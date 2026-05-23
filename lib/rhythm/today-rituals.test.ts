import { describe, expect, it } from "vitest";

import type {
  CompletedLogRow,
  RitualProgressEntry,
  RitualWithCategory,
} from "@/lib/data/rituals";

import { deriveRhythmCardView, selectTodayRituals } from "./today-rituals";

// 2026-05-20 is a Wednesday (ISO weekday 3); its week starts Mon 2026-05-18.
const TODAY = "2026-05-20";

function makeRitual(
  overrides: Partial<RitualWithCategory> = {},
): RitualWithCategory {
  return {
    id: "r1",
    name: "Ritual",
    icon: null,
    color: null,
    description: null,
    ritual_type: "recurring",
    frequency_unit: "day",
    frequency_value: 1,
    due_date: null,
    scheduled_days: null,
    scheduled_time: null,
    category_id: null,
    created_at: "2026-01-01T00:00:00Z",
    category: null,
    ...overrides,
  };
}

function run(
  rituals: RitualWithCategory[],
  opts: {
    progress?: Map<string, RitualProgressEntry>;
    weekLogs?: CompletedLogRow[];
    completedOneTimeIds?: Set<string>;
  } = {},
) {
  return selectTodayRituals({
    rituals,
    progressByRitualId: opts.progress ?? new Map(),
    weekLogs: opts.weekLogs ?? [],
    completedOneTimeIds: opts.completedOneTimeIds ?? new Set(),
    today: TODAY,
  });
}

const ids = (items: { ritual: RitualWithCategory }[]) =>
  items.map((i) => i.ritual.id);

describe("selectTodayRituals — daily", () => {
  it("is active when not logged today, done once logged", () => {
    const daily = makeRitual({ id: "d", frequency_unit: "day" });

    expect(ids(run([daily]).active)).toEqual(["d"]);

    const done = run([daily], {
      weekLogs: [{ ritual_id: "d", logged_at: TODAY }],
    });
    expect(ids(done.done)).toEqual(["d"]);
    expect(done.done[0].initialLogCount).toBe(1);
  });
});

describe("selectTodayRituals — daily quota for high targets", () => {
  it("keeps a 14×/week ritual active until 2 logs today, then clears it", () => {
    const weekly = makeRitual({
      id: "w",
      frequency_unit: "week",
      frequency_value: 14,
    });
    const oneLog = run([weekly], {
      weekLogs: [{ ritual_id: "w", logged_at: TODAY }],
    });
    expect(ids(oneLog.active)).toEqual(["w"]);

    const twoLogs = run([weekly], {
      weekLogs: [
        { ritual_id: "w", logged_at: TODAY },
        { ritual_id: "w", logged_at: TODAY },
      ],
    });
    expect(ids(twoLogs.done)).toEqual(["w"]);
  });

  it("clears a 5×/week ritual after a single log (quota 1)", () => {
    const weekly = makeRitual({
      id: "w5",
      frequency_unit: "week",
      frequency_value: 5,
    });
    const res = run([weekly], {
      weekLogs: [{ ritual_id: "w5", logged_at: TODAY }],
    });
    expect(ids(res.done)).toEqual(["w5"]);
  });

  it("is done when the period target is already met, even with no log today", () => {
    const weekly = makeRitual({
      id: "wt",
      frequency_unit: "week",
      frequency_value: 3,
    });
    const res = run([weekly], {
      progress: new Map([["wt", { completionRate: 100, logsThisPeriod: 3 }]]),
    });
    expect(ids(res.done)).toEqual(["wt"]);
    expect(res.done[0].initialLogCount).toBe(0);
  });
});

describe("selectTodayRituals — one-time scope", () => {
  it("shows only on the due date, and as done once completed", () => {
    const dueToday = makeRitual({
      id: "o",
      ritual_type: "one_time",
      frequency_unit: null,
      frequency_value: null,
      due_date: TODAY,
    });
    expect(ids(run([dueToday]).active)).toEqual(["o"]);

    const completed = run([dueToday], {
      completedOneTimeIds: new Set(["o"]),
    });
    expect(ids(completed.done)).toEqual(["o"]);

    const dueAnotherDay = makeRitual({
      id: "o2",
      ritual_type: "one_time",
      due_date: "2026-05-25",
    });
    const res = run([dueAnotherDay]);
    expect(res.active).toHaveLength(0);
    expect(res.done).toHaveLength(0);
  });
});

describe("selectTodayRituals — scheduled days", () => {
  it("only surfaces on scheduled weekdays", () => {
    const onWed = makeRitual({ id: "s1", scheduled_days: [3] }); // Wed
    expect(ids(run([onWed]).active)).toEqual(["s1"]);

    const monFri = makeRitual({ id: "s2", scheduled_days: [1, 5] });
    const res = run([monFri]); // today is Wed
    expect(res.active).toHaveLength(0);
    expect(res.done).toHaveLength(0);
  });
});

describe("selectTodayRituals — open rituals", () => {
  it("stays active even when logged, and is excluded from the day count", () => {
    const open = makeRitual({
      id: "op",
      ritual_type: "open",
      frequency_unit: null,
      frequency_value: null,
    });
    const res = run([open], {
      weekLogs: [
        { ritual_id: "op", logged_at: TODAY },
        { ritual_id: "op", logged_at: TODAY },
      ],
    });
    expect(ids(res.active)).toEqual(["op"]);
    expect(res.done).toHaveLength(0);
    expect(res.active[0].countsTowardDay).toBe(false);
    expect(res.active[0].initialLogCount).toBe(2);
  });
});

describe("selectTodayRituals — sort order", () => {
  it("orders active items one-time, then weekly/monthly, daily, open", () => {
    const open = makeRitual({ id: "open", ritual_type: "open" });
    const daily = makeRitual({ id: "daily", frequency_unit: "day" });
    const weekly = makeRitual({
      id: "weekly",
      frequency_unit: "week",
      frequency_value: 3,
    });
    const oneTime = makeRitual({
      id: "once",
      ritual_type: "one_time",
      due_date: TODAY,
    });

    const res = run([open, daily, weekly, oneTime]);
    expect(ids(res.active)).toEqual(["once", "weekly", "daily", "open"]);
  });
});

describe("deriveRhythmCardView", () => {
  const OLD = "2020-01-01T00:00:00Z"; // not "fresh"

  it("shows logs/target + completion bar for a weekly ritual", () => {
    const ritual = makeRitual({
      frequency_unit: "week",
      frequency_value: 5,
      created_at: OLD,
    });
    const view = deriveRhythmCardView(
      { ritual, progress: { completionRate: 60, logsThisPeriod: 3 }, weekDaysCount: 0 },
      TODAY,
    );
    expect(view).toMatchObject({
      numerator: 3,
      denominator: 5,
      barWidth: 60,
      status: "steady",
      showProgress: true,
    });
  });

  it("shows X/7 with pace-aware momentum for a daily ritual", () => {
    const ritual = makeRitual({ frequency_unit: "day", created_at: OLD });
    // Sunday (ISO 7): 6 of 7 elapsed days done -> ~86% pace -> strong.
    const view = deriveRhythmCardView(
      { ritual, progress: undefined, weekDaysCount: 6 },
      "2026-05-24",
    );
    expect(view.numerator).toBe(6);
    expect(view.denominator).toBe(7);
    expect(view.status).toBe("strong");
    expect(view.barWidth).toBeCloseTo(85.71, 1);
    expect(view.showProgress).toBe(true);
  });

  it("suppresses momentum for a fresh ritual with nothing logged", () => {
    const ritual = makeRitual({
      frequency_unit: "day",
      created_at: new Date().toISOString(),
    });
    const view = deriveRhythmCardView(
      { ritual, progress: undefined, weekDaysCount: 0 },
      TODAY,
    );
    expect(view.status).toBeNull();
    expect(view.showProgress).toBe(true); // still shows 0/7
    expect(view.barWidth).toBe(0);
  });

  it("shows no fraction/bar for open and one-time rituals", () => {
    const open = makeRitual({ ritual_type: "open", created_at: OLD });
    const oneTime = makeRitual({ ritual_type: "one_time", created_at: OLD });
    for (const ritual of [open, oneTime]) {
      const view = deriveRhythmCardView(
        { ritual, progress: undefined, weekDaysCount: 0 },
        TODAY,
      );
      expect(view.showProgress).toBe(false);
      expect(view.numerator).toBeNull();
      expect(view.status).toBeNull();
    }
  });
});
