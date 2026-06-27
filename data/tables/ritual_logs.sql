-- ritual_logs
-- one row per logged ritual occurrence
-- no unique constraint on (ritual_id, logged_at): supports multiple logs per day

drop table if exists ritual_logs cascade;

create table ritual_logs (
    id         uuid primary key default gen_random_uuid(),
    ritual_id  uuid not null references rituals(id) on delete cascade,
    user_id    uuid not null references profiles(id) on delete cascade,
    status_id  text not null references log_statuses(id),
    logged_at  date not null,
    note       text,
    logged_via text check (logged_via in ('manual', 'ai', 'auto')),
    created_at timestamptz not null default now()
);

-- rls
alter table ritual_logs enable row level security;

create policy "users can manage their own ritual logs"
    on ritual_logs for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- indexes
-- user_id: the RLS policy filters every query on auth.uid() = user_id
create index ritual_logs_user_id_idx on ritual_logs (user_id);
-- (ritual_id, logged_at): join key for the progress/summary/history views and
-- the per-week date-range lookups (getWeekCompletedLogs)
create index ritual_logs_ritual_id_logged_at_idx on ritual_logs (ritual_id, logged_at);