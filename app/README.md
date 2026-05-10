# `app/` — Next.js App Router

Locale-aware routing for the Strive web app. All user-facing routes live under `[locale]/` (currently `en` and `fr`).

## Structure

```
app/
├── [locale]/
│   ├── page.tsx                # Landing
│   ├── layout.tsx              # Root layout (theme, providers, intl)
│   ├── auth/                   # Auth flow (see below)
│   └── protected/              # Authenticated routes
│       ├── layout.tsx          # Auth gate + sticky header (app name, UserAvatar → settings)
│       ├── loading.tsx         # Suspense fallback (spinner) for the protected segment
│       ├── page.tsx            # Legacy protected landing
│       └── (app)/              # Route group: in-app shell with BottomNav
│           ├── layout.tsx      # Wraps children with padding + <BottomNav />
│           ├── flow/page.tsx     # "Rhythm" — daily momentum
│           ├── rituals/page.tsx  # Rituals list
│           └── circles/page.tsx  # Circles
├── globals.css                 # Color tokens, typography, base styles
├── favicon.ico
├── icon.svg
└── README.md                   # This file
```

### Auth flow (`[locale]/auth/`)

`login`, `sign-up`, `sign-up-success`, `confirm`, `confirmed`, `forgot-password`, `update-password`, `error`.

### Protected routes (`[locale]/protected/`)

Anything under `protected/` requires a Supabase session. Session refresh and auth gating happen in two layers:

1. [`proxy.ts`](../proxy.ts) (Next.js 16 Proxy API) refreshes the auth cookie on every request.
2. `protected/layout.tsx` calls [`getAuthenticatedProfile()`](../lib/profile.ts) and redirects to `/[locale]/auth/login` when no user is present. It also fetches the `profiles` row used to render the header `UserAvatar`.

Individual pages don't repeat the auth check.

### The `(app)` route group

`(app)/` is a route group (parentheses → no URL segment), so its children live at `/[locale]/protected/flow`, `/rituals`, `/circles`. The group exists to scope the in-app shell — `(app)/layout.tsx` injects the [`BottomNav`](../components/ui/bottom-nav.tsx) and content padding for tabbed pages. Routes that should not have the bottom nav (e.g. `settings/`) go directly under `protected/`, outside the group.

The header app-name link points to `/[locale]/protected/flow` — Flow is the default in-app destination after sign-in.

### Loading UI

`protected/loading.tsx` is the Suspense boundary for the whole protected segment. Per-route loading files can be added alongside any `page.tsx` when a tighter boundary is useful.

## Conventions

- **Server Components by default**; only add `"use client"` when you genuinely need browser-only behavior. The protected layout and feature pages are server components.
- All user-facing strings go through `next-intl`. Add the key in both [`messages/en.json`](../messages/en.json) and [`messages/fr.json`](../messages/fr.json) — never hardcode in the component. Navigation labels live under `navigation.*`, per-feature copy under `app.<feature>.*`.
- Auth + profile helper: [`lib/profile.ts`](../lib/profile.ts) (`getAuthenticatedProfile()`). Raw Supabase clients come from [`lib/supabase/server.ts`](../lib/supabase/server.ts) and [`lib/supabase/client.ts`](../lib/supabase/client.ts).
- Page filenames are lowercase (`page.tsx`, `layout.tsx`, `loading.tsx`); route segments are kebab-case (`forgot-password/`, `sign-up-success/`).

## Where the product spec lives

The full product specification (screens, navigation, interaction rules) is in [`docs/PRODUCT_SPEC.md`](../docs/PRODUCT_SPEC.md).

For canonical UX terminology and tone, read [`docs/UX_WRITING.md`](../docs/UX_WRITING.md).
