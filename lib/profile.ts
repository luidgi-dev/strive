// lib/profile.ts
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