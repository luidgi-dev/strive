-- Active: 1774638899369@@db.hjevipotibuxgsdktpeo.supabase.co@5432@postgres
# Profiles table
## Extends auth.users table
## Adds additional fields for profile information
## Created automatically when a user is created via trigger

drop table if exists profiles;
create table if not exists profiles (
  
    id uuid primary key references auth.users(id) on delete cascade,
    username text unique not null,
    avatar_url text,
    timezone text not null default 'UTC',
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
);


alter table profiles enable row level security;

-- POLICY: SELECT (Read)
-- Allows anyone to see a profile (useful for social features/displaying names)
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using ( true );

-- POLICY: UPDATE
-- Allows users to modify only their own data
create policy "Users can update their own profile"
  on public.profiles for update
  using ( auth.uid() = id )
  with check ( auth.uid() = id );

-- POLICY: DELETE
-- Allows users to delete only their own profile
create policy "Users can delete their own profile"
  on public.profiles for delete
  using ( auth.uid() = id );

