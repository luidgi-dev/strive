# Architecture Overview

Strive is a Next.js 16 app with a Supabase (PostgreSQL) backend. It is internationalized via `next-intl` and runs at the repository root — there is no separate `web/` package.

---

## Folder Map

### `app/` — Next.js App Router

Locale-aware routing. All user-facing routes live under `[locale]/`.

- `[locale]/page.tsx` — Landing page
- `[locale]/layout.tsx` — Root layout
- `[locale]/auth/` — Auth flow: `login/`, `sign-up/`, `sign-up-success/`, `confirm/`, `confirmed/`, `forgot-password/`, `update-password/`, `error/`
- `[locale]/protected/` — Authenticated routes (Rhythm, Rituals, Circles, Settings)
- `globals.css` — Global styles, color tokens, typography
- `favicon.ico`, `icon.svg` — App icons
- `README.md` — Product specification (screens, navigation, interaction rules)

### `components/` — Reusable React components

- `forms/` — Auth forms (`login-form`, `sign-up-form`, `forgot-password-form`, `update-password-form`, `logout-button`)
- `landing/` — Landing page sections (`hero-section`, `philosophy-section`, `vocabulary-section`, `ai-conversation-section`, `ritual-visualization-section`, `landing-shell`, `landing-footer`, plus `index.ts`, `types.ts`)
- `providers/` — React context providers (`theme-provider`)
- `ui/` — Primitives (`button`, `card`, `input`, `label`, `locale-switcher`, `theme-toggle`)

Files use **kebab-case** (`login-form.tsx`); component identifiers stay **PascalCase** (`LoginForm`).

### `lib/` — Shared utilities and clients

- `supabase/`
  - `client.ts` — Browser-safe Supabase client (publishable key)
  - `server.ts` — Server-side client with cookie-based session (`@supabase/ssr`)
- `utils.ts` — Generic helpers (Tailwind class merging, etc.)

### `messages/` — i18n translations

- `en.json`, `fr.json` — All user-facing strings, consumed by `next-intl` based on the URL locale segment.

### `data/` — Database (PostgreSQL on Supabase)

See [`data/README.md`](../data/README.md) for the full migration guide and schema overview.

- `tables/` — DDL files in dependency order
- `functions/` — SQL functions (credit guard, circle helpers)
- `triggers/` — DB triggers (e.g. `handle_new_user.sql`, `enforce_circle_member_limit.sql`)
- `seeds/` — Reference data and local-dev fixtures
- `tests/` — SQL verification scripts (e.g. `circles_rls.sql`, runs in a rolled-back transaction)
- `views/` — SQL views (`ritual_progress`, `daily_summary`, `ritual_log_history`)
- `migrate.py` — Python migration runner

### `public/` — Static assets

Favicons, PWA manifest, brand SVGs and JPEGs.

### `docs/` — Documentation hub

Technical specs and rules read by anyone coding (architecture, design system, product spec, UX writing, AI security). See [`docs/README.md`](README.md) for the index. No wireframes or UX artifacts live here — those are in `design/`.

### `design/` — Design workspace

UX artifacts: HTML wireframes (`wireframes/`), the global navigation flow (`ux-flow.md`), and the AI-chat design rationale (`chat-design.md`). See [`design/README.md`](../design/README.md) for the `docs/` vs `design/` rule.

### `.agents/` — Reusable AI skills

See [`.agents/README.md`](../.agents/README.md). Vendored skill packs (e.g. `supabase-postgres-best-practices`).

### `.github/` — CI and AI review workflows

See [`.github/WORKFLOWS.md`](../.github/WORKFLOWS.md).

---

## Root files (build/runtime critical — do not move)

| File | Role |
|---|---|
| `package.json`, `package-lock.json` | Dependencies and scripts |
| `next.config.ts` | Next.js config (wraps the `next-intl` plugin) |
| `tsconfig.json` | TypeScript config |
| `eslint.config.mjs` | ESLint flat config |
| `postcss.config.mjs` | Tailwind / PostCSS |
| `components.json` | shadcn CLI config |
| `proxy.ts` | Next.js Proxy — session refresh + auth gating |
| `i18n.ts` | `next-intl` runtime config |
| `next-env.d.ts` | Auto-generated Next.js types |

---

## Data Flow

1. **Request** hits a route under `app/[locale]/`.
2. **Proxy** (`proxy.ts`) refreshes the Supabase session cookie and gates protected routes.
3. **Server Components** read data via `lib/supabase/server.ts` using the user's session.
4. **Client Components** (only when interactivity is needed) read via `lib/supabase/client.ts`.
5. **Database** enforces per-user isolation through RLS policies defined in `data/tables/*.sql`.
6. **Translations** are resolved by `next-intl` from `messages/{locale}.json` based on the URL segment.

---

## When to add new folders or files

| Need | Where |
|---|---|
| New page | `app/[locale]/<route>/page.tsx` |
| New domain (rituals, logs, circles) | `components/<domain>/` |
| New utility | `lib/<topic>.ts` (or `lib/<topic>/` if it grows) |
| New table or view | `data/tables/` or `data/views/` |
| New translation key | `messages/en.json` **and** `messages/fr.json` |
| New AI skill | `.agents/skills/<skill-name>/` |

---

## Naming Conventions

- **Components**: kebab-case filenames, PascalCase identifiers (`login-form.tsx` exporting `LoginForm`).
- **Routes**: kebab-case (`/forgot-password`).
- **Database**: snake_case, lowercase SQL (`ritual_logs`, `logged_at`). See `data/README.md`.
- **Functions/variables**: camelCase (`getRituals`, `logRitual`).
- **Semantic naming for product concepts**: see [`UX_WRITING.md`](UX_WRITING.md) §5 (`ritual_id`, `momentum`, `logged_at`, `flow`).

---

## AI agent setup

Reusable agent knowledge is split across four places:

- [`AGENTS.md`](../AGENTS.md) — single source of truth for agent rules (terminology, code semantics, protocol).
- [`CLAUDE.md`](../CLAUDE.md) — Claude Code entry index pointing to docs to read first.
- [`.cursor/rules/strive.mdc`](../.cursor/rules/strive.mdc) — Cursor-specific workflow on top of `AGENTS.md`.
- [`.agents/`](../.agents/) — Vendored skill packs.
