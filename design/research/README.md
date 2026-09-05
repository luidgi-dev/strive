# `design/research/` — User Research

Where Strive's **evidence about users** lives: what was tested, with whom, what came out of it, and which issue it turned into. Versioned next to the code so a product decision can always be traced back to the observation that caused it.

## Studies

| Study | When | Participants | Method | Status |
|---|---|---|---|---|
| [`2026-09-synthetic-beta/`](2026-09-synthetic-beta/) | Sept 2026 | 3 synthetic | Moderated task-based, AI-simulated (UXia) | Findings in progress |

## How a study is packaged

Every study folder follows the same three layers. A reader should be able to stop after the first one.

```text
<yyyy-mm>-<slug>/
  protocol.md    # the plan: objectives, participants, task, measures — what we set out to learn
  findings.md    # the report: frictions ranked, evidence, decisions, issue links — the 5-minute read
  raw/           # the evidence: transcripts, per-question answers, metrics, platform exports
```

`protocol.md` describes the study **as designed**. `findings.md` describes what **actually happened** and what we decided to do. `raw/` exists so any claim in `findings.md` can be checked rather than trusted.

## Severity scale

Findings are rated on **Nielsen's usability severity scale**, unchanged, so the ratings mean the same thing here as in the wider field:

| Rating | Meaning | Default handling |
|---|---|---|
| **0** | Not a usability problem | Logged, no action |
| **1 — Cosmetic** | Fixed only if spare time is available | Backlog, no issue |
| **2 — Minor** | Low priority to fix | Issue, low priority |
| **3 — Major** | Important to fix, high priority | Issue, prioritised |
| **4 — Catastrophe** | Imperative to fix before release | Issue, blocks release |

Severity combines **frequency**, **impact**, and **persistence** — a friction that a user hits once and never again is not the same problem as one they hit on every session.

## From finding to issue

Every finding rated 2 or higher gets one of three outcomes, recorded in the findings table:

- **Fixed** — linked Linear issue, closed, with the commit or PR.
- **Accepted** — linked Linear issue, open and prioritised.
- **Won't fix** — no issue, but the rationale is written down. A rejected finding still counts as a finding.

Nothing is allowed to sit in a report without a decision next to it. The traceability column is the point of the exercise.

## Reading rules

- **Never report percentages on small samples.** With 3 participants, write "2 of 3", never "67%". Closed-question distributions live in `raw/metrics.md`, not in the headline.
- **Synthetic participants are labelled as synthetic, everywhere.** They are AI-simulated personas, not people. They surface interface frictions well and say nothing reliable about real-world motivation or retention.
- **A friction reported by both a real tester and a synthetic one is a different class of signal.** Where both sources exist, the findings table flags it.

## Related

- Product surfaces and flows under test → [`../ux-flow.md`](../ux-flow.md), [`../chat-design.md`](../chat-design.md)
- Terminology used in participant-facing copy → [`../../docs/UX_WRITING.md`](../../docs/UX_WRITING.md)
- Errors observed in production during the same period → [`../../docs/OBSERVABILITY.md`](../../docs/OBSERVABILITY.md)
