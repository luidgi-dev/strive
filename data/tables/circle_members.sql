-- circle_members
-- membership table for circles (phase 4 - table created empty)

drop table if exists circle_members cascade;

create table circle_members (
    id        uuid primary key default gen_random_uuid(),
    circle_id uuid not null references circles(id) on delete cascade,
    user_id   uuid not null references profiles(id) on delete cascade,
    role      text check (role in ('admin', 'member')),
    joined_at timestamptz not null default now()
);

-- rls
alter table circle_members enable row level security;

create policy "users can view circle members"
    on circle_members for select
    using (auth.uid() = user_id);

create policy "circle owners can manage members"
    on circle_members for all
    using (
        auth.uid() = (select owner_id from circles where id = circle_id)
    )
    with check (
        auth.uid() = (select owner_id from circles where id = circle_id)
    );