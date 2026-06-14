import { describe, expect, it } from "vitest";

import { authorizeRecipient, RecipientForbiddenError } from "@/lib/push/recipients";

const SELF = "11111111-1111-1111-1111-111111111111";
const OTHER = "22222222-2222-2222-2222-222222222222";

describe("authorizeRecipient", () => {
  it("returns the authenticated user when no target is requested", () => {
    expect(authorizeRecipient(SELF)).toBe(SELF);
    expect(authorizeRecipient(SELF, undefined)).toBe(SELF);
    expect(authorizeRecipient(SELF, null)).toBe(SELF);
    expect(authorizeRecipient(SELF, "")).toBe(SELF);
  });

  it("allows a target that matches the authenticated user", () => {
    expect(authorizeRecipient(SELF, SELF)).toBe(SELF);
  });

  it("rejects a target that differs from the authenticated user", () => {
    expect(() => authorizeRecipient(SELF, OTHER)).toThrow(RecipientForbiddenError);
  });

  it("rejects when there is no authenticated user", () => {
    expect(() => authorizeRecipient("")).toThrow(RecipientForbiddenError);
    expect(() => authorizeRecipient("", OTHER)).toThrow(RecipientForbiddenError);
  });
});
