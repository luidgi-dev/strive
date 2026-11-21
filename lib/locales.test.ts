import { describe, expect, it } from "vitest";

import { homePath, localeFromPathname } from "@/lib/locales";

describe("homePath", () => {
  it("keeps English URLs unprefixed", () => {
    expect(homePath("en")).toBe("/");
  });

  it("prefixes other locales", () => {
    expect(homePath("fr")).toBe("/fr");
  });
});

describe("localeFromPathname", () => {
  it("reads a locale prefix", () => {
    expect(localeFromPathname("/fr/protected/flow")).toBe("fr");
    expect(localeFromPathname("/fr")).toBe("fr");
  });

  it("falls back to the default locale without a known prefix", () => {
    expect(localeFromPathname("/")).toBe("en");
    expect(localeFromPathname("/protected/flow")).toBe("en");
    expect(localeFromPathname("/de/page")).toBe("en");
  });

  it("does not match a locale that is only a prefix of the segment", () => {
    expect(localeFromPathname("/french-toast")).toBe("en");
  });
});
