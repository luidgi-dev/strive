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
- `ai/` — Vercel AI SDK setup
  - `client.ts` — Shared, typed Gemini model singleton (`striveAIModel`, default `gemini-2.5-flash`). Reads `GOOGLE_GENERATIVE_AI_API_KEY`; the model id is overridable via `STRIVE_AI_MODEL`. Reuse this instead of re-instantiating a provider per call.
  - `prompt.ts` — `buildStriveSystemPrompt(now?)`: builds the agent's system prompt (identity, terminology, capabilities, per-tool response format, guardrails), injecting today's date at call time. Versioned; mirrors `docs/UX_WRITING.md`.
  - `tools.ts` — `striveTools(supabase, userId)` factory returning the agent's 5 tools (`list_rituals`, `get_momentum_summary`, `log_ritual`, `create_ritual`, `get_log_history`), each bound to the verified user. Tools resolve rituals by name (case-insensitive, structured not-found/ambiguous results), return rich momentum context, and reuse the `lib/data/rituals.ts` read/write helpers.
  - `types.ts` — shared types for the AI layer (`StriveSupabaseClient`, `StriveToolContext`).

  Consumed by the chat route at `app/[locale]/api/chat/route.ts` (POST), which authenticates the user, then `streamText`s the reply via `toUIMessageStreamResponse()`. The route lives under `[locale]/` because `proxy.ts` rewrites every non-static path with a locale prefix.
- `utils.ts` — General helpers (Tailwind class merging via `clsx` + `tailwind-merge`, etc.)
- `date.ts` — Date helpers: `todayInTimeZone`, `isoWeekday`, `startOfWeek`, `daysInMonth`
- `data/` — Typed query helpers + derivations against tables/views (`rituals.ts`: fetchers, `deriveMomentumStatus`, `deriveDailyMomentum`, plus `insertRitualLog`/`insertRitual` write helpers used by the AI tools — tagged `logged_via: "ai"`)
- `rituals/` — Ritual presentation logic: `presentation.ts` (period label, momentum tokens, freshness), `category-label.ts`, `arc.ts`
- `rhythm/` — `today-rituals.ts`: pure `selectTodayRituals` deciding what shows on the Rhythm home today (scope, daily quota, Done-today split)

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

## Testing

Unit tests are **co-located** with the modules they cover (Vitest, `*.test.ts`):

- `date.test.ts` — `isoWeekday`, `startOfWeek`, `daysInMonth`, `todayInTimeZone`
- `data/rituals.test.ts` — momentum derivation (`paceToStatus`, `deriveMomentumStatus`, `deriveDailyMomentum`)
- `rhythm/today-rituals.test.ts` — `selectTodayRituals` (scope, daily quota, open handling, sort order)

Run from the repo root with `npm test` (or `npm run test:watch`). Keep new unit
tests next to their source; a top-level `tests/` folder is reserved for future
integration / end-to-end suites.

## Conventions

- Files are lowercase, kebab-case where they have multiple words.
- Add new utilities directly in `lib/utils.ts` while it stays small. If a utility set grows beyond a single concern, give it its own file (e.g. `lib/profile.ts`) or subfolder (`lib/<topic>/`).
- Never hardcode secrets here — read from `process.env` only.
