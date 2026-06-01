import { isoWeekday } from "@/lib/date";
import {
  type CompletedLogRow,
  deriveDailyMomentum,
  deriveMomentumStatus,
  type MomentumStatus,
  type RitualProgressEntry,
} from "@/lib/data/rituals";
import { isRitualFresh } from "@/lib/rituals/presentation";

// A week is seven days; daily rituals are framed against this weekly target
// (mirrors DAILY_WEEK_TARGET in lib/rhythm/today-rituals.ts).
export const DAILY_WEEK_TARGET = 7;

export type MomentumFields = {
  ritual_type: string;
  frequency_unit: string | null;
  frequency_value: number | null;
  created_at: string;
};

export type MomentumView = {
  logs_this_period: number | null;
  target: number | null;
  period: "week" | "month" | null;
  momentum_status: MomentumStatus | null;
  on_track: boolean | null;
};

/** Distinct days logged this week per ritual id (drives a daily ritual's X/7). */
export function weekDayCountsByRitual(
  weekLogs: CompletedLogRow[],
): Map<string, number> {
  const days = new Map<string, Set<string>>();
  for (const log of weekLogs) {
    const set = days.get(log.ritual_id) ?? new Set<string>();
    set.add(log.logged_at);
    days.set(log.ritual_id, set);
  }
  const counts = new Map<string, number>();
  for (const [id, set] of days) counts.set(id, set.size);
  return counts;
}

/**
 * Per-ritual momentum exactly as the Rhythm cards present it (mirrors
 * `deriveRhythmCardView`): daily rituals are framed weekly (X/7, pace-based
 * momentum over elapsed weekdays), weekly/monthly use their period target, and
 * one_time/open carry no target. Fresh rituals with nothing logged suppress
 * momentum so the chat and the cards agree.
 */
export function buildMomentumView(
  fields: MomentumFields,
  progress: RitualProgressEntry | undefined,
  weekDaysCount: number,
  today: string,
): MomentumView {
  const isFresh = isRitualFresh(fields.created_at);
  const isDaily =
    fields.ritual_type === "recurring" && fields.frequency_unit === "day";
  const isPeriodic =
    fields.ritual_type === "recurring" &&
    (fields.frequency_unit === "week" || fields.frequency_unit === "month") &&
    (fields.frequency_value ?? 0) > 0;

  let logs_this_period: number | null = null;
  let target: number | null = null;
  let period: "week" | "month" | null = null;
  let momentum_status: MomentumStatus | null = null;

  if (isDaily) {
    logs_this_period = weekDaysCount;
    target = DAILY_WEEK_TARGET;
    period = "week";
    momentum_status =
      weekDaysCount === 0 && isFresh
        ? null
        : deriveDailyMomentum(weekDaysCount, isoWeekday(today));
  } else if (isPeriodic) {
    const logs = progress?.logsThisPeriod ?? 0;
    logs_this_period = logs;
    target = fields.frequency_value;
    period = fields.frequency_unit === "month" ? "month" : "week";
    momentum_status =
      logs === 0 && isFresh
        ? null
        : deriveMomentumStatus(fields.ritual_type, progress?.completionRate ?? null);
  }
  // one_time / open: no target, no momentum (everything stays null).

  const on_track =
    fields.ritual_type === "recurring" && momentum_status !== null
      ? momentum_status !== "resting"
      : null;

  return { logs_this_period, target, period, momentum_status, on_track };
}
