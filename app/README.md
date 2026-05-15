# `app/` — Next.js App Router

Locale-aware routing for the Strive web app. All user-facing routes live under `[locale]/` (currently `en` and `fr`).

## Structure

```
app/
├── layout.tsx                  # Root layout: <html>/<body>, fonts, ThemeProvider
├── [locale]/
│   ├── layout.tsx              # Locale validation + NextIntlClientProvider
│   ├── page.tsx                # Landing
│   ├── auth/                   # Auth flow (see below)
│   └── protected/              # Authenticated routes
│       ├── layout.tsx          # Auth gate + <ProtectedHeader />
│       ├── loading.tsx         # Suspense fallback (spinner) for the protected segment
│       ├── page.tsx            # Legacy protected landing
│       └── (app)/              # Route group: in-app shell with BottomNav
│           ├── layout.tsx      # Wraps children with padding + <BottomNav />
│           ├── flow/page.tsx       # "Rhythm" — daily momentum
│           ├── rituals/page.tsx    # Rituals list
│           ├── circles/page.tsx    # Circles
│           └── settings/           # User settings (see "Settings" below)
│               ├── layout.tsx      # Wraps {children} with SettingsTransition
│               ├── page.tsx
│               ├── loading.tsx     # Shimmer skeleton matching page.tsx structure
│               ├── action.ts       # updateUsername, updateAvatar
│               ├── settings-transition.tsx  # Client wrapper: slide-in-from-right + fade-in
│               └── components/     # Profile, Preferences, Membership, DangerZone
├── globals.css                 # Color tokens, typography, base styles
├── favicon.ico
├── icon.svg
└── README.md                   # This file
```

### Layout split (root vs locale)

`<html>`, `<body>`, fonts and the `ThemeProvider` live in the **root** layout (`app/layout.tsx`). The `[locale]/layout.tsx` only validates the locale and wraps children in `NextIntlClientProvider`. Switching locale therefore re-mounts only the intl provider, not the theme — this avoids the React 19 "scripts inside React components are never executed when rendering on the client" warning that next-themes' anti-FOUC inline script otherwise triggers on every locale change. `<html lang>` is resolved server-side via `getLocale()` from `next-intl/server`.

The root layout also exports `viewport` with a media-queried `themeColor` (light `#f8f9f9`, dark `#1d2122`, matching the `--background` tokens). The browser/OS status bar — visible on the PWA installed to a home screen — follows the OS color-scheme preference. Hex values are required because the `<meta name="theme-color">` tag and `public/site.webmanifest` cannot reference CSS tokens; the manifest also pins `theme_color` and `background_color` to the dark value since Strive is dark-by-default. Note that `themeColor` is static at the OS level and does **not** follow the in-app theme toggle.

### Auth flow (`[locale]/auth/`)

`login`, `sign-up`, `sign-up-success`, `confirm`, `confirmed`, `forgot-password`, `update-password`, `error`.

### Protected routes (`[locale]/protected/`)

Anything under `protected/` requires a Supabase session. Session refresh and auth gating happen in two layers:

1. [`proxy.ts`](../proxy.ts) (Next.js 16 Proxy API) refreshes the auth cookie on every request.
2. `protected/layout.tsx` calls [`getAuthenticatedProfile()`](../lib/profile.ts) and redirects to `/[locale]/auth/login` when no user is present. It also fetches the `profiles` row used to render the header `UserAvatar`.

Individual pages don't repeat the auth check.

### The `(app)` route group

`(app)/` is a route group (parentheses → no URL segment), so its children live at `/[locale]/protected/flow`, `/rituals`, `/circles`, `/settings`. The group exists to scope the in-app shell — `(app)/layout.tsx` injects the [`BottomNav`](../components/ui/bottom-nav.tsx) and content padding for tabbed pages.

Some routes inside the group intentionally render full-bleed without the shared chrome (no header, no bottom nav). `settings/` is the first of those — it provides its own in-page back header. Hiding works as follows: [`ProtectedHeader`](../components/layout/protected-header.tsx) and [`BottomNav`](../components/ui/bottom-nav.tsx) are client components that read `usePathname()` from [`@/lib/i18n/navigation`](../lib/i18n/navigation.ts) and return `null` for `/protected/settings`. Add other "destination" routes to those guards instead of moving them out of the group.

The header app-name link points to `/[locale]/protected/flow` — Flow is the default in-app destination after sign-in.

### Settings (`(app)/settings/`)

Server-rendered page that fetches the user's profile and membership in parallel via [`getAuthenticatedProfile()`](../lib/profile.ts) and [`getMembership()`](../lib/profile.ts). Four client sections handle interactivity:

- `ProfileSection` — avatar upload (Server Action → `user-assets` bucket) and inline username edit.
- `PreferencesSection` — language (next-intl), theme (next-themes), Smart reminders placeholder.
- `MembershipSection` — tier badge, monthly credits, reset date, "Voir les formules" sheet listing the three tiers.
- `DangerZoneSection` — logout (reuses [`LogoutButton`](../components/forms/logout-button.tsx)) and two-step delete-account confirmation.

Mutations live in [`settings/action.ts`](./[locale]/protected/(app)/settings/action.ts): `updateUsername` (regex + length validation, maps Postgres `23505` to a `usernameTaken` i18n key) and `updateAvatar` (MIME + size whitelist, uploads to `avatars/{user.id}/{uuid}.{ext}` for cache-busted URLs).

Because Settings is a full-bleed destination route (no shared header, no bottom nav), it opens with a brief slide-in to read as a panel rather than a hard page swap. `settings-transition.tsx` is a small Server Component wrapper that applies `animate-in slide-in-from-right-4 fade-in duration-300 ease-out` from `tw-animate-css` — the animation is CSS-only (no state, no effects), so the wrapper stays server-rendered. It is mounted by `settings/layout.tsx` (not `page.tsx`) so the animation runs **once on route entry** and spans both the Suspense fallback (`loading.tsx`) and the resolved page content — the layout does not re-mount when `loading.tsx` is replaced by `page.tsx`. Wrapping `page.tsx` directly would have animated the content only after data resolved, leaving the skeleton to appear without animation. The wrapper itself lives next to the route rather than in `settings/components/` because that folder is reserved for content sections; it's also not in the root `components/` because it's settings-specific, not a reusable primitive.

### Loading UI

`protected/loading.tsx` is the Suspense boundary for the whole protected segment. Per-route loading files can be added alongside any `page.tsx` when a tighter boundary is useful — `settings/loading.tsx` does this, rendering a shimmer skeleton that mirrors the page's header + avatar + sections layout so the swap-in feels seamless. The skeleton inherits the slide-in animation from `settings/layout.tsx` because the layout wraps `{children}`, which is what Next.js fills with the loading fallback before swapping in the page.

## Conventions

- **Server Components by default**; only add `"use client"` when you genuinely need browser-only behavior. The protected layout and feature pages are server components.
- All user-facing strings go through `next-intl`. Add the key in both [`messages/en.json`](../messages/en.json) and [`messages/fr.json`](../messages/fr.json) — never hardcode in the component. Navigation labels live under `navigation.*`, per-feature copy under `app.<feature>.*`.
- In Server Components, prefer the async API: `await getTranslations(ns)` from `next-intl/server`. The sync `useTranslations` hook is reserved for Client Components (`"use client"`).
- For internal links, import `Link` from [`@/lib/i18n/navigation`](../lib/i18n/navigation.ts) — it prefixes the current locale automatically. Plain `next/link` will lose the locale and silently fall back to English via the proxy rewrite.
- Auth + profile helper: [`lib/profile.ts`](../lib/profile.ts) (`getAuthenticatedProfile()`). Raw Supabase clients come from [`lib/supabase/server.ts`](../lib/supabase/server.ts) and [`lib/supabase/client.ts`](../lib/supabase/client.ts).
- Page filenames are lowercase (`page.tsx`, `layout.tsx`, `loading.tsx`); route segments are kebab-case (`forgot-password/`, `sign-up-success/`).

## Where the product spec lives

The full product specification (screens, navigation, interaction rules) is in [`docs/PRODUCT_SPEC.md`](../docs/PRODUCT_SPEC.md).

For canonical UX terminology and tone, read [`docs/UX_WRITING.md`](../docs/UX_WRITING.md).
