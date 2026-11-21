import { describe, expect, it } from "vitest";

import { isoWeekday } from "@/lib/date";
import {
  arcWindowCount,
  buildArcGeometry,
  buildArcModel,
  countCompletedByDate,
  type ArcLog,
  type BuildArcModelInput,
} from "@/lib/rituals/arc";

// 2026-09-19 is a Saturday; the Monday of its week is 2026-09-14.
const TODAY = "2026-09-19";

function completed(...dates: string[]): ArcLog[] {
  return dates.map((logged_at) => ({ logged_at, status_id: "completed" }));
}

function build(
  logs: ArcLog[] = [],
  overrides: Partial<BuildArcModelInput> = {},
) {
  return buildArcModel({
    counts: countCompletedByDate(logs),
    ritualType: "recurring",
    frequencyUnit: "week",
    frequencyValue: 4,
    today: TODAY,
    startDate: "2026-08-10",
    ...overrides,
  });
}

describe("buildArcModel week shape", () => {
  it("builds every week as 7 days running Monday to Sunday", () => {
    for (const week of build(completed(TODAY)).weeks) {
      expect(week.days).toHaveLength(7);
      expect(isoWeekday(week.startDate)).toBe(1);
      expect(isoWeekday(week.endDate)).toBe(7);
      week.days.forEach((day, index) => {
        expect(isoWeekday(day.date)).toBe(index + 1);
      });
    }
  });

  it("ends on the Monday of the current week", () => {
    const weeks = build(completed(TODAY)).weeks;
    const last = weeks[weeks.length - 1];
    expect(last.startDate).toBe("2026-09-14");
    expect(last.endDate).toBe("2026-09-20");
  });
});

describe("buildArcModel today marker", () => {
  it("marks today once, at its Monday-based index", () => {
    const weeks = build(completed(TODAY)).weeks;
    const flagged = weeks.flatMap((week) =>
      week.days.filter((day) => day.isToday),
    );
    expect(flagged).toHaveLength(1);
    expect(flagged[0].date).toBe(TODAY);

    const last = weeks[weeks.length - 1];
    // Saturday is the 6th day of a Monday-first week.
    expect(last.days.findIndex((day) => day.isToday)).toBe(5);
  });
});

describe("buildArcModel log placement", () => {
  it("places Tuesday, Thursday and Saturday logs at indices 1, 3 and 5", () => {
    // The exact case from LUI-149: logs on Tue/Thu/Sat were reported as landing
    // under Mon/Wed/Fri. The model was always right — the labels were not.
    const weeks = build(
      completed("2026-09-15", "2026-09-17", "2026-09-19"),
    ).weeks;
    const last = weeks[weeks.length - 1];

    const loggedIndices = last.days
      .map((day, index) => (day.status === "logged" ? index : -1))
      .filter((index) => index !== -1);
    expect(loggedIndices).toEqual([1, 3, 5]);
    expect(last.count).toBe(3);
  });

  it("leaves the rest of the current week in the future", () => {
    const last = build(completed(TODAY)).weeks.at(-1)!;
    expect(last.days[6].status).toBe("future"); // Sunday, still ahead
    expect(last.days[0].status).toBe("rest"); // Monday, no log
  });
});

describe("countCompletedByDate", () => {
  it("sums completed logs per day and ignores other statuses", () => {
    expect(
      countCompletedByDate([
        { logged_at: "2026-09-15T08:00:00Z", status_id: "completed" },
        { logged_at: "2026-09-15T19:00:00Z", status_id: "completed" },
        { logged_at: "2026-09-16T08:00:00Z", status_id: "missed" },
        { logged_at: null, status_id: "completed" },
      ]),
    ).toEqual({ "2026-09-15": 2 });
  });
});

describe("arcWindowCount", () => {
  it("is 1 without a start date or for a ritual starting in the future", () => {
    expect(arcWindowCount({ today: TODAY })).toBe(1);
    expect(arcWindowCount({ today: TODAY, startDate: "2026-10-01" })).toBe(1);
  });

  it("stays at 1 while the first week fits in the current window", () => {
    // Monday 2026-06-29 is 11 weeks before the current Monday (2026-09-14).
    expect(arcWindowCount({ today: TODAY, startDate: "2026-06-29" })).toBe(1);
  });

  it("adds a window as soon as the first week falls out", () => {
    // 12 weeks before the current Monday.
    expect(arcWindowCount({ today: TODAY, startDate: "2026-06-22" })).toBe(2);
    // Mid-week start, 22 weeks back.
    expect(arcWindowCount({ today: TODAY, startDate: "2026-04-15" })).toBe(2);
    // 24 weeks back.
    expect(arcWindowCount({ today: TODAY, startDate: "2026-03-30" })).toBe(3);
  });
});

describe("buildArcModel past windows", () => {
  const OLD_START = "2026-04-15"; // a Wednesday

  it("renders 12 Monday-aligned weeks right before the current window", () => {
    const current = build([], { startDate: OLD_START }).weeks;
    const previous = build([], { startDate: OLD_START, offset: 1 }).weeks;

    expect(previous).toHaveLength(12);
    for (const week of previous) {
      expect(isoWeekday(week.startDate)).toBe(1);
      expect(isoWeekday(week.endDate)).toBe(7);
    }
    expect(previous.at(-1)!.endDate).toBe("2026-06-28");
    expect(current[0].startDate).toBe("2026-06-29");
  });

  it("places logs and has no today or future days", () => {
    const model = build(completed("2026-05-05T10:00:00Z"), {
      startDate: OLD_START,
      offset: 1,
    });
    const days = model.weeks.flatMap((week) => week.days);
    expect(days.find((day) => day.date === "2026-05-05")?.status).toBe(
      "logged",
    );
    expect(model.totalLogs).toBe(1);
    expect(days.some((day) => day.isToday || day.status === "future")).toBe(
      false,
    );
  });

  it("pads the oldest window with pre-start weeks and days", () => {
    const weeks = build([], { startDate: OLD_START, offset: 1 }).weeks;

    expect(weeks).toHaveLength(12);
    expect(weeks[0].startDate).toBe("2026-04-06");
    expect(weeks[0].beforeStart).toBe(true);
    expect(weeks[0].days.every((day) => day.status === "before")).toBe(true);

    // Start week: Mon/Tue before the start, Wednesday onwards counts.
    const startWeek = weeks[1];
    expect(startWeek.beforeStart).toBe(false);
    expect(startWeek.days.map((day) => day.status)).toEqual([
      "before",
      "before",
      "rest",
      "rest",
      "rest",
      "rest",
      "rest",
    ]);
  });

  it("lets a log win over the pre-start status", () => {
    const weeks = build(completed("2026-04-07T10:00:00Z"), {
      startDate: OLD_START,
      offset: 1,
    }).weeks;
    expect(weeks[0].beforeStart).toBe(false);
    expect(weeks[0].days[1].status).toBe("logged");
  });

  it("keeps the current window of a young ritual unpadded", () => {
    const weeks = build([], { startDate: "2026-08-12" }).weeks;
    expect(weeks).toHaveLength(6);
    expect(weeks.some((week) => week.beforeStart)).toBe(false);
  });
});

describe("buildArcGeometry", () => {
  it("draws no point for pre-start weeks but keeps the x scale", () => {
    const weeks = build([], { startDate: "2026-04-15", offset: 1 }).weeks;
    const geometry = buildArcGeometry(weeks, 4, 330, 96);

    expect(geometry.points.map((point) => point.weekIndex)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    ]);
    expect(geometry.points[0].x).toBe(30); // 1/11 of 330
    expect(geometry.points.at(-1)!.x).toBe(330);
  });
});
