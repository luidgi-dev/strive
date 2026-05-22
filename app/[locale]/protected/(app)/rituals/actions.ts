"use server";

import { revalidatePath } from "next/cache";

import {
  categoryNameSchema,
  ritualFormSchema,
  type RitualFormValues,
} from "@/lib/data/rituals-schema";
import { ensureProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import type { TablesInsert, TablesUpdate } from "@/lib/supabase/database.types";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

function toInsertColumns(
  values: RitualFormValues,
  userId: string,
): TablesInsert<"rituals"> {
  const base = {
    user_id: userId,
    name: values.name,
    icon: values.icon ?? null,
    description: values.description ?? null,
    category_id: values.category_id ?? null,
    ritual_type: values.ritual_type,
  };

  if (values.ritual_type === "recurring") {
    return {
      ...base,
      frequency_unit: values.frequency_unit,
      frequency_value: values.frequency_value,
      scheduled_days:
        values.scheduled_days && values.scheduled_days.length > 0
          ? values.scheduled_days
          : null,
      scheduled_time: values.scheduled_time ?? null,
    };
  }

  if (values.ritual_type === "one_time") {
    return {
      ...base,
      due_date: values.due_date,
      scheduled_time: values.scheduled_time ?? null,
    };
  }

  return base;
}

function toUpdateColumns(
  values: RitualFormValues,
): TablesUpdate<"rituals"> {
  const base: TablesUpdate<"rituals"> = {
    name: values.name,
    icon: values.icon ?? null,
    description: values.description ?? null,
    category_id: values.category_id ?? null,
    ritual_type: values.ritual_type,
    updated_at: new Date().toISOString(),
    // Reset all schedule fields; the variant below sets only the relevant ones.
    frequency_unit: null,
    frequency_value: null,
    scheduled_days: null,
    scheduled_time: null,
    due_date: null,
  };

  if (values.ritual_type === "recurring") {
    base.frequency_unit = values.frequency_unit;
    base.frequency_value = values.frequency_value;
    base.scheduled_days =
      values.scheduled_days && values.scheduled_days.length > 0
        ? values.scheduled_days
        : null;
    base.scheduled_time = values.scheduled_time ?? null;
  } else if (values.ritual_type === "one_time") {
    base.due_date = values.due_date;
    base.scheduled_time = values.scheduled_time ?? null;
  }

  return base;
}

export async function createRitual(
  rawValues: RitualFormValues,
): Promise<ActionResult<{ id: string }>> {
  const parsed = ritualFormSchema.safeParse(rawValues);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { ok: false, error: firstIssue?.message ?? "validationFailed" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const healed = await ensureProfile(supabase, user);
  if (!healed) return { ok: false, error: "unknown" };

  const { data, error } = await supabase
    .from("rituals")
    .insert(toInsertColumns(parsed.data, user.id))
    .select("id")
    .single();

  if (error) {
    console.error("[createRitual] insert failed", error);
    return { ok: false, error: "unknown" };
  }

  revalidatePath("/protected/rituals");
  return { ok: true, data: { id: data.id } };
}

export async function updateRitual(
  id: string,
  rawValues: RitualFormValues,
): Promise<ActionResult> {
  if (typeof id !== "string" || id.length === 0) {
    return { ok: false, error: "validationFailed" };
  }

  const parsed = ritualFormSchema.safeParse(rawValues);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { ok: false, error: firstIssue?.message ?? "validationFailed" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { data, error } = await supabase
    .from("rituals")
    .update(toUpdateColumns(parsed.data))
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("[updateRitual] update failed", error);
    return { ok: false, error: "unknown" };
  }
  if (!data || data.length === 0) {
    return { ok: false, error: "notFound" };
  }

  revalidatePath("/protected/rituals");
  return { ok: true };
}

export async function archiveRitual(id: string): Promise<ActionResult> {
  if (typeof id !== "string" || id.length === 0) {
    return { ok: false, error: "validationFailed" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("rituals")
    .update({ archived_at: now, is_active: false, updated_at: now })
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("[archiveRitual] update failed", error);
    return { ok: false, error: "unknown" };
  }
  if (!data || data.length === 0) {
    return { ok: false, error: "notFound" };
  }

  revalidatePath("/protected/rituals");
  return { ok: true };
}

export async function restoreRitual(id: string): Promise<ActionResult> {
  if (typeof id !== "string" || id.length === 0) {
    return { ok: false, error: "validationFailed" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("rituals")
    .update({ archived_at: null, is_active: true, updated_at: now })
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("[restoreRitual] update failed", error);
    return { ok: false, error: "unknown" };
  }
  if (!data || data.length === 0) {
    return { ok: false, error: "notFound" };
  }

  revalidatePath("/protected/rituals");
  revalidatePath("/protected/rituals/archived");
  return { ok: true };
}

export async function createCategory(
  rawName: string,
): Promise<ActionResult<{ id: string }>> {
  const parsed = categoryNameSchema.safeParse(rawName);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "validationFailed" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const healed = await ensureProfile(supabase, user);
  if (!healed) return { ok: false, error: "unknown" };

  const { data, error } = await supabase
    .from("ritual_categories")
    .insert({ user_id: user.id, name: parsed.data })
    .select("id")
    .single();

  if (error) {
    console.error("[createCategory] insert failed", error);
    return { ok: false, error: "unknown" };
  }

  revalidatePath("/protected/rituals");
  return { ok: true, data: { id: data.id } };
}

export async function updateCategory(
  id: string,
  rawName: string,
): Promise<ActionResult> {
  if (typeof id !== "string" || id.length === 0) {
    return { ok: false, error: "validationFailed" };
  }
  const parsed = categoryNameSchema.safeParse(rawName);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "validationFailed" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  // RLS limits this to the caller's own categories; system rows (user_id null)
  // and others' rows match no row and surface as notFound.
  const { data, error } = await supabase
    .from("ritual_categories")
    .update({ name: parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("[updateCategory] update failed", error);
    return { ok: false, error: "unknown" };
  }
  if (!data || data.length === 0) {
    return { ok: false, error: "notFound" };
  }

  revalidatePath("/protected/rituals");
  return { ok: true };
}

export async function archiveCategory(id: string): Promise<ActionResult> {
  if (typeof id !== "string" || id.length === 0) {
    return { ok: false, error: "validationFailed" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("ritual_categories")
    .update({ is_active: false, updated_at: now })
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("[archiveCategory] update failed", error);
    return { ok: false, error: "unknown" };
  }
  if (!data || data.length === 0) {
    return { ok: false, error: "notFound" };
  }

  // Detach the rituals so they fall back to "Other" instead of lingering under
  // the now-hidden category. RLS scopes this to the caller's own rituals.
  const { error: detachError } = await supabase
    .from("rituals")
    .update({ category_id: null, updated_at: now })
    .eq("category_id", id);

  if (detachError) {
    console.error("[archiveCategory] detach rituals failed", detachError);
    return { ok: false, error: "unknown" };
  }

  revalidatePath("/protected/rituals");
  return { ok: true };
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function revalidateRitual(ritualId: string) {
  revalidatePath(`/protected/rituals/${ritualId}`);
  revalidatePath("/protected/rituals");
}

export async function logRitual(
  ritualId: string,
  loggedAt: string,
): Promise<ActionResult> {
  if (typeof ritualId !== "string" || ritualId.length === 0) {
    return { ok: false, error: "validationFailed" };
  }
  if (!DATE_REGEX.test(loggedAt)) {
    return { ok: false, error: "validationFailed" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const healed = await ensureProfile(supabase, user);
  if (!healed) return { ok: false, error: "unknown" };

  const { error } = await supabase.from("ritual_logs").insert({
    ritual_id: ritualId,
    user_id: user.id,
    status_id: "completed",
    logged_at: loggedAt,
    logged_via: "manual",
  });

  if (error) {
    console.error("[logRitual] insert failed", error);
    return { ok: false, error: "unknown" };
  }

  revalidateRitual(ritualId);
  return { ok: true };
}

export async function unlogRitual(
  ritualId: string,
  loggedAt: string,
  // One-time rituals undo their single completion regardless of the date it
  // was logged; recurring/open undo the latest completion for that day.
  anyDate = false,
): Promise<ActionResult> {
  if (typeof ritualId !== "string" || ritualId.length === 0) {
    return { ok: false, error: "validationFailed" };
  }
  if (!DATE_REGEX.test(loggedAt)) {
    return { ok: false, error: "validationFailed" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  // Remove the most recent completed log for that ritual.
  let query = supabase
    .from("ritual_logs")
    .select("id")
    .eq("ritual_id", ritualId)
    .eq("status_id", "completed");
  if (!anyDate) query = query.eq("logged_at", loggedAt);

  const { data: latest, error: findError } = await query
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (findError) {
    console.error("[unlogRitual] find failed", findError);
    return { ok: false, error: "unknown" };
  }
  if (!latest) return { ok: true }; // nothing to undo

  const { error } = await supabase
    .from("ritual_logs")
    .delete()
    .eq("id", latest.id);

  if (error) {
    console.error("[unlogRitual] delete failed", error);
    return { ok: false, error: "unknown" };
  }

  revalidateRitual(ritualId);
  return { ok: true };
}
