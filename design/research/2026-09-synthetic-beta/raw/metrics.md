# Raw — Post-test question results

Aggregate results as reported by the UXia platform (free tier). Per-participant
answers live in the participant files alongside this one. Analysis and decisions
are in [`../findings.md`](../findings.md) — this file is evidence only.

**n = 3.** Percentages below are reproduced as the platform displayed them; they
are not used in the report, where counts out of 3 are used instead.

---

## Q1 — How would you describe Strive's core philosophy in your own words?

*Open. Reads on RQ5 (does the positioning land).*

**Platform theme: "Flexible consistency (momentum over streaks)" — 3 mentions (3 of 3).**

- All three testers said Strive focuses on sustained momentum and avoids treating a missed day as failure.
- Each tester referenced weekly targets (like 3/7) or the "Steady" progress style as making goals feel practical rather than punitive.
- Arjun (P2) and Avery (P3) noted that the flexible goals fit around irregular schedules like shift work or daily life, making consistency more achievable.

---

## Q2 — What's one thing you'd change about this experience?

*Open. Reads on top unprompted friction.*

**Theme 1 — "Improve save confirmation and visibility" — 3 mentions (3 of 3).**

- All three noted that after tapping **Create ritual** the sheet closed without the new ritual appearing on the dashboard, causing doubt about whether the item saved.
- Each tester suggested a clear message like "Ritual saved" so they would know the app completed the action.
- They recommended the new ritual appear right away on the Today/dashboard to reassure users the app heard them.

**Theme 2 — "Make demo entry immediate/clear" — 2 mentions (2 of 3).**

- Both reported that tapping **Try the demo** didn't immediately show results, making them doubt it worked.
- They suggested a simple confirmation (e.g. "Demo opened") or immediate demo content so users don't get confused.
- Avery (P3) specifically noted needing to avoid extra scrolling like to "See it in action", and wants instant feedback.

**Theme 3 — "No change / positive feedback" — 1 mention (1 of 3).**

- Morgan (P1) said the chat-to-log portion felt great and only the save feedback needed improvement.

---

## Q3 — Rank these by how much they'd affect whether you'd keep using Strive

*Forced ranking of 4 items. Lower average = ranked higher. Reads on where to spend effort next.*

| Rank | Aspect | Avg position |
|---|---|---|
| **1** | **Ease of logging** | **1.0** |
| **2** | **Momentum tracking** | **2.0** |
| 3 | AI chat quality | 3.3 |
| 4 | Visual design | 3.7 |

An average of exactly **1.0** on *Ease of logging* and exactly **2.0** on *Momentum tracking* means all three participants placed them first and second respectively — unanimous, with no disagreement to average out. The two bottom places are the only ones where participants split.

---

## Q4 — How clear was it what to do at each step?

*Scale 1–7 (poor → excellent). Reads on RQ1, RQ2 (wayfinding).*

**Values: 3, 4, 5.** One participant each — full disagreement, no two alike.

| Statistic | Value |
|---|---|
| Mean | 4.0 / 7 |
| Median | 4 / 7 |
| Range | 3–5 |
| At or above the §6 bar (≥ 5) | **1 of 3** |

> **Attribution unknown.** The platform reported the distribution but not which
> participant gave which score. Not inferred from the transcripts — a score is
> only attributed here if the platform states it.

**Against the protocol bar** ([`../protocol.md`](../protocol.md) §6: *Q4 ≥ 5/7 for every participant*): **not met.** Two of three scored below the bar, and the median sits at 4 — the platform's own "Moderate" midpoint. This is the **weakest measure in the study**.

## Q5 — Did you encounter any errors or restrictions during the demo?

*Single choice. Reads on RQ1, RQ4 (incidence of blockers).*

| Answer | Count | Platform % |
|---|---|---|
| **Yes, minor friction** | **3 of 3** | 100% |
| Yes, clearly blocked | 0 of 3 | 0% |
| No issues | 0 of 3 | 0% |

Unanimous and unambiguous: **every participant hit friction, and none was hard-blocked.**

---

## Q6 — How natural and encouraging did the AI chat's tone feel?

*Scale 1–7 (poor → excellent). Reads on RQ6 (the differentiator).*

**Values: 4, 5, 6.** One participant each — again full disagreement.

| Statistic | Value |
|---|---|
| Mean | 5.0 / 7 |
| Median | 5 / 7 |
| Range | 4–6 |
| At or above the §6 bar (≥ 5) | **2 of 3** |

> **Attribution unknown**, same as Q4.

**Against the protocol bar** ([`../protocol.md`](../protocol.md) §6: *Q6 ≥ 5/7, no participant describing the tone as robotic or preachy*): **narrowly not met** on the numeric half — one participant sat at 4. The qualitative half is unresolved until the transcripts are in; note that Morgan (P1) volunteered in Q2 that the chat-to-log portion "felt great", so the 4 is not hers.

Tone scores one full point above clarity, and it is the only measure where a participant reached 6.

---

## Cross-question reading

The two scaled measures land very differently, and the gap is the study's headline:

| Measure | Median | Reads on |
|---|---|---|
| Q1 — positioning understood | **3 of 3** | What Strive *is* |
| Q4 — clarity of what to do | **4 / 7** | What to *do* in it |

**Participants understood the product and struggled to operate it.** All three reconstructed "flexible consistency, momentum over streaks" unprompted in Q1 — the hardest thing to get right, and it worked. Then they rated step-by-step clarity at a median of 4/7 and unanimously reported friction in Q5. The positioning is not the problem; the interface feedback is.

This is corroborated rather than contradicted by Q3: the two aspects participants ranked as most decisive for retention — **ease of logging (1.0)** and **momentum tracking (2.0)** — are exactly the two the flow made hard to feel confident about, while **visual design (3.7)**, which nobody complained about, ranked last.

## Notes on the source

- Platform: UXia, free tier. Export granularity is limited by the plan.
- The Q1 and Q2 blocks above are the platform's own thematic clustering, reproduced verbatim. They are the platform's interpretation of the open answers, not the answers themselves — the verbatim responses are in the participant files.
- Q4 and Q6 are the only two measures where participants fully disagreed with each other. With n = 3 that is three data points, not a distribution, but it is worth noting that the two *scaled* subjective measures split while the *behavioural* ones (Q2 friction, Q3 ranking, Q5 blockers) were unanimous.
