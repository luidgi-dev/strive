import { describe, expect, it } from "vitest";

import { isoWeekday } from "@/lib/date";
import { buildArcModel, type ArcLog } from "@/lib/rituals/arc";

// 2026-09-19 is a Saturday; the Monday of its week is 2026-09-14.
const TODAY = "2026-09-19";

function completed(...dates: string[]): ArcLog[] {
  return dates.map((logged_at) => ({ logged_at, status_id: "completed" }));
}

function build(logs: ArcLog[] = []) {
  return buildArcModel({
    logs,
    ritualType: "recurring",
    frequencyUnit: "week",
    frequencyValue: 4,
    today: TODAY,
    startDate: "2026-08-10",
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
