import { getTranslations } from "next-intl/server";

import { deliverToUser } from "@/lib/push/server";
import { createClient } from "@/lib/supabase/server";

// web-push relies on Node crypto for VAPID signing — force the Node runtime.
export const runtime = "nodejs";

// Self-test endpoint: sends a notification to the signed-in user's own devices.
// EXPLORATION ONLY (LUI-82) — gated to non-production and meant to be removed
// once real triggers (reminders cron) land. It is the manual loop used to
// validate the Web Push stack end to end.
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  // Preload both locales so each device is messaged in its captured language.
  const translators = {
    en: await getTranslations({ locale: "en", namespace: "notifications.test" }),
    fr: await getTranslations({ locale: "fr", namespace: "notifications.test" }),
  };

  const result = await deliverToUser(supabase, user.id, (locale) => ({
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
