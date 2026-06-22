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

/** A single circle's header data for the detail page. */
export type CircleDetail = {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  members: CircleMemberPreview[];
};

export type CircleFeedStatus = "on_track" | "steady" | "resting";

/** One shared ritual's weekly standing for a member, in the detail-page feed. */
export type CircleFeedRitualEntry = {
  ritualId: string;
  name: string;
  icon: string | null;
  /** Rolling momentum count; null when the ritual has no weekly target. */
  count: number | null;
  /** Target the count is paced against; null for open / one-time rituals. */
  target: number | null;
  status: CircleFeedStatus;
};

/**
 * The weekly feed grouped by member ("how is each person doing this week?").
 * Grouping by member rather than by ritual is deliberate: members name their own
 * rituals, so a shared ritual name almost never matches across people.
 */
export type CircleFeedMemberGroup = {
  userId: string;
  username: string | null;
  avatarUrl: string | null;
  rituals: CircleFeedRitualEntry[];
};

/** A row in the "my shared rituals" control panel: a ritual + its share state. */
export type CircleRitualToggle = {
  ritualId: string;
  name: string;
  icon: string | null;
  shared: boolean;
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
    const momentum = momentumByCircle.get(circle.id);

    return {
      id: circle.id,
      name: circle.name,
      description: circle.description,
      ownerId: circle.owner_id,
      members: toMemberPreviews(circle.members),
      sharedRituals: sharedByCircle.get(circle.id) ?? [],
      participantCount: momentum?.participant_count ?? 0,
      onTrackCount: momentum?.on_track_count ?? 0,
    };
  });
}

type CircleMemberRow = {
  user_id: string;
  role: string;
  joined_at: string;
  profile: { username: string | null; avatar_url: string | null } | null;
};

// Owner (admin) first, then by join date. Shared by the overview and the detail
// page so the avatar stack and member list always order members the same way.
function toMemberPreviews(members: CircleMemberRow[]): CircleMemberPreview[] {
  return [...members]
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
}

/**
 * A single circle's header data (name, description, owner, ordered members).
 * Returns null when the circle doesn't exist or the caller isn't a member —
 * RLS scopes the read, so a non-member simply gets no row.
 */
export async function getCircleDetail(
  client: SupabaseClient<Database>,
  circleId: string,
): Promise<CircleDetail | null> {
  const { data, error } = await client
    .from("circles")
    .select(CIRCLE_COLUMNS)
    .eq("id", circleId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    ownerId: data.owner_id,
    members: toMemberPreviews(data.members),
  };
}

/**
 * The weekly feed for one circle, grouped by member: each member with the rituals
 * they share and their rolling momentum. Backed by get_circle_feed (security
 * definer), the only path that can read co-members' progress.
 */
export async function getCircleFeed(
  client: SupabaseClient<Database>,
  circleId: string,
): Promise<CircleFeedMemberGroup[]> {
  const { data, error } = await client.rpc("get_circle_feed", {
    p_circle_id: circleId,
  });
  if (error) throw error;

  // Rows arrive ordered by ritual name then member; fold them into one group per
  // member, preserving each member's rituals in that name order.
  const byMember = new Map<string, CircleFeedMemberGroup>();
  for (const row of data ?? []) {
    // Function columns are typed non-null, but momentum is null for open rituals.
    const count = row.momentum_count as number | null;
    const target = row.momentum_target as number | null;

    let member = byMember.get(row.user_id);
    if (!member) {
      member = {
        userId: row.user_id,
        username: row.username,
        avatarUrl: row.avatar_url,
        rituals: [],
      };
      byMember.set(row.user_id, member);
    }
    member.rituals.push({
      ritualId: row.ritual_id,
      name: row.ritual_name,
      icon: row.ritual_icon,
      count,
      target,
      status: circleFeedStatus(count, target),
    });
  }

  return [...byMember.values()];
}

/**
 * Collective weekly momentum for a single circle: the "X of Y this week" signal
 * shown on the detail page, reusing the same aggregate read as the circles list.
 */
export async function getCircleMomentum(
  client: SupabaseClient<Database>,
  circleId: string,
): Promise<{ participantCount: number; onTrackCount: number }> {
  const { data, error } = await client.rpc("get_circles_momentum");
  if (error) throw error;

  const row = (data ?? []).find((m) => m.circle_id === circleId);
  return {
    participantCount: row?.participant_count ?? 0,
    onTrackCount: row?.on_track_count ?? 0,
  };
}

/**
 * The current user's active rituals, each flagged with whether it's shared in
 * this circle — the data behind the "my shared rituals" toggle panel.
 */
export async function getMyCircleRituals(
  client: SupabaseClient<Database>,
  circleId: string,
): Promise<CircleRitualToggle[]> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return [];

  const [ritualsRes, sharedRes] = await Promise.all([
    client
      .from("rituals")
      .select("id, name, icon")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .is("archived_at", null)
      .order("name", { ascending: true }),
    client
      .from("circle_rituals")
      .select("ritual_id")
      .eq("circle_id", circleId)
      .eq("user_id", user.id),
  ]);

  if (ritualsRes.error) throw ritualsRes.error;
  if (sharedRes.error) throw sharedRes.error;

  const sharedIds = new Set((sharedRes.data ?? []).map((r) => r.ritual_id));
  return (ritualsRes.data ?? []).map((r) => ({
    ritualId: r.id,
    name: r.name,
    icon: r.icon,
    shared: sharedIds.has(r.id),
  }));
}

/**
 * Maps a member's rolling momentum to a feed status. Mirrors the 0.8 "on track"
 * pace used by get_circles_momentum so the dots and the "X of Y" badge agree.
 * No target (open / one-time) or nothing logged yet reads as resting.
 */
export function circleFeedStatus(
  count: number | null,
  target: number | null,
): CircleFeedStatus {
  if (target == null || target <= 0) return "resting";
  if (count == null || count <= 0) return "resting";
  return count / target >= 0.8 ? "on_track" : "steady";
}

/** First letter of a member's name for an avatar fallback; "?" when unknown. */
export function memberInitial(name: string | null): string {
  return name?.trim().charAt(0).toUpperCase() || "?";
}
