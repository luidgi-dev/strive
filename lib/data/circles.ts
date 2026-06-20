import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export type CircleMemberPreview = {
  userId: string;
  role: string;
  username: string | null;
  avatarUrl: string | null;
};

export type CircleSharedRitual = {
  ritualId: string;
  name: string;
  icon: string | null;
};

export type CircleOverview = {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  members: CircleMemberPreview[];
  sharedRituals: CircleSharedRitual[];
  /** Members who share a measurable (target-based) ritual this week — the "Y". */
  participantCount: number;
  /** Of those, how many are on track (>= 80% weekly pace) — the "X". */
  onTrackCount: number;
};

// Members + their public profile (avatars), readable under RLS for a member. The
// cross-member reads RLS can't expose — collective momentum and other members'
// shared-ritual names/icons — come from the two security-definer functions below.
// Must stay a single string literal (no `+` concatenation): supabase-js infers
// the row shape from the literal type of the select argument.
const CIRCLE_COLUMNS =
  "id, name, description, owner_id, members:circle_members(user_id, role, joined_at, profile:profiles(username, avatar_url))";

/**
 * Every circle the current user belongs to (RLS-scoped), with member previews for
 * the avatar stack, the shared rituals shown on the card, and the collective
 * weekly momentum.
 */
export async function getCirclesOverview(
  client: SupabaseClient<Database>,
): Promise<CircleOverview[]> {
  const [circlesRes, momentumRes, sharedRes] = await Promise.all([
    client
      .from("circles")
      .select(CIRCLE_COLUMNS)
      .order("created_at", { ascending: true }),
    client.rpc("get_circles_momentum"),
    client.rpc("get_circle_shared_rituals"),
  ]);

  if (circlesRes.error) throw circlesRes.error;
  if (momentumRes.error) throw momentumRes.error;
  if (sharedRes.error) throw sharedRes.error;

  const momentumByCircle = new Map(
    (momentumRes.data ?? []).map((m) => [m.circle_id, m] as const),
  );

  const sharedByCircle = new Map<string, CircleSharedRitual[]>();
  for (const r of sharedRes.data ?? []) {
    const list = sharedByCircle.get(r.circle_id) ?? [];
    list.push({ ritualId: r.ritual_id, name: r.name, icon: r.icon });
    sharedByCircle.set(r.circle_id, list);
  }

  return (circlesRes.data ?? []).map((circle) => {
    const members: CircleMemberPreview[] = [...circle.members]
      // owner (admin) first, then by join date — drives the avatar stack order
      .sort((a, b) => {
        if ((a.role === "admin") !== (b.role === "admin")) {
          return a.role === "admin" ? -1 : 1;
        }
        return a.joined_at.localeCompare(b.joined_at);
      })
      .map((m) => ({
        userId: m.user_id,
        role: m.role,
        username: m.profile?.username ?? null,
        avatarUrl: m.profile?.avatar_url ?? null,
      }));

    const momentum = momentumByCircle.get(circle.id);

    return {
      id: circle.id,
      name: circle.name,
      description: circle.description,
      ownerId: circle.owner_id,
      members,
      sharedRituals: sharedByCircle.get(circle.id) ?? [],
      participantCount: momentum?.participant_count ?? 0,
      onTrackCount: momentum?.on_track_count ?? 0,
    };
  });
}
