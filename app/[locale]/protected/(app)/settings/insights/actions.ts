"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

/**
 * Dismiss one Insight Card. RLS scopes the update to the owner's row (the
 * "users can update their own insights" policy), so the id alone is safe — a
 * user cannot dismiss another user's card. Best-effort: a failure is logged,
 * not surfaced, since the card is non-critical.
 */
export async function dismissInsight(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("insights")
    .update({ dismissed_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("[insights] dismiss failed", error);
    return;
  }

  revalidatePath("/protected/settings/insights");
}
