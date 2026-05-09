# `app/` — Next.js App Router

Locale-aware routing for the Strive web app. All user-facing routes live under `[locale]/` (currently `en` and `fr`).

## Structure

```
app/
├── [locale]/
│   ├── page.tsx         # Landing
│   ├── layout.tsx       # Root layout (theme, providers, intl)
│   ├── auth/            # Auth flow (see below)
│   └── protected/       # Authenticated routes (Rhythm, Rituals, Circles, Settings)
├── globals.css          # Color tokens, typography, base styles
├── favicon.ico
├── icon.svg
└── README.md            # This file
```

### Auth flow (`[locale]/auth/`)

`login`, `sign-up`, `sign-up-success`, `confirm`, `confirmed`, `forgot-password`, `update-password`, `error`.

### Protected routes (`[locale]/protected/`)

Anything here requires a Supabase session. Session refresh and auth gating happen in [`proxy.ts`](../proxy.ts) (Next.js 16 Proxy API), not in individual pages.

## Conventions

- **Server Components by default**; only add `"use client"` when you genuinely need browser-only behavior.
- All user-facing strings go through `next-intl`. Add the key in both [`messages/en.json`](../messages/en.json) and [`messages/fr.json`](../messages/fr.json) — never hardcode in the component.
- Auth helpers come from [`lib/supabase/server.ts`](../lib/supabase/server.ts) (server-side) and [`lib/supabase/client.ts`](../lib/supabase/client.ts) (client-side).
- Page filenames are lowercase (`page.tsx`, `layout.tsx`); route segments are kebab-case (`forgot-password/`, `sign-up-success/`).

## Where the product spec lives

The full product specification (screens, navigation, interaction rules) is in [`docs/PRODUCT_SPEC.md`](../docs/PRODUCT_SPEC.md).

For canonical UX terminology and tone, read [`docs/UX_WRITING.md`](../docs/UX_WRITING.md).
