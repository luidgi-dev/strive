import { getTranslations } from "next-intl/server";

import { deliverToUser } from "@/lib/push/server";
import {
  authorizeRecipient,
  RecipientForbiddenError,
} from "@/lib/push/recipients";
import { createClient } from "@/lib/supabase/server";

// web-push relies on Node crypto for VAPID signing — force the Node runtime.
export const runtime = "nodejs";

// Authenticated send primitive. Delivers a notification to the caller's own
// devices and NOTHING else: the recipient is resolved from the verified session,
// and any client-supplied target that isn't the caller is rejected with 403
// (no broadcast, no cross-user). See lib/push/recipients.ts for the guard.
//
// Lives under `[locale]/` because proxy.ts rewrites every non-static request
// with a locale prefix; the client still posts to `/api/notifications/send`.
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  // Body is optional (the self-send button posts nothing). A `userId` is only
  // ever honored when it matches the session — otherwise 403.
  let requestedUserId: string | undefined;
  try {
    const body = (await req.json()) as { userId?: string };
    requestedUserId = body?.userId;
  } catch {
    requestedUserId = undefined;
  }

  let recipientId: string;
  try {
    recipientId = authorizeRecipient(user.id, requestedUserId);
  } catch (err) {
    if (err instanceof RecipientForbiddenError) {
      return new Response("Forbidden", { status: 403 });
    }
    throw err;
  }

  // Preload both locales so each device is messaged in its captured language.
  const translators = {
    en: await getTranslations({ locale: "en", namespace: "notifications.test" }),
    fr: await getTranslations({ locale: "fr", namespace: "notifications.test" }),
  };

  const result = await deliverToUser(supabase, recipientId, (locale) => ({
    title: translators[locale]("title"),
    body: translators[locale]("body"),
    url: "/protected",
    tag: "strive-test",
  }));

  if (result.sent === 0) {
    return new Response("No active subscription", { status: 409 });
  }

  return Response.json(result);
}
