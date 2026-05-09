# `docs/` — Strive Documentation

Reference material for humans and agents working on Strive. Each doc has a single, narrow scope so it stays easy to maintain.

## Index

| File | What it covers |
|---|---|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Folder map, file conventions, where to put new code |
| [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) | Color tokens, spacing, typography — the visual contract |
| [`UX_WRITING.md`](UX_WRITING.md) | Canonical terminology (Ritual, Momentum, Rhythm, The Arc…), tone, forbidden terms |
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
