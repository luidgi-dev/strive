"use server";

import { getTranslations } from "next-intl/server";

import { locales, type Locale } from "@/lib/locales";
import { deliverToUser } from "@/lib/push/server";
import { createClient } from "@/lib/supabase/server";

// Server Actions for Web Push opt-in. UI-initiated mutations go through actions
// (repo convention — see settings/action.ts), never client-side fetch calls. The
// user id always comes from the verified session, never the client.
export type ActionResult = { ok: true } | { ok: false; error: string };

type SubscriptionInput = {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
};

/**
 * Persist a browser push subscription for the signed-in user. Upserts on the
 * endpoint so re-enabling on the same device refreshes keys/locale in place.
 */
export async function saveSubscription(
  subscription: SubscriptionInput,
  locale: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  if (
    !subscription?.endpoint ||
    !subscription.keys?.p256dh ||
    !subscription.keys?.auth
  ) {
    return { ok: false, error: "invalidSubscription" };
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
    console.error("[push] saveSubscription failed", error);
    return { ok: false, error: "saveFailed" };
  }
  return { ok: true };
}

/** Remove a subscription for the signed-in user (scoped to their own rows). */
export async function removeSubscription(
  endpoint: string,
): Promise<ActionResult> {
  if (!endpoint) return { ok: false, error: "invalidEndpoint" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);

  if (error) {
    console.error("[push] removeSubscription failed", error);
    return { ok: false, error: "removeFailed" };
  }
  return { ok: true };
}

/**
 * Send a test notification to the caller's own devices. EXPLORATION ONLY
 * (LUI-82) — disabled in production and meant to be removed once real triggers
 * (the reminders cron) land. It is the manual loop that validates the stack.
 */
export async function sendTestNotification(): Promise<ActionResult> {
  if (process.env.NODE_ENV === "production") {
    return { ok: false, error: "disabled" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

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

  if (result.sent === 0) return { ok: false, error: "noSubscription" };
  return { ok: true };
}
