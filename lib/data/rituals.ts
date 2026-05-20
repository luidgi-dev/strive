import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables } from "@/lib/supabase/database.types";

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
  "id" | "name"
>;

export type RitualWithCategory = RitualRow & {
  category: RitualCategoryRow | null;
};

export type RitualDetailRow = RitualWithCategory &
  Pick<Tables<"rituals">, "started_at">;

/** A single completed/rest/missed entry, as exposed by ritual_log_history. */
export type RitualLogHistoryEntry = Pick<
  Tables<"ritual_log_history">,
  "logged_at" | "status_id" | "note"
>;

export type RitualProgressEntry = {
  completionRate: number | null;
  logsThisPeriod: number | null;
};

export type RitualsData = {
  rituals: RitualWithCategory[];
  progressByRitualId: Map<string, RitualProgressEntry>;
};

const RITUAL_COLUMNS =
  "id, name, icon, color, description, ritual_type, frequency_unit, frequency_value, due_date, scheduled_days, scheduled_time, category_id, created_at" as const;

const RITUAL_EDIT_COLUMNS =
  "id, name, icon, color, description, ritual_type, frequency_unit, frequency_value, due_date, scheduled_days, scheduled_time, category_id" as const;

const RITUAL_DETAIL_COLUMNS = `${RITUAL_COLUMNS}, started_at` as const;

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
    client.from("ritual_categories").select("id, name"),
    client.from("ritual_progress").select("ritual_id, completion_rate, logs_this_period"),
  ]);

  if (ritualsRes.error) throw ritualsRes.error;
  if (categoriesRes.error) throw categoriesRes.error;
  if (progressRes.error) throw progressRes.error;

  const categoriesById = new Map<string, RitualCategoryRow>();
  for (const cat of categoriesRes.data ?? []) {
    categoriesById.set(cat.id, cat);
  }

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
    });
  }

  return { rituals, progressByRitualId };
}

export async function getVisibleCategoriesForUser(
  client: SupabaseClient<Database>,
): Promise<RitualCategoryRow[]> {
  const { data, error } = await client
    .from("ritual_categories")
    .select("id, name")
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
  const { data, error } = await client
    .from("rituals")
    .select(RITUAL_DETAIL_COLUMNS)
    .eq("id", id)
    .eq("is_active", true)
    .is("archived_at", null)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  let category: RitualCategoryRow | null = null;
  if (data.category_id) {
    const { data: cat, error: catError } = await client
      .from("ritual_categories")
      .select("id, name")
      .eq("id", data.category_id)
      .maybeSingle();
    if (catError) throw catError;
    category = cat;
  }

  return { ...data, category };
}

export async function getRitualProgress(
  client: SupabaseClient<Database>,
  ritualId: string,
): Promise<RitualProgressEntry | null> {
  const { data, error } = await client
    .from("ritual_progress")
    .select("completion_rate, logs_this_period")
    .eq("ritual_id", ritualId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return {
    completionRate: data.completion_rate,
    logsThisPeriod: data.logs_this_period,
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

export function deriveMomentumStatus(
  ritualType: string,
  completionRate: number | null,
): MomentumStatus | null {
  if (ritualType !== "recurring") return null;
  if (completionRate === null) return "resting";
  if (completionRate >= 80) return "strong";
  if (completionRate >= 40) return "steady";
  return "resting";
}

export function groupRitualsByCategory(
  rituals: RitualWithCategory[],
): { key: string; categoryName: string | null; rituals: RitualWithCategory[] }[] {
  const buckets = new Map<
    string,
    { key: string; categoryName: string | null; rituals: RitualWithCategory[] }
  >();

  for (const ritual of rituals) {
    const key = ritual.category?.id ?? "__other__";
    const existing = buckets.get(key);
    if (existing) {
      existing.rituals.push(ritual);
    } else {
      buckets.set(key, {
        key,
        categoryName: ritual.category?.name ?? null,
        rituals: [ritual],
      });
    }
  }

  const groups = Array.from(buckets.values());
  // Sort by category name (alpha), nulls last.
  groups.sort((a, b) => {
    if (a.categoryName === null && b.categoryName === null) return 0;
    if (a.categoryName === null) return 1;
    if (b.categoryName === null) return -1;
    return a.categoryName.localeCompare(b.categoryName);
  });
  return groups;
}
