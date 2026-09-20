"use server";

import { isDemoUser } from "@/lib/demo";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Mark the given nudges as seen for the current user. Called by the in-app toast
 * once it has displayed, so a nudge surfaces only once. RLS restricts the update
 * to the receiver's own rows; the seen_at filter keeps it idempotent.
 */
export async function markNudgesSeen(ids: string[]): Promise<ActionResult> {
  if (!Array.isArray(ids) || ids.length === 0) return { ok: true };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { error } = await supabase
    .from("nudges")
    .update({ seen_at: new Date().toISOString() })
    .in("id", ids)
    .eq("receiver_id", user.id)
    .is("seen_at", null);

  if (error) {
    console.error("[markNudgesSeen] update failed", error);
    return { ok: false, error: "unknown" };
  }
  return { ok: true };
}

/**
 * Record that the current user has seen the first-login welcome, so it surfaces
 * once per account and not once per device. The flag lives in the Supabase auth
 * user_metadata (the same JSON the sign-up form writes username/timezone to)
 * rather than in `profiles`, which keeps this out of our schema entirely.
 * `updateUser` merges the given keys, so the existing metadata is preserved.
 */
export async function markWelcomed(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };
  // The demo account is shared: its welcome is driven by the entry URL, and
  // writing a flag here would silence it for every later visitor.
  if (isDemoUser(user.id)) return { ok: true };

  const { error } = await supabase.auth.updateUser({
    data: { welcomed_at: new Date().toISOString() },
  });

  if (error) {
    console.error("[markWelcomed] update failed", error);
    return { ok: false, error: "unknown" };
  }
  return { ok: true };
}
