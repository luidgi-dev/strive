# `docs/` — Strive Documentation

Reference material for humans and agents working on Strive. Each doc has a single, narrow scope so it stays easy to maintain.

## Index

| File | What it covers |
|---|---|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Folder map, file conventions, where to put new code |
| [`PRODUCT_SPEC.md`](PRODUCT_SPEC.md) | Product overview, screens, features, behavior rules |
| [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) | Color tokens, spacing, typography — the visual contract |
| [`UX_WRITING.md`](UX_WRITING.md) | Canonical terminology (Ritual, Momentum, Rhythm, The Arc…), tone, forbidden terms |
| [`wireframes/`](wireframes/) | Self-contained HTML wireframes used to iterate on layout and copy before building React |
| [`assets/`](assets/) | Brand assets and visual references (manifesto, voice, color palette, app shots) |

## Where agent rules live

Agent behavior rules are **not** in `docs/`. They live at the repo root:

- [`../AGENTS.md`](../AGENTS.md) — single source of truth for agent terminology, code semantics, protocol, and pitfalls.
- [`../CLAUDE.md`](../CLAUDE.md) — Claude Code entry index.
- [`../.cursor/rules/strive.mdc`](../.cursor/rules/strive.mdc) — Cursor-specific workflow on top of `AGENTS.md`.

Reusable skill packs are under [`../.agents/skills/`](../.agents/).

## Conventions

- One topic per file. If a doc starts covering two unrelated topics, split it.
- Keep each doc readable in under 5 minutes — link out for depth.
- Update `UX_WRITING.md` first when introducing new product terminology; everything else flows from it.

## Wireframes workflow

For new pages or major UI additions, build a self-contained HTML wireframe in `wireframes/` before writing any React. One file per surface, vanilla HTML + inline `<style>` + Google Fonts. Iterate on layout, hierarchy, copy, and dark/light styling there, then transpose 1:1 to React + Tailwind once approved. The file stays in the repo as a reference for future copy or layout tweaks.

Each wireframe should:
- Mirror the OKLch tokens from `app/globals.css` so light and dark match production.
- Expose a wireframe-only theme toggle (visible chip in a corner) for quick visual comparison.
- Keep alternate copy options as inline HTML comments so they can be swapped without editing.
