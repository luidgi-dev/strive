import { afterEach, describe, expect, it, vi } from "vitest";

import { runTool } from "@/lib/ai/run-tool";

describe("runTool", () => {
  afterEach(() => vi.restoreAllMocks());

  it("passes a successful result straight through", async () => {
    const result = await runTool("ok", async () => ({ status: "ok", value: 42 }));
    expect(result).toEqual({ status: "ok", value: 42 });
  });

  it("returns structured outcomes (not_found / ambiguous) unchanged", async () => {
    const notFound = await runTool("nf", async () => ({
      status: "not_found" as const,
      query: "run",
    }));
    expect(notFound).toEqual({ status: "not_found", query: "run" });
  });

  it("converts a thrown error into { status: 'error' } and never rethrows", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await runTool("boom", async () => {
      throw new Error("relation \"rituals\" does not exist");
    });

    expect(result).toEqual({ status: "error" });
    // The raw error is logged server-side only, never surfaced to the caller.
    expect(spy).toHaveBeenCalledOnce();
  });

  it("does not leak the raw error message in its return value", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await runTool("leak", async () => {
      throw new Error("secret column user_credits.balance");
    });

    expect(JSON.stringify(result)).not.toContain("secret");
    expect(JSON.stringify(result)).not.toContain("user_credits");
  });
});
