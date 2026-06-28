# Strive: Presentation Kit

> Single source of truth for every level of pitch, from a one-line hook to a
> three-minute oral script. Pull from here for slide decks, calls, applications,
> and demos. Versioned in Git like any other doc.

**Default voice:** investor ("why this app?"), with a user-facing variant at
each level. A stack-complete technical variant is also provided for the
one-liner. Spoken scripts (one-liner, 30s, 2 to 3 min) ship in English and French.

**Status:** v1.0 (2026-06-28)
**Maintainer:** Luidgi

Voice and terminology are bound by [`UX_WRITING.md`](UX_WRITING.md): calm,
precise, never hustle or guilt language. Canonical terms: **Ritual**,
**Rhythm**, **Momentum**, **The Arc**, **Consistency**, **Rest**, **Log**.
French copy follows `messages/fr.json` (Rituel, Momentum, régularité, rythme).
"Streaks" / "séries" appear here only as the thing Strive replaces.

---

## How to use this kit

Pick a row for depth, a column for audience.

| Level | Investor angle ("why this app?") | User angle ("why you'd use it") |
|---|---|---|
| **One-liner** (<15 words) | §1, investor / non-technical | §1, user |
| **30 seconds** (oral) | §2, investor script | §2, user script |
| **2 to 3 minutes** (oral) | §3, structured pitch | adapt §3 (drop the architecture section) |
| **Deep dive** (doc) | [`DEEP_DIVE.md`](DEEP_DIVE.md) | n/a |
| **Deck** (8 slides) | §4 outline + §5 generation prompt | adapt §4 |
| **Demo** (60 to 90s) | §6 talking points | §6 talking points |

The messaging spine below is the same at every level; only the depth changes.

### The spine (memorize this)

- **Problem.** Habit apps run on streaks. Miss one day, the streak resets to
  zero, and that guilt is the single biggest reason people quit the very app
  meant to help them. The retention mechanic *is* the churn mechanic.
- **Solution.** Strive replaces streaks with **flexible consistency**: weekly
  targets instead of daily streaks (miss a day, still win the week), and
  **momentum** that decays slowly and never resets to zero. A calm coach, not a
  drill sergeant.
- **Edge.** Logging costs one tap, or one sentence to the AI. Rest is treated as
  part of the practice, not a failure.
- **Why it matters.** A calmer model is both a better product and a
  differentiated brand in a market burnt out on hustle and guilt.

---

## 1. One-liner

A single sentence (< 15 words) that says what Strive is and why it matters.

**Investor / non-technical (default)**
> EN: Strive replaces guilt-inducing streaks with momentum that never resets to zero.
>
> FR: Strive remplace les séries culpabilisantes par un momentum qui ne retombe jamais à zéro.

**Alternate investor hook**
> EN: A habit tracker where one missed day never makes you quit.
>
> FR: Un tracker d'habitudes où un jour manqué ne vous fait jamais abandonner.

**User-facing**
> EN: Build habits without the guilt: miss a day, still win the week.
>
> FR: Construisez des habitudes sans culpabilité : un jour manqué, la semaine reste gagnable.

**Technical** (longer on purpose, covers the whole stack)
> EN: An AI-first ritual-tracking PWA (Next.js 16 with Server Components, Supabase Postgres + RLS, Vercel AI SDK + Gemini) where momentum is a computed Postgres view, not a stored streak counter.
>
> FR: Une PWA de suivi de rituels AI-first (Next.js 16 avec Server Components, Supabase Postgres + RLS, Vercel AI SDK + Gemini) où le momentum est une vue Postgres calculée, pas un compteur de série stocké.

---

## 2. 30-second pitch (oral)

Problem, then solution, then value, in plain language. Rehearse and time it; aim
for ~80 words, ~30 seconds at a calm pace.

### Investor version, v1.0 (2026-06-28)

**EN**

> Most habit apps run on streaks. Miss one day and the streak resets to zero,
> and that guilt is the number-one reason people quit the very app meant to help
> them. Strive fixes the mechanic. You set weekly targets, not daily streaks, so
> a missed day still leaves the week winnable. Progress shows up as momentum that
> decays slowly and never resets. Logging takes one tap, or one sentence to the
> AI. It's a calmer model for a burnt-out market, and a brand people stay with.

**FR**

> La plupart des apps d'habitudes reposent sur les séries. Vous ratez un jour, la
> série retombe à zéro, et cette culpabilité est la première raison qui pousse les
> gens à quitter l'app censée les aider. Strive corrige le mécanisme. Vous fixez
> des objectifs hebdomadaires, pas des séries quotidiennes : un jour manqué laisse
> la semaine encore gagnable. La progression devient un momentum qui décline
> lentement et ne retombe jamais à zéro. Enregistrer prend un tap, ou une phrase
> dite à l'IA. Un modèle plus calme pour un marché épuisé, et une marque qu'on garde.

### User version, v1.0 (2026-06-28)

**EN**

> You know the feeling: you miss one day, your streak resets to zero, and you
> quietly give up. Strive is built the opposite way. You set a weekly target, so
> missing a day still leaves the week within reach. Your progress is momentum
> that fades slowly and never drops to zero; rest is part of the practice, not a
> failure. Log a ritual in one tap, or just tell the AI what you did. No guilt,
> no drill sergeant. Just your own rhythm.

**FR**

> Vous connaissez ce sentiment : vous ratez un jour, votre série retombe à zéro,
> et vous lâchez doucement. Strive est pensé à l'inverse. Vous fixez un objectif
> hebdomadaire : rater un jour laisse la semaine à portée. Votre progression est
> un momentum qui s'estompe lentement et ne tombe jamais à zéro ; le repos fait
> partie de la pratique, pas d'un échec. Enregistrez un rituel d'un tap, ou dites
> simplement à l'IA ce que vous avez fait. Pas de culpabilité, pas de coach
> autoritaire. Juste votre propre rythme.

---

## 3. 2 to 3 minute structured pitch (oral)

Investor-primary. Covers product reasoning, architecture, key decisions, and
what's next. ~400 words, ~2.5 minutes. For a user audience, keep A and D and
drop B and C.

### v1.0 (2026-06-28)

**EN**

**A. The problem and the product reasoning, why flexible consistency over streaks.**

> Habit and wellness apps are a huge category, and almost all of them are built
> on the streak. It's a great hook and a terrible retention mechanic: the moment
> you miss a day, the counter resets to zero, you feel like you failed, and you
> churn. The thing designed to keep you engaged is the thing that makes you quit.
>
> Strive starts from the opposite belief, that lasting progress grows from calm,
> not pressure. So instead of daily streaks, you set a **weekly target**: miss a
> day and the week is still winnable. Instead of a streak counter, you get
> **momentum**, a soft signal that decays slowly and never resets to zero. And a
> day off is **rest**, part of the practice, not a failure. It's a calmer model
> for a market that's burnt out on hustle.

**B. Architecture overview, and why these choices.**

> It's a PWA built on Next.js 16 and Supabase Postgres, with AI through the
> Vercel AI SDK on Gemini. Three deliberate choices. **Next.js App Router with
> Server Components** keeps data fetching on the server, close to the database,
> which matters for a tracker that has to feel instant. **Supabase** gives me
> Postgres, auth, and row-level security in one place: every table enforces
> per-user isolation in the database itself, not in app code. And **AI is a
> feature, not the foundation**: it removes friction from logging, but the app is
> fully usable without it.

**C. The heart of the product, and the decisions that protect it.**

> Two things make Strive what it is. First, a calm **AI companion**: the chat
> logs a ritual from plain language, so tracking costs one sentence instead of a
> form, and Insights turn your own history into personal reflections. The point
> is to let you focus on progressing at your rhythm, not on data entry. Second, a
> **quiet-luxury experience**: the Rhythm screen is a quick glance at your day,
> the cards are clean and uncluttered, and Circles let you lean on close ones
> without competition.
>
> A few technical decisions keep that honest. Momentum is computed from your
> logs, never stored, so it can't drift. The AI is split so it never invents your
> numbers: the chat calls tools to write real data, while Insights only phrase
> facts the backend already computed. And every row is isolated per user by
> row-level security, in the database itself. The trade-off is more backend logic
> up front, in exchange for an experience and data I can trust.

**D. Impact and what's next.**

> Strive is live, and it's both a real product and a portfolio piece: proof I can
> take an opinionated idea from philosophy to shipped, secure software. Next:
> social Circles for gentle accountability, smarter AI reflections, and richer
> momentum visualizations. The bet stays the same, consistency over intensity.

**FR**

**A. Le problème et le raisonnement produit, pourquoi la régularité flexible plutôt que les séries.**

> Les apps d'habitudes et de bien-être forment une catégorie immense, et presque
> toutes reposent sur la série. C'est un excellent hameçon et un terrible
> mécanisme de rétention : dès que vous ratez un jour, le compteur retombe à
> zéro, vous avez l'impression d'avoir échoué, et vous partez. Ce qui est censé
> vous engager est précisément ce qui vous fait abandonner.
>
> Strive part de la conviction inverse : un progrès durable naît du calme, pas de
> la pression. Donc, au lieu de séries quotidiennes, vous fixez un **objectif
> hebdomadaire** : un jour manqué laisse la semaine gagnable. Au lieu d'un
> compteur de série, vous avez le **momentum**, un signal doux qui décline
> lentement et ne retombe jamais à zéro. Et un jour sans est un **repos**, une
> partie de la pratique, pas un échec. Un modèle plus calme pour un marché épuisé
> par la course à la performance.

**B. Vue d'ensemble de l'architecture, et pourquoi ces choix.**

> C'est une PWA bâtie sur Next.js 16 et Supabase Postgres, avec de l'IA via le
> Vercel AI SDK sur Gemini. Trois choix délibérés. **Le App Router de Next.js
> avec les Server Components** garde la récupération des données côté serveur, au
> plus près de la base, ce qui compte pour un tracker qui doit sembler instantané.
> **Supabase** réunit Postgres, l'authentification et le row-level security au
> même endroit : chaque table impose l'isolation par utilisateur dans la base
> elle-même, pas dans le code applicatif. Et **l'IA est une fonctionnalité, pas
> la fondation** : elle enlève la friction de l'enregistrement, mais l'app reste
> pleinement utilisable sans elle.

**C. Le cœur du produit, et les décisions qui le protègent.**

> Deux choses font Strive. D'abord, un **compagnon IA** apaisé : le chat
> enregistre un rituel en langage naturel, donc suivre coûte une phrase au lieu
> d'un formulaire, et les Insights transforment votre propre historique en
> réflexions personnelles. L'idée est de vous laisser vous concentrer sur votre
> progression, à votre rythme, pas sur la saisie. Ensuite, une **expérience quiet
> luxury** : l'écran Rhythm donne un aperçu de la journée en un coup d'œil, les
> cartes sont nettes et épurées, et les Cercles permettent de s'appuyer sur ses
> proches, sans compétition.
>
> Quelques décisions techniques garantissent tout ça. Le momentum est calculé à
> partir de vos journaux, jamais stocké, donc il ne peut pas se désynchroniser.
> L'IA est séparée pour ne jamais inventer vos chiffres : le chat appelle des
> outils pour écrire de vraies données, tandis que les Insights se contentent de
> formuler des faits déjà calculés par le backend. Et chaque ligne est isolée par
> utilisateur via le row-level security, dans la base elle-même. Le compromis :
> plus de logique backend en amont, en échange d'une expérience et de données
> auxquelles je peux me fier.

**D. Impact et la suite.**

> Strive est en ligne, et c'est à la fois un vrai produit et une pièce de
> portfolio : la preuve que je sais mener une idée affirmée de la philosophie
> jusqu'à un logiciel livré et sécurisé. La suite : les Cercles sociaux pour une
> émulation douce, des réflexions IA plus fines, et des visualisations du momentum
> plus riches. Le pari reste le même, la régularité plutôt que l'intensité.

---

## 4. Slide outline (8 slides max)

Investor angle, quiet-luxury / OLED-dark. Mirrors the landing page. One idea per
slide, minimal copy. Use this as the skeleton for §5's generation prompt.

1. **Cover.** Logo + "Strive" + tagline *"Consistency over intensity."* Minimal,
   OLED dark.
2. **Problem.** *"You missed one day. The streak resets. You quit."* The
   retention mechanic is the churn mechanic.
3. **Solution.** *"Momentum that decays slowly, never resets to zero."* One hero
   screenshot (Rhythm).
4. **Product.** 2 to 3 screenshots: Rhythm, The Arc, AI chat. One caption each.
5. **Three pillars.** Flexible targets, Zero-friction logging, Momentum not
   streaks (verbatim from the landing).
6. **Philosophy.** *"We do not worship hustle. Lasting progress grows from calm,
   not pressure."* Large type, whitespace.
7. **Roadmap** (optional). Foundation, Core experience, AI & Mobile, Circles
   (social).
8. **Closing.** *"Find your rhythm."* Link to [striveapp.cc](https://www.striveapp.cc),
   Made by Luidgi, GitHub.

---

## 5. Pitch deck, generation prompt (Gamma / Claude / Lovable / Figma)

Paste the block below into Gamma.app (or Claude/Lovable) for a first draft, then
refine for quiet-luxury polish. Angle: investor. Store the exported PDF in
[`docs/assets/`](assets/).

> For a deck that actually looks like Strive (the prompt alone tends to come out
> too colorful), paste the self-contained **[`assets/strive-design-kit.md`](assets/strive-design-kit.md)**
> instead, then attach the logo and screenshots it lists. It carries the full
> brand: OLED near-monochrome palette, type, layout rules, slide content, and a
> ready-to-paste instruction. Best for Claude design / Figma AI.

```text
Create a minimal, "quiet luxury" pitch deck for a product called Strive, an
AI-first habit tracker. 8 slides max. Aesthetic: OLED-dark background, lots of
whitespace, one elegant serif/heading + one clean sans, a single restrained
accent color, large typography, one idea per slide. Tone: calm, confident, no
hustle or hype language, no emoji. Audience: investors and the dev community.
Apply the brand kit attached in this conversation (logo, colors, fonts); keep
the accent color restrained, 2 to 3 highlights per slide.

Narrative spine: Most habit apps run on streaks; miss one day and the streak
resets to zero, and that guilt is the #1 reason people quit. Strive replaces
streaks with "flexible consistency": weekly targets (miss a day, still win the
week) and "momentum" that decays slowly and never resets to zero. A calm coach,
not a drill sergeant. AI removes friction from logging (one tap, or one sentence).

Slides:
1. Cover: "Strive" + tagline "Consistency over intensity." Minimal, OLED dark.
2. The Problem: "You missed one day. The streak resets. You quit." One sentence.
3. The Solution: "Momentum that decays slowly, never resets to zero." + space
   for one app screenshot.
4. Product: 3 screenshot placeholders captioned: "Rhythm: today's rituals at a
   glance", "The Arc: twelve weeks of consistency", "AI chat: log in your own words".
5. Three pillars: "Flexible targets: miss a day, still win the week" /
   "Zero-friction logging: one tap, or just tell the AI" / "Momentum, not streaks:
   progress that decays slowly, never resets to zero".
6. Philosophy: "We do not worship hustle. Lasting progress grows from calm, not
   pressure." Large type, generous whitespace.
7. Roadmap: four calm phases, Foundation, Core experience, AI & Mobile, Circles
   (social). Minimal horizontal timeline.
8. Closing: "Find your rhythm." Link to striveapp.cc. "Made by Luidgi."

Do not use the words: hustle, grind, streak (except on slide 2 as the problem),
crush, beast mode, gamify, level up. Keep copy short; if a slide needs a
paragraph, shorten it.
```

### 5.1 Make it branded (context to give the tool)

The prompt sets the words; the items below set the look. Provide them alongside
the prompt so the deck comes out on-brand instead of generic.

1. **Logo.** Upload a repo SVG: `public/strive-app-dark.svg` (for dark slides),
   `public/strive-app-light.svg`, or `public/strive-logo.jpeg`.
2. **Brand colors.** Paste these into the tool's theme / brand-kit color picker.
   Values are HSL, straight from [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) (most
   pickers accept HSL, or convert in-tool):
   - Background (OLED dark): `hsl(220 16% 7%)`
   - Text: `hsl(40 10% 90%)`
   - Card surface: `hsl(220 14% 10%)`
   - Brand accent / CTA: `hsl(168 30% 52%)`
   - Momentum (on track): `hsl(155 30% 42%)`
   - Caution: `hsl(36 40% 50%)`
3. **Fonts.** Headings in **Satoshi Bold** (tight tracking), body in **DM Sans**.
   If Satoshi is unavailable, pair Clash Display / General Sans (headings) with
   Inter (body).
4. **Screenshots.** Three on-brand exports already exist in
   [`../public/wireframes/`](../public/wireframes/), the same visuals the live
   landing uses: `rhythm-dark.png`, `the-arc-dark.png`, `ai-chat-v2-dark.png`
   (light variants too). Drop them into slides 3 and 4 as Rhythm (quick glance of
   the day), The Arc (12-week consistency), and AI chat (logging in plain
   language). A fourth export, `circle-detail-{light,dark}.png`, is available for
   an optional "support" slide (the Circles pillar). These are design mockups,
   not live captures; for maximum credibility, swap in real screenshots from the
   demo account later. Any other screen can be exported from its source in
   [`../design/wireframes/`](../design/wireframes/) (21 screens).
5. **Tool-specific tip.**
   - **Gamma:** build a custom Theme first (logo + the colors and fonts above),
     then run the prompt so every slide inherits the brand.
   - **Claude / Lovable / Figma AI:** attach the logo and screenshots as images
     in the same message as the prompt, and paste the color list for exact values.

---

## 6. Demo resources

The product is **live** at [striveapp.cc](https://www.striveapp.cc) (demo account
with nightly reset; credentials kept out of the repo, ask Luidgi).

**60 to 90s walkthrough, talking points** (open app, log a ritual, see momentum):

1. **Open the app.** Land on **Rhythm**: today's rituals at a glance, calm and
   uncluttered. "This is the whole daily surface, 30 to 60 seconds."
2. **Log a ritual.** One tap to log. Then open the AI chat and type *"ran 5km
   today"*: same log, no forms. "Friction is the enemy of consistency."
3. **See momentum.** Momentum nudges up; it never resets on a miss. Open a ritual
   and show **The Arc**: twelve weeks of consistency, rest days included.
   "Progress you can see over time, without the guilt."

> A short Loom / Screen Studio recording of this flow can live in
> [`docs/assets/`](assets/) once recorded.

---

## 7. Links

- **Technical deep dive:** [`DEEP_DIVE.md`](DEEP_DIVE.md)
- **Architecture:** [`ARCHITECTURE.md`](ARCHITECTURE.md)
- **Product spec:** [`PRODUCT_SPEC.md`](PRODUCT_SPEC.md)
- **Voice & terminology:** [`UX_WRITING.md`](UX_WRITING.md)
- **Brand manifesto (PDF):** [`assets/Strive_Brand_Manifesto.pdf`](assets/Strive_Brand_Manifesto.pdf)
- **Live app:** [striveapp.cc](https://www.striveapp.cc)

---

## Changelog

- **v1.0 (2026-06-28).** Initial kit: one-liner (3 variants, EN + FR), 30s
  scripts (investor + user, EN + FR), 2 to 3 min structured pitch (EN + FR),
  slide outline, deck generation prompt + brand-kit guidance, demo talking points.
