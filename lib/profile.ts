// lib/profile.ts
import type { SupabaseClient, User } from "@supabase/supabase-js";

import { todayInTimeZone } from "@/lib/date";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type Tier = "lite" | "premium" | "lifetime";

export type Membership = {
  tier: Tier;
  balance: number;
  used: number;
  /** Monthly credit allotment for this tier (the "total" in used/total). */
  quota: number;
  resetAt: string | null;
};

const TIERS: ReadonlySet<Tier> = new Set(["lite", "premium", "lifetime"]);

function toTier(value: string | null | undefined): Tier {
  return value && TIERS.has(value as Tier) ? (value as Tier) : "lite";
}

// Ensures the authenticated user has a profiles row. Heals legacy/Studio
// accounts where the handle_new_user trigger never fired, which otherwise
// causes a 23503 FK violation on the first write referencing profiles(id).
export async function ensureProfile(
  supabase: SupabaseClient<Database>,
  user: { id: string; email?: string | null },
): Promise<boolean> {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (existing) return true;

  const base =
    (user.email?.split("@")[0] ?? "").trim() || `user-${user.id.slice(0, 8)}`;
  // Always append a short random suffix to avoid the username UNIQUE
  // constraint; this is a fallback identity the user can edit later.
  const username = `${base}-${Math.random().toString(36).slice(2, 6)}`;

  const { error } = await supabase
    .from("profiles")
    .insert({ id: user.id, username }); // other columns use DB defaults
  if (error) {
    console.error("[ensureProfile] insert failed", error);
    return false;
  }
  return true;
}

/**
 * Returns the authenticated user and their `profiles` row (username, avatar).
 *
 * @param client - optional Supabase server client to reuse instead of creating one.
 * @param knownUser - optional already-validated user. When provided, skips the
 *   internal `getUser()` call — pass it from callers that have already validated
 *   the session (e.g. the protected layout) to avoid a redundant auth round-trip.
 */
export async function getAuthenticatedProfile(
  client?: SupabaseClient<Database>,
  knownUser?: User,
) {
  const supabase = client ?? (await createClient());

  // Reuse the caller's already-validated user when provided (the protected
  // layout validates once and passes it down) to skip a redundant getUser()
  // round-trip to the auth server.
  let user = knownUser ?? null;
  if (!user) {
    const {
      data: { user: fetched },
    } = await supabase.auth.getUser();
    user = fetched;
  }
  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", user.id)
    .single();

  return { user, profile };
}

/** Today as YYYY-MM-DD in the authenticated user's timezone (falls back to UTC). */
export async function getUserToday(
  supabase: SupabaseClient<Database>,
): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("timezone")
    .maybeSingle();
  return todayInTimeZone(data?.timezone ?? "UTC");
}

export async function getMembership(): Promise<Membership | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [profileResult, creditsResult, quotasResult] = await Promise.all([
    supabase.from("profiles").select("tier").eq("id", user.id).single(),
    supabase
      .from("user_credits")
      .select("balance, used, reset_at")
      .eq("user_id", user.id)
      .single(),
    supabase.from("tier_quotas").select("tier, monthly_quota"),
  ]);

  const tier = toTier(profileResult.data?.tier);
  const balance = creditsResult.data?.balance ?? 0;
  const used = creditsResult.data?.used ?? 0;

  // Quota comes from tier_quotas (source of truth). Fall back to balance + used,
  // which always equals the quota since consume/refund keep the sum invariant.
  const quota =
    quotasResult.data?.find((row) => row.tier === tier)?.monthly_quota ??
    balance + used;

  return {
    tier,
    balance,
    used,
    quota,
    resetAt: creditsResult.data?.reset_at ?? null,
  };
}