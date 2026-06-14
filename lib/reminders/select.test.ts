import { describe, expect, it } from "vitest";

import { hourInTimeZone } from "@/lib/date";
import { selectOneTimeDueToday, type ReminderRitual } from "@/lib/reminders/select";

const TODAY = "2026-06-16";

function ritual(over: Partial<ReminderRitual>): ReminderRitual {
  return {
    id: "r1",
    name: "Dentist appointment",
    ritual_type: "one_time",
    due_date: TODAY,
    is_active: true,
    archived_at: null,
    ...over,
  };
}

describe("selectOneTimeDueToday", () => {
  it("includes an active one_time due today that isn't completed", () => {
    const result = selectOneTimeDueToday([ritual({})], TODAY, new Set());
    expect(result.map((r) => r.id)).toEqual(["r1"]);
  });

  it("excludes recurring and open rituals even if dated today", () => {
    const rituals = [
      ritual({ id: "rec", ritual_type: "recurring" }),
      ritual({ id: "open", ritual_type: "open" }),
    ];
    expect(selectOneTimeDueToday(rituals, TODAY, new Set())).toEqual([]);
  });

  it("excludes one_time due on another day", () => {
    const result = selectOneTimeDueToday(
      [ritual({ due_date: "2026-06-17" })],
      TODAY,
      new Set(),
    );
    expect(result).toEqual([]);
  });

  it("excludes already-completed, archived, and inactive rituals", () => {
    const rituals = [
      ritual({ id: "done" }),
      ritual({ id: "archived", archived_at: "2026-06-15T00:00:00Z" }),
      ritual({ id: "inactive", is_active: false }),
    ];
    const result = selectOneTimeDueToday(rituals, TODAY, new Set(["done"]));
    expect(result).toEqual([]);
  });

  it("returns several when multiple one_time rituals are due today", () => {
    const rituals = [ritual({ id: "a" }), ritual({ id: "b" })];
    expect(selectOneTimeDueToday(rituals, TODAY, new Set()).length).toBe(2);
  });
});

describe("hourInTimeZone", () => {
  const at6Utc = new Date("2026-06-16T06:00:00Z");

  it("resolves the local hour per timezone", () => {
    expect(hourInTimeZone("Europe/Paris", at6Utc)).toBe(8); // UTC+2 in June
    expect(hourInTimeZone("UTC", at6Utc)).toBe(6);
    expect(hourInTimeZone("America/New_York", at6Utc)).toBe(2); // UTC-4 in June
  });

  it("normalizes midnight to 0", () => {
    expect(hourInTimeZone("UTC", new Date("2026-06-16T00:00:00Z"))).toBe(0);
  });

  it("falls back to the UTC hour on an invalid timezone", () => {
    expect(hourInTimeZone("Not/AZone", at6Utc)).toBe(6);
  });
});
