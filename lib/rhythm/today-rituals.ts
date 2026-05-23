import {
  deriveDailyMomentum,
  deriveMomentumStatus,
  type CompletedLogRow,
  type MomentumStatus,
  type RitualProgressEntry,
  type RitualWithCategory,
} from "@/lib/data/rituals";
import { daysInMonth, isoWeekday } from "@/lib/date";
import { isRitualFresh } from "@/lib/rituals/presentation";

const DAILY_WEEK_TARGET = 7;

export type RhythmItem = {
  ritual: RitualWithCategory;
  progress: RitualProgressEntry | undefined;
  /** Today's completed-log count (one-time: 1 once done) — seeds the control. */
  initialLogCount: number;
  /** Distinct days logged this week (drives a daily ritual's X/7). */
  weekDaysCount: number;
  /**
   * Whether this ritual is part of today's "to clear" set (the X of Y count and
   * the all-done check). Open rituals are ad-hoc loggables — always false.
   */
  countsTowardDay: boolean;
};

export type RhythmSelection = {
  /** In scope today and still needing action. */
  active: RhythmItem[];
  /** In scope today and already satisfied — the collapsed "Done today" group. */
  done: RhythmItem[];
};

type Inputs = {
  rituals: RitualWithCategory[];
  progressByRitualId: Map<string, RitualProgressEntry>;
  /** Completed logs since Monday — today's count and week days derive from these. */
  weekLogs: CompletedLogRow[];
  /** One-time ritual ids that already have a completed log (any date). */
  completedOneTimeIds: Set<string>;
  /** Today as YYYY-MM-DD in the user's timezone. */
  today: string;
};

// Sort buckets for the active list — "action needed first".
function activeRank(ritual: RitualWithCategory): number {
  if (ritual.ritual_type === "one_time") return 0;
  if (
    ritual.ritual_type === "recurring" &&
    (ritual.frequency_unit === "week" || ritual.frequency_unit === "month")
  ) {
    return 1;
  }
  if (ritual.ritual_type === "recurring") return 2; // daily
  return 3; // open
}

/**
 * How many times a recurring ritual ideally gets logged *today* before it drops
 * to "Done today". Derived from its target spread over the period so a high
 * weekly target (e.g. 14×/week → 2/day) isn't cleared after a single log, while
 * a low one (5×/week → 1/day) is. The period target still caps the week/month.
 */
function dailyQuota(ritual: RitualWithCategory, today: string): number {
  const n = ritual.frequency_value ?? 1;
  if (ritual.frequency_unit === "day") return Math.max(1, n);

  const scheduledCount = ritual.scheduled_days?.length ?? 0;
  const spread =
    scheduledCount > 0
      ? scheduledCount
      : ritual.frequency_unit === "week"
        ? 7
        : daysInMonth(today);
  return Math.max(1, Math.round(n / spread));
}

function isInScopeToday(ritual: RitualWithCategory, today: string): boolean {
  if (ritual.ritual_type === "one_time") {
    return ritual.due_date === today;
  }
  // Recurring / open: a day-of-week schedule, when set, restricts which days
  // the ritual surfaces on Rhythm (ISO 1=Mon … 7=Sun).
  const days = ritual.scheduled_days;
  if (days && days.length > 0) {
    return days.includes(isoWeekday(today));
  }
  return true;
}

/**
 * Decides which rituals belong on today's Rhythm and splits them into the
 * active to-do list and the satisfied "Done today" group. Pure: all I/O is done
 * by the caller and passed in.
 */
export function selectTodayRituals({
  rituals,
  progressByRitualId,
  weekLogs,
  completedOneTimeIds,
  today,
}: Inputs): RhythmSelection {
  // Today's count and the set of distinct days logged this week, per ritual.
  const todayLogCounts = new Map<string, number>();
  const weekDays = new Map<string, Set<string>>();
  for (const { ritual_id, logged_at } of weekLogs) {
    if (logged_at === today) {
      todayLogCounts.set(ritual_id, (todayLogCounts.get(ritual_id) ?? 0) + 1);
    }
    let days = weekDays.get(ritual_id);
    if (!days) {
      days = new Set();
      weekDays.set(ritual_id, days);
    }
    days.add(logged_at);
  }

  const active: RhythmItem[] = [];
  const done: RhythmItem[] = [];

  for (const ritual of rituals) {
    if (!isInScopeToday(ritual, today)) continue;

    const progress = progressByRitualId.get(ritual.id);
    const loggedToday = todayLogCounts.get(ritual.id) ?? 0;
    const weekDaysCount = weekDays.get(ritual.id)?.size ?? 0;

    let satisfied: boolean;
    let initialLogCount: number;
    // Open rituals are ad-hoc: never auto-cleared, never part of the day count.
    let countsTowardDay = true;

    if (ritual.ritual_type === "one_time") {
      const completed = completedOneTimeIds.has(ritual.id);
      satisfied = completed;
      initialLogCount = completed ? 1 : 0;
    } else if (ritual.ritual_type === "open") {
      initialLogCount = loggedToday;
      satisfied = false;
      countsTowardDay = false;
    } else {
      // Recurring: done for today once today's logs reach the daily quota, or
      // the whole period target is already met.
      initialLogCount = loggedToday;
      const target = ritual.frequency_value ?? 0;
      const targetMet = target > 0 && (progress?.logsThisPeriod ?? 0) >= target;
      satisfied = loggedToday >= dailyQuota(ritual, today) || targetMet;
    }

    (satisfied ? done : active).push({
      ritual,
      progress,
      initialLogCount,
      weekDaysCount,
      countsTowardDay,
    });
  }

  active.sort((a, b) => {
    const rank = activeRank(a.ritual) - activeRank(b.ritual);
    if (rank !== 0) return rank;
    // Within a bucket, surface the most behind first, then by name.
    const ra = a.progress?.completionRate ?? Number.POSITIVE_INFINITY;
    const rb = b.progress?.completionRate ?? Number.POSITIVE_INFINITY;
    if (ra !== rb) return ra - rb;
    return a.ritual.name.localeCompare(b.ritual.name);
  });

  return { active, done };
}

export type RhythmCardView = {
  /** Score numerator, or null when the card shows no fraction/bar. */
  numerator: number | null;
  denominator: number;
  status: MomentumStatus | null;
  /** Progress bar fill, 0–100. */
  barWidth: number;
  showProgress: boolean;
};

/**
 * The display model for a Rhythm card. A fraction + colored bar + momentum pill
 * only apply to rituals that accumulate over a period: daily counts distinct
 * days this week (X/7, paced against days elapsed); weekly/monthly count logs
 * against their target. Daily/open/one-time keep no bar. Momentum is suppressed
 * for fresh rituals (created in the last 7 days) with nothing logged yet.
 */
export function deriveRhythmCardView(
  { ritual, progress, weekDaysCount }: Pick<
    RhythmItem,
    "ritual" | "progress" | "weekDaysCount"
  >,
  today: string,
): RhythmCardView {
  const isFresh = isRitualFresh(ritual.created_at);
  const view: RhythmCardView = {
    numerator: null,
    denominator: 0,
    status: null,
    barWidth: 0,
    showProgress: false,
  };

  const isDaily =
    ritual.ritual_type === "recurring" && ritual.frequency_unit === "day";
  const isPeriodic =
    ritual.ritual_type === "recurring" &&
    (ritual.frequency_unit === "week" || ritual.frequency_unit === "month") &&
    (ritual.frequency_value ?? 0) > 0;

  if (isDaily) {
    view.numerator = weekDaysCount;
    view.denominator = DAILY_WEEK_TARGET;
    view.barWidth = (weekDaysCount / DAILY_WEEK_TARGET) * 100;
    view.status =
      weekDaysCount === 0 && isFresh
        ? null
        : deriveDailyMomentum(weekDaysCount, isoWeekday(today));
  } else if (isPeriodic) {
    const logs = progress?.logsThisPeriod ?? 0;
    view.numerator = logs;
    view.denominator = ritual.frequency_value ?? 0;
    view.barWidth = Math.min(100, Math.max(0, progress?.completionRate ?? 0));
    view.status =
      logs === 0 && isFresh
        ? null
        : deriveMomentumStatus(ritual.ritual_type, progress?.completionRate ?? null);
  }

  view.showProgress = view.numerator !== null;
  return view;
}
