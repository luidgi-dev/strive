# Strive UX Writing & Terminology Guide (LUI-15)

This document enforces the terminology and voice to be used across all UI, error/success messages, onboarding flows, and agent outputs (dev + AI).

## Golden Rule
Use the canonical terms defined below. Avoid the "forbidden" synonyms listed in each entry.

## Terminology Reference

| Product concept | Canonical term | Don't use (alternatives) | Notes |
|---|---|---|---|
| A single unit a user performs | Ritual | Task, Habit | "Ritual" is the primary product term. "Habit" is only acceptable in explanatory phrasing, not as a UI label. |
| List/board of rituals | Ritual board | To-do list | UI term for the space where the user manages their rituals. |
| The main dashboard experience | The Flow | Dashboard | "The Flow" is the name of the main interface/section. |
| Progress unit over time | Momentum | Streak | "Momentum" replaces the anxiety of "streak". |
| Progress encouragement | Great momentum! | Great streak! | Tone example (encouraging, not guilt-inducing). |
| Completed state / confirmation | Logged | Completed | Use "Logged" when the user has recorded an action. |
| Successful completion badge/CTA feedback | Nailed it | Done, Completed | "Nailed it" is used for success feedback (not a "Done" button). |
| Primary action after input | Log | Log/Track (no preference), Complete | "Log" is the preferred form for both the action and confirmation. |
| Tracking intent | Track | Track streak | "Track" should lead to a "Log" action in the UI (context-dependent). |
| User marks something complete | Log | Complete, Mark as done | Replace "Complete" with "Log" (feedback: "Logged" / "Nailed it"). |
| Completion feedback | Logged | Completed | Example: "Ritual logged." |
| Completion feedback (celebratory) | Nailed it | Done | Example: "Nailed it! One more ritual, one more step." |
| Item list entries | Ritual item | Task item | Name UI components and labels using "Ritual". |
| Action button label | Log | Done, Complete | "Done" is forbidden on action buttons. |
| Empty state (board) | Your ritual board is empty | You have no tasks | Emptiness should feel positive and action-oriented. |
| Empty state (flow) | Start building momentum | No dashboard items | Avoid "No X" phrasing without guidance. |
| Onboarding step | Add your first ritual | Add your first task | Encourages flexible discipline (not constraint). |
| Error message (logging) | Couldn't log the ritual | Unable to complete task | Tone: direct, helpful, not guilt-inducing. |
| Validation message (form) | Add a ritual name | Task name is required | Avoid "task" in interface labels. |
| Success message | Ritual logged | Task completed | Tone: concise, positive. |
| Progress summary | Momentum over time | Streak over time | Emphasize flexible continuity. |
| Weekly/monthly consistency | Consistency | Streak | Frame logic as "consistency" rather than "day quotas". |
| System concept "run" | Log a ritual run | Mark a streak | "Run" is acceptable as a technical description, but UI stays "Log". |
| CTA to begin | Start a ritual | Start a task | "Start" + "Ritual" (not "Task"). |
| CTA to review | Review the Flow | Open dashboard | "The Flow" in UI context. |
| Section header | Your rituals | Your tasks | Avoid "tasks". |
| Success toast | Logged | Done | Toast should be "Logged" or "Nailed it" depending on intensity. |
| Status pill / label | Logged | Completed | Used in small UI elements. |
| Confirmation microcopy | Nice. Logged. | Nice. Done. | Short and conversational. |
| API response semantic | status: "logged" | status: "completed" | API: prefer "logged" values for semantics. |
| DB column semantic | logged_at | completed_at | Prefer `logged_at` over `completed_at`. |
| Object identifier | ritual_id | task_id | Prefer "ritual". |
| Component name | RitualCard | TaskCard | Prefer "Ritual". |
| Component name | RitualBoard | ToDoList/TaskList | The UI term is "Ritual board". |
| Page/route name | flow | dashboard | If a route carries a term, it must use "flow". |
| Marketing-ish page title | The Flow | Dashboard | For section/screen titles. |
| Voice: verbosity level | Minimalist | Verbose | Short, useful, no unnecessary explanations. |
| Voice: encouragement | Encouraging | Punishing | No "You failed…" — use "You kept your momentum." |
| Voice: tone | Conversational | Robotic | Natural phrasing (avoid "successfully…"). |
| Action verb (preferred) | Log | Complete | "Log" is the global preference. |
| Action verb (allowed) | Track | Track | "Track" only if the final UI action remains "Log". |
| Feedback phrase | Nailed it! | Great job / Done | "Nailed it" is canonical for success feedback. |
| Motivation line | Keep going with momentum | Keep your streak | Avoid "streak". |
| Error recovery hint | Try again when you're ready | Try again to complete | Not guilt-inducing, timing-oriented. |
| Naming: list "to-do" | Ritual board | To-do list | UI terminology. |
| Naming: "completed" state | Logged | Completed | Even in code: prefer "logged". |
| Naming: "done" state | Nailed it / Logged | Done | "Done" forbidden on buttons/user-facing text. |
| Microcopy: "progress" | Momentum | Streak | Systematic. |
| Microcopy: "result" | Logged / Nailed it | Completed / Done | Systematic. |
| User motivation framing | Keep momentum | Keep your streak | Encouragement framing to avoid "streak". |

> Note: the canonical mapping required by LUI-15 includes `Task -> Ritual (or Habit)` and `Streak -> Momentum`, as well as `Completed -> Logged` and `Dashboard -> The Flow`. In practice, use "Ritual" / "Momentum" / "Logged" / "The Flow" as default UI terms.

## Tone & Voice Guidelines

### How Strive "speaks"
- Minimalist, not verbose: "Log run", not "Please log your running activity".
- Encouraging, not guilt-inducing: "Great momentum!", not "You failed to maintain your streak".
- Conversational, not robotic: "Nailed it!", not "Successfully marked complete".
- Assumes user intelligence: avoid tutorial-style microcopy.

### Do / Don't (summary)
- Do: "Ritual logged."
- Don't: "Task completed."
- Do: "Your ritual board is empty."
- Don't: "You have no tasks."
- Do: "Great momentum!"
- Don't: "Great streak!"

## Copy Examples (Before / After)

1. Button (action)
   - Before: `Done`
   - After: `Log` (or `Nailed it` for feedback, not a button)

2. Button (completion)
   - Before: `Complete task`
   - After: `Log ritual`

3. Status message
   - Before: `You completed 3 tasks.`
   - After: `You logged 3 rituals.`

4. Success toast
   - Before: `Task completed`
   - After: `Nailed it!`

5. Progress label
   - Before: `Current streak`
   - After: `Momentum`

6. Encouragement line
   - Before: `Great streak!`
   - After: `Great momentum!`

7. Section header / screen title
   - Before: `Dashboard`
   - After: `The Flow`

8. Empty state (board)
   - Before: `You have no tasks`
   - After: `Your ritual board is empty`

9. Form label
   - Before: `Task name`
   - After: `Ritual name`

10. Error message
    - Before: `Unable to complete task`
    - After: `Couldn't log the ritual`

## AI & Code Integration

This section explains how to translate terms into code and AI outputs.

### Naming in code
- IDs and variables:
  - `ritual_id` (not `task_id`)
  - `momentum` (not `streak`)
  - `logged_at` (not `completed_at`)
  - `flow` (not `dashboard`)
- Components:
  - `RitualCard`, `RitualBoard`
  - `Flow` (page/section), `FlowHeader` (if needed)
- DOM classes/IDs:
  - `ritual-card`, `ritual-board`, `flow-header`

### API and schemas
- Expose consistent semantic states:
  - `status: "logged"`
  - avoid `completed` on the semantic response side (except for legacy migration)
- DB column:
  - `logged_at`
  - avoid `completed_at` in the "new" schema

### Errors, feedback and events
- Error text:
  - "Couldn't log the ritual" rather than "Unable to complete task"
- Success text:
  - "Ritual logged."
  - "Nailed it!" when it's an encouraging success

## Terminology Checklist (Agents)

Before generating/editing a UI, a message, or an API integration:
- [ ] Use `Ritual`, not `Task`
- [ ] Use `Momentum`, not `Streak`
- [ ] Use `Logged`, not `Completed`
- [ ] Use `The Flow`, not `Dashboard`
- [ ] Action buttons: avoid the text `Done`
- [ ] "Completion" labels must become `Log` / `Logged`
- [ ] Tone: minimalist, encouraging, conversational
- [ ] Errors: recovery-oriented, not guilt-inducing
- [ ] Code names aligned (`ritual_id`, `logged_at`, `momentum`, `flow`)
- [ ] Correct vs incorrect examples consistent with the sections above