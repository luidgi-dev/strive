# Strive: Build Log

> How Strive actually got built, in the first person: what I chose, what I got
> wrong, what I would do differently. The story behind the decisions, not an
> explanation of them. For *how the system works*, read
> [`DEEP_DIVE.md`](DEEP_DIVE.md); for *how it is pitched*, read
> [`PITCH.md`](PITCH.md). This doc deliberately repeats neither.

**Status:** v0.1 (2026-09-20)
**Author:** Luidgi

---

## In one minute

| | |
|---|---|
| **What** | A live AI-first habit tracker built on momentum instead of streaks |
| **Scope** | Solo, every layer: product, design, schema, code, AI, deploy, research |
| **Effort** | 590 commits, 110 PRs, about 100 hours across four months, evenings and weekends |
| **The story** | My first momentum implementation reset every Monday, reintroducing the exact streak behaviour the product exists to remove (§3) |
| **Usage** | 293 logs of my own over 94 days. Seven external sign-ups, one of whom ever logged, four times (§7) |
| **Reliability** | One Sentry issue in three months, root-caused to infrastructure clock skew, not app code (§7) |
| **The lesson** | I ran a rigorous study on simulated users and no structured test on the real ones (§8) |

---

## 1. Origin and role

**I did not start with a product idea. I started with a scope.** I wanted to
build one application end to end, alone, covering every layer rather than the
two or three I was comfortable with: challenge an idea, build a proof of
concept, define a real visual direction, design a clean Postgres schema, learn
Next.js properly, then deploy, maintain and present it. The subject came second.
I needed something worth four months, not a to-do list demo.

**The subject came from my own notes app.** I stick to personal goals far better
when I write down every time I make progress on them, and the tool I was using
for that was the Notes app on my phone. That is a low bar, and the fact that it
still beat nothing told me the mechanism mattered more than the software. If the
problem was mine, it was probably not only mine.

**Then the hard part: there are hundreds of habit trackers, some already called
Strive.** I was never going to surface in a search for "AI habit tracker" and I
knew it going in, so a real part of the work was positioning. What is the one
characteristic that makes this one worth existing? That took more iterations
than any feature.

**The answer came from how I actually work.** I did not want a two or three day
pause to erase months of consistency. That is a personal preference before it is
a market insight, and it is the origin of the whole model: momentum instead of
streaks, weekly targets instead of daily ones, and ritual types (recurring,
one-time, open) so the app bends to the rhythm rather than the reverse. The
market argument in [`PITCH.md`](PITCH.md) is true, but it was built after the
conviction, not before it.

**AI went in for two reasons and I will name both.** The first is technical: I
wanted to learn how to integrate a model into a real application, with tool
calling, quotas and guardrails, not a demo prompt box. The second is product
value: logging by chat or voice removes the friction that kills tracking, and
Insights have surfaced connections in my own data I would not have made myself.
Presenting only the second reason would be a nicer story and a less honest one.

**Presentation was part of the exercise**, not an afterthought: a pitch deck, the
memos in this repository, an Instagram account. Not to break through, which was
never plausible, but because "end to end" includes explaining the thing to
someone who has never seen it.

So the role was all of it: product definition, UX writing, visual design, schema,
application code, AI integration, deployment, observability, research and
presentation. There was no one to hand a decision to. Every bad call in this
document is mine, and so is every fix.

> **Portfolio-ready.** Strive was a scope before it was an idea: build one
> application end to end, alone, from the visual direction to the database to
> deployment. The subject came from my own notes app, which was the habit
> tracker I was actually using.

---

## 2. How it was built

Straight from `git log`, not estimates.

| | |
|---|---|
| First commit | 23 March 2026 |
| Main build period | March to July 2026 |
| Commits | 590 |
| Merged pull requests | 110 |
| Days with commits | 36 |
| Hands-on time | about 100 hours |
| Application code | 21 678 lines of TypeScript and TSX, excluding tests |
| Tests | 1 177 lines across 10 files |
| Database | 44 SQL files: 17 tables, 3 views, 11 functions, 3 triggers |

**The work was concentrated, not spread.** 497 of the 590 commits land in May
and June, which hold 24 of the 36 active days. Strive was an evenings and
weekends project alongside a full-time job, so it moved in bursts. The September
commits are small adjustments, not new work.

**The 100 hours is a floor and I can show the method.** I estimated it by hand
first, then from the commit timestamps: count the interval between consecutive
commits when it is under two hours, treat anything longer as a new session, add
thirty minutes of lead-in. That gives 44 sessions and 100 hours, or 95 to the end
of July. The method only sees time between commits, so it misses design,
wireframes and everything done outside the repository. I quote the floor because
it is the part I can prove.

> **Portfolio-ready.** A live product with AI, social features and per-user data
> isolation, built solo in about 100 hours of evenings and weekends across four
> months.

---

## 3. The rebuild that mattered: momentum

The decision I would talk about if I could only talk about one.

**Momentum was never a streak.** Strive exists because streaks reset to zero and
that reset is what makes people quit, so momentum was in the design from its
first commit (`e3c2f9e`, 1 June 2026). The word "streak" appears nowhere in the
codebase except as the thing the product rejects: landing copy, and the
forbidden-terms list in the AI system prompt.

**My first implementation reintroduced the reset anyway.** Momentum v1 was
computed on the calendar week or month, and for daily rituals pro-rated against
the days elapsed in the current period. Both halves were wrong, in opposite
directions:

- The calendar boundary wiped it. Every Monday and every first of the month,
  momentum started over. That is the streak reset under a different name, in the
  app built to remove it.
- The pro-rating lied in the user's favour. After two idle weeks a single Monday
  log read as one out of one elapsed day, scoring **Strong**. The app
  congratulated someone who had just come back from a fortnight away.

The second one bothered me more. A tracker's only real asset is that you believe
what it tells you, and rating a comeback as Strong is not a generous bug, it is a
dishonest one.

**What I changed, and what I deliberately did not.** Momentum *status* moved to a
rolling window sized to the ritual's own cadence: seven days for daily and
weekly, thirty for monthly, none for open and one-time rituals, which have no
cadence to measure against. The fix is two additive columns on the
`ritual_progress` view, `momentum_count` and `momentum_target`
([`data/views/ritual_progress.sql`](../data/views/ritual_progress.sql)), so every
surface already reading that view got the corrected status with no new queries.
The status itself is derived in TypeScript by `rollingMomentumStatus`
([`lib/data/rituals.ts`](../lib/data/rituals.ts)) so it stays unit tested.

The Rhythm card's number and bar stayed calendar-based, because they sit beside
the day strip and The Arc, which are calendar views. Only the status pill went
rolling. That inconsistency is accepted on purpose: the number answers "where am
I this week", the pill answers "how have I been doing lately", and making them
agree would have meant making one of them wrong.

Merged as [PR #60](https://github.com/luidgi-dev/strive/pull/60) on 13 June 2026.
Momentum v1 had been live for twelve days.

> **Portfolio-ready.** My first implementation of momentum reset every Monday,
> which is exactly the streak behaviour the product exists to eliminate. I had
> rebuilt the problem I was solving, inside the feature named after the solution.

---

## 4. Two other things that fought back

### 4.1 The iOS status bar

Strive is a PWA, so on an iPhone home screen the OS status bar sits above the app
and has to follow the in-app theme. Three constraints each broke the obvious fix.
iOS only re-evaluates that bar when a `theme-color` meta node is **added**, so
mutating the existing one leaves it stale. The iOS WebView caches that node
across soft navigations, so it has to be re-appended on route change too. And
React 19 with Next 16 tracks any meta rendered through `viewport.themeColor`, so
stripping those out from under React crashes on the next unmount.

The answer is
[`components/providers/dynamic-theme-color.tsx`](../components/providers/dynamic-theme-color.tsx):
a client side-effect that appends its own tagged nodes and removes only the ones
it tagged. The layout does not export `viewport.themeColor` at all. The accepted
cost is a 50 to 100 ms flash of the default status bar before hydration, hidden
by the splash screen on an installed PWA. Full write-up in
[`app/README.md`](../app/README.md).

I keep this one because it appears in no tutorial and cannot be reasoned out from
first principles. It only shows up on a real device, and the fix is three
workarounds that have to coexist.

### 4.2 Row Level Security that calls itself

Circles are the one feature where users read each other's data, so it is the one
place where per-user isolation had to be reasoned about rather than copied.

The policy on `circle_members` needs to answer "is the caller a member of this
circle?", which means querying `circle_members` from inside the policy governing
`circle_members`. Postgres calls that infinite recursion and refuses. The fix is
`is_circle_member()`
([`data/functions/is_circle_member.sql`](../data/functions/is_circle_member.sql)),
a `security definer` helper doing that one scoped lookup as its owner so every
policy above it stays flat.

That helper is also the trade-off: a `security definer` function bypasses RLS by
design, so each one is a small audit surface I have chosen to accept. I keep them
few, narrowly scoped, and covered by
[`data/tests/circles_rls.sql`](../data/tests/circles_rls.sql), which runs inside a
transaction and rolls back. Full model in [`DEEP_DIVE.md`](DEEP_DIVE.md) §3.

---

## 5. Something I built and deleted the same day

While building the chat, I shipped voice input twice.

The first version was dictation: a `useDictation` hook wrapping the browser's Web
Speech API, plus its TypeScript definitions. Speech became text, text landed in
the input, the user pressed send. It worked.

I deleted it anyway, 151 lines (`b902f41`), and replaced it with actual voice
messages (`8775147`): the recorder captures the platform format, re-encodes to
mono 16 kHz WAV which is Gemini's native input, discards clips under 300 ms, and
sends the audio. The model transcribes and acts on it in one pass. A sent message
renders as a play and pause bubble with a waveform and a duration.

**The reason was product, not engineering.** Dictation is a different keyboard;
voice messages are a different medium. Every early tester described the chat as
"like texting someone", and the surface leans into that: cards instead of walls
of text, tappable disambiguation chips, a calm persona. Inside that metaphor,
sending a voice note is the natural gesture and dictating into a text box is not.
The technical gain, one model pass instead of a transcription step plus a text
parse, came free but is not why I did it.

**On the timeline, honestly:** all of this happened on 1 June 2026. I built
dictation, saw it was the wrong metaphor, and replaced it in the same session. It
was never in front of a user. This is not a story about learning from feedback
over weeks. It is about noticing, while building, that a working feature was
answering the wrong question.

Design rationale for the surface as it stands is in
[`design/chat-design.md`](../design/chat-design.md).

---

## 6. Testing my own assumptions

I tested Strive on people twice, in two very different ways, and the contrast is
the most useful thing in this document.

### 6.1 Real people, no method

I sent friends the link and collected what came back in chat messages. No test
plan, no fixed questions, no tasks, no scoring, no write-up. One-shot sessions.

It still worked, because real users find real problems. Almost everything they
raised was about **comprehension**: parts of the app obvious to me were not
obvious to them. That is the blind spot a solo builder cannot cover alone, and
thirty minutes of someone else's confusion exposed more of it than any amount of
re-reading my own screens. Two things shipped as a direct result: the in-app
feedback form (28 June 2026) and the Help page (6 July 2026).

### 6.2 Simulated people, full method

In July I ran a structured usability study on the live app: three participants, a
written protocol, success bars fixed **before** analysis, Nielsen severity
ratings, and a findings document with a decision attached to every item, all in
[`design/research/2026-07-synthetic-beta/`](../design/research/2026-07-synthetic-beta/).

**The participants were AI-simulated, not people.** I repeat that everywhere the
study is mentioned, because a finding from a simulated user is a hypothesis about
a real one and nothing more.

**The positioning survived contact.** Three of three reconstructed "momentum over
streaks" without being told, two of three from the interface alone, from the word
"Steady" and the fraction "3/7". Three of three logged a ritual by typing a plain
sentence on the first attempt and none looked for a manual log button. The two
bets the product rests on held up.

**The platform's severity ratings did not.** Of five insights, two were rated
High. I checked both against the code and a live reproduction, and both were
overstated. The first claimed the chat never confirms what it logged, when
[`components/chat/cards/log-card.tsx`](../components/chat/cards/log-card.tsx)
renders a confirmation card with the ritual name, a momentum meter and an Undo.
The second claimed a saved ritual does not appear, when a live repro shows it
does. Both described states the agents had not waited long enough to see, because
synthetic agents do not wait for asynchronous results. The real residue was
smaller and different: nothing acknowledges the gap between an action and its
result. That became [LUI-143](https://linear.app/luidgi-dev/issue/LUI-143).

> **Portfolio-ready.** A generated severity rating is a lead, not a verdict. Two
> of two "High" findings did not survive a code read and a two-minute
> reproduction, and the real issue was a third thing neither of them named.

---

## 7. Where it actually stands

The honest version, because the alternative is dressing up small numbers.

### Usage: I have had testers, not users

Thirteen accounts exist. Six are mine or machine-generated: my own two, a dev
account, the public demo account and two seeded test personas. The demo account's
483 logs are written by the nightly reset job and tagged `auto`, so they are
fixtures, not usage.

That leaves **seven genuine external sign-ups**. Four created a ritual. **One
ever logged anything, four times**, between 30 June and 11 August. Nobody churned
after a month of use, because nobody reached a month of use.

My own usage is the only sustained data there is: 293 logs across 15 rituals over
94 distinct days, from 20 May to 19 September. Twenty-six went through the AI
chat rather than a tap, about 9 percent. I quote that because it is unflattering
and I would rather state it than the figure I would have guessed.

**The likeliest explanation is not a product failure, and it belongs first.**
These people opened Strive because I asked them to, or to be kind. Most were not
in the market for a habit tracker. Someone who does not want what a product does
will not be rescued by better onboarding, and reading their drop-off as a design
verdict would flatter me twice: once by assuming they wanted it, again by
assuming the fix is mine to make.

**There is real friction too, and I can name it.** Getting in means clicking a
button labelled "Get early access" rather than "Sign up", waiting for a
confirmation email that has landed in spam at least once, installing a PWA
because there is no app store listing, and reading a landing page that exists
only in English. Each is small; stacked in front of a favour, they are enough to
end it. The behaviour fits: most people who wanted to see Strive used the demo
account instead of signing up, which is what happens when the door is heavier
than the room.

**And the demo account is where I cannot follow them.** Its logs carry the same
`auto` tag as the reset fixtures and the nightly job wipes the state, so I have
no idea how many of those 483 logs were someone trying the product. The surface
real people actually touched is the one I made unreadable, and that is a
limitation I built rather than inherited.

**So the honest conclusion is that I have never had a user.** I have had testers,
which is different: people who arrived because of me rather than because of the
problem. Nothing here can say whether Strive solves something for anyone, because
the sample was never a market. The number I am missing is not a retention rate.
It is one person who found Strive on their own and stayed because they wanted
what it does. I have zero of those, and I know why: I never tried to find one.

### Reliability: one error since Sentry went in

Sentry has run since 27 June 2026 and has captured **exactly one distinct issue,
across 4 events, all in production** on release `9bedeea`, first seen 26 August
2026.

It was not an application bug. The server render of the rituals page failed with
PostgREST `PGRST303`, "JWT issued at future": PostgREST rejected the access token
because its `iat` claim was ahead of PostgREST's own clock, a clock disagreement
between the Supabase Auth issuer and the PostgREST validator. Nothing in this
repository signs or validates that token, so there was no code-side fix. I
diagnosed it, wrote up the root cause and closed it as not fixable here.

I prefer quoting that to quoting zero. "One issue in three months, root-caused to
infrastructure clock skew" says something about the code. "Zero errors" would
only say something about how many people are using it.

### Reach: small, but genuinely not my friends

Visitors have come from the United States, Brazil, Japan, Norway and Canada among
others, with one Brazilian session referred by ChatGPT. The numbers are small and
there has been no marketing spend, no launch post, nothing beyond sharing the
link with people I know. Those people are not in Brazil or Japan, so something
reached those visitors on its own.

One gap: Vercel Analytics on the free plan keeps 30 days, so the traffic from the
beta launch day, by far the highest the app has seen, is gone. That is a lesson
in its own right, in section 8.

---

## 8. What I learned

**Product decisions drove the technical ones, not the reverse.** Momentum is a
Postgres view rather than a stored counter because "never resets to zero" has to
stay true after a retroactive edit. The AI phrases numbers but never computes
them because a tracker that invents your history is worthless. The rolling window
exists because the calendar reset contradicted the product's reason for existing.
None of these started as an engineering preference.

**Writing decisions down as I made them is why this document exists.** The PR
bodies, folder READMEs and design notes were written at the moment of the
decision, not reconstructed later. Six months on I can quote the exact failure
mode of momentum v1 because I wrote it into PR #60 while fixing it. The
alternative is a vague memory of "I improved momentum at some point", which is
worth nothing in a conversation and nothing to my future self.

**Shipping beat waiting for the right architecture.** The app is live, it is in
daily use, and its seams are documented rather than resolved. The trade-off table
in [`DEEP_DIVE.md`](DEEP_DIVE.md) §5 names each one and says what would change at
scale. I would rather defend a known seam than a feature that never shipped.

**AI was most useful where I argued with it.** The models helped most in the
wireframing and design sessions before the code, precisely because I treated the
first proposal as a draft to push against. Several screens exist in their current
form because I rejected three versions and said why. Used the other way,
accepting what comes back, it would have produced a generic app with none of the
positioning work from section 1 surviving.

### What I would do differently

**I built the app I wanted, which is both why it is coherent and its main risk.**
Every opinionated choice traces back to how I personally work. That is what gives
the product a spine. It is also an assumption I never tested: my idea of the best
habit tracker is unverified for anyone but me, and section 7 is where that shows.

The beta feedback did get a real response. The feedback form shipped 28 June, and
on 6 July I landed both the Help page and
[PR #93](https://github.com/luidgi-dev/strive/pull/93), covering an RGAA and WCAG
contrast audit, missing close buttons on modals, and performance fixes from a
Lighthouse run. That is design work, not paperwork. But the **comprehension**
findings specifically got the Help page. Adding documentation is the classic
answer to a design problem, and I reached for it even though "do not over-explain
the app" was an explicit product goal. Probably the right call for launch. Still
not a substitute for the interfaces it explains, and I have not gone back to fix
those.

**I applied more rigour to simulated users than to real ones.** The synthetic
study had a protocol, pre-registered bars, a severity scale and a decision
attached to every finding. The real-user test, which came first, was a link sent
to friends and reactions collected in chat. No plan, no fixed questions, no
numbers, no write-up. That is backwards. The rehearsal got treated as the
performance, and the only sessions with real people got no structure at all. The
same two hours of preparation spent on the friends test would have left me with
data instead of recollections.

**Too few tests, in the wrong places.** Ten files and 1 177 lines, all on pure
logic: dates, momentum derivation, ritual matching, scheduling. The coverage is
real where it exists, but momentum v1 was wrong for twelve days and one test
asserting "a single log after a two-week gap must not be Strong" would have
caught it before it shipped. The gap is not a missing test runner. It is that I
wrote tests after deciding something was tricky, instead of using them to find
out whether it was.

**The migration system works for exactly one person.** There is no
`supabase/migrations/`, only a home-made `migrate.py` that also replays seeds
containing test data, so it cannot be pointed at production. The consequence
showed up in PR #60: shipping it needed a manual `psql` step on each environment,
before the app rolled out, in the right order, by hand. That holds while I am the
only one deploying. It does not survive a second person or a bad evening.

**Measure while the window is open.** Two versions of the same mistake. Vercel
Analytics on the free plan keeps 30 days, so the beta launch day, the highest
traffic Strive has had, exists only in my memory because I went looking in
September. And the demo account, the main way real people saw Strive, is the one
surface with no measurement at all: its logs carry the same `auto` tag as the
reset fixtures and the nightly job wipes the state, so I cannot tell what a
visitor tried before leaving. The place with the most real behaviour is the place
I made unreadable.

**Keep a running lessons file, not a retrospective.** This is the section I most
wish I had been writing all along. I will hit these same problems again in a few
months on another project, and a document written once at the end is already a
reconstruction. From here this section is append-only: a dated line goes in when
I learn something, not when I remember it.

---

## Notes on this document

- Passages marked **Portfolio-ready** are written to be lifted into the portfolio
  site with minimal rewriting: short, specific, first person.
- There is deliberately no roadmap section. Everything the older docs listed as
  "next" has shipped, and a backlog is interesting in conversation and irrelevant
  to a visitor.
- Every commit hash, PR number, file path and figure here was verified against
  the repository before being written. A claim that cannot survive a follow-up
  question should be deleted rather than softened.

## Links

- **How the system works:** [`DEEP_DIVE.md`](DEEP_DIVE.md)
- **How it is pitched:** [`PITCH.md`](PITCH.md)
- **Product spec:** [`PRODUCT_SPEC.md`](PRODUCT_SPEC.md)
- **The study:** [`../design/research/2026-07-synthetic-beta/`](../design/research/2026-07-synthetic-beta/)
- **Live app:** [striveapp.cc](https://www.striveapp.cc)
