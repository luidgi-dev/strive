# Strive

> Find your rhythm.

Strive (available at [striveapp.cc](https://www.striveapp.cc)) is a minimalist, AI-first ritual tracker PWA. It replaces the anxiety of daily streaks with a flexible system grounded in weekly and monthly **consistency** — momentum that decays slowly, never resets to zero, and treats rest days as part of the practice.

## What is Strive

- **Flexible consistency** instead of binary success/failure.
- **Zero-friction logging**, including conversational flows powered by AI.
- **Quiet luxury UI**: minimal, fast, clear, dark-by-default.

The full product specification lives in `[docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md)`. Canonical terminology and tone are in `[docs/UX_WRITING.md](docs/UX_WRITING.md)`.

## Tech stack

- **Next.js 16** (App Router, Server Components by default)
- **TypeScript 5**, React 19
- **Supabase** (PostgreSQL + Auth + RLS) via `@supabase/ssr`
- **next-intl** for routing-aware i18n (`en`, `fr`)
- **Tailwind CSS v4** + shadcn/Base UI primitives
- **next-themes** for light/dark theming

## Repository structure


| Path          | Role                                                  | Reference                                      |
| ------------- | ----------------------------------------------------- | ---------------------------------------------- |
| `app/`        | Next.js App Router (locale-aware routes)              | `[app/README.md](app/README.md)`               |
| `components/` | Reusable React components                             | `[components/README.md](components/README.md)` |
| `lib/`        | Supabase clients and shared utilities                 | `[lib/README.md](lib/README.md)`               |
| `messages/`   | i18n translations (`en.json`, `fr.json`)              | —                                              |
| `data/`       | DB schema, seeds, triggers, views, migration runner   | `[data/README.md](data/README.md)`             |
| `docs/`       | Architecture, design system, UX writing, product spec | `[docs/README.md](docs/README.md)`             |
| `design/`     | Design workspace (wireframes, mockups, research)      | `[design/README.md](design/README.md)`         |
| `.agents/`    | Reusable AI skill packs                               | `[.agents/README.md](.agents/README.md)`       |
| `.github/`    | CI workflows and AI review prompts                    | `[.github/WORKFLOWS.md](.github/WORKFLOWS.md)` |


Root files like `proxy.ts`, `i18n.ts`, `next.config.ts`, `tsconfig.json` are build/runtime critical and are documented in `[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)`.

## Quick start

Prerequisites: Node.js 20+, npm.

1. Create a `.env.local` at the repo root with:
  ```env
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
  ```
2. Install and run:
  ```bash
   npm install
   npm run dev
  ```
3. Open [http://localhost:3000](http://localhost:3000).

For database setup (migrations, seeds, RLS), see `[data/README.md](data/README.md)`. For Supabase client usage, see `[lib/README.md](lib/README.md)`.

## Internationalization

Strive ships in **English** and **French**, served via `next-intl` and locale-prefixed routes (`/en/...`, `/fr/...`). All user-facing strings live in `[messages/en.json](messages/en.json)` and `[messages/fr.json](messages/fr.json)` — never hardcoded in components. Locale is resolved by `[i18n.ts](i18n.ts)` and the runtime middleware in `[proxy.ts](proxy.ts)`.

## Theming

Light and dark modes via `next-themes`. Color tokens are defined as CSS custom properties in `[app/globals.css](app/globals.css)` and the canonical visual contract is in `[docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)`. Never hardcode hex/rgb values — always reference Tailwind tokens.

## CI & automation

Two GitHub Actions workflows guard the repo:

- `pr-review.yml` — AI-assisted review on every pull request, checking code semantics, terminology, and architectural fit.
- `project-audit.yml` — periodic project-wide audit for documentation drift and architectural health.

Both workflows consume prompts from `.github/prompts/`. See `[.github/WORKFLOWS.md](.github/WORKFLOWS.md)` for the full setup.

## AI agent guidelines

This repo is designed to be coded with AI agents. Three files keep agents aligned:

- `[AGENTS.md](AGENTS.md)` — single source of truth for agent rules (terminology, code semantics, protocol).
- `[CLAUDE.md](CLAUDE.md)` — Claude Code entry index.
- `[.cursor/rules/strive.mdc](.cursor/rules/strive.mdc)` — Cursor-specific workflow on top of `AGENTS.md`.

Reusable skill packs (e.g. Supabase Postgres best practices) live under `[.agents/skills/](.agents/)`.

## Documentation

The full documentation index is `[docs/README.md](docs/README.md)`.