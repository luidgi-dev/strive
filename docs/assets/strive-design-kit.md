# Strive: Design Kit for AI Slide Tools (self-contained)

> Paste this entire file into Claude design / Gamma / Lovable / Figma AI as
> context, then attach the logo and screenshots listed in §8. It is
> self-contained: the tool needs nothing else (no repo, no links) to reproduce
> the Strive look. For exact colors, the tool can also sample directly from the
> attached screenshots.

---

## 0. One-paragraph brief

Strive is a calm, AI-first habit tracker. Its visual identity is **quiet
luxury**: Linear-grade engineering precision meets meditation-app calm. The look
is **OLED near-black, near-monochrome**, with generous negative space and a
**single restrained green accent** used only to signal progress. No decorative
color, no gradients-as-decoration, no bright palettes, no emoji, no hustle
energy. Typography is confident, bold, and tight. Every slide: one idea, lots of
space.

The single most important rule for matching the brand: **the UI is almost
grayscale. Color appears only to communicate status (on-track green, caution
amber, missed red), never as decoration.** Tools tend to over-colorize; resist
that.

---

## 1. Voice and words (so copy sounds like Strive)

- **Tone:** calm, precise, confident, reflective. Never guilt, never hype.
- **Use these terms:** Ritual, Rhythm (the daily home screen), Momentum
  (progress that decays slowly, never resets), The Arc (12-week consistency
  view), Consistency, Rest, Log.
- **The enemy word**, used only to name the problem: *streak*.
- **Never use:** hustle, grind, crush, beast mode, gamify, level up, "Done!!",
  multiple exclamation marks, or emoji that carry meaning.
- Precision over enthusiasm: "4 of 5 this week", not "Amazing job!".

---

## 2. Color

The product is deliberately near-monochrome. Color is reserved for **status**,
never decoration. Background is **OLED-dark by default** (use the dark palette
for the deck). Values are given in OKLCH (exact, from the product mockups) with
HSL equivalents; convert to hex in your tool's color picker, or sample the
screenshots.

### 2.1 Dark palette (deck default)

| Role | OKLCH | ~HSL |
|---|---|---|
| Page background (OLED) | `oklch(0.18 0.006 200)` | `hsl(220 16% 7%)` |
| Card / surface | `oklch(0.22 0.006 200)` | `hsl(220 14% 10%)` |
| Elevated surface | `oklch(0.26 0.006 200)` | `hsl(220 12% 15%)` |
| Text (primary) | `oklch(0.86 0.006 200)` | `hsl(40 10% 90%)` |
| Text (muted) | `oklch(0.62 0.01 200)` | `hsl(220 6% 60%)` |
| Hairline border | `oklch(1 0 0 / 0.07)` | white at 7% opacity |
| **Accent / on-track (the only color)** | `oklch(0.62 0.12 154)` | `hsl(155 30% 42%)` |
| Caution (amber) | `oklch(0.68 0.14 72)` | `hsl(36 40% 50%)` |
| Missed (red) | `oklch(0.62 0.17 27)` | `hsl(10 35% 52%)` |

### 2.2 Light palette (only if a slide must be light)

| Role | OKLCH |
|---|---|
| Background | `oklch(0.98 0.004 200)` |
| Card | `oklch(1 0 0)` (white) |
| Text (primary) | `oklch(0.28 0.005 200)` |
| Text (muted) | `oklch(0.55 0.01 200)` |
| Border | `oklch(0.92 0.002 200)` |

Momentum / caution / missed are the same in both modes.

### 2.3 Color rules

- Base everything in the neutral grays above. Add the **green accent at most 2 to
  3 times per slide** (a keyword, a single dot, one CTA).
- Caution amber and missed red appear **only** on status data (progress dots,
  partial/missed states), never on text or backgrounds for emphasis.
- On dark, prefer **hairline borders** (white 7%) over drop shadows for
  separation. Depth comes from subtle surface steps (0.18 to 0.22 to 0.26), not
  from glow.
- Brand-system note: the app's canonical token set lists a teal primary
  (`hsl(168 30% 52%)`). The shipped UI and all screenshots use the **green**
  accent above; match the green so the deck and the screenshots agree.

---

## 3. Typography

- **Headings:** Satoshi Bold (canonical). If unavailable, use **Sora** (600/700),
  the free font the real mockups ship with, so the deck matches the screenshots.
  Last-resort: Clash Display or General Sans.
- **Body / UI:** **DM Sans** (400/500). Last-resort: Inter.
- **Tracking:** headings tight (`-0.025em`); captions/eyebrows uppercase with
  wide tracking (`0.1em`) and muted color.
- **Scale:** Display 48px · H1 36px · H2 30px · H3 20px · Body 16px · Small 14px ·
  Caption 12px.
- Headings are bold and quiet at the same time: large size, tight spacing, no
  decoration. Eyebrows (small uppercase labels) introduce sections.

---

## 4. Layout, shape, motion

- **Grid:** 4px base unit. Negative space is a feature: 48 to 64px between major
  blocks. Let content breathe; never fill the slide.
- **Radius:** ~6px on small elements, soft (`~0.75rem`) on cards. Understated,
  not bubbly, not sharp.
- **Cards:** dark surface + hairline border + soft radius + generous padding
  (~24px). Minimal or no shadow on dark.
- **Composition:** one idea per slide, large type, asymmetry and whitespace over
  dense grids. Left-aligned text reads calmer than centered blocks.
- **Motion** (if the tool animates): a single slow fade, `ease-out`, 200 to
  500ms. Motion should feel inevitable, never decorative.

---

## 5. Product imagery (the screenshots)

- The product shots are **tall portrait phone screens** in dark mode, with a
  hairline border. Place them flat on the OLED background, optionally inside a
  thin rounded bezel.
- Do **not** add salesy 3D device frames, heavy drop shadows, reflections, or
  tilts. Keep them flat, calm, and centered or grid-aligned.
- One caption per screenshot, short, muted, below the image.

---

## 6. Signature components (reproduce these)

These are the real Strive components, distilled from the product. The attached
`rhythm-dark.png` and `ai-chat-v2-dark.png` show them; use these specs when a
slide **redraws** a UI element instead of placing a screenshot. Token names refer
to §2 and §3.

### Ritual card (the signature element)

- Surface: card background, 1px hairline border, radius ~17px, padding 20px (22px
  at the bottom). Vertical stack, ~18px gap.
- **Logged-today state:** do not add color. The border simply brightens to a soft
  off-white (~22% of the text color). Calm confirmation, never a green flood.
- Top row (icon · info · score · log button):
  - **Icon tile:** 40×40, radius ~10px, elevated-surface fill, a centered emoji or
    line icon (~20px) in a muted tone.
  - **Name:** heading font, weight 600, 15px, tight tracking.
  - **Meta line:** 11px muted text, an inline 6px **status dot** + a status word:
    *Strong* (green), *Steady* (amber), *Resting* (muted). Color lives only here
    and on the bar.
  - **Score:** heading font, weight 700, 24px (e.g. `4`) with a `/5` denominator
    in body font, muted, 14px.
  - **Quick-log button:** 32px circle, transparent, 1.5px muted ring, small check
    or plus icon (~15px).
- **Progress bar:** 5px tall, full width, pill ends; track = muted at ~14%, fill
  colored by status (green / amber / red), width = progress toward the weekly
  target.

### Status system (the only place color lives)

| State | Dot + bar color | Word |
|---|---|---|
| On track | green (momentum) | Strong |
| Behind | amber (caution) | Steady |
| Missed | red (missed) | Missed |
| Rest / none | muted gray | Resting |

### AI chat

- **User bubble:** right-aligned, fill = text color at ~10% (a faint gray), radius
  18px with the bottom-right corner tucked to 4px, padding 8×12, 13px.
- **AI bubble:** left-aligned, fill = elevated surface, radius 18px with the
  bottom-left corner tucked to 4px, same metrics.
- **Output card** (when the AI logs or shows data): card surface + hairline
  border, radius ~22px, a small muted header with a 14px icon, then rows of
  `name … category` with an optional mini momentum meter (64px track, 6px tall).
- **Suggestion chips:** pill, transparent, 1px border (text at ~25%), full radius,
  padding 6×12, 12px medium weight.
- **Input bar:** hairline top border on card background; the field sits on an
  elevated-surface pill (radius ~22px); the **send** button is a 36px circle
  filled with the text color (its icon inverts to the background color); the mic
  button is muted at 60% opacity.

### Bottom navigation

- 64px tall, hairline top border, translucent blurred background. Three items:
  **Rhythm · Rituals · Circles**, each a 20px line icon over an 11px label; the
  active item uses the text color, the rest are muted.

### AI FAB

- A 52px circle pinned bottom-right above the nav, light (near-white) fill with a
  dark sparkle glyph: the single "talk to the AI" affordance.

---

## 7. The deck (content and structure, 8 slides)

Investor angle, OLED dark. Use this copy verbatim or tighten it; never add hype.

1. **Cover.** Wordmark "Strive" + tagline *"Consistency over intensity."* Minimal,
   OLED dark, huge whitespace.
2. **Problem.** *"You missed one day. The streak resets. You quit."* One sentence.
   Subline (muted): the retention mechanic is the churn mechanic.
3. **Solution.** *"Momentum that decays slowly, never resets to zero."* Plus one
   product screenshot (Rhythm).
4. **Product.** 2 to 3 screenshots, one caption each: Rhythm ("today's rituals at
   a glance"), The Arc ("twelve weeks of consistency"), AI chat ("log in your own
   words").
5. **Three pillars.** Flexible targets ("miss a day, still win the week") ·
   Zero-friction logging ("one tap, or just tell the AI") · Momentum, not streaks
   ("progress that decays slowly, never resets to zero").
6. **Philosophy.** *"We do not worship hustle. Lasting progress grows from calm,
   not pressure."* Large type, generous whitespace, no image.
7. **Roadmap** (optional). Four calm phases on a minimal horizontal line:
   Foundation · Core experience · AI & Mobile · Circles (social). Optional
   Circles screenshot.
8. **Closing.** *"Find your rhythm."* Link to striveapp.cc · "Made by Luidgi".

---

## 8. Do / Don't

**Do:** OLED near-black, monochrome base + one green accent, tight bold headings,
huge whitespace, short copy, hairline borders, flat screenshots.

**Don't:** bright or multicolor palettes, gradients as decoration, emoji,
exclamation marks, stock photos, hustle words, more than one accent color,
cramped or busy slides, 3D device mockups.

---

## 9. Attach these assets alongside this brief

Upload these to the tool in the same session (filenames as exported):

- **Logo:** `strive-app-dark.svg` (for dark slides), `strive-app-light.svg`,
  raster fallback `strive-logo.jpeg`.
- **Screenshots (dark):** `rhythm-dark.png`, `the-arc-dark.png`,
  `ai-chat-v2-dark.png`, `circle-detail-dark.png`.

---

## 10. Ready-to-paste generation instruction

> Using the Strive design kit above (colors, type, layout, voice) and the
> attached logo and screenshots, generate an 8-slide "quiet luxury" pitch deck.
> OLED near-black background, near-monochrome with a single green accent used only
> for emphasis or status, Satoshi/Sora bold tight headings, DM Sans body, generous
> whitespace, one idea per slide. Calm and confident, no hype, no emoji. Reuse the
> component styles in §6, use the slide content in §7, and place the attached
> screenshots on slides 3, 4, and 7.
