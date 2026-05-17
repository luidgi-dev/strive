-- user_credits
  -- one row per user, tracks monthly AI credit usage and reset window
  -- created automatically on sign-up via trigger (see triggers/handle_new_user.sql)
  
  drop table if exists user_credits cascade;

  create table user_credits (
      user_id    uuid primary key references profiles(id) on delete cascade,
      balance    int not null default 5,
      used       int not null default 0,
      reset_at   timestamptz not null default (date_trunc('month', now()) + interval '1 month'),
      updated_at timestamptz not null default now()
  );
  
  -- rls
  alter table user_credits enable row level security;

  create policy "users can read their own credits"
      on user_credits for select
      using (auth.uid() = user_id);
  
  create policy "users can update their own credits"
      on user_credits for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);