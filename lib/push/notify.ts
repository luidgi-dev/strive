import "server-only";

import type { StriveSupabaseClient } from "@/lib/ai/types";
import type { Locale } from "@/lib/locales";
import { deliverToUser, type PushPayload } from "@/lib/push/server";

/**
 * Deliver a notification to a user at most once per `(type, day)`.
 *
 * Claim-then-send: insert a `notification_log` row first (the claim). A `23505`
 * unique violation means it was already sent for this `(user, type, sent_on)` →
 * `"skipped"`. Then deliver; if delivery throws or reaches no device, RELEASE the
 * claim so the user isn't falsely marked notified and a later trigger can retry.
 * The anti-duplicate guarantee holds — the claim only ever survives a real send,
 * so a concurrent run that saw the claim never produced a send either.
 *
 * `sentOn` is the user-local date (`YYYY-MM-DD`). Expects the service-role client
 * (the cron has no user session; `notification_log` has no user RLS policy).
 */
export async function sendOncePerDay(
  supabase: StriveSupabaseClient,
  userId: string,
  type: string,
  sentOn: string,
  buildPayload: (locale: Locale) => PushPayload,
): Promise<"sent" | "skipped"> {
  const { error: claimError } = await supabase
    .from("notification_log")
    .insert({ user_id: userId, type, sent_on: sentOn });
  if (claimError) {
    if (claimError.code === "23505") return "skipped"; // already sent today
    throw claimError;
  }

  try {
    const { sent } = await deliverToUser(supabase, userId, buildPayload);
    if (sent === 0) {
      await releaseClaim(supabase, userId, type, sentOn);
      return "skipped";
    }
  } catch (err) {
    await releaseClaim(supabase, userId, type, sentOn);
    throw err;
  }
  return "sent";
}

async function releaseClaim(
  supabase: StriveSupabaseClient,
  userId: string,
  type: string,
  sentOn: string,
) {
  const { error } = await supabase
    .from("notification_log")
    .delete()
    .eq("user_id", userId)
    .eq("type", type)
    .eq("sent_on", sentOn);
  // A failed release leaves a stale claim that would block today's retry; it
  // self-heals tomorrow (new sent_on), but surface it so it's not invisible.
  if (error) {
    console.error("[push] failed to release notification claim", userId, type, error);
  }
}
