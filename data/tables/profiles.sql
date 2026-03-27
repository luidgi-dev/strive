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
    timezone text not null,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
);


alter table profiles enable row level security;

create policy "users can read their own profile"
  on profiles for select using (auth.uid() = id);

create policy "users can update their own profile"
  on profiles for update using (auth.uid() = id);


create policy "users can delete their own profile"
  on profiles for delete using (auth.uid() = id);

create policy "users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);