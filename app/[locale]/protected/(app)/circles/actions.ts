"use server";

import { revalidatePath } from "next/cache";

import {
  circleCreateSchema,
  type CircleCreateValues,
} from "@/lib/data/circles-schema";
import { DEMO_RESTRICTED, isDemoUser } from "@/lib/demo";
import { ensureProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

/**
 * Create a circle and its first invite link in one atomic step
 * (create_circle_with_invite inserts the circle, the owner membership, and the
 * invite). Returns the new circle id and invite code so the confirmation screen
 * can show the shareable link immediately.
 */
export async function createCircle(
  rawValues: CircleCreateValues,
): Promise<ActionResult<{ circleId: string; code: string }>> {
  const parsed = circleCreateSchema.safeParse(rawValues);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "validationFailed",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };
  if (isDemoUser(user.id)) return { ok: false, error: DEMO_RESTRICTED };

  // Heal legacy accounts missing a profiles row, or the owner_id FK would fail.
  const healed = await ensureProfile(supabase, user);
  if (!healed) return { ok: false, error: "unknown" };

  const { data, error } = await supabase.rpc("create_circle_with_invite", {
    p_name: parsed.data.name,
    p_description: parsed.data.description,
  });
  if (error) {
    console.error("[createCircle] rpc failed", error);
    return { ok: false, error: "unknown" };
  }

  const row = data?.[0];
  if (!row) return { ok: false, error: "unknown" };

  revalidatePath("/protected/circles");
  return { ok: true, data: { circleId: row.circle_id, code: row.invite_code } };
}

/**
 * Join a circle from inside the app by entering an invite code, skipping the
 * browser round-trip. Reuses redeem_circle_invite and returns the circle id on
 * success so the caller can navigate there; otherwise the failure status.
 */
export async function joinByCode(
  rawCode: string,
): Promise<ActionResult<{ circleId: string }>> {
  const code = typeof rawCode === "string" ? rawCode.trim() : "";
  if (!code) return { ok: false, error: "validationFailed" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { data, error } = await supabase.rpc("redeem_circle_invite", {
    p_code: code,
  });
  if (error) {
    console.error("[joinByCode] redeem failed", error);
    return { ok: false, error: "unknown" };
  }

  const result = data?.[0];
  if (!result) return { ok: false, error: "unknown" };

  if (
    (result.status === "joined" || result.status === "already_member") &&
    result.circle_id
  ) {
    revalidatePath("/protected/circles");
    return { ok: true, data: { circleId: result.circle_id } };
  }

  // expired / full / invalid / unauthenticated
  return { ok: false, error: result.status };
}
