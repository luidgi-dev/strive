# Strive — Design System Documentation

## Aesthetic: Quiet Luxury

Linear.app's engineering precision meets premium meditation-app calm. Every pixel serves a purpose. Negative space is a feature, not a gap.

---

## 1. Color System

### Core Palette

All colors must be implemented via CSS custom properties (Tailwind tokens) and never as raw hex values.

| Token | Light Mode (HSL) | Dark Mode (HSL) | Usage |
|---|---|---|---|
| `--background` | 40 20% 98% | 220 16% 7% | Main page background |
| `--foreground` | 220 20% 10% | 40 10% 90% | Primary text content |
| `--card` | 40 15% 96% | 220 14% 10% | Card and surface elements |
| `--primary` | 168 28% 38% | 168 30% 52% | Brand accent, primary CTAs |
| `--secondary` | 40 10% 92% | 220 12% 15% | Secondary UI surfaces |
| `--muted` | 40 10% 94% | 220 12% 14% | Subtle backgrounds / disabled states |
| `--accent` | 168 20% 92% | 168 15% 14% | Subtle highlights and focus |
| `--border` | 40 12% 90% | 220 12% 16% | Dividers and element borders |

### Semantic: Momentum System

Status-driven colors that communicate ritual progress at a glance. These are for status only, never decoration.

| Token | HSL | Meaning | Usage |
|---|---|---|---|
| `--momentum` | 155 30% 42% | **On Track**: Ritual is progressing well | Progress bars, success states |
| `--caution` | 36 40% 50% | **Needs Attention**: Behind on target | Warnings, partial completion |
| `--missed` | 10 35% 52% | **Missed**: No progress recorded | Missing data / missed rituals |

### Color Rules

- **Tokenization**: Never use raw hex/rgb; always reference Tailwind tokens.
- **Primary Accent**: Use sparingly for CTAs and focus rings; maximum 2–3 per viewport.
- **Opacity**: Use HSL opacity variants (e.g., `hsl(var(--token)/0.1)`) for subtle layered backgrounds.
- **Accessibility**: Every screen must pass contrast checks in both light and dark modes.

---

## 2. Typography

Strive uses **Satoshi Bold** for impactful headings and **DM Sans** for readable body text.

| Role | Font | Weight | Tracking |
|---|---|---|---|
| **Headings (H1–H3)** | Satoshi Bold | 700 (Bold) | Tight (-0.025em) |
| **Body / UI Text** | DM Sans | 400 (Regular) | Default |
| **Caption / Small** | DM Sans | 500 (Medium) | Wide (0.1em) |

### Typographic Scale

- **Display**: 3rem (48px) | Satoshi Bold | Tracking: Tight (-0.025em)
- **Heading 1**: 2.25rem (36px) | Satoshi Bold | Tracking: Tight
- **Heading 2**: 1.875rem (30px) | Satoshi Bold | Tracking: Tight
- **Heading 3**: 1.25rem (20px) | Satoshi Bold | Tracking: Default
- **Body**: 1rem (16px) | DM Sans Regular
- **Small**: 0.875rem (14px) | DM Sans Regular
- **Caption**: 0.75rem (12px) | DM Sans Medium | Tracking: Wide

---

## 3. Spacing & Layout

Based on a **4px base unit**. Generous negative space allows content to breathe.

- **4px**: Hairline gaps (`gap-1`)
- **8px**: Tight inline spacing (`gap-2`)
- **12px**: Badge and small element padding (`p-3`)
- **16px**: Standard component padding (`p-4`)
- **24px**: Card internal spacing (`p-6`)
- **32px**: Section gaps (`gap-8`)
- **48px**: Spacing between major sections (`gap-12`)
- **64px**: Major visual separation (`gap-16`)

---

## 4. Components & Motion

### Elevation & Borders

- **Border Radius**: Base unit of `0.375rem` (6px). Understated — not bubbly, not sharp.
- **Shadows**:
  - `shadow-subtle`: Cards at rest, status badges.
  - `shadow-elevated`: Hovered cards, dropdown menus.
  - `shadow-floating`: Modals, command palettes.

### Motion Philosophy

- **Duration**: 200–500ms.
- **Easing**: `ease-out` (entrances), `ease-in-out` (transitions).
- **Intent**: Motion should feel inevitable, not decorative. One well-timed fade is superior to scattered micro-interactions.
