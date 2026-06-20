# data/

This folder contains everything related to the Strive database: table definitions, seeds, triggers, views, and the migration runner.

---

## Folder structure

```
data/
├── migrate.py                  # migration runner — executes all files in order
│
├── tables/                     # one file per table, in dependency order
│   ├── ritual_categories.sql
│   ├── profiles.sql
│   ├── user_credits.sql
│   ├── tier_quotas.sql         # monthly AI credit quota per tier (reference)
│   ├── system_settings.sql     # global settings incl. AI kill-switch (singleton)
│   ├── rituals.sql
│   ├── log_statuses.sql
│   ├── ritual_logs.sql
│   ├── insights.sql            # cached AI Insight Cards (premium); written by the cron
│   ├── push_subscriptions.sql
│   ├── circles.sql             # social groups (max 8 members)
│   ├── circle_members.sql      # circle membership
│   ├── circle_invites.sql      # shareable invite links (/i/[code])
│   ├── nudges.sql              # in-app waves between circle members
│   └── circle_rituals.sql      # opt-in: rituals a member shares in a circle
│
├── functions/                  # sql functions
│   ├── is_circle_member.sql            # security-definer helper, breaks circle RLS recursion (pre-tables)
│   ├── generate_circle_invite_code.sql # 8-char invite code, default for circle_invites.code (pre-tables)
│   ├── consume_ai_credit.sql   # atomically reserves one AI credit (caller-scoped)
│   ├── refund_ai_credit.sql    # returns a reserved credit when an AI call fails
│   └── reset_ai_credits.sql    # monthly reset to tier quota for due users
│
├── triggers/
│   ├── handle_new_user.sql              # auto-creates profile + user_credits rows on auth sign-up
│   └── enforce_circle_member_limit.sql  # rejects a 9th member (8-member product cap)
│
├── cron/                       # pg_cron schedules, applied last
│   └── reset_ai_credits.sql    # daily job that calls reset_ai_credits()
│
├── storage/                    # Supabase Storage buckets + RLS policies
│   └── user_assets_bucket.sql  # user-assets bucket (avatars, etc.)
│
├── seeds/
│   ├── seed_log_statuses.sql   # reference data: completed, rest, missed, partial
│   ├── seed_ritual_categories.sql  # system categories: Sport, Nutrition, etc.
│   ├── seed_test.sql           # fake data for local dev and view testing only
│   └── seed_circles_dev.sql    # one populated circle (real accounts) — manual, not in migrate.py
│
├── tests/
│   └── circles_rls.sql         # RLS + cap-trigger checks, runs in a rolled-back transaction
│
└── views/
    ├── daily_summary.sql
    ├── ritual_log_history.sql
    └── ritual_progress.sql

```

---

## Database overview

Strive uses **Supabase (PostgreSQL)** as its database. Row Level Security (RLS) is enabled on every table — users can only access their own data.

### Tables


| Table                | Description                                                                             |
| -------------------- | --------------------------------------------------------------------------------------- |
| `profiles`           | Extends `auth.users` (1:1). Created automatically on sign-up via trigger. Holds `tier` (`lite` / `premium` / `lifetime`). |
| `user_credits`       | One row per user. Monthly AI-log balance + reset window. Auto-created on sign-up via trigger. |
| `tier_quotas`        | Reference table: monthly AI credit quota per tier. Read-only for clients. Single source of truth for the guard and the monthly reset. |
| `system_settings`    | Single-row global settings. `ai_enabled` is the app-wide AI kill-switch. Read-only for clients; flipped via SQL / service role. |
| `ritual_categories`  | System-wide and user-defined categories. Rows with `user_id = null` are visible to all. |
| `rituals`            | Core entity. Three types: `recurring`, `one_time`, `open`.                              |
| `log_statuses`       | Reference table: `completed`, `rest`, `missed`, `partial`. Read-only for clients.       |
| `ritual_logs`        | One row per logged ritual occurrence. Multiple logs per day are allowed.                |
| `insights`           | Cached AI Insight Cards (premium). Written by the weekly/monthly cron under the **service role** (no user INSERT/DELETE policy); users only read and dismiss their own. `cadence` + `period_start` form the per-report identity. See [`design/insights-page.md`](../design/insights-page.md). |
| `push_subscriptions` | Web Push credentials for PWA notifications (used in Phase 3).                           |
| `circles`            | Social groups. A circle is a capped "trust circle" (max 8 members). `owner_id` is the creator; `description` is optional. |
| `circle_members`     | Circle membership (`role` = `admin` for the owner, else `member`). Unique per `(circle_id, user_id)`. Capped at 8 by a trigger. |
| `circle_invites`     | Shareable invite links (Discord-style). Auto-generated `code`, 7-day `expires_at`, optional `max_uses`. A circle can hold several active links. |
| `nudges`             | Lightweight in-app waves between members of the same circle. No push, no email. `seen_at` null = unread. |
| `circle_rituals`     | Opt-in join table: which of a member's own rituals are surfaced in a given circle. Anything not listed stays private. |


### Views


| View                   | Description                                                                    |
| ---------------------- | ------------------------------------------------------------------------------ |
| `v_ritual_progress`    | One row per active ritual with current period progression and completion rate. |
| `v_daily_summary`      | Daily snapshot: total rituals, logged today, remaining today.                  |
| `v_ritual_log_history` | Full log history per ritual, used for heatmap and arc visualization.           |


### What is not a table

- **Momentum** — computed on the fly via views and SQL functions. Never stored.
- **Momentum badges** — computed in application logic (Phase 2/3). No table needed.
- **Notification history** — out of scope for Phase 1.

### Circles RLS design (Phase 4)

The social tables enforce "no cross-user data without verified membership" entirely in the database:

- **`is_circle_member(circle_id, user_id)`** is a `security definer` helper. Membership-visibility policies need to ask "is the caller a member of this circle?", but querying `circle_members` from inside its own policy would raise *infinite recursion*. The helper runs as the function owner for that one scoped lookup, so every policy stays simple. It is applied **before** the tables (their policies reference it).
- **Member inserts are owner-only.** Only the circle owner can self-insert (the create-circle flow). Every other join goes through `redeem_circle_invite()` (added in LUI-65), a `security definer` function that validates the invite (expiry, cap, `max_uses`, already-member) — so a user can never self-insert into an arbitrary circle by hitting the table directly.
- **The 8-member cap is a trigger** (`enforce_circle_member_limit`), not app logic, so no client can bypass it.
- **Invites are never world-readable.** The public `/i/[code]` landing reads through a `security definer` preview function (LUI-65), so the anon role can't enumerate the `circle_invites` table.
- **Shared rituals are opt-in.** A row in `circle_rituals` only exists for rituals a member explicitly shared, and the insert policy verifies the ritual is theirs. Private rituals never appear.

Verify the policies and the cap with the test script (it runs inside a transaction and rolls back, so it touches nothing):

```bash
psql "$DATABASE_URL" -f tests/circles_rls.sql
```

The dev seed (`seeds/seed_circles_dev.sql`) creates one populated circle from the real accounts so the Circles UI has something to render. It resolves accounts by username and is **not** part of `migrate.py`:

```bash
psql "$DATABASE_URL" -f seeds/seed_circles_dev.sql
```

### Storage buckets

Supabase Storage buckets and their RLS policies live in [`storage/`](./storage/). They are not table definitions and are kept separate from the `migrate.py` pipeline — apply them once via the Supabase SQL Editor or by extending `migrate.py` with a `STORAGE` block.

| Bucket        | File                                | Path convention                | Notes                                                                                                 |
| ------------- | ----------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `user-assets` | [`storage/user_assets_bucket.sql`](./storage/user_assets_bucket.sql) | `avatars/{user.id}/{filename}` | Public read. Writes (`INSERT`/`UPDATE`/`DELETE`) restricted to the authenticated user's own folder. |

---

## Running the migration

### Prerequisites

```bash
pip install psycopg2-binary python-dotenv
```

Create a `.env` file at the project root (or in `data/`):

```env
DATABASE_URL=postgresql://postgres:<password>@<host>:5432/postgres
```

You'll find your `DATABASE_URL` in Supabase → Settings → Database → Connection string (session mode).

### Run

```bash
cd data
python migrate.py
```

The runner executes files in this order:

1. **Pre-table functions** — helpers that table policies / column defaults reference (`is_circle_member`, `generate_circle_invite_code`), so they must exist before the tables.
2. **Tables** — in dependency order (categories before profiles before rituals, etc.)
3. **Functions** — after tables (credit consume/refund/reset)
4. **Triggers** — after tables are created
5. **Seeds** — reference data (log statuses, system categories, tier quotas, settings)
6. **Views** — depend on all tables
7. **Cron** — last; `pg_cron` schedules

> **pg_cron**: the monthly reset job (`cron/reset_ai_credits.sql`) needs the
> `pg_cron` extension. On Supabase, enable it once under **Database > Extensions**.
> The cron step runs last so the rest of the schema still applies if `pg_cron`
> is not yet available.

### Running the test seed (local dev only)

The test seed inserts fake users, rituals, and logs so you can validate views immediately. It is **never run in production**.

```bash
# from supabase sql editor (service_role, bypasses RLS and auth.users FK)
# or via psql with your service_role key
psql $DATABASE_URL -f seeds/seed_test.sql
```

> The test seed uses fixed UUIDs so it is safe to re-run — `on conflict do nothing` prevents duplicate inserts.

---

## Key conventions

- All SQL is written in **lowercase**.
- Every table with a `user_id` has **RLS enabled**.
- `timestamptz` is used everywhere (never `timestamp`) to handle per-user timezones correctly.
- `id` columns are always `uuid` with `gen_random_uuid()` — never `bigint`.
- Derived data (momentum, completion rate) is **computed, never stored**.

```

```

