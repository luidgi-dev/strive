"use server";

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
