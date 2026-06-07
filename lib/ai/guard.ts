import {
  AI_BLOCK_CODES,
  type AiBlockCode,
  consumeAiCredit,
  isAiEnabled,
  refundAiCredit,
} from "@/lib/ai/credits";
import type { StriveSupabaseClient } from "@/lib/ai/types";

/**
 * Result of the AI pre-flight check.
 *
 * On `ok`, one credit has already been reserved; the caller must invoke `refund`
 * if the AI request then fails before producing a response. On failure, `code`
 * tells the route how to respond and the UI which message to show; `resetAt`
 * carries the credit renewal date for the "exhausted" case.
 */
export type GuardResult =
  | { ok: true; refund: () => Promise<void> }
  | { ok: false; code: AiBlockCode | "error"; resetAt: string | null };

/**
 * Single pre-flight gate in front of every AI call. Composes the two layers of
 * protection, cheapest-first:
 *  1. global kill-switch (`isAiEnabled`) — pause AI app-wide;
 *  2. per-user credit reservation (`consumeAiCredit`) — cap individual spend.
 *
 * Reusable beyond the chat route: any future AI entry point should call this
 * before reaching the model. The user is read from the verified session inside
 * the RPCs (auth.uid()), never from request input.
 */
export async function guardAiRequest(
  supabase: StriveSupabaseClient,
): Promise<GuardResult> {
  if (!(await isAiEnabled(supabase))) {
    return { ok: false, code: AI_BLOCK_CODES.paused, resetAt: null };
  }

  const credit = await consumeAiCredit(supabase);

  if (credit.ok) {
    return { ok: true, refund: () => refundAiCredit(supabase) };
  }

  if (credit.reason === "exhausted") {
    return {
      ok: false,
      code: AI_BLOCK_CODES.exhausted,
      resetAt: credit.resetAt,
    };
  }

  // "no_row" (no profile to heal from) or an RPC error: unexpected, so don't
  // mislabel it as "exhausted". The route surfaces a generic failure.
  return { ok: false, code: "error", resetAt: null };
}
