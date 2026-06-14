import type { Database } from "@/lib/supabase/database.types";

// Minimal ritual shape the reminder selection needs.
export type ReminderRitual = Pick<
  Database["public"]["Tables"]["rituals"]["Row"],
  "id" | "name" | "ritual_type" | "due_date" | "is_active" | "archived_at"
>;

/**
 * One-time rituals due today that the user hasn't completed yet.
 *
 * LUI-85 reminds only about **dated, one-off events** (`one_time` with a
 * `due_date`) — recurring/open habits are intentionally excluded so the morning
 * reminder never becomes a daily nag. A one-time ritual is "done" once it has any
 * completed log, so `completedRitualIds` (any completed log) is the skip set.
 *
 * Pure for unit testing — callers pass today (in the user's timezone) and the set
 * of completed ritual ids.
 */
export function selectOneTimeDueToday(
  rituals: ReminderRitual[],
  todayISO: string,
  completedRitualIds: ReadonlySet<string>,
): ReminderRitual[] {
  return rituals.filter(
    (ritual) =>
      ritual.ritual_type === "one_time" &&
      ritual.due_date === todayISO &&
      ritual.is_active &&
      ritual.archived_at == null &&
      !completedRitualIds.has(ritual.id),
  );
}
