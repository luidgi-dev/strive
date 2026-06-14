# Insights — design & architecture

The **Insights** page turns raw data (The Arc, ritual history, momentum) into
**understanding**: patterns, correlations, and gentle suggestions, delivered as
minimal "Insight Cards". It is a **premium** surface (it leans on the AI), reached
as a discrete sub-page from Settings — never a bottom-nav tab.

Wireframe: [`wireframes/insights.html`](wireframes/insights.html). Tokens/voice stay
canonical in [`../docs/DESIGN_SYSTEM.md`](../docs/DESIGN_SYSTEM.md) and
[`../docs/UX_WRITING.md`](../docs/UX_WRITING.md).

## The core idea: hybrid intelligence

> **The AI never invents a number.** It only *phrases* facts the backend already
> computed.

Two halves, kept strictly separate:

1. **Stats Engine** ([`lib/insights/calculators.ts`](../lib/insights/calculators.ts)) —
   pure TypeScript over completed `ritual_logs`. It extracts precise facts
   (a weekday completion drop, a lift between two rituals) and attaches a
   **confidence score**. No AI here, so it is deterministic and unit-tested.
2. **Prompt Library** ([`lib/insights/prompts.ts`](../lib/insights/prompts.ts)) —
   one specialized prompt per card type. The model receives the pre-computed
   facts and returns only `{ headline, body }`. The raw numbers are persisted in
   the row's `payload`, so nothing the model writes is trusted as a statistic.

The **Orchestrator** ([`lib/insights/orchestrator.ts`](../lib/insights/orchestrator.ts))
glues them: run calculators → keep the confident facts → phrase each with Gemini
(`generateObject`, structured output) → cache in the `insights` table.

## Card types

The first two need several weeks of patterns; the last three (added so a new user
sees cards early) fire within a week or two and lean positive.

| Type | Reads | Fires | Example |
|---|---|---|---|
| **Correlation** | weeks where ritual A is logged heavily vs ritual B's completion | slow | "Sleep and Sport are linked." |
| **Adjustment** | per-weekday completion for one ritual | ~4 wks | "Your Wednesday target may be too high." |
| **Strength** | each recurring ritual's avg weekly completion ratio | early | "Skincare nuit is your anchor." |
| **Best day** | total logs per weekday across all rituals | early | "Wednesdays carry your rhythm." |
| **Pairing** | Jaccard overlap of two daily rituals' logged days | early | "Skincare matin and nuit tend to pair." |

The orchestrator caps each type (`PER_TYPE_CAP`) so one calculator can't fill a
report — a Strength sits next to an Adjustment rather than four Adjustments.

*Suggestion* cards (from note text) remain deferred — the fuzziest, hardest to
ground in stats.

## Confidence model

Each fact gets a `0..1` score blending three signals (weights in
`CONFIDENCE_WEIGHTS`):

- **sufficiency** — enough weeks of history observed,
- **effect** — how strong the pattern is,
- **sample** — how much data backs it.

The orchestrator drops anything below `~0.5`, sorts by confidence, and keeps the
top cards. The **"Last N weeks"** basis label on each card is the user-facing,
implicit robustness signal (an explicit per-card score is a v2 idea). This is why
a brand-new user sees few or no cards rather than noise.

## Cadence: two reports

| Cadence | Runs | Lookback | Cards | Feel |
|---|---|---|---|---|
| **Weekly** | every Monday | 8 weeks | up to 4 | a quick pulse |
| **Monthly** | the 1st | 12 weeks | up to 6 | a deeper, richer look |

`cadence` is part of each row's identity, so when a **Monday falls on the 1st**
both reports coexist without overwriting each other (the cron schedules are
staggered an hour apart). The page presents them behind a **Week / Month toggle**,
defaulting to the freshest. Generation is **idempotent**: re-running a report
replaces that period's non-dismissed cards and never resurrects a dismissed one.

## Generation & access

- **Scheduled, not on-demand.** Two Vercel Cron jobs (see `vercel.json`) call
  [`app/[locale]/api/cron/insights/route.ts`](../app/%5Blocale%5D/api/cron/insights/route.ts)
  with a GET, authorized by a shared `CRON_SECRET` Vercel attaches automatically.
  The page is a **pure read** of the cache.
- **Service role.** The job has no user session, so it runs under
  [`lib/supabase/admin.ts`](../lib/supabase/admin.ts) (bypasses RLS) and filters
  `user_id` explicitly. Users only **read** their own rows (and **dismiss** them)
  via RLS.
- **Free / tier-covered.** Generation does **not** consume AI credits — the
  premium gate *is* the paywall. The global AI kill-switch (`isAiEnabled`) is still
  respected, so AI can be paused app-wide.
- **Premium only.** The page redirects `lite` users to Settings, and the
  "My Insights" link in Settings is hidden for them.

## Why these choices

- **Calm, not addictive.** Insights are contemplative; a scheduled cadence (vs a
  pull-to-refresh that burns credits per tap) fits Strive's voice.
- **Trustworthy.** Separating computation from phrasing means a prompt change can
  never alter a statistic, and the facts are auditable in `payload`.
- **Premium feel.** Found via your account rather than the main nav, gated to paid
  tiers — it reads as a perk, not a default tab.
