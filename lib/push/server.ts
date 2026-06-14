import "server-only";

import webpush, { WebPushError } from "web-push";

import type { StriveSupabaseClient } from "@/lib/ai/types";
import { locales, type Locale } from "@/lib/locales";

// The payload our service worker (public/sw.js) knows how to render. Keep the
// two in sync: any field added here must be handled there.
export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
  badge?: string;
};

// Configure VAPID exactly once per server runtime. Reads the same env vars the
// client half relies on (NEXT_PUBLIC_VAPID_PUBLIC_KEY) plus the private key,
// which never leaves the server.
let configured = false;
function ensureConfigured() {
  if (configured) return;
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) {
    throw new Error(
      "Missing VAPID_SUBJECT, NEXT_PUBLIC_VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY.",
    );
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

/**
 * Deliver a notification to every device a user has opted in from. The payload
 * is built per-subscription so each device is messaged in the language captured
 * at opt-in (push_subscriptions.locale).
 *
 * A push endpoint that returns 404/410 is permanently gone (unsubscribed or
 * expired by the browser vendor) — we delete it so the table stays clean and we
 * never retry a dead endpoint.
 *
 * Works under either a user-session client (RLS-scoped, e.g. the self-test
 * route) or the service-role admin client (e.g. a future reminders cron), since
 * both satisfy StriveSupabaseClient. Callers using the admin client MUST pass
 * the real userId — there is no session to scope the query.
 *
 * Returns how many devices were reached and how many dead endpoints were pruned.
 */
export async function deliverToUser(
  supabase: StriveSupabaseClient,
  userId: string,
  buildPayload: (locale: Locale) => PushPayload,
): Promise<{ sent: number; removed: number }> {
  ensureConfigured();

  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth_key, locale")
    .eq("user_id", userId);

  if (error) throw error;
  if (!subscriptions?.length) return { sent: 0, removed: 0 };

  let sent = 0;
  const expiredEndpoints: string[] = [];

  await Promise.all(
    subscriptions.map(async (row) => {
      // Coerce unexpected stored values to a known locale instead of trusting
      // the DB string blindly (translators only exist for `locales`).
      const locale: Locale = locales.includes(row.locale as Locale)
        ? (row.locale as Locale)
        : "en";
      const payload = buildPayload(locale);
      try {
        await webpush.sendNotification(
          {
            endpoint: row.endpoint,
            keys: { p256dh: row.p256dh, auth: row.auth_key },
          },
          JSON.stringify(payload),
        );
        sent += 1;
      } catch (err) {
        if (err instanceof WebPushError && (err.statusCode === 404 || err.statusCode === 410)) {
          expiredEndpoints.push(row.endpoint);
        } else {
          console.error("[push] send failed", row.endpoint, err);
        }
      }
    }),
  );

  if (expiredEndpoints.length) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", userId)
      .in("endpoint", expiredEndpoints);
  }

  return { sent, removed: expiredEndpoints.length };
}
