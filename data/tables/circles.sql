-- circles
-- social groups (phase 4 - table created empty)

drop table if exists circles cascade;

create table circles (
    id         uuid primary key default gen_random_uuid(),
    name       text not null,
    owner_id   uuid not null references profiles(id) on delete cascade,
    created_at timestamptz not null default now()
);

-- rls
alter table circles enable row level security;

create policy "users can manage their own circles"
    on circles for all
    using (auth.uid() = owner_id)
    with check (auth.uid() = owner_id);