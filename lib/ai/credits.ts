import type { StriveSupabaseClient } from "@/lib/ai/types";

/**
 * AI credits & kill-switch plumbing.
 *
 * Thin, typed wrappers over the Postgres side of the credit system (see
 * `data/functions/*` and `data/tables/system_settings.sql`). No HTTP or UI
 * concerns here — the guard (`lib/ai/guard.ts`) composes these into a single
 * pre-flight check, and the chat route maps the result onto a response.
 */

/**
 * Wire codes returned to the chat client when an AI request is blocked. They are
 * intentionally stable strings: the route puts one in the response body and the
 * UI maps it to an i18n message. Keep in sync with the `rituals.ai` namespace.
 */
export const AI_BLOCK_CODES = {
  paused: "ai_paused",
  exhausted: "credits_exhausted",
} as const;

export type AiBlockCode = (typeof AI_BLOCK_CODES)[keyof typeof AI_BLOCK_CODES];

/** Outcome of reserving one credit via the `consume_ai_credit` RPC. */
export type ConsumeCreditResult =
  | { ok: true; balance: number; resetAt: string | null }
  | {
      ok: false;
      reason: "exhausted" | "no_row" | "error";
      resetAt: string | null;
    };

/**
 * Whether AI features are globally enabled.
 *
 * Two layers, checked cheapest-first:
 *  1. `AI_KILL_SWITCH=true` — a hard env override (e.g. an incident) that forces
 *     AI off without touching the database.
 *  2. `system_settings.ai_enabled` — the runtime flag flipped via SQL/service
 *     role, so AI can be paused app-wide without a redeploy.
 *
 * Fails open: if the flag can't be read (transient DB error), AI stays on — the
 * per-user credit guard still caps spend.
 */
export async function isAiEnabled(
  supabase: StriveSupabaseClient,
): Promise<boolean> {
  if (process.env.AI_KILL_SWITCH === "true") return false;

  const { data, error } = await supabase
    .from("system_settings")
    .select("ai_enabled")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[isAiEnabled] failed to read system_settings", error);
    return true;
  }

  // Missing row is treated as "enabled" (default-on) to avoid locking AI out.
  return data?.ai_enabled ?? true;
}

/**
 * Atomically reserve one credit for the authenticated caller. Delegates the
 * check-and-decrement to the `consume_ai_credit` RPC so it stays race-safe under
 * concurrent requests. The caller is responsible for refunding on failure.
 */
export async function consumeAiCredit(
  supabase: StriveSupabaseClient,
): Promise<ConsumeCreditResult> {
  const { data, error } = await supabase.rpc("consume_ai_credit");

  if (error) {
    console.error("[consumeAiCredit] rpc failed", error);
    return { ok: false, reason: "error", resetAt: null };
  }

  const row = data?.[0];
  if (!row) return { ok: false, reason: "error", resetAt: null };

  const resetAt = row.reset_at ?? null;

  if (row.status === "ok") {
    return { ok: true, balance: row.balance, resetAt };
  }
  if (row.status === "no_row") {
    return { ok: false, reason: "no_row", resetAt };
  }
  // "insufficient" — no credits left this period.
  return { ok: false, reason: "exhausted", resetAt };
}

/**
 * Return one previously-reserved credit to the authenticated caller. Best-effort:
 * a refund failure is logged but never thrown, since it runs on an already-failing
 * request path and must not mask the original error.
 */
export async function refundAiCredit(
  supabase: StriveSupabaseClient,
): Promise<void> {
  const { error } = await supabase.rpc("refund_ai_credit");
  if (error) console.error("[refundAiCredit] rpc failed", error);
}
