import type { SupabaseClient } from "@supabase/supabase-js";

import type { RitualFormValues } from "@/lib/data/rituals-schema";
import type {
  Database,
  Tables,
  TablesInsert,
} from "@/lib/supabase/database.types";

export type RitualType = "recurring" | "one_time" | "open";
export type FrequencyUnit = "day" | "week" | "month";
export type MomentumStatus = "strong" | "steady" | "resting";

export type RitualRow = Pick<
  Tables<"rituals">,
  | "id"
  | "name"
  | "icon"
  | "color"
  | "description"
  | "ritual_type"
  | "frequency_unit"
  | "frequency_value"
  | "due_date"
  | "scheduled_days"
  | "scheduled_time"
  | "category_id"
  | "created_at"
>;

export type RitualForEditRow = Pick<
  Tables<"rituals">,
  | "id"
  | "name"
  | "icon"
  | "color"
  | "description"
  | "ritual_type"
  | "frequency_unit"
  | "frequency_value"
  | "due_date"
  | "scheduled_days"
  | "scheduled_time"
  | "category_id"
>;

export type RitualCategoryRow = Pick<
  Tables<"ritual_categories">,
  "id" | "name" | "slug" | "user_id"
>;

export type RitualWithCategory = RitualRow & {
  category: RitualCategoryRow | null;
};

export type RitualDetailRow = RitualWithCategory &
  Pick<Tables<"rituals">, "started_at" | "archived_at">;

/** A row on the archived rituals screen — no momentum/schedule, just identity + archive date. */
export type ArchivedRitualRow = Pick<
  Tables<"rituals">,
  "id" | "name" | "icon" | "archived_at"
> & { category: RitualCategoryRow | null };

/** A single completed/rest/missed entry, as exposed by ritual_log_history. */
export type RitualLogHistoryEntry = Pick<
  Tables<"ritual_log_history">,
  "logged_at" | "status_id" | "note"
>;

export type RitualProgressEntry = {
  completionRate: number | null;
  logsThisPeriod: number | null;
  /** Expected logs for the current period (null for open rituals / no target). */
  target: number | null;
};

export type RitualsData = {
  rituals: RitualWithCategory[];
  progressByRitualId: Map<string, RitualProgressEntry>;
};

const RITUAL_COLUMNS =
  "id, name, icon, color, description, ritual_type, frequency_unit, frequency_value, due_date, scheduled_days, scheduled_time, category_id, created_at" as const;

const RITUAL_EDIT_COLUMNS =
  "id, name, icon, color, description, ritual_type, frequency_unit, frequency_value, due_date, scheduled_days, scheduled_time, category_id" as const;

const RITUAL_DETAIL_COLUMNS = `${RITUAL_COLUMNS}, started_at, archived_at` as const;

const RITUAL_ARCHIVED_COLUMNS = "id, name, icon, category_id, archived_at" as const;

const CATEGORY_COLUMNS = "id, name, slug, user_id" as const;

function indexCategoriesById(
  categories: RitualCategoryRow[] | null,
): Map<string, RitualCategoryRow> {
  const map = new Map<string, RitualCategoryRow>();
  for (const cat of categories ?? []) map.set(cat.id, cat);
  return map;
}

export async function getRitualsForActiveUser(
  client: SupabaseClient<Database>,
): Promise<RitualsData> {
  const [ritualsRes, categoriesRes, progressRes] = await Promise.all([
    client
      .from("rituals")
      .select(RITUAL_COLUMNS)
      .eq("is_active", true)
      .is("archived_at", null)
      .order("created_at", { ascending: true }),
    // Only active categories resolve; a ritual still pointing at an archived
    // category (e.g. a failed detach) gracefully falls back to "Other".
    client.from("ritual_categories").select(CATEGORY_COLUMNS).eq("is_active", true),
    client.from("ritual_progress").select("ritual_id, completion_rate, logs_this_period, target"),
  ]);

  if (ritualsRes.error) throw ritualsRes.error;
  if (categoriesRes.error) throw categoriesRes.error;
  if (progressRes.error) throw progressRes.error;

  const categoriesById = indexCategoriesById(categoriesRes.data);

  const rituals: RitualWithCategory[] = (ritualsRes.data ?? []).map((r) => ({
    ...r,
    category: r.category_id ? categoriesById.get(r.category_id) ?? null : null,
  }));

  const progressByRitualId = new Map<string, RitualProgressEntry>();
  for (const p of progressRes.data ?? []) {
    if (!p.ritual_id) continue;
    progressByRitualId.set(p.ritual_id, {
      completionRate: p.completion_rate,
      logsThisPeriod: p.logs_this_period,
      target: p.target,
    });
  }

  return { rituals, progressByRitualId };
}

export async function getVisibleCategoriesForUser(
  client: SupabaseClient<Database>,
): Promise<RitualCategoryRow[]> {
  const { data, error } = await client
    .from("ritual_categories")
    .select(CATEGORY_COLUMNS)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getRitualById(
  client: SupabaseClient<Database>,
  id: string,
): Promise<RitualForEditRow | null> {
  const { data, error } = await client
    .from("rituals")
    .select(RITUAL_EDIT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getRitualDetail(
  client: SupabaseClient<Database>,
  id: string,
): Promise<RitualDetailRow | null> {
  // No is_active/archived filter: archived rituals are viewable read-only.
  // RLS still scopes this to the current user.
  const { data, error } = await client
    .from("rituals")
    .select(RITUAL_DETAIL_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  let category: RitualCategoryRow | null = null;
  if (data.category_id) {
    const { data: cat, error: catError } = await client
      .from("ritual_categories")
      .select(CATEGORY_COLUMNS)
      .eq("id", data.category_id)
      .maybeSingle();
    if (catError) throw catError;
    category = cat;
  }

  return { ...data, category };
}

export async function getArchivedRitualsForActiveUser(
  client: SupabaseClient<Database>,
): Promise<ArchivedRitualRow[]> {
  const [archivedRes, categoriesRes] = await Promise.all([
    client
      .from("rituals")
      .select(RITUAL_ARCHIVED_COLUMNS)
      .not("archived_at", "is", null)
      .order("archived_at", { ascending: false }),
    client.from("ritual_categories").select(CATEGORY_COLUMNS),
  ]);

  if (archivedRes.error) throw archivedRes.error;
  if (categoriesRes.error) throw categoriesRes.error;

  const categoriesById = indexCategoriesById(categoriesRes.data);

  return (archivedRes.data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    icon: r.icon,
    archived_at: r.archived_at,
    category: r.category_id ? categoriesById.get(r.category_id) ?? null : null,
  }));
}

export async function countArchivedRituals(
  client: SupabaseClient<Database>,
): Promise<number> {
  const { count, error } = await client
    .from("rituals")
    .select("id", { count: "exact", head: true })
    .not("archived_at", "is", null);

  if (error) throw error;
  return count ?? 0;
}

export async function getRitualProgress(
  client: SupabaseClient<Database>,
  ritualId: string,
): Promise<RitualProgressEntry | null> {
  const { data, error } = await client
    .from("ritual_progress")
    .select("completion_rate, logs_this_period, target")
    .eq("ritual_id", ritualId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return {
    completionRate: data.completion_rate,
    logsThisPeriod: data.logs_this_period,
    target: data.target,
  };
}

export async function getRitualArcLogs(
  client: SupabaseClient<Database>,
  ritualId: string,
  since: string,
): Promise<RitualLogHistoryEntry[]> {
  const { data, error } = await client
    .from("ritual_log_history")
    .select("logged_at, status_id, note")
    .eq("ritual_id", ritualId)
    .gte("logged_at", since)
    .order("logged_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getLatestCompletedLog(
  client: SupabaseClient<Database>,
  ritualId: string,
): Promise<string | null> {
  const { data, error } = await client
    .from("ritual_logs")
    .select("logged_at")
    .eq("ritual_id", ritualId)
    .eq("status_id", "completed")
    .order("logged_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.logged_at ?? null;
}

export type CompletedLogRow = { ritual_id: string; logged_at: string };

/**
 * Completed logs since `weekStart` (Monday), for the current user (RLS-scoped).
 * One query feeds the Rhythm view both today's per-ritual count (quick-log
 * baseline + Done-today split) and the distinct days logged this week (the
 * daily ritual's X/7 momentum).
 */
export async function getWeekCompletedLogs(
  client: SupabaseClient<Database>,
  weekStart: string,
): Promise<CompletedLogRow[]> {
  const { data, error } = await client
    .from("ritual_logs")
    .select("ritual_id, logged_at")
    .eq("status_id", "completed")
    .gte("logged_at", weekStart);

  if (error) throw error;

  return (data ?? []).filter(
    (row): row is CompletedLogRow => row.ritual_id != null && row.logged_at != null,
  );
}

/**
 * Which of the given rituals have at least one completed log (any date). Used
 * to tell whether a one-time ritual is already done. Returns an empty set
 * without a round-trip when the input is empty.
 */
export async function getCompletedRitualIds(
  client: SupabaseClient<Database>,
  ritualIds: string[],
): Promise<Set<string>> {
  if (ritualIds.length === 0) return new Set();

  const { data, error } = await client
    .from("ritual_logs")
    .select("ritual_id")
    .eq("status_id", "completed")
    .in("ritual_id", ritualIds);

  if (error) throw error;

  const done = new Set<string>();
  for (const row of data ?? []) {
    if (row.ritual_id) done.add(row.ritual_id);
  }
  return done;
}

/** Maps a 0–100 completion/pace percentage to a momentum status. */
export function paceToStatus(percent: number): MomentumStatus {
  if (percent >= 80) return "strong";
  if (percent >= 40) return "steady";
  return "resting";
}

export function deriveMomentumStatus(
  ritualType: string,
  completionRate: number | null,
): MomentumStatus | null {
  if (ritualType !== "recurring") return null;
  if (completionRate === null) return "resting";
  return paceToStatus(completionRate);
}

/**
 * Momentum for a daily ritual, paced against the week so far: days done vs days
 * elapsed (Mon = 1 … today). This avoids the early-week trap of `daysDone / 7`,
 * where a perfect Tuesday (2/2) would otherwise read as 2/7 = "behind".
 */
export function deriveDailyMomentum(
  daysDone: number,
  daysElapsed: number,
): MomentumStatus {
  if (daysElapsed <= 0) return "resting";
  return paceToStatus((daysDone / daysElapsed) * 100);
}

export type RitualGroup = {
  key: string;
  category: RitualCategoryRow | null;
  rituals: RitualWithCategory[];
};

export function groupRitualsByCategory(
  rituals: RitualWithCategory[],
): RitualGroup[] {
  const buckets = new Map<string, RitualGroup>();

  for (const ritual of rituals) {
    const key = ritual.category?.id ?? "__other__";
    const existing = buckets.get(key);
    if (existing) {
      existing.rituals.push(ritual);
    } else {
      buckets.set(key, {
        key,
        category: ritual.category ?? null,
        rituals: [ritual],
      });
    }
  }

  const groups = Array.from(buckets.values());
  // Sort by category name (alpha), nulls ("Other") last.
  groups.sort((a, b) => {
    if (a.category === null && b.category === null) return 0;
    if (a.category === null) return 1;
    if (b.category === null) return -1;
    return a.category.name.localeCompare(b.category.name);
  });
  return groups;
}

// ---------------------------------------------------------------------------
// Writes
//
// Pure insert helpers (no auth concern — the caller passes a verified userId).
// They mirror the inserts the UI server actions perform, so logging/creating a
// ritual through the AI agent stays consistent with the app. The matching
// server actions live in app/.../rituals/actions.ts and are intentionally not
// reused here to keep lib/ free of any app-layer dependency.
// ---------------------------------------------------------------------------

/**
 * Insert a "completed" log for a ritual. Tagged `logged_via: "ai"` so logs made
 * by the agent are distinguishable from manual ones. No uniqueness check —
 * duplicate logs on the same day are allowed, matching the app.
 */
export async function insertRitualLog(
  client: SupabaseClient<Database>,
  args: { ritualId: string; userId: string; loggedAt: string; note?: string | null },
): Promise<void> {
  const { error } = await client.from("ritual_logs").insert({
    ritual_id: args.ritualId,
    user_id: args.userId,
    status_id: "completed",
    logged_at: args.loggedAt,
    logged_via: "ai",
    note: args.note ?? null,
  });
  if (error) throw error;
}

/**
 * Insert a new ritual from validated form values. Mirrors the column mapping of
 * the `createRitual` server action (recurring → frequency fields, one_time →
 * due_date, open → base only). Returns the new ritual id.
 */
export async function insertRitual(
  client: SupabaseClient<Database>,
  values: RitualFormValues,
  userId: string,
): Promise<{ id: string }> {
  const base: TablesInsert<"rituals"> = {
    user_id: userId,
    name: values.name,
    icon: values.icon ?? null,
    description: values.description ?? null,
    category_id: values.category_id ?? null,
    ritual_type: values.ritual_type,
  };

  let insert: TablesInsert<"rituals"> = base;
  if (values.ritual_type === "recurring") {
    insert = {
      ...base,
      frequency_unit: values.frequency_unit,
      frequency_value: values.frequency_value,
      scheduled_days:
        values.scheduled_days && values.scheduled_days.length > 0
          ? values.scheduled_days
          : null,
      scheduled_time: values.scheduled_time ?? null,
    };
  } else if (values.ritual_type === "one_time") {
    insert = {
      ...base,
      due_date: values.due_date,
      scheduled_time: values.scheduled_time ?? null,
    };
  }

  const { data, error } = await client
    .from("rituals")
    .insert(insert)
    .select("id")
    .single();

  if (error) throw error;
  return { id: data.id };
}
