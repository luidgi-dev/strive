import { describe, expect, it } from "vitest";

import { matchRitualByName } from "@/lib/ai/ritual-match";

// Mirrors the screenshot's ritual board so the cases read against real data.
const RITUALS = [
  { id: "1", name: "Work on Strive" },
  { id: "2", name: "Musculation" },
  { id: "3", name: "Protéines" },
  { id: "4", name: "Skincare nuit" },
  { id: "5", name: "Skincare matin" },
  { id: "6", name: "Boxe" },
  { id: "7", name: "Read a book of the Bible" },
  { id: "8", name: "Étirements" },
  { id: "9", name: "Coiffeur" },
];

describe("matchRitualByName", () => {
  it("resolves an exact name (case-insensitive)", () => {
    expect(matchRitualByName("boxe", RITUALS)).toEqual({
      status: "ok",
      ritual: { id: "6", name: "Boxe" },
    });
  });

  it("resolves across accents and plural variants (Proteins → Protéines)", () => {
    const result = matchRitualByName("Proteins", RITUALS);
    expect(result.status).toBe("ok");
    expect(result.status === "ok" && result.ritual.id).toBe("3");
  });

  it("resolves an unaccented spelling (Etirements → Étirements)", () => {
    const result = matchRitualByName("Etirements", RITUALS);
    expect(result.status === "ok" && result.ritual.id).toBe("8");
  });

  it("resolves despite extra and reordered words", () => {
    const result = matchRitualByName(
      "how much book of the Bible have I read this week",
      RITUALS,
    );
    expect(result.status === "ok" && result.ritual.id).toBe("7");
  });

  it("offers candidates when several rituals are equally plausible", () => {
    const result = matchRitualByName("skincare", RITUALS);
    expect(result.status).toBe("ambiguous");
    const names =
      result.status === "ambiguous"
        ? result.candidates.map((c) => c.name).sort()
        : [];
    expect(names).toEqual(["Skincare matin", "Skincare nuit"]);
  });

  it("returns not_found when nothing is close", () => {
    expect(matchRitualByName("pizza delivery", RITUALS)).toEqual({
      status: "not_found",
    });
  });

  it("returns not_found for an empty query", () => {
    expect(matchRitualByName("   ", RITUALS)).toEqual({ status: "not_found" });
  });
});
