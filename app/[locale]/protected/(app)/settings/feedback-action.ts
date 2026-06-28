"use server";

import * as Sentry from "@sentry/nextjs";

import { DEMO_RESTRICTED, isDemoUser } from "@/lib/demo";
import {
  FEEDBACK_BODY_MAX,
  FEEDBACK_SCREENSHOT_MAX_BYTES,
  FEEDBACK_SCREENSHOT_MIME_TO_EXT,
  FEEDBACK_TITLE_MAX,
  isFeedbackTag,
  type FeedbackTag,
} from "@/lib/feedback/types";
import { createLinearIssue } from "@/lib/linear/client";
import { LINEAR_LABEL_ID_BY_TAG } from "@/lib/linear/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const FEEDBACK_BUCKET = "user-assets";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function submitFeedback(
  formData: FormData,
): Promise<ActionResult> {
  const tag = formData.get("tag");
  const rawTitle = formData.get("title");
  const rawBody = formData.get("body");
  const screenshot = formData.get("screenshot");

  if (!isFeedbackTag(tag)) return { ok: false, error: "invalid" };

  const body = typeof rawBody === "string" ? rawBody.trim() : "";
  if (body.length === 0 || body.length > FEEDBACK_BODY_MAX) {
    return { ok: false, error: "invalid" };
  }

  // Both title and body are required (kept short is fine): a clear title makes the
  // Linear issue list scannable.
  const title = typeof rawTitle === "string" ? rawTitle.trim() : "";
  if (title.length === 0 || title.length > FEEDBACK_TITLE_MAX) {
    return { ok: false, error: "invalid" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "unauthorized" };
  // The shared demo account can't submit feedback (it's public — would spam Linear).
  if (isDemoUser(user.id)) return { ok: false, error: DEMO_RESTRICTED };

  // 1. Optional screenshot → user's own folder in the public bucket, so the
  //    resulting URL is embeddable in the Linear issue.
  let screenshotUrl: string | null = null;
  if (screenshot instanceof File && screenshot.size > 0) {
    if (screenshot.size > FEEDBACK_SCREENSHOT_MAX_BYTES) {
      return { ok: false, error: "screenshotTooLarge" };
    }
    const ext = FEEDBACK_SCREENSHOT_MIME_TO_EXT[screenshot.type];
    if (!ext) return { ok: false, error: "screenshotWrongType" };

    const path = `feedback/${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from(FEEDBACK_BUCKET)
      .upload(path, screenshot, {
        cacheControl: "31536000",
        contentType: screenshot.type,
        upsert: false,
      });
    if (uploadError) {
      console.error("[submitFeedback] screenshot upload failed", uploadError);
      return { ok: false, error: "failed" };
    }
    screenshotUrl = supabase.storage
      .from(FEEDBACK_BUCKET)
      .getPublicUrl(path).data.publicUrl;
  }

  // 2. Persist the feedback first (durable), so a later Linear failure never
  //    loses it. Service role: lets us read the new id back without exposing a
  //    select policy (testers never read feedback).
  const admin = createAdminClient();
  const { data: row, error: insertError } = await admin
    .from("feedback")
    .insert({
      user_id: user.id,
      tag,
      title,
      body,
      screenshot_url: screenshotUrl,
    })
    .select("id")
    .single();
  if (insertError || !row) {
    console.error("[submitFeedback] insert failed", insertError);
    return { ok: false, error: "failed" };
  }

  // 3. Mirror into Linear. Best-effort: the feedback is already saved, so a
  //    failure is reported to Sentry (which the maintainer watches) rather than
  //    surfaced to the tester or left to rot unseen in the table.
  try {
    const issue = await createLinearIssue({
      title,
      description: buildDescription({
        tag,
        body,
        screenshotUrl,
        email: user.email ?? null,
      }),
      labelId: LINEAR_LABEL_ID_BY_TAG[tag],
    });
    const { error: updateError } = await admin
      .from("feedback")
      .update({ linear_issue_id: issue.id, linear_issue_url: issue.url })
      .eq("id", row.id);
    if (updateError) {
      // The Linear issue exists but the row lost its link — surface it like the
      // creation failure so the traceability gap isn't silent.
      console.error("[submitFeedback] linear link update failed", updateError);
      Sentry.captureException(updateError, {
        tags: { feature: "feedback" },
        extra: { feedbackId: row.id, linearIssueId: issue.id },
      });
    }
  } catch (err) {
    console.error("[submitFeedback] Linear issue creation failed", err);
    Sentry.captureException(err, {
      tags: { feature: "feedback" },
      extra: { feedbackId: row.id },
    });
  }

  return { ok: true };
}

function buildDescription(params: {
  tag: FeedbackTag;
  body: string;
  screenshotUrl: string | null;
  email: string | null;
}): string {
  const lines = [
    params.body,
    "",
    "---",
    `**Tag:** ${params.tag}`,
    `**From:** ${params.email ?? "unknown"}`,
  ];
  if (params.screenshotUrl) {
    lines.push("", `![screenshot](${params.screenshotUrl})`);
  }
  return lines.join("\n");
}
