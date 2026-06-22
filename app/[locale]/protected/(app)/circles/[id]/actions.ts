"use server";

import { revalidatePath } from "next/cache";

import { circleNameSchema } from "@/lib/data/circles-schema";
import { startOfLocalDayIso } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

const CIRCLES_PATH = "/protected/circles";

function circlePath(circleId: string): string {
  return `${CIRCLES_PATH}/${circleId}`;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/**
 * Opt a ritual into a circle. Idempotent: re-sharing is a no-op. The insert
 * policy on circle_rituals verifies the ritual is the caller's and they're a
 * member, so identity is enforced server-side and again by RLS.
 */
export async function shareRitualInCircle(
  circleId: string,
  ritualId: string,
): Promise<ActionResult> {
  if (!isNonEmptyString(circleId) || !isNonEmptyString(ritualId)) {
    return { ok: false, error: "validationFailed" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { error } = await supabase.from("circle_rituals").upsert(
    { circle_id: circleId, user_id: user.id, ritual_id: ritualId },
    { onConflict: "circle_id,user_id,ritual_id", ignoreDuplicates: true },
  );

  if (error) {
    console.error("[shareRitualInCircle] upsert failed", error);
    return { ok: false, error: "unknown" };
  }

  revalidatePath(circlePath(circleId));
  return { ok: true };
}

/** Remove a ritual from a circle. Only the caller's own share rows are touched. */
export async function unshareRitualInCircle(
  circleId: string,
  ritualId: string,
): Promise<ActionResult> {
  if (!isNonEmptyString(circleId) || !isNonEmptyString(ritualId)) {
    return { ok: false, error: "validationFailed" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { error } = await supabase
    .from("circle_rituals")
    .delete()
    .eq("circle_id", circleId)
    .eq("user_id", user.id)
    .eq("ritual_id", ritualId);

  if (error) {
    console.error("[unshareRitualInCircle] delete failed", error);
    return { ok: false, error: "unknown" };
  }

  revalidatePath(circlePath(circleId));
  return { ok: true };
}

/** Rename a circle. Owner-only: RLS lets a non-owner update match no row. */
export async function renameCircle(
  circleId: string,
  rawName: string,
): Promise<ActionResult> {
  if (!isNonEmptyString(circleId)) {
    return { ok: false, error: "validationFailed" };
  }

  const parsed = circleNameSchema.safeParse(rawName);
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

  const { data, error } = await supabase
    .from("circles")
    .update({ name: parsed.data })
    .eq("id", circleId)
    .select("id");

  if (error) {
    console.error("[renameCircle] update failed", error);
    return { ok: false, error: "unknown" };
  }
  if (!data || data.length === 0) {
    return { ok: false, error: "notFound" };
  }

  revalidatePath(circlePath(circleId));
  revalidatePath(CIRCLES_PATH);
  return { ok: true };
}

/**
 * Leave a circle. The owner can't leave their own circle (they delete it
 * instead); everyone else removes their own membership. The cleanup trigger
 * drops the departing member's shared rituals and nudges.
 */
export async function leaveCircle(circleId: string): Promise<ActionResult> {
  if (!isNonEmptyString(circleId)) {
    return { ok: false, error: "validationFailed" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { data: circle, error: circleError } = await supabase
    .from("circles")
    .select("owner_id")
    .eq("id", circleId)
    .maybeSingle();

  if (circleError) {
    console.error("[leaveCircle] read failed", circleError);
    return { ok: false, error: "unknown" };
  }
  if (!circle) return { ok: false, error: "notFound" };
  if (circle.owner_id === user.id) {
    return { ok: false, error: "ownerCannotLeave" };
  }

  const { data, error } = await supabase
    .from("circle_members")
    .delete()
    .eq("circle_id", circleId)
    .eq("user_id", user.id)
    .select("id");

  if (error) {
    console.error("[leaveCircle] delete failed", error);
    return { ok: false, error: "unknown" };
  }
  if (!data || data.length === 0) {
    return { ok: false, error: "notFound" };
  }

  revalidatePath(CIRCLES_PATH);
  return { ok: true };
}

/** Delete a circle. Owner-only: RLS lets a non-owner delete match no row. */
export async function deleteCircle(circleId: string): Promise<ActionResult> {
  if (!isNonEmptyString(circleId)) {
    return { ok: false, error: "validationFailed" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { data, error } = await supabase
    .from("circles")
    .delete()
    .eq("id", circleId)
    .select("id");

  if (error) {
    console.error("[deleteCircle] delete failed", error);
    return { ok: false, error: "unknown" };
  }
  if (!data || data.length === 0) {
    return { ok: false, error: "notFound" };
  }

  revalidatePath(CIRCLES_PATH);
  return { ok: true };
}

/**
 * Send a nudge to a circle member. Rate-limited to one per receiver per circle
 * per local day, enforced here (no DB unique by design). The insert policy on
 * nudges verifies the sender is the caller and both are members.
 */
export async function sendNudge(
  circleId: string,
  receiverId: string,
): Promise<ActionResult> {
  if (!isNonEmptyString(circleId) || !isNonEmptyString(receiverId)) {
    return { ok: false, error: "validationFailed" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };
  if (receiverId === user.id) return { ok: false, error: "validationFailed" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .maybeSingle();
  const since = startOfLocalDayIso(profile?.timezone ?? "UTC");

  // One nudge per sender/receiver/circle/day. head:true keeps this count-only.
  const { count, error: countError } = await supabase
    .from("nudges")
    .select("id", { count: "exact", head: true })
    .eq("sender_id", user.id)
    .eq("receiver_id", receiverId)
    .eq("circle_id", circleId)
    .gte("created_at", since);
  if (countError) {
    console.error("[sendNudge] rate-limit check failed", countError);
    return { ok: false, error: "unknown" };
  }
  if ((count ?? 0) > 0) return { ok: false, error: "alreadyNudged" };

  const { error } = await supabase.from("nudges").insert({
    circle_id: circleId,
    sender_id: user.id,
    receiver_id: receiverId,
  });
  if (error) {
    console.error("[sendNudge] insert failed", error);
    return { ok: false, error: "unknown" };
  }

  revalidatePath(circlePath(circleId));
  return { ok: true };
}

/**
 * Mint a fresh invite link for a circle. Owner-only: the circle_invites insert
 * policy rejects non-owners. Used by the detail-page Invite button and to replace
 * a link once the 7-day one expires.
 */
export async function generateInviteLink(
  circleId: string,
): Promise<ActionResult<{ code: string }>> {
  if (!isNonEmptyString(circleId)) {
    return { ok: false, error: "validationFailed" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { data, error } = await supabase
    .from("circle_invites")
    .insert({ circle_id: circleId, created_by: user.id })
    .select("code")
    .single();
  if (error) {
    console.error("[generateInviteLink] insert failed", error);
    return { ok: false, error: "unknown" };
  }

  revalidatePath(circlePath(circleId));
  return { ok: true, data: { code: data.code } };
}
