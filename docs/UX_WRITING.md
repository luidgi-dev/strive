# Strive — Master Guide: UX Writing, Terminology & Brand Voice (LUI-15)

This document is the single source of truth for terminology, voice, and personality across all Strive interfaces (UI), error/success messages, onboarding flows, and agent outputs (Dev + AI).

---

## 1. Personality & Brand Voice

Strive speaks like a **calm, knowledgeable coach** — never pushy, never guilt-inducing. We celebrate momentum, not perfection.

### Core Principles
1. **Respect Autonomy:** Never guilt or shame. Present data and let the user decide.
2. **Precision over Enthusiasm:** "You completed 4 of 5 this week" — not "Amazing job!! 🎉🔥".
3. **Calm Confidence:** The app knows what it's doing. No hedging, no filler, minimal verbosity.
4. **Non-linear Progress:** Acknowledge that dips are normal, not failures.
5. **Assume Intelligence:** Avoid tutorial-style microcopy or unnecessary explanations.

### Tone Spectrum
| Context | Tone | Example |
|---|---|---|
| **Completing a ritual** | Quietly affirming | "Noted." / "That's 4 this week." |
| **Falling behind** | Neutral, supportive | "2 of 5 so far. Three days remain." |
| **Weekly summary** | Reflective | "A steady week. Your morning meditation held strong." |
| **Onboarding** | Warm, minimal | "Let's define your first ritual." |

---

## 2. Exhaustive Terminology Reference

**Golden Rule:** Use the canonical terms. Avoid the "forbidden" synonyms listed below.

| Product Concept | Canonical Term | Forbidden Synonyms | Notes |
|---|---|---|---|
| Single unit of action | **Ritual** | Task, Habit, Routine | Primary term. "Habit" only for long-form prose. |
| Main interface/section | **The Flow** | Dashboard, Home | Use for routes and section headers. |
| Progress unit | **Momentum** | Streak, Series | Replaces the anxiety of "streaks." |
| Progress logic | **Consistency** | Productivity, Hustle | Focus on rhythm over output. |
| Management space | **Ritual board** | To-do list, Task list | UI term for the ritual list/board. |
| Action (Verb) | **Log** | Complete, Finish, Done | Global preference for buttons and feedback. |
| Action (Secondary) | **Track** | Track streak | Leads to a "Log" action in UI. |
| Success Feedback | **Nailed it!** | Done, Completed | For celebratory feedback only. |
| Success (Standard) | **Logged** | Completed, Done | For status pills and standard feedback. |
| Objective/Goal | **Target / Intention** | Goal, Objective | Softer, more mindful framing. |
| System Concept | **Run** | Streak | Technical description only (e.g., "Log a ritual run"). |
| System Prompt | **Reminder** | Notification | More helpful and less intrusive. |
| Failed/Missing | **Missed** | Failure, Failed, Lost | Neutral, non-judgmental language. |

---

## 3. Banned Patterns & Guardrails

### Words to Avoid
* **Done:** Forbidden on action buttons or user-facing text. Use **Log** or **Logged**.
* **Failure / Punishment:** Never reference these. Use a dash (`—`) or neutral language.
* **Perfect:** Use **Steady** or **Strong** instead.

### Patterns to Avoid
* **Excessive Punctuation:** No multiple exclamation marks ("Great job!!!").
* **Emoji Abuse:** Use sparingly. Never let an emoji carry the primary meaning.
* **Gamification:** Avoid "Level up!", "Unlocked!", or "Points."
* **Guilt-Nudges:** Avoid "You haven't done X in 3 days." Use "Start building momentum."

---

## 4. Copy Examples (Before / After)

| Component | Before (Incorrect) | After (Canonical) |
|---|---|---|
| **Action Button** | `Done` / `Complete task` | `Log` / `Log ritual` |
| **Success Toast** | `Task completed` | `Logged` / `Nailed it!` |
| **Empty Board** | `You have no tasks` | `Your ritual board is empty` |
| **Empty Flow** | `No dashboard items` | `Start building momentum` |
| **Onboarding** | `Add your first task` | `Add your first ritual` |
| **Error Message** | `Unable to complete task` | `Couldn't log the ritual` |
| **Form Label** | `Task name` | `Ritual name` |
| **Progress Label** | `Current streak` | `Momentum` |
| **Motivation** | `Keep your streak!` | `Keep your momentum` |

---

## 5. Technical & AI Integration

Consistent semantics must exist from the database to the DOM.

### Naming in Code
* **Variables & IDs:** Use `ritual_id`, `momentum`, `logged_at`, `flow_state`. (Avoid `task_id`, `streak`, `completed_at`).
* **UI Components:** `RitualCard`, `RitualBoard`, `Flow`, `FlowHeader`.
* **DOM Classes:** `.ritual-card`, `.ritual-board`, `.flow-header`.

### API & Database
* **Schema:** Prefer `logged_at` over `completed_at`.
* **API Response:** Use `status: "logged"` instead of `status: "completed"`.

---

## 6. Terminology Checklist

Before generating/editing a UI or message, verify:
- [ ] Use **Ritual**, not **Task**.
- [ ] Use **Momentum**, not **Streak**.
- [ ] Use **Logged**, not **Completed**.
- [ ] Use **The Flow**, not **Dashboard**.
- [ ] Action buttons: avoid the text **Done**.
- [ ] Tone: minimalist, encouraging, conversational.
- [ ] Errors: recovery-oriented, not guilt-inducing.
- [ ] Code names aligned (`ritual_id`, `logged_at`, `momentum`).

---
> *Note: Progress is non-linear. Respect the pause, encourage the return.*