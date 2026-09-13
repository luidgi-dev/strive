# Findings: Demo Onboarding & Conversational Logging

**Report.** What happened in the study, what it means, and what was decided.
Method in [`protocol.md`](protocol.md); evidence in [`raw/`](raw/). Severity uses
the Nielsen 0-4 scale defined in [`../README.md`](../README.md).

| | |
|---|---|
| **Study** | `2026-07-synthetic-beta`, run 30 July 2026 on `striveapp.cc` (`9bedeea`) |
| **Participants** | 3 synthetic personas (UXia): P1 Morgan, P2 Arjun, P3 Avery |
| **Linear** | [LUI-109](https://linear.app/luidgi-dev/issue/LUI-109) (test plan) · [LUI-142](https://linear.app/luidgi-dev/issue/LUI-142) (results) · [LUI-143](https://linear.app/luidgi-dev/issue/LUI-143) · [LUI-145](https://linear.app/luidgi-dev/issue/LUI-145) |
| **Verification** | Platform insights checked against the code and a live repro before any decision |

> Participants are AI-simulated, not people. Every finding below is a hypothesis
> about real users, weighted by the limitations in [`protocol.md`](protocol.md) §7.

---

## TL;DR

1. **The positioning lands.** 3 of 3 reconstructed "momentum over streaks" unprompted, and 2 of 3 got it from the UI itself ("Steady", "3/7"), not just from the briefing.
2. **The core bet holds.** 3 of 3 logged by typing a natural sentence on the first attempt. None looked for a manual log button; all three said the chat felt like texting.
3. **The weak spot is acknowledgment, not clarity.** Each key action (demo tap, ritual save, chat send) worked, but produced a short silent gap before its result appeared. That gap is where every doubt in the study came from.
4. **Both "High" insights from the platform were overstated.** Checked against the code and the live app, the chat confirmation already exists and the new ritual does appear. What remains is the missing acknowledgment in between, addressed by LUI-143.
5. **The method had a blind spot worth knowing:** synthetic agents do not wait for asynchronous results, so no session could capture the stop condition as designed.

---

## Scorecard against the protocol

Bars from [`protocol.md`](protocol.md) §6, set before analysis.

| Bar | Result | Note |
|---|---|---|
| All 3 reach the stop condition | ❌ **0 of 3 captured** | Every session ended waiting on the chat reply. Live check: the reply arrives in under 5 s. A capture artifact, see [Method notes](#method-notes). The platform marked all 3 as Success, based on actions performed. |
| No hard blocker (Q5) | ✅ 0 of 3 blocked | 3 of 3 reported "minor friction" |
| Wayfinding, Q4 ≥ 5 for everyone | ❌ 1 of 3 | Scores 3, 4, 5. Transcripts show the doubt was about *whether actions worked*, not *what to do* |
| Positioning understood (Q1), ≥ 2 of 3 | ✅ **3 of 3** | Strongest result of the study |
| Logs in natural language on the first try, no fallback | ✅ **3 of 3** | Message sent first time; reply not captured (see above) |
| AI tone, Q6 ≥ 5, never robotic or preachy | ❌ narrowly, 2 of 3 | Scores 4, 5, 6. No negative tone comment. **Weakly grounded:** with no reply captured, participants could only rate the greeting |

---

## The key insight: it worked, but it didn't say so

> "The flow is strongest when it reflects the brand promise with steady progress and non-daily targets, and **weakest when it withholds basic state confirmation after key actions**." (P3, Avery)

The same pattern shows up at the three moments that matter:

| Moment | Seen by | What the participant saw | What was actually happening |
|---|---|---|---|
| Tap *Try the demo* | 2 of 3 | Landing page unchanged, no loading state. P3 gave up on the button and scrolled away | The demo opened after a delay |
| Tap *Create ritual* | 3 of 3 | Sheet closes, new ritual not on Rhythm, no confirmation | The ritual was saved and appears on Rhythm shortly after (live repro) |
| Send a chat log | 3 of 3 | Typing indicator, no confirmation | The reply, a *Logged · ritual name* card, arrives in under 5 s |

In every case the system did its job. What failed is the silence between the action and its result. This matters more in a habit tracker than elsewhere: the whole promise is *trust that it recorded what I did*. As P2 put it: "that kind of mismatch makes the app feel unreliable, especially when the whole point of a tracker is trusting that it recorded what I did."

It also explains the one poor score. Q4 asked how clear it was *what to do* (median 4/7), yet no transcript shows a participant unsure of the next step. P1 finished in 7 steps with no misclicks and still reported two "confidence dips".

---

## Findings

Ranked by severity. Every finding carries a decision.

| ID | Finding | Seen by | Severity | Decision | Issue |
|---|---|---|---|---|---|
| **F1** | No confirmation when a ritual is saved: the sheet closes before the new ritual shows on Rhythm | 3 of 3 | **2 · Minor** | Accepted | [**LUI-143**](https://linear.app/luidgi-dev/issue/LUI-143) |
| **F2** | Rhythm is read as a dashboard of all rituals rather than today's list; the day picker is skipped | 3 of 3 skipped it; 3 of 3 called Rhythm "the dashboard" | **2 · Minor** | Accepted | [**LUI-145**](https://linear.app/luidgi-dev/issue/LUI-145) |
| **F3** | Demo entry: no feedback on tap, and *Try the demo* is visually weaker than *Get early access* | 2 of 3 (feedback); 3 of 3 (hierarchy) | **2 · Minor** | Deprioritized: the demo is a shortcut; real evaluation happens in the app | — |
| **F4** | Momentum labels ("3/7", "2 of 4 logged", "Steady") take a moment to parse | 3 of 3 mentioned; 3 of 3 interpreted correctly | **1 · Cosmetic** | Won't fix: product vocabulary, identical on real accounts, understood by all three | — |
| **F5** | Pre-filled demo rituals are not marked as sample data | 1 of 3 confused (P2); 1 of 3 helped by them (P1) | **1 · Cosmetic** | Won't fix, by design: avoids an empty app and keeps demo behaviour identical to a real account after signup | — |
| **F6** | Sparkle chat button has no label | 2 of 3 (all found it anyway) | **1 · Cosmetic** | Won't fix: minor detail, all three found the button without hunting | — |
| **F7** | Chat log card shows the ritual but not the date | 1 of 3 (P2 asked for it) | **1 · Cosmetic** | Won't fix: minor detail, the card already names the ritual | — |
| **F8** | Category pills look alike before selection | 1 of 3 | **1 · Cosmetic** | Backlog | — |

**A note on F2 and LUI-145.** Two participants explicitly valued being able to skip the optional fields: "nicely forgiving because it lets me leave optional details alone" (P1), and the day options reassured P2 "even though I have not opened them". LUI-145 should make the day picker more *visible* without making it *required*. The issue already says so ("should not feel like a blocking requirement").

---

## Where we disagree with the platform

UXia rated five insights ([`raw/uxia-report.md`](raw/uxia-report.md)). Each was checked against the code, the live app, or both before being accepted.

| UXia insight | UXia | Ours | Why |
|---|---|---|---|
| **U1** Chat does not confirm what was logged to which ritual | High | **0**, artifact (F7 residue) | The confirmation exists: `components/chat/cards/log-card.tsx` renders *Logged · {ritual name}*, a momentum meter and Undo. Every session's last step was "Waits", captured right after sending; live, the reply arrives in under 5 s. The suggested "complex, major redesign" describes a shipped feature. |
| **U2** Saved ritual does not appear on the dashboard | High | **2** (F1) | Live repro: a weekly ×3 ritual with no days, created from Rhythm, appears there shortly after the sheet closes, as the scope rule in `lib/rhythm/today-rituals.ts` (and its tests) predicts. Each participant looked at Rhythm once, right after the sheet closed, then moved into the full-screen chat; later mentions are from memory, not re-observation. The real residue is the missing save acknowledgment. |
| **U3** Demo entry under-emphasized | Medium | **2** (F3) | Agreed on the observation, deprioritized on product grounds |
| **U4** Dashboard labels not self-explanatory | Medium | **1** (F4, F5) | All three interpreted the labels correctly after a moment; the labels also carried the positioning (TL;DR 1) |
| **U5** Category selection state subtle | Low | **1** (F8) | Agreed |

The lesson for future studies: **a High rating from the platform is a lead, not a verdict.** Both of the High insights here described system states the agents did not wait long enough to see.

---

## What to protect

Changes coming out of this study should not break what worked:

- **The forgiving creation form.** Defaults of *weekly, 3×* were noticed and praised ("refreshingly realistic", P3). Optional fields stay optional.
- **Chat as texting.** 3 of 3 compared it to messaging someone; the sparkle button was found without hunting by all three.
- **Momentum vocabulary as the carrier of the positioning.** "Steady" and "3/7" are what convinced participants this was not a streak app.
- **Priorities, per Q3:** ease of logging (1st, unanimous) and momentum tracking (2nd, unanimous) drive retention; visual design ranked last and drew no complaints.

---

## Method notes

What this study taught us about the method itself, beyond the limitations already listed in [`protocol.md`](protocol.md) §7:

1. **Synthetic agents do not wait for asynchronous results.** Both the chat reply (under 5 s) and the post-save re-render were missed. The stop condition, which depended on the chat reply, was unreachable as captured. Next time: state explicitly in the mission to wait for the reply, or verify asynchronous outcomes manually and record them as such.
2. **Platform "Success" means actions performed, not stop condition met.** Grade against your own stop condition.
3. **A tool-generated severity needs checking before it drives work.** Two of two High insights were overstated; a code read and a two-minute live repro were enough to tell.
4. **Q6 (AI tone) was rated on the greeting only**, since no reply was captured. Its scores say little about the tone of real responses.
5. **Starting from Rhythm was the right path.** All three created their ritual from Rhythm's *Add a ritual* without being told to. It is where a new user lands, so it is where the test should run.

---

## Decisions and follow-ups

| Item | Status |
|---|---|
| [LUI-143](https://linear.app/luidgi-dev/issue/LUI-143): in-app confirmation when a ritual is saved | Open, from F1 |
| [LUI-145](https://linear.app/luidgi-dev/issue/LUI-145): make "pick a day" more prominent in Define Ritual | Open, from F2 |
| F3, F4, F5, F6, F7 | Deprioritized or won't fix, rationale in the findings table |
| **Product question, outside this study:** should a recurring ritual with no days picked show on Rhythm every day? Current behaviour: yes. If this changes, F1 becomes the default experience for anyone who skips the day picker (3 of 3 here), which makes LUI-143 and LUI-145 prerequisites rather than improvements. | Parked |
