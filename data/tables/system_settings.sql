-- system_settings
-- global application settings, constrained to a single row (id = true).
-- ai_enabled is the global kill-switch for every AI route: flip it to false to
-- pause AI app-wide without a redeploy (see lib/ai/guard.ts).

drop table if exists system_settings cascade;

create table system_settings (
    id         boolean primary key default true check (id),
    ai_enabled boolean not null default true,
    updated_at timestamptz not null default now()
);

-- rls
alter table system_settings enable row level security;

-- read-only for client/server sessions; the kill-switch is flipped via sql /
-- service role only (no insert/update/delete policy is intentional).
create policy "authenticated users can read system settings"
    on system_settings for select
    to authenticated
    using (true);
