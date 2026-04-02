# Architecture Overview

## Folder Map

### `app/`
Next.js 16 App Router. Houses pages and route handlers.

- `auth/` — Auth pages (login, signup, reset password)
- `(protected)/` — Authenticated user pages (route group)
- `layout.tsx` — Root layout
- `page.tsx` — Landing page

### `components/`
Reusable React components.

- `forms/` — Auth and data-entry forms
- `ui/` — Primitive components (from shadcn/Base UI)

### `lib/`
Shared utilities and client libraries.

- `supabase/` — Supabase client instances + auth helpers
- `utils.ts` — General utilities
- `constants.ts` — App-wide constants

### `data/`
Database schema, migrations, seeds, and views (PostgreSQL + Supabase).

- `tables/` — Table definitions (DDL)
- `triggers/` — Database triggers
- `seeds/` — Reference data and test fixtures
- `views/` — SQL views for reports and queries
- `migrate.py` — Migration runner

### `design/`
UX/design assets, wireframes, and visual guidelines.

### `docs/`
Documentation hub for developers and AI agents.

- `AGENTS.md` — AI agent guidelines
- `system-prompt.md` — Claude system prompt
- `UX_WRITING.md` — Terminology and UI tone
- `ARCHITECTURE.md` — This file

### `public/`
Static assets served by Next.js.

---

## Data Flow

1. **User action** → Next.js app
2. **Client-side** → `lib/supabase/client.ts` (anon key queries)
3. **Server-side** → `lib/supabase/server.ts` (admin queries, RLS bypass)
4. **Database** → `data/` (tables + RLS policies)
5. **Response** → Component render

---

## When to Add New Folders

- **New page type?** Create a new route group in `app/(group-name)/`
- **New domain (rituals, logs)?** Create a new folder in `components/` (e.g., `components/rituals/`)
- **New utility library?** Add a new file in `lib/` (or subfolder if complex)
- **New SQL schema?** Add files to `data/tables/`

---

## Naming Conventions

- Components: PascalCase (`RitualCard.tsx`)
- Pages/routes: kebab-case (`/app/ritual-detail/page.tsx`)
- Database: snake_case (`ritual_logs`, `logged_at`)
- Functions: camelCase (`getRituals`, `logRitual`)