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
│   ├── rituals.sql
│   ├── log_statuses.sql
│   ├── ritual_logs.sql
│   ├── push_subscriptions.sql
│   ├── circles.sql
│   └── circle_members.sql
│
├── triggers/
│   └── handle_new_user.sql     # auto-creates a profile row on auth sign-up
│
├── seeds/
│   ├── seed_log_statuses.sql   # reference data: completed, rest, missed, partial
│   ├── seed_ritual_categories.sql  # system categories: Sport, Nutrition, etc.
│   └── seed_test.sql           # fake data for local dev and view testing only
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
| `profiles`           | Extends `auth.users` (1:1). Created automatically on sign-up via trigger.               |
| `ritual_categories`  | System-wide and user-defined categories. Rows with `user_id = null` are visible to all. |
| `rituals`            | Core entity. Three types: `recurring`, `one_time`, `open`.                              |
| `log_statuses`       | Reference table: `completed`, `rest`, `missed`, `partial`. Read-only for clients.       |
| `ritual_logs`        | One row per logged ritual occurrence. Multiple logs per day are allowed.                |
| `push_subscriptions` | Web Push credentials for PWA notifications (used in Phase 3).                           |
| `circles`            | Social groups — scaffolded, empty until Phase 4.                                        |
| `circle_members`     | Circle membership — scaffolded, empty until Phase 4.                                    |


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

1. **Tables** — in dependency order (categories before profiles before rituals, etc.)
2. **Triggers** — after tables are created
3. **Seeds** — reference data (log statuses, system categories)
4. **Views** — last, as they depend on all tables

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

