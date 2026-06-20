-- nudges
-- a lightweight wave from one circle member to another — calm encouragement, no
-- pressure. In-app only: no push, no email. An unread nudge has seen_at = null.

drop table if exists nudges cascade;

create table nudges (
    id          uuid primary key default gen_random_uuid(),
    circle_id   uuid not null references circles(id) on delete cascade,
    sender_id   uuid not null references profiles(id) on delete cascade,
    receiver_id uuid not null references profiles(id) on delete cascade,
    seen_at     timestamptz,                            -- null = unread
    created_at  timestamptz not null default now()
);

-- unread nudges for a given receiver — the in-app indicator query
create index nudges_receiver_unread_idx on nudges (receiver_id) where seen_at is null;
create index nudges_circle_id_idx on nudges (circle_id);

-- rls
alter table nudges enable row level security;

-- send: the sender must be the caller, and both sender and receiver must belong
-- to the circle the nudge is sent in.
create policy "members can send nudges in their circle"
    on nudges for insert
    with check (
        sender_id = auth.uid()
        and is_circle_member(circle_id, sender_id)
        and is_circle_member(circle_id, receiver_id)
    );

-- read: the receiver sees nudges addressed to them; the sender sees the ones
-- they sent (so the UI can show an already-nudged "sent" state).
create policy "sender and receiver can read nudges"
    on nudges for select
    using (receiver_id = auth.uid() or sender_id = auth.uid());

-- update: only the receiver can mark a nudge as seen
create policy "receiver can mark nudges seen"
    on nudges for update
    using (receiver_id = auth.uid())
    with check (receiver_id = auth.uid());
