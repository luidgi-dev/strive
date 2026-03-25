# Strive — Design System Documentation

## Aesthetic: Quiet Luxury
[cite_start]Linear.app's engineering precision meets premium meditation-app calm[cite: 2]. [cite_start]Every pixel serves a purpose[cite: 2]. [cite_start]Negative space is a feature, not a gap[cite: 2].

---

## 1. Color System

### Core Palette
[cite_start]All colors must be implemented via CSS custom properties (Tailwind tokens) and never as raw hex values[cite: 31, 32].

| Token | Light Mode (HSL) | Dark Mode (HSL) | Usage |
|---|---|---|---|
| `--background` | [cite_start]40 20% 98% [cite: 7] | [cite_start]220 16% 7% [cite: 40] | Main page background |
| `--foreground` | [cite_start]220 20% 10% [cite: 8] | [cite_start]40 10% 90% [cite: 41] | Primary text content |
| `--card` | [cite_start]40 15% 96% [cite: 14] | [cite_start]220 14% 10% [cite: 43] | Card and surface elements |
| `--primary` | [cite_start]168 28% 38% [cite: 15] | [cite_start]168 30% 52% [cite: 44] | Brand accent, primary CTAs |
| `--secondary` | [cite_start]40 10% 92% [cite: 10] | [cite_start]220 12% 15% [cite: 46] | Secondary UI surfaces |
| `--muted` | [cite_start]40 10% 94% [cite: 12] | [cite_start]220 12% 14% [cite: 50] | Subtle backgrounds/disabled states |
| `--accent` | [cite_start]168 20% 92% [cite: 16] | [cite_start]168 15% 14% [cite: 51] | Subtle highlights and focus |
| `--border` | [cite_start]40 12% 90% [cite: 18] | [cite_start]220 12% 16% [cite: 52] | Dividers and element borders |

### Semantic: Momentum System
[cite_start]Status-driven colors that communicate ritual progress at a glance[cite: 21]. [cite_start]These are for status only, never decoration[cite: 33].

| Token | HSL | Meaning | Usage |
|---|---|---|---|
| `--momentum` | [cite_start]155 30% 42% [cite: 23] | [cite_start]**On Track**: Ritual is progressing well [cite: 24] | Progress bars, success states |
| `--caution` | [cite_start]36 40% 50% [cite: 25] | [cite_start]**Needs Attention**: Behind on target [cite: 28] | Warnings, partial completion |
| `--missed` | [cite_start]10 35% 52% [cite: 27] | [cite_start]**Missed**: No progress recorded [cite: 29] | Missing data/missed rituals |

### Color Rules
* [cite_start]**Tokenization**: Never use raw hex/rgb; always reference Tailwind tokens[cite: 31, 32].
* [cite_start]**Primary Accent**: Use sparingly for CTAs and focus rings; maximum 2-3 per viewport[cite: 34].
* [cite_start]**Opacity**: Use HSL opacity variants (e.g., `hsl(var(--token)/0.1)`) for subtle layered backgrounds[cite: 35].
* [cite_start]**Accessibility**: Every screen must pass contrast checks in both light and dark modes[cite: 36].

---

## 2. Typography

[cite_start]Strive uses **Satoshi Bold** for impactful headings and **DM Sans** for readable body text[cite: 54, 56].

| Role | Font | Weight | Tracking |
|---|---|---|---|
| **Headings (H1-H3)** | [cite_start]Satoshi Bold  | 700 (Bold) | [cite_start]Tight (-0.025em) [cite: 55] |
| **Body / UI Text** | [cite_start]DM Sans  | 400 (Regular) | [cite_start]Default [cite: 55] |
| **Caption / Small** | [cite_start]DM Sans  | 500 (Medium) | [cite_start]Wide (0.1em) [cite: 55] |

### Typographic Scale
* **Display**: 3rem (48px) | Satoshi Bold | [cite_start]Tracking: Tight (-0.025em) [cite: 55]
* **Heading 1**: 2.25rem (36px) | Satoshi Bold | [cite_start]Tracking: Tight [cite: 55]
* **Heading 2**: 1.875rem (30px) | Satoshi Bold | [cite_start]Tracking: Tight [cite: 55]
* **Heading 3**: 1.25rem (20px) | Satoshi Bold | [cite_start]Tracking: Default [cite: 55]
* **Body**: 1rem (16px) | [cite_start]DM Sans Regular [cite: 55]
* **Small**: 0.875rem (14px) | [cite_start]DM Sans Regular [cite: 55]
* **Caption**: 0.75rem (12px) | DM Sans Medium | [cite_start]Tracking: Wide [cite: 55]

---

## 3. Spacing & Layout

[cite_start]Based on a **4px base unit**[cite: 66, 67]. [cite_start]Generous negative space allows content to breathe[cite: 66].

* [cite_start]**4px**: Hairline gaps (`gap-1`) [cite: 68]
* [cite_start]**8px**: Tight inline spacing (`gap-2`) [cite: 70]
* [cite_start]**12px**: Badge and small element padding (`p-3`) [cite: 72]
* [cite_start]**16px**: Standard component padding (`p-4`) [cite: 74]
* [cite_start]**24px**: Card internal spacing (`p-6`) [cite: 75]
* [cite_start]**32px**: Section gaps (`gap-8`) [cite: 77]
* [cite_start]**48px**: Spacing between major sections (`gap-12`) [cite: 79]
* [cite_start]**64px**: Major visual separation (`gap-16`) [cite: 80]

---

## 4. Components & Motion

### Elevation & Borders
* **Border Radius**: Base unit of `0.375rem` (6px). Understated—not bubbly, not sharp.
* **Shadows**:
    * `shadow-subtle`: Cards at rest, status badges.
    * `shadow-elevated`: Hovered cards, dropdown menus.
    * `shadow-floating`: Modals, command palettes.

### Motion Philosophy
* **Duration**: 200–500ms.
* **Easing**: `ease-out` (entrances), `ease-in-out` (transitions).
* **Intent**: Motion should feel inevitable, not decorative. One well-timed fade is superior to scattered micro-interactions.