-- ritual_categories
-- stores system-wide and user-defined ritual categories
-- rows with user_id = null are system categories visible to all users

-- drop and recreate (safe for local dev migrations)
drop table if exists ritual_categories cascade;

create table ritual_categories (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid references profiles(id) on delete cascade,
    name        text not null,
    description text,
    icon        text,
    color       text,
    is_active   boolean not null default true,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

-- rls
alter table ritual_categories enable row level security;

-- select: system categories (user_id is null) are visible to everyone
-- custom categories (user_id is set) are visible only to their owner
create policy "users can view relevant ritual categories"
    on ritual_categories for select
    using (user_id is null or auth.uid() = user_id);

-- insert: users can only create categories for themselves
create policy "users can insert their own ritual categories"
    on ritual_categories for insert
    with check (auth.uid() = user_id);

-- update: users can only update their own categories
create policy "users can update their own ritual categories"
    on ritual_categories for update
    using (auth.uid() = user_id);

-- delete: users can only delete their own categories
create policy "users can delete their own ritual categories"
    on ritual_categories for delete
    using (auth.uid() = user_id);

