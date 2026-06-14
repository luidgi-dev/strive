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
| `ritual_reminder` | The user has **one-time** rituals **due today** and not yet logged. | Once each morning (~8am local) |
| `evening_nudge` | The user has rituals to do today but logged **nothing** by evening. | Once each evening (~9pm local) |
| `insight_ready` | A new insight has just been generated for the user. | Weekly (Mon) + monthly (1st) |

`ritual_reminder` firing conditions (grounded in the `rituals` schema):

- **One-time rituals only** (`ritual_type = 'one_time'`, `due_date = today`). These
  are dated, one-off events that are easy to forget — exactly what a reminder helps
  with. **Recurring and `open` rituals never trigger here**: a daily "you have N
  habits" push would become noise. Recurring habits are covered by the gentler
  `evening_nudge` below.
- Fires **only if no completed `ritual_log` exists** for the ritual (a one-time
  ritual is done once logged).
- Respects `is_active` and `archived_at`.
- **Timing:** one morning send (~8am in the user's `profiles.timezone`), not per
  ritual — a single notification covers the day's one-time rituals. Copy: title
  `Reminder` / `Rappel`; body `Today's ritual: {name}` when there's one,
  `Today's rituals: {n} planned` when several.

`evening_nudge` firing conditions:

- Fires only if the user **logged nothing today** (no `ritual_log` of any status)
  **and** still has ≥1 ritual to clear on today's Rhythm. "On today's Rhythm" reuses
  `selectTodayRituals` ([`lib/rhythm/today-rituals.ts`](../lib/rhythm/today-rituals.ts)),
  so it matches exactly what the user sees: daily rituals every day, weekly/monthly
  rituals on their scheduled weekdays (or every day when no day is set) **until the
  period target is met** (a met weekly/monthly target drops off — no nagging), and
  `open` rituals never count on their own.
- **Timing:** one evening send (~9pm in the user's `profiles.timezone`). Copy: title
  `Reminder` / `Rappel`; body `Keep today's momentum going` / `Garde ton momentum
  aujourd'hui`; deep-links to the day view (`/protected/flow`).
- `ritual_reminder` and `evening_nudge` share the **same hourly pg_cron trigger**
  ([`app/[locale]/api/cron/reminders/route.ts`](../app/[locale]/api/cron/reminders/route.ts)),
  routed by the user's local hour (8 → morning, 21 → evening).

`insight_ready` fires **inline from the Insights cron**
([`app/[locale]/api/cron/insights/route.ts`](../app/[locale]/api/cron/insights/route.ts)),
right after a user's generation produces ≥1 new card (weekly Mon, monthly 1st — see
[`vercel.json`](../vercel.json)), gated on opt-in + a subscription. Copy: title
`Weekly insights` / `Monthly insights` (by cadence), body `Ready to explore in Strive`;
deep-links to the **Insights tab** (`/protected/settings/insights`). The page is global
(no per-ritual view) — the ritual is named inside each card's text. Deduped to once per
user-local day via `notification_log`.

Future types (e.g. circle activity) will be added to this table when scoped — not
implemented speculatively.

---

## 4. Anti-spam — frequency caps

Hard limits, enforced server-side before sending, backed by the `notification_log`
table (`unique (user_id, type, sent_on)`):

- **`ritual_reminder`:** max **1 per user per day** (one morning digest, not per ritual).
- **`evening_nudge`:** max **1 per user per day**.
- **`insight_ready`:** max **1 per day** (cadence already makes this ~1/week + 1/month).
- **Global cap:** max **3 notifications per user per day**, all types combined (a busy
  day could be morning reminder + evening nudge + insight = 3, the ceiling).

The cron **inserts the `notification_log` row before sending** (claim-then-send), so
an overlapping run or a crash mid-send can never duplicate. When the global cap would
be exceeded, **priority** decides what gets dropped.

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

**Title rule:** keep the `title` **short** and **never the app name**. iOS adds
"from Strive" on its **own line** under the title for an installed PWA, so the header
is always two lines — the title length can't change that, and a "Strive" title just
duplicates the attribution. So the title is a short type label (e.g. `Reminder`) and
the **detail goes in the body**. See
[`design/wireframes/push-notification.html`](wireframes/push-notification.html).

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
| Once-per-day claim-then-send helper (both crons) | [`lib/push/notify.ts`](../lib/push/notify.ts) |
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

## 9. Scheduling decision

**Send logic always runs in the Node/Vercel route** (`web-push` needs Node crypto;
this reuses `CRON_SECRET` bearer auth + the service-role admin client + chunked
fan-out, like the Insights route). The open question is only *what triggers it*.

- **Insights** (`/api/cron/insights`, weekly + monthly) → **Vercel Cron**
  ([`vercel.json`](../vercel.json)). Daily-or-coarser, fits even Vercel Hobby.
- **Reminders** (`/api/cron/reminders`, hourly) → **Supabase pg_cron**. Reminders
  must run sub-daily to hit local-morning/evening in **each user's timezone**, but
  Vercel Hobby crons are daily-only and capped at 2 jobs (both used by Insights).
  pg_cron fires hourly for free and `POST`s the route via `pg_net` with the
  `CRON_SECRET` bearer. (On Vercel Pro this could instead be a Vercel cron — same
  route; only the trigger changes.)

The reminders route lists users with `smart_reminders_enabled = true`, `is_active`,
and ≥1 `push_subscriptions` row, then routes each by their **local hour** — `8` →
`ritual_reminder` (morning one-time), `21` → `evening_nudge` — dedups via
`notification_log`, and calls `deliverToUser`. One hourly job covers both slots.

### pg_cron / pg_net trigger setup (run once in Supabase)

The bearer secret is kept in **Supabase Vault**, not inlined — so the recurring
command in `cron.job` never stores the `CRON_SECRET` in plaintext.

```sql
-- 1. Enable the extensions (Supabase: Database → Extensions, or:)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2. Store the bearer secret in Vault (run once). Use the real CRON_SECRET value.
select vault.create_secret('<CRON_SECRET>', 'cron_secret', 'Bearer secret for the reminders cron');

-- 3. Hourly at minute 0 (UTC): POST the reminders route, reading the secret from
--    Vault so it isn't persisted in cron.job. Replace <APP_URL>.
select cron.schedule(
  'ritual-reminders-hourly',
  '0 * * * *',
  $$
  select net.http_post(
    url     := 'https://<APP_URL>/api/cron/reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret'),
      'Content-Type', 'application/json'
    )
  );
  $$
);
```
> One hourly job covers both the morning (8h) and evening (21h) slots — the route
> branches on each user's local hour. Inspect runs with
> `select * from cron.job_run_details order by start_time desc limit 10;`.

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

**`notification_log`** (see [`../data/tables/notification_log.sql`](../data/tables/notification_log.sql)):
one row per notification sent — `user_id`, `type`, `sent_on`, with
`unique (user_id, type, sent_on)` backing dedup + the per-type daily cap. Added in
LUI-85. Operational data: RLS on, no user policies (only the service-role cron
touches it).

Migrations are applied **manually** in the Supabase SQL editor (not via `migrate.py`):

```sql
-- LUI-82
alter table push_subscriptions add column if not exists locale text not null default 'en';
alter table push_subscriptions add constraint push_subscriptions_locale_check check (locale in ('en', 'fr'));
alter table push_subscriptions add constraint push_subscriptions_endpoint_key unique (endpoint);

-- LUI-84
alter table profiles add column if not exists smart_reminders_enabled boolean not null default false;

-- LUI-85
create table if not exists notification_log (
    id         uuid primary key default gen_random_uuid(),
    user_id    uuid not null references profiles(id) on delete cascade,
    type       text not null,
    sent_on    date not null,
    created_at timestamptz not null default now(),
    unique (user_id, type, sent_on)
);
alter table notification_log enable row level security;
```
