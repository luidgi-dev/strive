# `design/` — Design Workspace

Centralizes product and visual design artifacts that don't belong in the codebase or in `docs/`. This is where the design thinking lives — wireframes, mockups, flows, research notes — alongside (not duplicating) the canonical visual contract in [`docs/DESIGN_SYSTEM.md`](../docs/DESIGN_SYSTEM.md).

## Why this folder exists

- Keep design exploration and decisions versioned next to the code, so context is never lost.
- Separate "what the product looks like" (here, plus `docs/DESIGN_SYSTEM.md`) from "how the product runs" (`app/`, `components/`, `lib/`).
- Give agents and humans a single entry point when they need the visual or UX rationale behind a feature.

## What goes here

- **Wireframes** — low-fidelity sketches, flow boards, layout explorations.
- **Mockups** — high-fidelity exports from Figma (PNG/SVG) for review or handoff.
- **Flows** — interaction diagrams, navigation maps, state charts.
- **Tokens (optional)** — non-canonical visual references; canonical tokens stay in [`docs/DESIGN_SYSTEM.md`](../docs/DESIGN_SYSTEM.md) and `app/globals.css`.
- **Research notes** — UX research, user interviews, observations, surveys.

What does **not** go here:

- Source of truth for color/typography tokens → [`docs/DESIGN_SYSTEM.md`](../docs/DESIGN_SYSTEM.md).
- Canonical UX terminology and copy → [`docs/UX_WRITING.md`](../docs/UX_WRITING.md).
- Brand assets (logos, brand voice/manifesto PDFs) → [`docs/assets/`](../docs/assets/).

## Suggested structure

```text
design/
  wireframes/
  mockups/
  flows/
  tokens/        # optional — non-canonical references only
  notes/
```

## Naming convention

- Use kebab-case: `flow-redesign.png`, not `Flow Redesign.PNG`.
- Date files when the iteration matters: `2026-05-flow-redesign.png`.
- Group related artifacts in a subfolder rather than long filenames.

## When you add something here

If a design decision affects code, reflect the outcome in:

- [`docs/DESIGN_SYSTEM.md`](../docs/DESIGN_SYSTEM.md) when tokens or visual rules change.
- [`docs/UX_WRITING.md`](../docs/UX_WRITING.md) when terminology or copy changes.
- [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) when folder/component structure changes.
