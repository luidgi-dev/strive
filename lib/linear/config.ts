// Linear integration config (LUI-91).
//
// These identifiers belong to the "Luidgi-dev" (key LUI) workspace and are NOT
// secrets — only LINEAR_API_KEY is. They are resolved once via the Linear API and
// pinned here so the feedback action doesn't query labels on every submit. If a
// label is renamed in Linear its id is stable; only deleting/recreating it would
// require updating the id below.

import type { FeedbackTag } from "@/lib/feedback/types";

/** "Luidgi-dev" team — issues created from feedback land here. */
export const LINEAR_TEAM_ID = "b0dc4d3e-05bd-4883-9a8c-482ce0a1f9c8";

/**
 * Feedback issues are auto-filed so they arrive triaged: the "Strive" project,
 * its "Phase 6: Continuous Improvment" milestone, and assigned to the maintainer
 * (assignment doubles as the notification — Linear pings the assignee). Adjust
 * the milestone here if incoming feedback outgrows that phase.
 */
export const LINEAR_PROJECT_ID = "d1e09fe0-cc4c-43f2-858c-62f5bd20a05e";
export const LINEAR_MILESTONE_ID = "dbea60d6-ed0f-4250-9976-e9422ae3790a";
export const LINEAR_ASSIGNEE_ID = "8c737396-0297-4f17-9d8f-9ac65934e1f7";

/**
 * Feedback tag → Linear label id. Deterministic mapping used by the no-AI path:
 * the three tags line up with existing workspace labels (Bug / Feature / Other).
 */
export const LINEAR_LABEL_ID_BY_TAG: Record<FeedbackTag, string> = {
  bug: "94e33b52-55f1-4f7c-aca3-2d57f3c03431", // Bug
  suggestion: "21e46e4d-56b9-40ae-95ed-159696c5c811", // Feature
  other: "7172f260-b35e-4d65-a42b-efe723c68cdc", // Other
};
