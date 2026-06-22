import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export type CircleInvitePreview = {
  circleId: string;
  circleName: string;
  description: string | null;
  creatorUsername: string | null;
  memberCount: number;
  isExpired: boolean;
  isFull: boolean;
};

/**
 * Public preview for the /i/[code] landing page. Backed by the security-definer
 * get_circle_invite_preview, so it works for logged-out users without exposing
 * the circle_invites table. Returns null for an unknown code.
 */
export async function getCircleInvitePreview(
  client: SupabaseClient<Database>,
  code: string,
): Promise<CircleInvitePreview | null> {
  const { data, error } = await client.rpc("get_circle_invite_preview", {
    p_code: code,
  });
  if (error) throw error;

  const row = data?.[0];
  if (!row) return null;

  return {
    circleId: row.circle_id,
    circleName: row.circle_name,
    description: row.description,
    creatorUsername: row.creator_username,
    memberCount: row.member_count,
    isExpired: row.is_expired,
    isFull: row.is_full,
  };
}

/**
 * The newest still-valid invite code for a circle, or null if there is none.
 * circle_invites is readable by members under RLS; this powers the detail-page
 * Invite button so members can copy the existing link rather than minting a new
 * one each time. Expiry is filtered in SQL; max_uses is checked here.
 */
export async function getActiveCircleInvite(
  client: SupabaseClient<Database>,
  circleId: string,
): Promise<string | null> {
  const { data, error } = await client
    .from("circle_invites")
    .select("code, max_uses, uses_count")
    .eq("circle_id", circleId)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  if (error) throw error;

  const active = (data ?? []).find(
    (invite) => invite.max_uses == null || invite.uses_count < invite.max_uses,
  );
  return active?.code ?? null;
}
