import { locales, type Locale } from "@/lib/locales";
import { createClient } from "@/lib/supabase/server";

// Persist a browser push subscription for the signed-in user. The user id comes
// only from the verified session — never from the request body. Upserts on the
// endpoint so re-enabling on the same device refreshes keys/locale in place.
//
// Lives under `[locale]/` because proxy.ts rewrites every non-static request
// with a locale prefix; the client still posts to `/api/push/subscribe`.
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  let body: {
    subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
    locale?: string;
  };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { subscription, locale } = body;
  if (!subscription?.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
    return new Response("Invalid subscription", { status: 400 });
  }

  const safeLocale: Locale = locales.includes(locale as Locale)
    ? (locale as Locale)
    : "en";

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth_key: subscription.keys.auth,
      locale: safeLocale,
    },
    { onConflict: "endpoint" },
  );

  if (error) {
    console.error("[push/subscribe] failed to save subscription", error);
    return new Response("Failed to save subscription", { status: 500 });
  }

  return Response.json({ ok: true });
}
