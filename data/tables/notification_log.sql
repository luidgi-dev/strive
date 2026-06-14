-- notification_log
-- one row per notification sent to a user. Backs dedup + anti-spam: the unique
-- constraint enforces "max one notification of a given type per user per day"
-- (the day is the user's local date). Reused across reminder types (LUI-86).

drop table if exists notification_log cascade;

create table notification_log (
    id         uuid primary key default gen_random_uuid(),
    user_id    uuid not null references profiles(id) on delete cascade,
    type       text not null,          -- 'ritual_reminder' | 'insight_ready' (LUI-86)
    sent_on    date not null,          -- user-local date of the send
    created_at timestamptz not null default now(),
    unique (user_id, type, sent_on)
);

-- rls
alter table notification_log enable row level security;

-- Operational rows, not user data: written and read only by the service-role
-- reminders cron (which bypasses RLS). No user-facing policies are defined, so a
-- normal user session sees zero rows.
