-- insights
-- one row per AI-generated Insight Card, cached so the page is a pure read.
--
-- Hybrid intelligence: the facts are computed in TypeScript/SQL by the Stats
-- Engine (lib/insights/calculators.ts); the AI only PHRASES them (headline +
-- body). The raw numbers live in `payload` so nothing the model writes can
-- invent a statistic.
--
-- Rows are written by scheduled jobs running under the service role (bypasses
-- RLS); users only read their own rows and may dismiss them. There is
-- deliberately no user INSERT/DELETE policy.
--
-- Two cadences coexist: a weekly report (Mondays) and a monthly report (the 1st).
-- `cadence` is part of the per-period identity so that when a Monday falls on the
-- 1st, both reports can be stored that day without clobbering each other.
--
-- NOTE: this table is applied on its own (SQL Editor / `psql -f`), never via a
-- full migrate.py run. It is listed in migrate.py only to document ordering.

drop table if exists insights cascade;

create table insights (
    id           uuid primary key default gen_random_uuid(),
    user_id      uuid not null references profiles(id) on delete cascade,
    cadence      text not null default 'weekly' check (cadence in ('weekly', 'monthly')),
    type         text not null check (type in ('correlation', 'adjustment', 'strength', 'best_day', 'anchor_pair')),
    headline     text not null,
    body         text not null,
    -- denormalized fallback; the page renders the basis from payload.weeksObserved
    -- so it can localize (FR/EN). Kept for debugging / non-localized surfaces.
    basis_label  text not null,
    confidence   numeric not null check (confidence >= 0 and confidence <= 1),
    -- the primary ritual the card is about (correlation: ritual A; adjustment:
    -- the ritual whose weekday underperforms). Nullable for future card types.
    ritual_id    uuid references rituals(id) on delete cascade,
    -- raw stats + action metadata + the locale used to phrase the card, e.g.
    -- { weeksObserved, effect, sampleSize, locale, ritualBId?, weekday?, ... }
    payload      jsonb not null default '{}',
    period_start date not null,
    period_end   date not null,
    generated_at timestamptz not null default now(),
    dismissed_at timestamptz,
    created_at   timestamptz not null default now()
);

-- The page reads the latest period's non-dismissed cards per cadence for a user.
create index insights_user_period_idx on insights (user_id, cadence, period_start desc);
create index insights_user_active_idx on insights (user_id) where dismissed_at is null;

-- rls
alter table insights enable row level security;

create policy "users can read their own insights"
    on insights for select
    using (auth.uid() = user_id);

-- users may only dismiss (set dismissed_at) their own insights. Generation
-- inserts/replacements run under the service role, which bypasses RLS.
create policy "users can update their own insights"
    on insights for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
