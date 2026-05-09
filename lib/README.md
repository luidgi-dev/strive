# `lib/`

Shared utilities and client libraries for the Strive web app.

## Structure

- `supabase/` — Supabase clients and middleware (uses `@supabase/ssr`)
  - `client.ts` — Browser-safe client, typed with `<Database>` (uses `NEXT_PUBLIC_SUPABASE_URL` + publishable key)
  - `server.ts` — Server-side client, typed with `<Database>`, cookie-based session handling
  - `middleware.ts` — Refreshes the session cookie; called from `proxy.ts`; also typed with `<Database>`
  - `database.types.ts` — Auto-generated TypeScript types reflecting the public schema (tables, views, enums). Do not edit by hand. Regenerate with `npm run db:types`.
- `utils.ts` — General helpers (Tailwind class merging via `clsx` + `tailwind-merge`, etc.)

## Usage

### Server Component (preferred)

```ts
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
```

### Client Component (only when needed)

```ts
'use client'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
```

### Proxy / session refresh

`proxy.ts` at the repo root delegates to `lib/supabase/middleware.ts` to refresh the auth cookie on every request and gate protected routes — pages don't need to do this themselves.

### Typed queries

Both clients return a `SupabaseClient<Database>`, so `.from(...)` calls are fully type-checked: column names autocomplete, typos are caught at compile time, and views (`ritual_progress`, `daily_summary`, `ritual_log_history`) are typed alongside tables. No casting or manual type annotations needed.

```ts
const { data } = await supabase.from('rituals').select('id, name, ritual_type')
//                                  ^ autocompletes      ^ typed as 'recurring' | 'one_time' | 'open'
```

For ad-hoc row types in app code, derive them from `Database`:

```ts
import type { Database } from '@/lib/supabase/database.types'

type Ritual = Database['public']['Tables']['rituals']['Row']
type NewLog = Database['public']['Tables']['ritual_logs']['Insert']
```

## Regenerating database types

Run `npm run db:types` after any schema change (new table, new column, new view, enum value, etc.). The script writes a fresh `database.types.ts` against the live Supabase project. Commit the result.

> Heads-up: when run from inside the Claude Code shell with the official Supabase plugin active, a stray `<claude-code-hint .../>` line is appended to the file and breaks the TypeScript build. Strip it with `sed -i '' '/<claude-code-hint/d' lib/supabase/database.types.ts`. Not needed when run from a regular terminal.

## Conventions

- Files are lowercase, kebab-case where they have multiple words.
- Add new utilities directly in `lib/utils.ts` while it stays small. If a utility set grows beyond a single concern, give it its own subfolder (`lib/<topic>/`).
- Never hardcode secrets here — read from `process.env` only.
