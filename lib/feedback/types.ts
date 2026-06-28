// Shared feedback widget definitions (LUI-91).
//
// One source of truth for the tag set and input limits, imported by the server
// action, the Linear config and the client UI so they can never drift.

export const FEEDBACK_TAGS = ["bug", "suggestion", "other"] as const;

export type FeedbackTag = (typeof FEEDBACK_TAGS)[number];

export function isFeedbackTag(value: unknown): value is FeedbackTag {
  return (
    typeof value === "string" &&
    (FEEDBACK_TAGS as readonly string[]).includes(value)
  );
}

/** Title and body are both required (short is fine). Caps keep Linear tidy. */
export const FEEDBACK_BODY_MAX = 2000;
export const FEEDBACK_TITLE_MAX = 120;

// Screenshot upload mirrors the avatar size cap. HEIC/HEIF are intentionally NOT
// accepted here (unlike avatars): the screenshot is embedded as a markdown image
// in the Linear issue, and HEIC doesn't render in browsers/Linear. iOS screenshots
// are PNG anyway, so this only nudges photo uploads to a renderable format.
export const FEEDBACK_SCREENSHOT_MAX_BYTES = 5 * 1024 * 1024;
export const FEEDBACK_SCREENSHOT_MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
