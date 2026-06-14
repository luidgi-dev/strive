"use server";

import { revalidatePath } from "next/cache";

import { locales, type Locale } from "@/lib/locales";
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
 * Persist the account-level smart-reminders intent. This is the cron's
 * kill-switch (see profiles.smart_reminders_enabled): delivery only happens for
 * users with it `true`. Devices to deliver to are tracked separately in
 * push_subscriptions via saveSubscription/removeSubscription.
 */
export async function setSmartRemindersEnabled(
  enabled: boolean,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { error } = await supabase
    .from("profiles")
    .update({ smart_reminders_enabled: enabled })
    .eq("id", user.id);

  if (error) {
    console.error("[push] setSmartRemindersEnabled failed", error);
    return { ok: false, error: "saveFailed" };
  }

  revalidatePath("/protected/settings");
  return { ok: true };
}
