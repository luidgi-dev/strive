-- push_subscriptions
-- stores web push credentials for pwa notifications (phase 3)

drop table if exists push_subscriptions cascade;

create table push_subscriptions (
    id         uuid primary key default gen_random_uuid(),
    user_id    uuid not null references profiles(id) on delete cascade,
    endpoint   text not null,
    p256dh     text not null,
    auth_key   text not null,
    created_at timestamptz not null default now()
);

-- rls
alter table push_subscriptions enable row level security;

create policy "users can manage their own push subscriptions"
    on push_subscriptions for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);