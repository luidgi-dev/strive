"use server";

import { revalidatePath } from "next/cache";

import { buildMomentumView } from "@/lib/data/momentum";
import {
  deleteRitualLog,
  getRitualProgress,
  insertRitualLog,
} from "@/lib/data/rituals";
import { ensureProfile, getUserToday } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

export type ChatActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type LoggedRitual = {
  log_id: string;
  ritual_name: string;
  date: string;
  momentum: {
    logs_this_period: number | null;
    target: number | null;
    period: "week" | "month" | null;
    status: "strong" | "steady" | "resting" | null;
  };
};

/**
 * Log a ritual straight from a chat card (a disambiguation chip), bypassing the
 * model. This keeps interactive cards free: tapping a chip is part of the same
 * task, not a new chat message, so it never costs a credit. The user id comes
 * from the verified session, never the client.
 */
export async function logRitualFromChat(
  ritualId: string,
  loggedAt?: string,
): Promise<ChatActionResult<LoggedRitual>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  try {
    const { data: ritual, error } = await supabase
      .from("rituals")
      .select("id, name, ritual_type, frequency_unit, frequency_value, created_at")
      .eq("id", ritualId)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .is("archived_at", null)
      .maybeSingle();
    if (error) throw error;
    if (!ritual) return { ok: false, error: "not_found" };

    const today = await getUserToday(supabase);
    const date = loggedAt ?? today;

    await ensureProfile(supabase, { id: user.id });
    const { id: log_id } = await insertRitualLog(supabase, {
      ritualId: ritual.id,
      userId: user.id,
      loggedAt: date,
    });

    const progress = await getRitualProgress(supabase, ritual.id);
    const view = buildMomentumView(ritual, progress ?? undefined);

    revalidatePath("/protected/flow");
    revalidatePath("/protected/rituals");

    return {
      ok: true,
      data: {
        log_id,
        ritual_name: ritual.name,
        date,
        momentum: {
          logs_this_period: view.logs_this_period,
          target: view.target,
          period: view.period,
          status: view.momentum_status,
        },
      },
    };
  } catch {
    return { ok: false, error: "failed" };
  }
}

/** Undo an AI log from the chat's log card. Idempotent and owner-scoped. */
export async function undoRitualLog(
  logId: string,
): Promise<ChatActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  try {
    await deleteRitualLog(supabase, { logId, userId: user.id });
  } catch {
    return { ok: false, error: "failed" };
  }

  revalidatePath("/protected/flow");
  revalidatePath("/protected/rituals");
  return { ok: true, data: undefined };
}
