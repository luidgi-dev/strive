// Insights Stats Engine — the "facts" half of the hybrid intelligence model.
//
// These functions extract PRECISE statistics from completed ritual logs. They
// never call the AI: the orchestrator passes their output to a prompt, and the
// model only phrases the numbers (it cannot invent them). The pure functions
// take plain arrays so they are deterministic and unit-testable without a DB.
//
// Dates are plain YYYY-MM-DD strings in UTC, and weeks are Monday-start, exactly
// like `lib/rituals/arc.ts` (matching Postgres `date_trunc('week')`).

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export type InsightType = "correlation" | "adjustment";

/** A completed log, reduced to the fields the calculators need. */
export type InsightLog = {
  ritual_id: string;
  logged_at: string;
  status_id: string;
};

/** A ritual, reduced to the fields the calculators need. */
export type InsightRitual = {
  id: string;
  name: string;
  ritual_type: string;
  frequency_unit: string | null;
  frequency_value: number | null;
};

/**
 * One computed fact, ready to be phrased by the AI and cached. `facts` is the
 * structured input for the prompt; `payload` is the raw stats + action metadata
 * persisted in the `insights` table (so nothing the model writes is trusted as a
 * number). `basisWeeks` drives the "Last N weeks" label (the lookback window).
 */
export type CalculatorResult = {
  type: InsightType;
  confidence: number;
  ritualId: string | null;
  basisWeeks: number;
  facts: Record<string, unknown>;
  payload: Record<string, unknown>;
};

// --- Confidence model -------------------------------------------------------

/**
 * How much each signal contributes to a card's 0..1 confidence. Tuned so a card
 * needs a real effect AND enough history to clear the orchestrator's threshold,
 * not just one strong week.
 */
export const CONFIDENCE_WEIGHTS = {
  sufficiency: 0.4, // enough weeks of history observed
  effect: 0.35, // how strong the pattern is
  sample: 0.25, // how much data backs it
} as const;

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

/**
 * Blend data sufficiency, effect size and sample size into a single 0..1 score.
 * Each term is independently clamped to [0,1], so no single signal can dominate
 * past its weight.
 */
export function computeConfidence(input: {
  weeksObserved: number;
  minWeeks: number;
  effect: number;
  effectCap: number;
  sample: number;
  sampleTarget: number;
}): number {
  const sufficiency = clamp01(input.weeksObserved / input.minWeeks);
  const effect = clamp01(Math.abs(input.effect) / input.effectCap);
  const sample = clamp01(input.sample / input.sampleTarget);
  return clamp01(
    CONFIDENCE_WEIGHTS.sufficiency * sufficiency +
      CONFIDENCE_WEIGHTS.effect * effect +
      CONFIDENCE_WEIGHTS.sample * sample,
  );
}

// --- Date / week helpers (mirror lib/rituals/arc.ts conventions) ------------

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_PER_WEEK = 7;

const parseISO = (value: string): number => Date.parse(`${value}T00:00:00.000Z`);
const toISO = (ms: number): string => new Date(ms).toISOString().slice(0, 10);
const addDays = (value: string, days: number): string =>
  toISO(parseISO(value) + days * MS_PER_DAY);

/** Monday-start week containing `value`, as YYYY-MM-DD. */
function mondayOf(value: string): string {
  const day = new Date(parseISO(value)).getUTCDay(); // 0 = Sunday
  const offset = (day + 6) % 7;
  return addDays(value, -offset);
}

/**
 * The `weeks` fully-elapsed week-start Mondays immediately before the current
 * week. The in-progress week is excluded so a partial week never skews a rate
 * (same reasoning as the Arc's trend, which compares fully elapsed weeks).
 */
function elapsedWeekStarts(today: string, weeks: number): string[] {
  const currentMonday = mondayOf(today);
  const starts: string[] = [];
  for (let i = weeks; i >= 1; i--) starts.push(addDays(currentMonday, -DAYS_PER_WEEK * i));
  return starts;
}

const mean = (xs: number[]): number =>
  xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;
const round2 = (n: number): number => Math.round(n * 100) / 100;

/** Weekday names indexed by `Date.getUTCDay()` (0 = Sunday). English; the AI localizes. */
const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const isDailyRecurring = (r: InsightRitual): boolean =>
  r.ritual_type === "recurring" && r.frequency_unit === "day";

/**
 * Distinct completed days per (ritual, week), restricted to weeks in `windowSet`.
 * Multiple logs on the same day count once — momentum is about days, not volume.
 */
function distinctDaysByRitualWeek(
  logs: InsightLog[],
  windowSet: Set<string>,
): { count: (ritualId: string, weekStart: string) => number; activeWeeks: Set<string> } {
  const seen = new Map<string, Set<string>>(); // `${ritualId}|${weekStart}` -> dates
  const activeWeeks = new Set<string>();
  for (const log of logs) {
    const weekStart = mondayOf(log.logged_at);
    if (!windowSet.has(weekStart)) continue;
    activeWeeks.add(weekStart);
    const key = `${log.ritual_id}|${weekStart}`;
    let set = seen.get(key);
    if (!set) {
      set = new Set();
      seen.set(key, set);
    }
    set.add(log.logged_at);
  }
  return {
    count: (ritualId, weekStart) => seen.get(`${ritualId}|${weekStart}`)?.size ?? 0,
    activeWeeks,
  };
}

// --- Correlation ------------------------------------------------------------

export type CorrelationOpts = {
  weeks?: number;
  minWeeks?: number;
  minOverlapWeeks?: number;
  minEffect?: number;
};

/**
 * Find ritual pairs where logging A heavily lifts B's completion. For each daily
 * recurring ritual A, take the weeks where A was logged on most days ("A-high"),
 * and compare B's mean weekly completion in those weeks against B's baseline
 * across the window. Only positive lifts are surfaced (the "linked" framing).
 * Each unordered pair keeps its strongest direction.
 */
export function computeCorrelations(
  logs: InsightLog[],
  rituals: InsightRitual[],
  today: string,
  opts: CorrelationOpts = {},
): CalculatorResult[] {
  const { weeks = 8, minWeeks = 6, minOverlapWeeks = 4, minEffect = 0.2 } = opts;
  const daily = rituals.filter(isDailyRecurring);
  if (daily.length < 2) return [];

  const windowWeeks = elapsedWeekStarts(today, weeks);
  const windowSet = new Set(windowWeeks);
  const { count, activeWeeks } = distinctDaysByRitualWeek(logs, windowSet);
  const weeksObserved = activeWeeks.size;

  const highThreshold = Math.ceil(DAYS_PER_WEEK * 0.7); // logged on most days (5/7)
  const best = new Map<string, CalculatorResult>();

  for (const a of daily) {
    const aHighWeeks = windowWeeks.filter((w) => count(a.id, w) >= highThreshold);
    if (aHighWeeks.length < minOverlapWeeks) continue;

    for (const b of daily) {
      if (b.id === a.id) continue;

      const baseline = mean(windowWeeks.map((w) => count(b.id, w) / DAYS_PER_WEEK));
      if (baseline <= 0) continue;

      const highRate = mean(aHighWeeks.map((w) => count(b.id, w) / DAYS_PER_WEEK));
      const effect = (highRate - baseline) / baseline;
      if (effect < minEffect) continue; // positive lifts only

      const confidence = computeConfidence({
        weeksObserved,
        minWeeks,
        effect,
        effectCap: 0.6,
        sample: aHighWeeks.length,
        sampleTarget: 8,
      });

      const result: CalculatorResult = {
        type: "correlation",
        confidence,
        ritualId: a.id,
        basisWeeks: weeks,
        facts: {
          ritualAName: a.name,
          ritualBName: b.name,
          threshold: highThreshold,
          deltaPct: Math.round(effect * 100),
          highWeeks: aHighWeeks.length,
          weeks,
        },
        payload: {
          ritualBId: b.id,
          baselineRate: round2(baseline),
          highRate: round2(highRate),
          effect: round2(effect),
          sampleSize: aHighWeeks.length,
          threshold: highThreshold,
          weeksObserved,
        },
      };

      const pairKey = [a.id, b.id].sort().join("|");
      const existing = best.get(pairKey);
      if (!existing || confidence > existing.confidence) best.set(pairKey, result);
    }
  }

  return [...best.values()];
}

// --- Adjustment -------------------------------------------------------------

export type AdjustmentOpts = {
  weeks?: number;
  minWeeks?: number;
  minWeekdayOccurrences?: number;
  minDrop?: number;
};

/**
 * Flag a single weekday where a daily ritual consistently underperforms its
 * other days — the cue to lower that day's ambition. One card per ritual (its
 * worst weekday). Each weekday occurs exactly `weeks` times across `weeks` full
 * weeks, so occurrences gate on `weeks >= minWeekdayOccurrences`.
 */
export function computeAdjustments(
  logs: InsightLog[],
  rituals: InsightRitual[],
  today: string,
  opts: AdjustmentOpts = {},
): CalculatorResult[] {
  const { weeks = 4, minWeeks = 4, minWeekdayOccurrences = 3, minDrop = 0.3 } = opts;
  if (weeks < minWeekdayOccurrences) return [];
  const daily = rituals.filter(isDailyRecurring);
  if (daily.length === 0) return [];

  const windowWeeks = elapsedWeekStarts(today, weeks);
  const windowSet = new Set(windowWeeks);

  // Weeks with any activity, for the sufficiency term.
  const activeWeeks = new Set<string>();
  for (const log of logs) {
    const w = mondayOf(log.logged_at);
    if (windowSet.has(w)) activeWeeks.add(w);
  }
  const weeksObserved = activeWeeks.size;

  const results: CalculatorResult[] = [];

  for (const r of daily) {
    // Distinct completed days for this ritual, bucketed by weekday.
    const completedByWeekday = new Array<number>(7).fill(0);
    const countedDates = new Set<string>();
    for (const log of logs) {
      if (log.ritual_id !== r.id) continue;
      const w = mondayOf(log.logged_at);
      if (!windowSet.has(w) || countedDates.has(log.logged_at)) continue;
      countedDates.add(log.logged_at);
      completedByWeekday[new Date(parseISO(log.logged_at)).getUTCDay()] += 1;
    }
    if (countedDates.size === 0) continue;

    const rate = completedByWeekday.map((c) => c / weeks); // 0..1 per weekday

    let worstDay = -1;
    let worstDrop = 0;
    let worstOtherAvg = 0;
    for (let wd = 0; wd < 7; wd++) {
      const otherAvg = mean(rate.filter((_, i) => i !== wd));
      if (otherAvg <= 0) continue;
      const drop = (otherAvg - rate[wd]) / otherAvg;
      if (drop >= minDrop && drop > worstDrop) {
        worstDay = wd;
        worstDrop = drop;
        worstOtherAvg = otherAvg;
      }
    }
    if (worstDay === -1) continue;

    const confidence = computeConfidence({
      weeksObserved,
      minWeeks,
      effect: worstDrop,
      effectCap: 0.6,
      sample: countedDates.size,
      sampleTarget: weeks * 3,
    });

    results.push({
      type: "adjustment",
      confidence,
      ritualId: r.id,
      basisWeeks: weeks,
      facts: {
        ritualName: r.name,
        weekday: WEEKDAY_NAMES[worstDay],
        dropPct: Math.round(worstDrop * 100),
        weeks,
      },
      payload: {
        targetRitualId: r.id,
        weekday: worstDay,
        weekdayName: WEEKDAY_NAMES[worstDay],
        dayRate: round2(rate[worstDay]),
        otherAvg: round2(worstOtherAvg),
        weeksObserved,
      },
    });
  }

  return results;
}

/** Run every v1 calculator over one user's data and return all candidate facts. */
export function buildInsightCandidates(input: {
  logs: InsightLog[];
  rituals: InsightRitual[];
  today: string;
}): CalculatorResult[] {
  return [
    ...computeCorrelations(input.logs, input.rituals, input.today),
    ...computeAdjustments(input.logs, input.rituals, input.today),
  ];
}

// --- DB fetch ---------------------------------------------------------------

/**
 * Completed logs for one user since `sinceISO` (inclusive). The `user_id` filter
 * is explicit on top of RLS — the scheduled job runs under the service role,
 * where RLS does not scope rows for us (same defense-in-depth as the AI tools).
 */
export async function fetchCompletedLogsSince(
  client: SupabaseClient<Database>,
  userId: string,
  sinceISO: string,
): Promise<InsightLog[]> {
  const { data, error } = await client
    .from("ritual_logs")
    .select("ritual_id, logged_at, status_id")
    .eq("user_id", userId)
    .eq("status_id", "completed")
    .gte("logged_at", sinceISO);

  if (error) throw error;

  return (data ?? []).filter(
    (r): r is InsightLog =>
      r.ritual_id != null && r.logged_at != null && r.status_id != null,
  );
}
