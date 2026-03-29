-- log_statuses
-- reference table for ritual log states
-- seeded at init, read-only for clients

drop table if exists log_statuses cascade;

create table log_statuses (
    id    text not null primary key,
    label text not null
);

-- rls
alter table log_statuses enable row level security;

-- select: anyone can read log statuses (reference data)
create policy "log statuses are publicly readable"
    on log_statuses for select
    using (true);

-- no insert/update/delete policies: clients cannot mutate reference data