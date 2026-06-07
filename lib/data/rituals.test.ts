import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import {
  deriveDailyMomentum,
  deriveMomentumStatus,
  getRitualProgress,
  getRitualsForActiveUser,
  getWeekCompletedLogs,
  paceToStatus,
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
