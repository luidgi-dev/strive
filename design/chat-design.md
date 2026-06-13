# Chat Design — "My Strive" AI assistant

The design rationale behind Strive's conversational assistant: what it can do, how it answers, and the guardrails that keep it on-brand. This complements the implementation — it's grounded in `lib/ai/*` and `components/chat/*`, and the visual is in [`wireframes/ai-chat-v2.html`](wireframes/ai-chat-v2.html). Terminology follows [`../docs/UX_WRITING.md`](../docs/UX_WRITING.md).

## Intent

Let the user **log rituals, check momentum, and manage rituals through natural conversation** — by typing or by voice — without learning the UI. The assistant feels like a calm, smart productivity tool, not a chatbot.

## Surface

A floating glass panel ("My Strive") anchored above the FAB, over a blurred Rhythm backdrop (`components/chat/chat-panel.tsx`, built on a base-ui Dialog for focus-trap / Escape). Opened by the sparkles FAB from anywhere in the app (hidden on Settings). Input is a multi-line auto-growing field (text) with a mic button for voice.

## Model

Google **Gemini 2.5 Flash** via the Vercel AI SDK (`lib/ai/client.ts`), overridable with the `STRIVE_AI_MODEL` env var. Responses stream from `app/[locale]/api/chat/route.ts`. The system prompt (`lib/ai/prompt.ts`) is rebuilt per request so today's date is always fresh.

## Tools (`lib/ai/tools.ts`)

The model has five tools, each bound to the verified user (never an id from the conversation) and filtered by `user_id` on top of RLS:

| Tool | Does | Card |
|---|---|---|
| `list_rituals` | List active rituals, optionally by category | RitualListCard |
| `get_momentum_summary` | Momentum for all rituals or one | MomentumCard |
| `log_ritual` | Log a ritual for today or a past date | LogCard (or DisambiguationCard) |
| `create_ritual` | Create a ritual (recurring / one-time / open) | — (text) |
| `get_log_history` | Log history for a ritual, optional date range | — (text) |

## Cards over text (`components/chat/cards/`)

Tool results render as **rich cards**, and the prompt instructs the model **not to repeat card data as text** — the card *is* the answer (at most one short sentence alongside). `tool-card.tsx` dispatches by tool name and `safeParse`s each output against a Zod schema (`schemas.ts`) before rendering, falling back to nothing on a mismatch.

- **MomentumCard** — one row per ritual with an X/target meter; open/one-time rituals show a bare count. Colors come from the shared momentum tokens (Strong = momentum green, Steady = caution amber, Resting = muted).
- **RitualListCard** — name + category + period chip (Daily / Weekly / Monthly / One-time / Open).
- **LogCard** — confirmation (check + "Logged · name"), updated momentum, and an **Undo** that removes the log via a server action (no chat round-trip, no credit).
- **DisambiguationCard** — tappable chips when a log is ambiguous; tapping logs directly via a server action (no credit), then swaps in the LogCard.

## Voice (`components/chat/use-voice-recorder.ts`, `voice-message.tsx`)

The user can speak instead of typing. The recorder captures the platform format, then decodes and re-encodes to **mono 16 kHz WAV** (Gemini's native input); clips under ~300 ms are discarded. A sent voice message renders as a play/pause bubble with a decorative waveform and duration. The model transcribes and acts on it like any message.

## Fuzzy ritual matching (`lib/ai/ritual-match.ts`)

Spoken or paraphrased names rarely match a ritual exactly, so `resolveRitualByName` runs a pure fuzzy matcher over the user's active rituals. Three signals, combined and thresholded:

- **Containment** (one string inside the other),
- **Token coverage** (bidirectional word overlap, stopwords removed — tolerates word order and extra words),
- **Trigram similarity** (Dice coefficient — tolerates typos and accents, e.g. "Proteins" → "Protéines").

A clear winner (score ≥ STRONG, with a MARGIN lead) resolves silently; close contenders become **disambiguation chips** ("which ritual?"); nothing plausible is "not found". Favouring confirmation over a silent guess matters most for voice.

## Guardrails & persona (`lib/ai/prompt.ts`)

- **Voice**: calm, focused, encouraging — never cheerful, robotic, or shaming. No gamification, minimal emoji. Replies in the user's language (informal "tu" in French).
- **Terminology (strict)**: always "ritual / momentum / log / Rhythm / Rituals / The Arc / rest"; never "task / habit / streak / done / completed / goal / The Flow".
- **Cannot**: delete or archive rituals/logs (points to the detail page), access another user's data, or answer off-topic questions; it must not pick a ritual itself when a log is ambiguous (it calls `log_ritual` and lets the app show chips).
- **Never invents** numbers — it calls a tool whenever live data or an action is needed.
- **Errors stay generic**: every tool runs through `runTool` (`lib/ai/run-tool.ts`), which logs server-side and returns `{ status: "error" }` — a raw DB error never reaches the model or the user, and the model phrases it as "Something went wrong on my end."

## Credits & kill-switch (`lib/ai/guard.ts`, `lib/ai/credits.ts`)

Each chat request is guarded cheapest-check-first: a **global pause** (kill-switch) is checked, then **one monthly credit** is reserved per request (refunded best-effort if the call fails). Blocked requests return a calm, localized notice (quota exhausted with renewal date, or a temporary AI pause) and lock the input. Card-driven actions (disambiguation chips, Undo) run as server actions and cost **no credit**.

## Why this works (strengths)

- **Log in your own words** — by text or voice — instead of hunting through the UI.
- **Tappable disambiguation** resolves ambiguity in one tap, free, without a new chat turn.
- **Designed cards, not walls of text** — momentum, lists, and confirmations read at a glance and match the app's visual language.
- **Safe by construction** — user-scoped data, generic errors, strict on-brand voice, and a credit/kill-switch budget.
