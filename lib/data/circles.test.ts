import { describe, expect, it } from "vitest";

import { circleFeedStatus } from "@/lib/data/circles";

describe("circleFeedStatus", () => {
  it("rests when the ritual has no weekly target", () => {
    expect(circleFeedStatus(3, null)).toBe("resting");
    expect(circleFeedStatus(null, 0)).toBe("resting");
  });

  it("rests when nothing has been logged yet", () => {
    expect(circleFeedStatus(0, 5)).toBe("resting");
    expect(circleFeedStatus(null, 5)).toBe("resting");
  });

  it("is on track at or above 80% of target", () => {
    expect(circleFeedStatus(4, 5)).toBe("on_track"); // exactly 0.8
    expect(circleFeedStatus(5, 5)).toBe("on_track");
    expect(circleFeedStatus(9, 7)).toBe("on_track"); // can exceed target
  });

  it("is steady below 80% of target", () => {
    expect(circleFeedStatus(2, 5)).toBe("steady");
    expect(circleFeedStatus(1, 7)).toBe("steady");
  });
});
