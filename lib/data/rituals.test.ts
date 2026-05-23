import { describe, expect, it } from "vitest";

import {
  deriveDailyMomentum,
  deriveMomentumStatus,
  paceToStatus,
} from "@/lib/data/rituals";

describe("paceToStatus", () => {
  it("maps thresholds to strong / steady / resting", () => {
    expect(paceToStatus(100)).toBe("strong");
    expect(paceToStatus(80)).toBe("strong");
    expect(paceToStatus(79)).toBe("steady");
    expect(paceToStatus(40)).toBe("steady");
    expect(paceToStatus(39)).toBe("resting");
    expect(paceToStatus(0)).toBe("resting");
  });
});

describe("deriveMomentumStatus", () => {
  it("only applies to recurring rituals", () => {
    expect(deriveMomentumStatus("one_time", 100)).toBeNull();
    expect(deriveMomentumStatus("open", 100)).toBeNull();
  });

  it("treats a null completion rate (open target) as resting", () => {
    expect(deriveMomentumStatus("recurring", null)).toBe("resting");
  });

  it("derives from the completion rate", () => {
    expect(deriveMomentumStatus("recurring", 90)).toBe("strong");
    expect(deriveMomentumStatus("recurring", 50)).toBe("steady");
    expect(deriveMomentumStatus("recurring", 10)).toBe("resting");
  });
});

describe("deriveDailyMomentum", () => {
  it("paces days done against days elapsed (no early-week penalty)", () => {
    // Tuesday, both days done -> on pace.
    expect(deriveDailyMomentum(2, 2)).toBe("strong");
    // Wednesday, 2 of 3 done.
    expect(deriveDailyMomentum(2, 3)).toBe("steady");
    // Friday, 1 of 5 done.
    expect(deriveDailyMomentum(1, 5)).toBe("resting");
  });

  it("returns resting before any day has elapsed", () => {
    expect(deriveDailyMomentum(0, 0)).toBe("resting");
  });
});
