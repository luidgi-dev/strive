# Strive

Strive is a minimalist, AI-first product focused on turning discipline into sustainable momentum.

The goal is to avoid rigid "daily streak" anxiety and replace it with a flexible system based on weekly/monthly consistency.

## Product Vision

- Flexible consistency instead of binary success/failure.
- Zero-friction logging, including conversational flows.
- Quiet luxury UI: minimal, fast, and clear.

## Repository Scope

This repository is designed to host multiple streams of work:

- `web/`: web product documentation and boundaries for the Next.js app.
- `data/`: database schema, SQL migrations, RLS policies, and seed scripts.
- `design/`: UX notes, wireframes, visual guidelines, and mockups.

The current Next.js implementation still lives at repository root (`app/`, `components/`, `lib/`, etc.).
A full physical move into `web/` can be done in a dedicated refactor once you are ready.

## Quick Start (Current Web App at Root)

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Supabase Setup

Expected env keys in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Supabase client helpers are available in `lib/supabase/`.

## AI Agent Guidelines
To keep AI-generated changes consistent, follow:
- Cursor: `.cursorrules`
- Agent workflow: `docs/AGENTS.md`
- Claude system prompt: `docs/system-prompt.md`
- Terminology + UI tone: `docs/UX_WRITING.md`

## Suggested Next Steps

1. Put SQL assets (tables, RLS, functions) in `data/`.
2. Store design references and UX decisions in `design/`.
3. When stable, move the Next.js runtime files into `web/` and keep root as orchestrator/documentation.
