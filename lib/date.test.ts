import { describe, expect, it } from "vitest";

import {
  daysInMonth,
  isoWeekday,
  startOfLocalDayIso,
  startOfWeek,
  todayInTimeZone,
} from "@/lib/date";

describe("isoWeekday", () => {
  it("returns 1 for Monday and 7 for Sunday", () => {
    expect(isoWeekday("2026-05-18")).toBe(1); // Monday
    expect(isoWeekday("2026-05-20")).toBe(3); // Wednesday
    expect(isoWeekday("2026-05-24")).toBe(7); // Sunday
  });
});

describe("startOfWeek", () => {
  it("returns the Monday of the week (Monday-based, like date_trunc)", () => {
    expect(startOfWeek("2026-05-20")).toBe("2026-05-18"); // Wed -> Mon
    expect(startOfWeek("2026-05-18")).toBe("2026-05-18"); // Mon -> itself
    expect(startOfWeek("2026-05-24")).toBe("2026-05-18"); // Sun -> Mon
  });

  it("crosses month boundaries", () => {
    expect(startOfWeek("2026-06-01")).toBe("2026-06-01"); // Mon
    expect(startOfWeek("2026-03-01")).toBe("2026-02-23"); // Sun -> prev Mon
  });
});

describe("daysInMonth", () => {
  it("handles 31/30-day months", () => {
    expect(daysInMonth("2026-05-20")).toBe(31);
    expect(daysInMonth("2026-04-10")).toBe(30);
  });

  it("handles February in common and leap years", () => {
    expect(daysInMonth("2026-02-15")).toBe(28);
    expect(daysInMonth("2024-02-15")).toBe(29);
  });
});

describe("todayInTimeZone", () => {
  it("returns an ISO YYYY-MM-DD string", () => {
    expect(todayInTimeZone("UTC")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("falls back to a valid date for an invalid timezone", () => {
    expect(todayInTimeZone("Not/AZone")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("startOfLocalDayIso", () => {
  // 2026-06-22T15:30:45.250Z — a fixed instant to make the math checkable.
  const now = new Date("2026-06-22T15:30:45.250Z");

  it("returns UTC midnight for the UTC zone", () => {
    expect(startOfLocalDayIso("UTC", now)).toBe("2026-06-22T00:00:00.000Z");
  });

  it("handles a positive offset zone (Asia/Tokyo, UTC+9)", () => {
    // 15:30 UTC is 00:30 next day in Tokyo -> local midnight is 15:00 UTC.
    expect(startOfLocalDayIso("Asia/Tokyo", now)).toBe(
      "2026-06-22T15:00:00.000Z",
    );
  });

  it("handles a negative offset zone (America/New_York, EDT -4 in June)", () => {
    // 15:30 UTC is 11:30 EDT -> local midnight (00:00 EDT) is 04:00 UTC.
    expect(startOfLocalDayIso("America/New_York", now)).toBe(
      "2026-06-22T04:00:00.000Z",
    );
  });

  it("falls back to UTC midnight on an invalid zone", () => {
    expect(startOfLocalDayIso("Not/AZone", now)).toBe(
      "2026-06-22T00:00:00.000Z",
    );
  });
});
