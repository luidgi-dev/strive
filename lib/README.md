# `lib/`

Shared utilities and client libraries for the Strive web app.

## Structure

- `supabase/` — Supabase clients and middleware (uses `@supabase/ssr`)
  - `client.ts` — Browser-safe client (uses `NEXT_PUBLIC_SUPABASE_URL` + publishable anon key)
  - `server.ts` — Server-side client with cookie-based session handling
  - `middleware.ts` — Refreshes the session cookie; called from `proxy.ts`
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

## Conventions

- Files are lowercase, kebab-case where they have multiple words.
- Add new utilities directly in `lib/utils.ts` while it stays small. If a utility set grows beyond a single concern, give it its own subfolder (`lib/<topic>/`).
- Never hardcode secrets here — read from `process.env` only.
