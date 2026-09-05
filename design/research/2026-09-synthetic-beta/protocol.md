# Synthetic User Testing — Demo Onboarding & Conversational Logging

**Protocol.** What this study set out to learn, with whom, and how it was run.
Results live in [`findings.md`](findings.md); raw evidence in [`raw/`](raw/).

| | |
|---|---|
| **Study ID** | `2026-09-synthetic-beta` |
| **Run** | September 2026 |
| **Method** | Moderated task-based usability test, AI-simulated participants |
| **Platform** | UXia (free tier) |
| **Participants** | 3 synthetic personas, English, unmoderated single session each |
| **Build under test** | Live preview deployment, release `9bedeea` |
| **Linear** | [LUI-109](https://linear.app/issue/LUI-109) (test plan) · [LUI-142](https://linear.app/issue/LUI-142) (results) |

> **On the status of this document.** The mission, stop condition, scenario, participant set and question list below are reproduced **verbatim from the study configuration**, which was defined before the sessions ran (LUI-109). The objectives and success criteria in §1 and §6 are made explicit here for the first time: they were the intent behind the study design, but were not written down as formal, pre-registered criteria before the runs. That distinction is recorded rather than smoothed over, and §7 treats it as a limitation.

---

## 1. Objectives

Strive's two riskiest first-session bets are that a stranger can reach value **without creating an account**, and that they will **log by talking to the AI** rather than hunting for a button. This study targets exactly those.

| # | Research question | Answered by |
|---|---|---|
| **RQ1** | Can a first-time user find and enter demo mode unaided, with no account and no guidance? | Task completion, Q4, Q5 |
| **RQ2** | Is creating a first ritual self-explanatory, or does the form need prior knowledge of the model? | Transcript, Q4 |
| **RQ3** | Is conversational logging **discoverable** — do users find the chat when a manual log button is also present? | Transcript, Q2 |
| **RQ4** | Does conversational logging **work** on an unconstrained, natural-language first attempt? | Task completion, Q5 |
| **RQ5** | Does "flexible consistency" land as the product's core idea, or do users still read it as a streak tracker? | Q1 |
| **RQ6** | Does the AI's tone read as natural and encouraging rather than robotic or preachy? | Q6, transcript |

RQ5 is the one worth stating plainly: Strive's entire positioning is *not being a streak app*. If participants describe it back as a streak tracker, the positioning has failed regardless of how well the flow performed.

---

## 2. Method

### 2.1 Nature of the participants

Participants are **AI-simulated personas**, not people. Each is given a persona sheet, the mission, the scenario and a live link to the app, then navigates the real deployed product while narrating its reasoning click by click.

This is a **discount usability method**. What it is good for: surfacing interface frictions, dead ends, ambiguous labels, and gaps between what the UI offers and what a newcomer expects. What it cannot tell us: whether a real person would come back on day 4, what they would pay, or how they would feel after breaking a rhythm. Those questions need humans and time. See §7.

### 2.2 Design choices

- **Single session, no retry.** Each participant runs the flow once. First-run friction is the object of study, so a second attempt would destroy the signal.
- **Demo mode, not signup.** The account-creation path is deliberately out of scope. This isolates the "stranger evaluates the product in 3 minutes" path, which is the one the landing page actually sends people down.
- **No task hints.** The scenario gives motivation and context, never instructions. "Try logging it conversationally" states an intent, not a route — finding the chat is part of what is being measured.
- **A realistic ritual, chosen by the participant.** Participants pick their own ritual rather than being handed one, so the choice itself is data about what people expect the product to track.
- **English only.** The single demographic dimension set manually was language (`EN`). The app ships FR and EN; the French path was not covered by this study.

---

## 3. Participants

Three personas, deliberately spread across age, geography, education, income and technical fluency, so a friction reported by all three cannot be dismissed as a profile artefact.

| | **P1 — Morgan L.** | **P2 — Arjun D.** | **P3 — Avery R.** |
|---|---|---|---|
| **Age / gender** | 58, female | 19, male | 28, female |
| **Country** | 🇨🇦 Canada | 🇮🇳 India | 🇺🇸 United States |
| **Tech fluency** | Intermediate | **Beginner** | **Advanced** |
| **Education** | Secondary school | Secondary school | University graduate |
| **Work** | Real estate agent, part time | Lathe operator, full time | Content strategist, full time |
| **Sector** | Real estate | Manufacturing | Media & communications |
| **Household income** | 52 000 USD | 18 000 USD | 50 000 USD |
| **Status** | Married | Married | Single |
| **Language** | EN | EN | EN |

**Persona briefs, as given to the participants:**

- **P1 — Morgan L.** — Lifestyle-focused and community-oriented, she balances family life with a flexible part-time real estate practice and enjoys outdoor walks, gardening, and social get-togethers on weekends.
- **P2 — Arjun D.** — A practical, family-oriented young man who balances work commitments with home life. He enjoys cricket, quick-witted banter with colleagues, and a habit of tinkering with small machines in his free time.
- **P3 — Avery R.** — A dedicated content strategist who thrives on structured planning and clear goals, balancing creative exploration with meticulous execution. Outside work, she enjoys streaming indie films, hiking, and hosting small get-togethers with friends.

**Why this spread.** The two endpoints carry most of the load. **P2** is the stress test: beginner-level technical fluency, lowest income, on the mobile-first path where an unlabelled affordance or an unexplained term breaks the session outright. **P3** is the opposite pressure: advanced, professionally trained in structured planning, and therefore the most likely to judge the product against tools she already knows and to notice what is missing rather than what is confusing. **P1** sits between them and is closest to the "tried habit trackers, gave up" profile the scenario describes.

**Provenance note.** Age, gender and language were set as audience parameters; the remaining nine attributes per persona (nationality, country, technical fluency, education, sector, occupation, employment, marital status, income) were **generated by the platform** from those seeds, not authored by hand. The personas are therefore internally coherent, but the spread is only partly deliberate.

---

## 4. The task

Given to all three participants identically, verbatim:

### Mission

```text
Open Strive and use the "Try a demo" option to access the app instantly.
Create your first ritual, then log it using the AI chat by describing your
activity in natural language (e.g. "I ran 5km today") instead of tapping a
manual log button.
```

### Stop condition

```text
Stop once you have entered the demo, created a ritual, and received a
confirmation from the AI chat that your activity was logged.
```

### Scenario

```text
You've tried habit trackers before but always abandoned them after breaking a
streak — it felt discouraging and all-or-nothing. A friend told you about
Strive, an app that focuses on "flexible consistency" instead of daily streaks,
with an AI chat that lets you log activities just by describing them like
you're texting a friend. You want to try it out quickly without creating an
account, so you use the demo mode. You create a ritual you'd realistically want
to stick to (e.g. reading, meditating, working out), and try logging it
conversationally to see how the AI responds.
```

The scenario is written to carry the **prior frustration** that Strive is positioned against ("abandoned after breaking a streak"). That framing is deliberate: it is the emotional state of the target user at the moment they arrive, and without it the value proposition has nothing to land against.

### Implied step sequence

Not shown to participants — used to locate where in the flow each friction occurred.

1. Land on the public site
2. Find and trigger **Try a demo**
3. Arrive in the app, oriented
4. Find ritual creation
5. Define a ritual (name, cadence, category)
6. Find the AI chat
7. Log in natural language
8. Receive and recognise a confirmation

---

## 5. Measures

Six post-task questions, mixing scaled, ranked and open formats so that a weak score always has a stated reason attached to it.

| # | Question | Type | Reads on |
|---|---|---|---|
| **Q1** | How would you describe Strive's core philosophy in your own words? | Open | RQ5 — does the positioning land |
| **Q2** | What's one thing you'd change about this experience? | Open | Top unprompted friction |
| **Q3** | Rank these by how much they'd affect whether you'd keep using Strive: AI chat quality · Visual design · Ease of logging · Momentum tracking | Rank (4) | Where to spend effort next |
| **Q4** | How clear was it what to do at each step? | Scale 1–7 (poor → excellent) | RQ1, RQ2 — wayfinding |
| **Q5** | Did you encounter any errors or restrictions during the demo? | Choice: no issues · yes, minor friction · yes, clearly blocked | RQ1, RQ4 — incidence of blockers |
| **Q6** | How natural and encouraging did the AI chat's tone feel? | Scale 1–7 (poor → excellent) | RQ6 — the differentiator |

**Q1 is the highest-value question in the set.** It is unprompted and open, so a participant who has genuinely understood "flexible consistency" will reconstruct it in their own words, while one who has not will fall back on the vocabulary of every habit app they have used before. It cannot be gamed by a satisfied user being polite.

**Q3 is deliberately forced-choice.** Ranking four aspects against each other prevents the "everything matters" answer and yields an ordering that can actually drive the roadmap.

Q4 and Q6 use a 7-point scale rather than 5 to leave room above "good" — with three participants, the interesting movement is at the top of the range.

---

## 6. What success looks like

Stated in advance of analysis, so the findings are not graded on a curve after the fact.

| Outcome | Bar |
|---|---|
| **Task completion** | All 3 reach the stop condition unaided |
| **No hard blockers** | No participant answers Q5 with "yes, clearly blocked" |
| **Wayfinding** | Q4 ≥ 5 / 7 for every participant, including P2 (beginner) |
| **Positioning** | At least 2 of 3 describe Strive in Q1 without reducing it to streaks |
| **Conversational logging** | All 3 log successfully on their **first** natural-language attempt, without falling back to a manual button |
| **AI tone** | Q6 ≥ 5 / 7, with no participant describing the tone as robotic or preachy |

The conversational-logging bar is the strict one on purpose. Falling back to the manual button is a silent failure: the task still completes, so completion rate alone would report a success where the product's actual differentiator did not work.

---

## 7. Limitations

Recorded so that no finding in [`findings.md`](findings.md) is read as stronger than the method supports.

1. **Participants are simulated, not human.** Every finding here is a hypothesis about a real user, not an observation of one. Frictions are the transferable part; stated preferences, emotional reactions and anything about retention are not.
2. **n = 3.** Enough to surface major interface frictions, far too few for any distribution claim. Counts only, never percentages.
3. **Objectives and success criteria were not formally pre-registered.** They are reconstructed in §1 and §6 from the study design. They constrain the analysis honestly, but they were not locked before the runs, and a reader is entitled to weigh them accordingly.
4. **One session per participant, no retry.** Good for first-run friction, silent on learnability — a friction that a real user would resolve on their second visit looks identical here to one that would drive them away.
5. **Demo mode only.** Signup, real data, cross-session persistence and long-run momentum are all untested. The demo may itself carry restrictions that a real account would not, which Q5 is designed to catch.
6. **English only, and a partly generated persona spread.** The FR path is uncovered, and nine of twelve persona attributes were platform-generated (§3).
7. **Free tier.** Export granularity and session instrumentation are limited by the plan, which constrains what `raw/` can contain.

---

## 8. Open items

- [ ] Confirm the exact deployment URL and commit tested, and pin it here.
- [ ] Confirm which demographic parameters were set manually vs generated (§3 provenance note).
- [ ] Confirm session dates for each participant.
