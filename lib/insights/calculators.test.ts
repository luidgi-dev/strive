import { describe, expect, it } from "vitest";

import {
  computeAdjustments,
  computeConfidence,
  computeCorrelations,
  type InsightLog,
  type InsightRitual,
} from "@/lib/insights/calculators";

// --- Fixture helpers --------------------------------------------------------
// Build logs relative to "today" using the same Monday-start, UTC conventions as
// the calculators, so the fixtures stay correct regardless of which weekday the
// chosen `today` is.

const MS = 86_400_000;
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const parse = (d: string) => Date.parse(`${d}T00:00:00.000Z`);
const addDays = (d: string, n: number) => iso(parse(d) + n * MS);
const mondayOf = (d: string) => addDays(d, -((new Date(parse(d)).getUTCDay() + 6) % 7));

const TODAY = "2026-06-15";
const CURRENT_MONDAY = mondayOf(TODAY);

/** Start (Monday) of the k-th fully-elapsed week before the current week (k>=1). */
const weekStart = (k: number) => addDays(CURRENT_MONDAY, -7 * k);
/** A date at weekday `offset` (0 = Monday … 6 = Sunday) within elapsed week k. */
const day = (k: number, offset: number) => addDays(weekStart(k), offset);

const daily = (id: string, name: string): InsightRitual => ({
  id,
  name,
  ritual_type: "recurring",
  frequency_unit: "day",
  frequency_value: 1,
});

const log = (ritualId: string, loggedAt: string): InsightLog => ({
  ritual_id: ritualId,
  logged_at: loggedAt,
  status_id: "completed",
});

/** Log `ritualId` on `count` distinct days (offsets 0..count-1) of elapsed week k. */
function logDays(ritualId: string, k: number, count: number): InsightLog[] {
  return Array.from({ length: count }, (_, offset) => log(ritualId, day(k, offset)));
}

// --- computeConfidence ------------------------------------------------------

describe("computeConfidence", () => {
  const base = {
    weeksObserved: 4,
    minWeeks: 6,
    effect: 0.3,
    effectCap: 0.6,
    sample: 4,
    sampleTarget: 8,
  };

  it("clamps to [0, 1]", () => {
    expect(
      computeConfidence({ ...base, weeksObserved: 999, effect: 999, sample: 999 }),
    ).toBe(1);
    expect(
      computeConfidence({ ...base, weeksObserved: 0, effect: 0, sample: -5 }),
    ).toBe(0);
  });

  it("increases monotonically with each signal", () => {
    const ref = computeConfidence(base);
    expect(computeConfidence({ ...base, weeksObserved: 6 })).toBeGreaterThan(ref);
    expect(computeConfidence({ ...base, effect: 0.6 })).toBeGreaterThan(ref);
    expect(computeConfidence({ ...base, sample: 8 })).toBeGreaterThan(ref);
  });

  it("treats effect as magnitude (sign-independent)", () => {
    expect(computeConfidence({ ...base, effect: -0.3 })).toBe(
      computeConfidence({ ...base, effect: 0.3 }),
    );
  });
});

// --- computeCorrelations ----------------------------------------------------

describe("computeCorrelations", () => {
  const sleep = daily("a", "Sleep");
  const sport = daily("b", "Sport");

  it("surfaces a positive lift, only in the qualifying direction", () => {
    const logs: InsightLog[] = [];
    // Weeks 1-4: Sleep high (6 days), Sport moderate (4 days, never "high").
    for (let k = 1; k <= 4; k++) {
      logs.push(...logDays(sleep.id, k, 6), ...logDays(sport.id, k, 4));
    }
    // Weeks 5-8: both low (1 day).
    for (let k = 5; k <= 8; k++) {
      logs.push(...logDays(sleep.id, k, 1), ...logDays(sport.id, k, 1));
    }

    const results = computeCorrelations(logs, [sleep, sport], TODAY);

    expect(results).toHaveLength(1);
    const [r] = results;
    expect(r.type).toBe("correlation");
    expect(r.ritualId).toBe(sleep.id); // Sport never clears the "high" threshold
    expect(r.facts).toMatchObject({
      ritualAName: "Sleep",
      ritualBName: "Sport",
      deltaPct: 60,
    });
    expect(r.confidence).toBeGreaterThan(0.5);
  });

  it("returns nothing when B is identical in high and baseline weeks", () => {
    const logs: InsightLog[] = [];
    for (let k = 1; k <= 8; k++) {
      logs.push(...logDays(sleep.id, k, 6), ...logDays(sport.id, k, 6));
    }
    expect(computeCorrelations(logs, [sleep, sport], TODAY)).toEqual([]);
  });

  it("returns nothing without enough overlapping high weeks", () => {
    const logs: InsightLog[] = [];
    // Sleep high in only 2 weeks (< minOverlapWeeks).
    for (let k = 1; k <= 2; k++) {
      logs.push(...logDays(sleep.id, k, 6), ...logDays(sport.id, k, 4));
    }
    for (let k = 3; k <= 8; k++) {
      logs.push(...logDays(sleep.id, k, 1), ...logDays(sport.id, k, 1));
    }
    expect(computeCorrelations(logs, [sleep, sport], TODAY)).toEqual([]);
  });
});

// --- computeAdjustments -----------------------------------------------------

describe("computeAdjustments", () => {
  const meditation = daily("m", "Meditation");

  it("flags the consistently missed weekday", () => {
    const logs: InsightLog[] = [];
    // 4 weeks, logged every weekday EXCEPT Wednesday (offset 2 from Monday).
    for (let k = 1; k <= 4; k++) {
      for (const offset of [0, 1, 3, 4, 5, 6]) {
        logs.push(log(meditation.id, day(k, offset)));
      }
    }

    const results = computeAdjustments(logs, [meditation], TODAY);

    expect(results).toHaveLength(1);
    const [r] = results;
    expect(r.type).toBe("adjustment");
    expect(r.ritualId).toBe(meditation.id);
    expect(r.facts).toMatchObject({ ritualName: "Meditation", weekday: "Wednesday", dropPct: 100 });
    expect(r.payload).toMatchObject({ weekday: 3 }); // getUTCDay: Wednesday = 3
    expect(r.confidence).toBeGreaterThan(0.5);
  });

  it("returns nothing when every weekday performs the same", () => {
    const logs: InsightLog[] = [];
    for (let k = 1; k <= 4; k++) {
      for (let offset = 0; offset < 7; offset++) logs.push(log(meditation.id, day(k, offset)));
    }
    expect(computeAdjustments(logs, [meditation], TODAY)).toEqual([]);
  });

  it("returns nothing below the minimum weeks", () => {
    const logs: InsightLog[] = [];
    for (let k = 1; k <= 2; k++) {
      for (const offset of [0, 1, 3, 4, 5, 6]) logs.push(log(meditation.id, day(k, offset)));
    }
    // weeks: 2 < minWeekdayOccurrences (3) → guarded out.
    expect(computeAdjustments(logs, [meditation], TODAY, { weeks: 2 })).toEqual([]);
  });
});
