import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import {
  getRitualProgress,
  getRitualsForActiveUser,
  getWeekCompletedLogs,
  paceToStatus,
  rollingMomentumStatus,
} from "@/lib/data/rituals";
import type { Database } from "@/lib/supabase/database.types";

// Minimal chainable Supabase mock that records every .eq(column, value) call,
// tagged with the table it was made on. Each builder is awaitable (resolves to
// { data: rows }) and supports .maybeSingle()/.single(). Enough to assert which
// queries scope by user_id without touching a real database.
type EqCall = { table: string; column: string; value: unknown };

interface QueryBuilder {
  select: () => QueryBuilder;
  eq: (column: string, value: unknown) => QueryBuilder;
  is: () => QueryBuilder;
  order: () => QueryBuilder;
  gte: () => QueryBuilder;
  lte: () => QueryBuilder;
  ilike: () => QueryBuilder;
  in: () => QueryBuilder;
  limit: () => QueryBuilder;
  maybeSingle: () => Promise<{ data: unknown; error: null }>;
  single: () => Promise<{ data: unknown; error: null }>;
  then: (resolve: (value: { data: unknown[]; error: null }) => unknown) => unknown;
}

function makeClient(rowsByTable: Record<string, unknown[]>) {
  const eqCalls: EqCall[] = [];

  function from(table: string): QueryBuilder {
    const rows = rowsByTable[table] ?? [];
    const builder: QueryBuilder = {
      select: () => builder,
      eq: (column, value) => {
        eqCalls.push({ table, column, value });
        return builder;
      },
      is: () => builder,
      order: () => builder,
      gte: () => builder,
      lte: () => builder,
      ilike: () => builder,
      in: () => builder,
      limit: () => builder,
      maybeSingle: () => Promise.resolve({ data: rows[0] ?? null, error: null }),
      single: () => Promise.resolve({ data: rows[0] ?? null, error: null }),
      then: (resolve) => resolve({ data: rows, error: null }),
    };
    return builder;
  }

  const client = { from } as unknown as SupabaseClient<Database>;
  return { client, eqCalls };
}

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

describe("rollingMomentumStatus", () => {
  const recurring = (momentumCount: number | null, momentumTarget: number | null) =>
    ({ momentumCount, momentumTarget });

  it("only applies to recurring rituals", () => {
    expect(rollingMomentumStatus(recurring(7, 7), "one_time", false)).toBeNull();
    expect(rollingMomentumStatus(recurring(7, 7), "open", false)).toBeNull();
  });

  it("returns null without a target (open target) or no progress row", () => {
    expect(rollingMomentumStatus(recurring(0, null), "recurring", false)).toBeNull();
    expect(rollingMomentumStatus(recurring(3, 0), "recurring", false)).toBeNull();
    expect(rollingMomentumStatus(undefined, "recurring", false)).toBeNull();
  });

  it("suppresses momentum for a fresh ritual with nothing logged", () => {
    expect(rollingMomentumStatus(recurring(0, 7), "recurring", true)).toBeNull();
    // Not fresh: an empty window reads as resting, not null.
    expect(rollingMomentumStatus(recurring(0, 7), "recurring", false)).toBe("resting");
  });

  it("paces a daily ritual over the rolling 7-day window", () => {
    // 6 of the last 7 days -> strong (carries across a Monday).
    expect(rollingMomentumStatus(recurring(6, 7), "recurring", false)).toBe("strong");
    // A single log after a gap -> resting (the bug this fixes).
    expect(rollingMomentumStatus(recurring(1, 7), "recurring", false)).toBe("resting");
  });

  it("paces weekly / monthly rituals against their target", () => {
    expect(rollingMomentumStatus(recurring(3, 3), "recurring", false)).toBe("strong");
    expect(rollingMomentumStatus(recurring(2, 3), "recurring", false)).toBe("steady");
    expect(rollingMomentumStatus(recurring(1, 3), "recurring", false)).toBe("resting");
    expect(rollingMomentumStatus(recurring(8, 10), "recurring", false)).toBe("strong");
  });
});

describe("user_id scoping (defense-in-depth on the AI surface)", () => {
  it("getRitualsForActiveUser filters rituals + ritual_progress, never categories", async () => {
    const { client, eqCalls } = makeClient({
      rituals: [{ id: "r1", category_id: null }],
      ritual_categories: [],
      ritual_progress: [
        { ritual_id: "r1", completion_rate: 50, logs_this_period: 1, target: 2 },
      ],
    });

    await getRitualsForActiveUser(client, "user-1");

    const userIdEqs = eqCalls.filter((c) => c.column === "user_id");
    expect(userIdEqs).toContainEqual({
      table: "rituals",
      column: "user_id",
      value: "user-1",
    });
    expect(userIdEqs).toContainEqual({
      table: "ritual_progress",
      column: "user_id",
      value: "user-1",
    });
    // System categories have a null user_id and must stay visible — never filter them.
    expect(
      eqCalls.some(
        (c) => c.table === "ritual_categories" && c.column === "user_id",
      ),
    ).toBe(false);
  });

  it("getRitualProgress filters by user_id when provided", async () => {
    const { client, eqCalls } = makeClient({
      ritual_progress: [{ completion_rate: 1, logs_this_period: 1, target: 1 }],
    });

    await getRitualProgress(client, "r1", "user-1");

    expect(eqCalls).toContainEqual({
      table: "ritual_progress",
      column: "user_id",
      value: "user-1",
    });
  });

  it("getWeekCompletedLogs filters by user_id when provided", async () => {
    const { client, eqCalls } = makeClient({ ritual_logs: [] });

    await getWeekCompletedLogs(client, "2026-06-01", "user-1");

    expect(eqCalls).toContainEqual({
      table: "ritual_logs",
      column: "user_id",
      value: "user-1",
    });
  });

  it("omits the user_id filter when no userId is passed (relies on RLS)", async () => {
    const { client, eqCalls } = makeClient({
      rituals: [],
      ritual_categories: [],
      ritual_progress: [],
      ritual_logs: [],
    });

    await getRitualsForActiveUser(client);
    await getWeekCompletedLogs(client, "2026-06-01");

    expect(eqCalls.some((c) => c.column === "user_id")).toBe(false);
  });
});
