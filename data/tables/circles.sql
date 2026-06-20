-- circles
-- social groups (phase 4). a circle is a small, capped "trust circle": at most
-- 8 members (enforced by the enforce_circle_member_limit trigger on
-- circle_members), built around the rituals members choose to share.

drop table if exists circles cascade;

create table circles (
    id          uuid primary key default gen_random_uuid(),
    name        text not null,
    description text,
    owner_id    uuid not null references profiles(id) on delete cascade,
    created_at  timestamptz not null default now()
);

-- rls
alter table circles enable row level security;

-- read: the owner and every member of the circle. is_circle_member() is a
-- security-definer helper that avoids RLS recursion (see its definition).
create policy "members can read their circles"
    on circles for select
    using (owner_id = auth.uid() or is_circle_member(id));

-- create: a user can only create a circle they own
create policy "users can create their own circles"
    on circles for insert
    with check (owner_id = auth.uid());

-- update / delete: owner only
create policy "owners can update their circles"
    on circles for update
    using (owner_id = auth.uid())
    with check (owner_id = auth.uid());

create policy "owners can delete their circles"
    on circles for delete
    using (owner_id = auth.uid());
