import {
  type MomentumStatus,
  type RitualProgressEntry,
  rollingMomentumStatus,
} from "@/lib/data/rituals";
import { isRitualFresh } from "@/lib/rituals/presentation";

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

/**
 * Per-ritual momentum for the chat, read from the rolling-window figures the
 * `ritual_progress` view exposes (`momentumCount` / `momentumTarget`, sized to
 * the cadence). The count and target shown in the chat are therefore the rolling
 * ones (e.g. days logged in the last 7), and the status matches them. Open /
 * one-time rituals carry no target, so everything stays null. Mirrors the status
 * shown on the app cards (which keep their calendar "this week" numbers).
 */
export function buildMomentumView(
  fields: MomentumFields,
  progress: RitualProgressEntry | undefined,
): MomentumView {
  const momentum_status = rollingMomentumStatus(
    progress,
    fields.ritual_type,
    isRitualFresh(fields.created_at),
  );

  const isRecurring = fields.ritual_type === "recurring";
  const period: "week" | "month" | null = isRecurring
    ? fields.frequency_unit === "month"
      ? "month"
      : "week"
    : null;

  const on_track = momentum_status !== null ? momentum_status !== "resting" : null;

  return {
    logs_this_period: progress?.momentumCount ?? null,
    target: progress?.momentumTarget ?? null,
    period,
    momentum_status,
    on_track,
  };
}
