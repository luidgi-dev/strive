# UX Flow — Global Navigation

A readable map of Strive's screens, how they connect, and the global entry points. Prose detail lives in [`../docs/PRODUCT_SPEC.md`](../docs/PRODUCT_SPEC.md); canonical terminology in [`../docs/UX_WRITING.md`](../docs/UX_WRITING.md). This doc is grounded in the actual routes under `app/[locale]/`.

## Vocabulary (canonical — see UX_WRITING.md)

- **Rhythm** — the daily view: today's rituals to log, with momentum at a glance.
- **Rituals** — the ritual board: the full library of the user's rituals.
- **The Arc** — the 12-week consistency view on a ritual's detail page.
- **Circles** — the social space (scaffolded; light in the initial release).
- **Momentum** — progress signal (Strong / Steady / Resting); never "streak".
- **log / rest** — recording a ritual; a day without logging (neutral, never "failure").

## Screens

### Public / auth (`app/[locale]/`)

| Route | Purpose |
|---|---|
| `/` | Landing page (marketing; previews of Rhythm, The Arc, AI chat). |
| `/auth/login` | Sign in. |
| `/auth/sign-up` → `/auth/sign-up-success` | Create account, then "check your email". |
| `/auth/confirm` → `/auth/confirmed` | Email confirmation endpoint, then success. |
| `/auth/forgot-password` → `/auth/update-password` | Password reset request, then set a new one. |
| `/auth/error` | Auth failure fallback. |

### Authenticated app (`app/[locale]/protected/(app)/`)

| Route | Surface | Purpose |
|---|---|---|
| `/protected/flow` | **Rhythm** | Home. Today's rituals to log + momentum at a glance. |
| `/protected/rituals` | **Rituals** | The board: all active rituals, grouped by category. |
| `/protected/rituals/[id]` | Ritual detail | Logging, history, and **The Arc** (12 weeks). |
| `/protected/rituals/archived` | Archived | Read-only list of archived rituals; restore from here. |
| `/protected/circles` | **Circles** | Social/inspiration space. |
| `/protected/settings` | Settings | Profile, preferences, membership. |

Auth gating + session refresh happen in `proxy.ts` (Next.js Proxy); pages assume an authenticated user.

## Main transitions

```
Landing ──▶ Auth ──▶ Rhythm (/protected/flow)
                         │
        ┌────────────────┼─────────────────┐
        ▼ (bottom tabs)  ▼                  ▼
     Rhythm ◀──────▶ Rituals ◀──────▶ Circles
                         │
                         ▼ (tap a ritual)
                   Ritual detail + The Arc
                         │  (archive → )  Archived rituals

   Avatar (header) ──▶ Settings
   FAB (sparkles)  ──▶ My Strive (AI chat overlay, any app screen)
```

## Global entry points

- **Bottom tab bar** — `components/ui/bottom-nav.tsx`. Three tabs: **Rhythm** (`/protected/flow`), **Rituals** (`/protected/rituals`), **Circles** (`/protected/circles`). The active tab is highlighted; the bar is fixed to the bottom with safe-area padding.
- **AI chat FAB** — `components/ui/strive-ai-fab.tsx` opens the floating "My Strive" panel (`components/chat/chat-panel.tsx`), anchored above the FAB over a blurred Rhythm backdrop. Available from anywhere in the app. See [`chat-design.md`](chat-design.md).
- **Avatar (header)** — `components/layout/protected-header.tsx`. Top-right avatar → `/protected/settings`.

### Hide rules (keep the focus surfaces clean)

- On **Settings** (`/protected/settings` and sub-routes): bottom nav, FAB, and header avatar are hidden.
- On a **ritual detail** page (`/protected/rituals/*`): the header avatar is hidden (the page has its own back arrow); the bottom nav and FAB stay.

## Notes

- Mobile-first PWA; the layouts above are designed for a phone and scale up.
- New surfaces start as an HTML wireframe in [`wireframes/`](wireframes/) before React (see [`README.md`](README.md)).
