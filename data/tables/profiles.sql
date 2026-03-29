-- profiles
-- extends auth.users (1:1)
-- automatically created on user sign-up via trigger

drop table if exists profiles cascade;

create table profiles (
    id         uuid primary key references auth.users(id) on delete cascade,
    username   text unique not null,
    avatar_url text,
    timezone   text not null default 'UTC',
    is_active  boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- rls
alter table profiles enable row level security;

-- select: all profiles are publicly readable (needed for social features)
create policy "public profiles are viewable by everyone"
    on profiles for select
    using (true);

-- insert: users can only create their own profile
create policy "users can insert their own profile"
    on profiles for insert
    with check (auth.uid() = id);

-- update: users can only update their own profile
create policy "users can update their own profile"
    on profiles for update
    using (auth.uid() = id)
    with check (auth.uid() = id);

-- delete: users can only delete their own profile
create policy "users can delete their own profile"
    on profiles for delete
    using (auth.uid() = id);