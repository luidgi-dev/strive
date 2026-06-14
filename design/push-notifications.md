# Push Notifications — rules & stack

How Strive sends notifications, and **when it is allowed to**. Half product rules
(style, triggers, frequency), half technical reference (the Web Push stack and how
to run it). Read this before implementing any notification trigger.

Tokens/voice stay canonical in [`../docs/DESIGN_SYSTEM.md`](../docs/DESIGN_SYSTEM.md)
and [`../docs/UX_WRITING.md`](../docs/UX_WRITING.md) — this file references them,
never duplicates them. Terminology note: the user-facing word is **Reminder**,
never "Alert" or "Push" (see `UX_WRITING.md`).

> **Status.** The Web Push stack was validated end to end in LUI-82 (this branch).
> The governance rules below are the contract for the implementation issues
> (one-time reminders, recurring reminders, insight notifications). The reminders
> **scheduler** is not built yet — only the manual self-test path exists today.

---

## 1. The one principle: never intrusive

Strive speaks like a calm coach. Notifications are a **plus, not a nag**. Fewer,
well-timed reminders beat frequent ones. Everything below enforces that.

---

## 2. Opt-in — no notification without explicit consent

- A user receives notifications **only** after enabling **Smart reminders** in
  *Settings → Preferences* (the toggle wired in
  [`preferences-section.tsx`](../app/[locale]/protected/(app)/settings/components/preferences-section.tsx)).
- Enabling asks the browser for permission, stores a push subscription for the
  device, and sets the account-level intent `profiles.smart_reminders_enabled = true`.
  Disabling flips it back to `false` and removes the device's subscription.
- Two layers, both required to receive: **intent** (`smart_reminders_enabled`, the
  account kill-switch the cron checks) and **transport** (a row in `push_subscriptions`
  for at least one device). No intent or no subscription ⇒ no notification. There is
  no implicit enrollment.
- **iOS** receives push **only when Strive is installed to the home screen** (PWA)
  on iOS 16.4+. Until then the toggle is shown disabled with an "add to home screen"
  hint — never a broken switch.

---

## 3. Allowed triggers

Each notification belongs to exactly one **type**. Only these types may fire; a new
type is added here first, then implemented.

| Type | Fires when | Cadence |
|---|---|---|
| `ritual_reminder` | A scheduled ritual is due soon and **not yet logged** for that occurrence. | Per scheduled occurrence (see below) |
| `insight_ready` | A new insight has just been generated for the user. | Weekly (Mon) + monthly (1st) |

`ritual_reminder` firing conditions (grounded in the `rituals` schema):

- Applies to `one_time` and `recurring` rituals **only**. `open` rituals have no
  target or date and never trigger.
- The ritual must have a scheduled moment:
  - `one_time` → uses `due_date` (always present), plus optional `scheduled_time`.
  - `recurring` → only if the user set `scheduled_days` and/or `scheduled_time`.
- Fires **only if no `ritual_log` exists** for that ritual on that date (already
  logged ⇒ no reminder).
- **Timing:** when `scheduled_time` is set, fire **5 minutes before** it, in the
  user's `profiles.timezone`. When no time is set, fire once at a default daily
  anchor for the due date.
- Respects the ritual's `started_at`/`ends_at` window, `is_active`, and `archived_at`.

`insight_ready` mirrors the existing Insights cron cadence (every Monday + the 1st
of each month — see [`vercel.json`](../vercel.json)); at most one per generation.

Future types (e.g. circle activity) will be added to this table when scoped — not
implemented speculatively.

---

## 4. Anti-spam — frequency caps

Hard limits, enforced server-side before sending:

- **`ritual_reminder`:** max **1 per ritual per day**.
- **`insight_ready`:** max **1 per day** (cadence already makes this ~1/week + 1/month).
- **Global cap:** max **3 notifications per user per day**, all types combined.

When the global cap would be exceeded, **priority** decides what gets dropped.

---

## 5. Priority

`ritual_reminder` **>** `insight_ready`.

A reminder is time-sensitive (a ritual is about to be missed); an insight is not.
If both contend for the same slot or the daily cap, the reminder wins.

---

## 6. Localization (mandatory)

Notifications are sent in the **user's language** (`en` / `fr`). Because a push is
sent server-side with no request URL to infer locale from, the locale is **captured
at opt-in** and stored on `push_subscriptions.locale`. The send path localizes each
device's payload with `getTranslations({ locale })` against `messages/{locale}.json`.

> Canonical evolution: a user-level `profiles.locale` (set from the Settings language
> switcher) would supersede the per-subscription locale. Out of scope for the
> exploration; documented so the next issue can pick it up.

All notification copy lives in `messages/{en,fr}.json` (namespace `notifications`) —
never hardcoded.

---

## 7. Payload format

The server sends a JSON payload; the service worker
([`public/sw.js`](../public/sw.js)) renders it. Contract:

| Field | Required | Role |
|---|---|---|
| `title` | yes | Notification title (localized) |
| `body` | yes | Notification body (localized) |
| `url` | no | Deep link opened on tap (defaults to `/`) |
| `tag` | no | Dedup key — a newer push with the same `tag` replaces the old one |
| `icon` | no | Defaults to `/web-app-manifest-192x192.png` |
| `badge` | no | Monochrome status-bar icon, defaults to `/favicon-96x96.png` |

Keep `public/sw.js` and the `PushPayload` type in
[`lib/push/server.ts`](../lib/push/server.ts) in sync — any new field must be handled
in both.

---

## 8. Technical stack

Standard **Web Push** — no third-party service. Self-hosted, VAPID-authenticated.

```
Settings toggle ──► lib/push/client.ts ──► saveSubscription (action) ──► push_subscriptions
                         (subscribe)                                          │
                                                                             ▼
   (trigger: self-test today, reminders cron later) ──► lib/push/server.ts (web-push + VAPID)
                                                                             │
                                                                             ▼
                                              browser push service ──► public/sw.js ──► notification
```

| Piece | File |
|---|---|
| Service worker (push + click) | [`public/sw.js`](../public/sw.js) |
| Browser opt-in helpers | [`lib/push/client.ts`](../lib/push/client.ts) |
| Server send + VAPID + dead-endpoint cleanup | [`lib/push/server.ts`](../lib/push/server.ts) |
| Mutations: save / remove subscription, set intent | [`lib/push/actions.ts`](../lib/push/actions.ts) |
| Recipient authorization guard (pure, unit-tested) | [`lib/push/recipients.ts`](../lib/push/recipients.ts) |
| Authenticated self-send route | `app/[locale]/api/notifications/send/route.ts` |
| Subscription storage | [`../data/tables/push_subscriptions.sql`](../data/tables/push_subscriptions.sql) |

UI **data mutations** (subscribe/unsubscribe, set intent) are **Server Actions**
(repo convention). **Sending** is a trigger, not a row mutation, so it lives in a
route: `/api/notifications/send` resolves the recipient from the verified session
and rejects any cross-user target with **403** (`authorizeRecipient`, no broadcast).

**Keys (VAPID).** A public/private pair authenticates the server to browser push
services. Generate once with `npx web-push generate-vapid-keys`; store as
`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`. **Never
hardcoded**, never committed (the private key is server-only).

**Dead endpoints.** A push endpoint returning `404`/`410` is permanently gone; the
send path deletes that row so the table self-heals and we never retry it.

---

## 9. Scheduling decision — Vercel Cron (not pg_cron)

Reminders that fire on a schedule will use **Vercel Cron**, consistent with the
existing Insights cron ([`vercel.json`](../vercel.json) → `/api/cron/insights`,
authorized by `CRON_SECRET`).

- ✅ The `web-push` library (VAPID signing + HTTPS delivery) runs naturally in the
  Node serverless runtime the cron route already uses.
- ✅ Reuses an established pattern (`CRON_SECRET` bearer auth, service-role admin
  client, chunked fan-out) — see the Insights route.
- ❌ **pg_cron** would force VAPID signing and HTTP delivery from inside Postgres
  (`pg_net` + plpgsql), adding complexity for no benefit here.

LUI-implementation: add `/api/cron/reminders` to `vercel.json` (a minute-granularity
schedule for the 5-min-before timing), select due rituals via the admin client
**for users with `profiles.smart_reminders_enabled = true`**, and call
`deliverToUser` from `lib/push/server.ts`.

---

## 10. Platform support & gotchas

| Platform | Supported | Notes |
|---|---|---|
| Chrome / Edge (desktop + Android) | ✅ | Works on `localhost` (secure context) |
| Firefox (desktop + Android) | ✅ | |
| Safari (macOS) | ✅ | macOS 13+ |
| Safari (iOS / iPadOS) | ⚠️ | **Only as an installed PWA**, iOS 16.4+ |
| iOS browser tab (not installed) | ❌ | Push APIs are absent until added to home screen |

Gotchas:

- **iOS install requirement** is the big one — communicate it in the UI, don't let
  the toggle look broken.
- **Permission needs a user gesture** — request it from the toggle click, not on load.
- **Subscriptions expire** silently (browser-rotated) → rely on the `404`/`410`
  cleanup above.
- **`userVisibleOnly: true`** is mandatory in Chrome — every push must show a
  notification (no silent pushes).
- **Desktop browser-tab notifications** show the page origin (e.g. `localhost:3000`,
  `striveapp.cc`) and the **browser's** icon (Chrome's), enforced by the browser/OS
  and not removable. Installing Strive as a PWA (desktop Install button, or iOS Add
  to Home Screen) re-attributes notifications to the app — Strive's name and icon,
  no origin line. Always evaluate the final look from the **installed** PWA.
- **Shared browser, two accounts** — endpoints are globally unique (`unique(endpoint)`).
  If user A enabled reminders on a browser and user B later signs in on that *same*
  browser without A unsubscribing, B's opt-in upsert targets A's row, which RLS won't
  let B update — so B's toggle fails (surfaced as an error, not silently). Acceptable
  edge for a personal tracker; the common single-user case works. A fix would reassign
  ownership via the service role, which `admin.ts` reserves for trusted jobs only.

---

## 11. How to test

**Desktop (now, local):**

1. `npm run dev`, sign in, open *Settings → Preferences*.
2. Toggle **Smart reminders** on → accept the browser permission prompt.
3. Click **Send test** → the notification appears (try Chrome and Safari).
4. Switch the app to `/fr`, re-toggle, send test → body arrives in French.

**iOS (via a public HTTPS preview):**

1. Open the Vercel preview URL in **Safari** on the iPhone → Share → **Add to Home
   Screen**.
2. Launch Strive from the home-screen icon, sign in, enable **Smart reminders**.
3. Click **Send test** → the notification appears on the lock screen.

> The **Send test** button renders only on dev and Vercel **preview** deploys
> (`VERCEL_ENV !== "production"`), so it can validate iOS reception on a preview while
> staying hidden on production. The underlying `/api/notifications/send` route is a
> real authenticated self-send. Both are exploration aids to be removed once the
> reminders cron lands.

---

## 12. Schema

**`push_subscriptions`** (see [`../data/tables/push_subscriptions.sql`](../data/tables/push_subscriptions.sql)):
one row per device subscription — `endpoint`, `p256dh`, `auth_key`, `locale`,
`user_id`. RLS scopes every row to its owner (a user can only read/write their own
subscriptions). The `locale` column and the `unique(endpoint)` constraint were added
in LUI-82.

**`profiles.smart_reminders_enabled`** (boolean, default `false`): the account-level
intent gate, added in LUI-84.

Migrations are applied **manually** in the Supabase SQL editor (not via `migrate.py`):

```sql
-- LUI-82
alter table push_subscriptions add column if not exists locale text not null default 'en';
alter table push_subscriptions add constraint push_subscriptions_locale_check check (locale in ('en', 'fr'));
alter table push_subscriptions add constraint push_subscriptions_endpoint_key unique (endpoint);

-- LUI-84
alter table profiles add column if not exists smart_reminders_enabled boolean not null default false;
```
