# `lib/`

Shared utilities and client libraries for the Strive web app.

## Structure

- `supabase/` — Supabase clients and middleware (uses `@supabase/ssr`)
  - `client.ts` — Browser-safe client, typed with `<Database>` (uses `NEXT_PUBLIC_SUPABASE_URL` + publishable key)
  - `server.ts` — Server-side client, typed with `<Database>`, cookie-based session handling
  - `middleware.ts` — Refreshes the session cookie; called from `proxy.ts`; also typed with `<Database>`
  - `database.types.ts` — Auto-generated TypeScript types reflecting the public schema (tables, views, enums). Do not edit by hand. Regenerate with `npm run db:types`.
- `profile.ts` — `getAuthenticatedProfile()`: server-side helper that returns `{ user, profile }` from the Supabase session + `profiles` table. Used by `app/[locale]/protected/layout.tsx` to gate access and render the header avatar.
- `i18n/` — Locale-aware navigation helpers built on `next-intl`
  - `routing.ts` — `defineRouting` config (re-uses `locales`/`defaultLocale` from root `i18n.ts`, `localePrefix: "as-needed"` to match the proxy's clean-URL behavior for English)
  - `navigation.ts` — `createNavigation(routing)` re-exports: `Link`, `redirect`, `usePathname`, `useRouter`, `getPathname`. Use these instead of `next/link` / `next/navigation` for any internal route that needs to preserve the current locale.
- `utils.ts` — General helpers (Tailwind class merging via `clsx` + `tailwind-merge`, etc.)

## Usage

### Server Component (preferred)

```ts
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
```

### Authenticated profile helper

For server components in the protected segment that need both the verified user and their profile row, use the helper instead of repeating the query:

```ts
import { getAuthenticatedProfile } from '@/lib/profile'

const { user, profile } = await getAuthenticatedProfile()
if (!user) redirect(`/${locale}/auth/login`)
// profile?.username, profile?.avatar_url
```

Returns `{ user: null, profile: null }` when there is no session — callers decide how to react (the protected layout redirects to login).

### Locale-aware navigation

Always use the wrappers from `@/lib/i18n/navigation` for internal links — they automatically prefix the current locale (`/protected/flow` → `/fr/protected/flow` for French users) so navigation never silently flips back to the default locale.

```tsx
import { Link } from "@/lib/i18n/navigation";

<Link href="/protected/rituals">{t("rituals")}</Link>
```

Bare `next/link` is fine for external URLs and locale-agnostic anchors, but never for routes under `[locale]/`.

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
- Add new utilities directly in `lib/utils.ts` while it stays small. If a utility set grows beyond a single concern, give it its own file (e.g. `lib/profile.ts`) or subfolder (`lib/<topic>/`).
- Never hardcode secrets here — read from `process.env` only.
