<!-- Portfolio Quality: AI agent behavior guidelines for Strive -->
# Strive AI Agent Guidelines (LUI-14)

This document is the single source-of-truth for how AI agents should behave in the Strive repository.

## Non-negotiables (always follow)
- Write outputs in English unless the user explicitly asks otherwise.
- When writing any user-facing text (UI labels, buttons, empty states, onboarding copy, error/success messages, confirmations, tooltips), follow `docs/UX_WRITING.md` exactly.
- Do not introduce terminology drift:
  - Prefer: `Ritual`, `Momentum`, `Logged`, `Nailed it`, `The Flow`, and action verb `Log`
  - Avoid: `Task/Tasks`, `Streak`, `Completed`, `Dashboard`, and the action label `Done`
- Keep tone minimalist, encouraging, and conversational (no blame, no guilt framing, no robotic phrasing).

## Why this exists
AI-first development only works if every agent writes consistently. These rules make sure Cursor, Claude, and other agents:
- use the same product language
- create compatible code naming
- produce UI/UX copy that feels like Strive

## Source references (the coherence chain)
- Terminology and voice: [`docs/UX_WRITING.md`](docs/UX_WRITING.md)
- Cursor integration: [`.cursorrules`](../.cursorrules)
- Claude system prompt: [`docs/system-prompt.md`](docs/system-prompt.md)

## Default interaction protocol (how you should respond)
When the user asks for a change, follow this sequence:
1. Interpret the request and restate the goal in 1-2 sentences.
2. Ask 1-3 clarifying questions if requirements are ambiguous or if repository structure/patterns are unclear.
3. Propose a minimal plan before making breaking changes.
4. Implement with the smallest diff that achieves the goal.
5. Verify consistency:
   - terminological consistency for all user-facing copy
   - code naming aligned with Strive conventions
6. Summarize what changed and what the user should verify manually (if anything).

If you cannot confidently complete step 5 (terminology or code alignment), ask before proceeding.

## Terminology enforcement (quick checklist)
Before generating or editing any user-facing text:
- Use `Ritual`, not `Task`.
- Use `Momentum`, not `Streak`.
- Use `Logged`, not `Completed`.
- Use `Nailed it` for celebratory success feedback (not as a button label).
- Use `The Flow`, not `Dashboard`.
- Use `Log` / `Logged` for action/confirmation semantics (avoid action label `Done`).

## Code and semantic naming conventions
When generating or editing code, follow Strive’s semantic naming:
- `ritual_id` (not `task_id`)
- `momentum` (not `streak`)
- `logged_at` (not `completed_at`)
- `flow` (not `dashboard`)

Semantic response / state conventions:
- Prefer `status: "logged"` in API responses.
- Avoid `completed` in new semantics unless explicitly required for legacy migration.

Component/page naming conventions:
- Prefer `RitualCard`, `RitualBoard`, and `Flow` naming aligned with UI.

## Next.js alignment (repo reality)
This repository currently hosts the Next.js app at the root.
General rules to follow:
- Use App Router patterns.
- Prefer Server Components by default.
- Only add `"use client"` when you need client-only behavior (hooks, browser APIs, interactivity).

## Portfolio-quality output standards
When writing code or docs:
- Keep diffs focused (avoid unrelated formatting churn).
- Use clear structure and consistent headings.
- If you add user-facing copy, validate it against `docs/UX_WRITING.md` terminology.
- Avoid over-explaining; be direct and helpful.

## Common pitfalls to avoid
- Writing UI copy with “Task/Tasks”, “Streak”, “Completed”, “Dashboard”, or “Done” action labels.
- Introducing new code identifiers that contradict the established semantic naming.
- Assuming different framework versions than the repo uses (do not mention Next.js 15 as a requirement).

## Quick self-check (one minute)
Before you finish:
- Did you keep the terminology consistent with `docs/UX_WRITING.md`?
- Did you keep UI copy encouraging and conversational?
- Did you use the correct semantic code names (`ritual_id`, `momentum`, `logged_at`, `flow`)?

