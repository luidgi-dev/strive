# `design/` — Design Workspace

Where Strive's **UX thinking** lives: wireframes, navigation flows, and the rationale behind product surfaces. Versioned next to the code so the "why" behind the UI is never lost.

## `docs/` vs `design/` — the rule

| | Holds | Read by |
|---|---|---|
| **`docs/`** | Rules, technical specs, constraints — [`ARCHITECTURE`](../docs/ARCHITECTURE.md), [`DESIGN_SYSTEM`](../docs/DESIGN_SYSTEM.md) (tokens), [`PRODUCT_SPEC`](../docs/PRODUCT_SPEC.md), [`UX_WRITING`](../docs/UX_WRITING.md), [`AI_SECURITY_CHECKLIST`](../docs/AI_SECURITY_CHECKLIST.md) | Devs & agents that **write code** |
| **`design/`** | UX artifacts — wireframes, flows, design rationale | Designers & agents that **generate UI** |

Rule of thumb: if a file tells you *how the product should be built or what the rules are*, it's `docs/`. If it shows or explains *how the product looks and flows*, it's `design/`.

> Canonical sources stay in `docs/`: color/typography tokens → [`docs/DESIGN_SYSTEM.md`](../docs/DESIGN_SYSTEM.md) (mirrored in `app/globals.css`); terminology & copy → [`docs/UX_WRITING.md`](../docs/UX_WRITING.md). Brand assets (logos, manifesto PDFs) → [`docs/assets/`](../docs/assets/). `design/` references these, never duplicates them.

## Structure

```text
design/
  README.md          # this file
  wireframes/        # self-contained HTML wireframes, one per surface
  ux-flow.md         # global navigation: screens, transitions, entry points
  chat-design.md     # "My Strive" AI chat — tools, cards, voice, guardrails
  insights-page.md   # Insights — hybrid intelligence, confidence, cadence, gating
  push-notifications.md  # Notifications — rules (opt-in, triggers, anti-spam) + Web Push stack
```

The rendered PNG exports shown on the landing page live in [`public/wireframes/`](../public/wireframes/) (served as static assets), not here — `design/wireframes/` holds the **editable HTML sources**.

## Wireframes workflow

For new pages or major UI additions, build a self-contained HTML wireframe in `wireframes/` before writing any React. One file per surface, vanilla HTML + inline `<style>` + Google Fonts. Iterate on layout, hierarchy, copy, and dark/light styling there, then transpose 1:1 to React + Tailwind once approved. The file stays in the repo as a reference for future copy or layout tweaks.

Each wireframe should:

- Mirror the OKLch tokens from `app/globals.css` so light and dark match production.
- Expose a wireframe-only theme toggle (visible chip in a corner) for quick visual comparison.
- Keep alternate copy options as inline HTML comments so they can be swapped without editing.

Some wireframes (e.g. `ai-chat-v2.html`) carry a capture recipe in a top-of-file comment for exporting the landing-page PNGs into `public/wireframes/`.

## Naming convention

- kebab-case: `rituals-define.html`, not `Rituals Define.HTML`.
- Date a file only when iterations need to coexist: `2026-05-flow-redesign.png`.
- Group related artifacts in a subfolder rather than long filenames.

## When a design decision affects code

Reflect the outcome in the canonical spec:

- [`docs/DESIGN_SYSTEM.md`](../docs/DESIGN_SYSTEM.md) when tokens or visual rules change.
- [`docs/UX_WRITING.md`](../docs/UX_WRITING.md) when terminology or copy changes.
- [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) when folder/component structure changes.
