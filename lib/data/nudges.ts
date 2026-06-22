import type { SupabaseClient } from "@supabase/supabase-js";

import { startOfLocalDayIso } from "@/lib/date";
import type { Database } from "@/lib/supabase/database.types";

export type UnseenNudge = {
  id: string;
  senderName: string | null;
  circleName: string | null;
};

/**
 * Unseen nudges addressed to the current user, newest first, with the sender's
 * name and the circle they were sent in. Drives the in-app nudge toast. RLS
 * scopes nudges to the receiver; sender profiles are publicly readable and the
 * circle is readable to its members.
 *
 * Fail-soft: this runs in the protected layout on every page, but the toast is
 * non-critical, so a transient failure degrades to "no toast" rather than
 * breaking the whole protected tree.
 */
export async function getUnseenNudges(
  client: SupabaseClient<Database>,
): Promise<UnseenNudge[]> {
  try {
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) return [];

    const { data, error } = await client
      .from("nudges")
      .select(
        "id, sender:profiles!nudges_sender_id_fkey(username), circle:circles!nudges_circle_id_fkey(name)",
      )
      .eq("receiver_id", user.id)
      .is("seen_at", null)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data ?? []).map((row) => ({
      id: row.id,
      senderName: row.sender?.username ?? null,
      circleName: row.circle?.name ?? null,
    }));
  } catch (err) {
    console.error("[getUnseenNudges] failed", err);
    return [];
  }
}

/**
 * The receiver ids the current user has already nudged today (their local day)
 * in this circle. Renders the nudge button in its "sent" state and mirrors the
 * rate-limit window enforced by the sendNudge action.
 */
export async function getSentNudgeReceiversToday(
  client: SupabaseClient<Database>,
  circleId: string,
): Promise<string[]> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return [];

  const { data: profile } = await client
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .maybeSingle();
  const since = startOfLocalDayIso(profile?.timezone ?? "UTC");

  const { data, error } = await client
    .from("nudges")
    .select("receiver_id")
    .eq("sender_id", user.id)
    .eq("circle_id", circleId)
    .gte("created_at", since);

  if (error) throw error;
  return (data ?? []).map((row) => row.receiver_id);
}
