// lib/profile.ts
import type { SupabaseClient } from "@supabase/supabase-js";

import { todayInTimeZone } from "@/lib/date";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type Tier = "lite" | "premium" | "lifetime";

export type Membership = {
  tier: Tier;
  balance: number;
  used: number;
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

export async function getAuthenticatedProfile() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
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

  const [profileResult, creditsResult] = await Promise.all([
    supabase.from("profiles").select("tier").eq("id", user.id).single(),
    supabase
      .from("user_credits")
      .select("balance, used, reset_at")
      .eq("user_id", user.id)
      .single(),
  ]);

  return {
    tier: toTier(profileResult.data?.tier),
    balance: creditsResult.data?.balance ?? 5,
    used: creditsResult.data?.used ?? 0,
    resetAt: creditsResult.data?.reset_at ?? null,
  };
}