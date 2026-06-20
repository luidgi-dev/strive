-- circle_members
-- membership of a circle. the owner is stored here too (role 'admin'), inserted
-- when the circle is created. max 8 members per circle is enforced by the
-- enforce_circle_member_limit trigger — a deliberate product cap.

drop table if exists circle_members cascade;

create table circle_members (
    id        uuid primary key default gen_random_uuid(),
    circle_id uuid not null references circles(id) on delete cascade,
    user_id   uuid not null references profiles(id) on delete cascade,
    role      text not null default 'member' check (role in ('admin', 'member')),
    joined_at timestamptz not null default now(),
    unique (circle_id, user_id)
);

create index circle_members_circle_id_idx on circle_members (circle_id);

-- rls
alter table circle_members enable row level security;

-- read: any member can see the full member list of circles they belong to.
-- is_circle_member() is security-definer, so this does not recurse.
create policy "members can read co-members"
    on circle_members for select
    using (is_circle_member(circle_id));

-- insert: only the circle owner can add themselves (the create-circle flow).
-- every other join goes through redeem_circle_invite() (LUI-65), which runs as
-- security definer and validates the invite — so a user can never self-insert
-- into an arbitrary circle by hitting the table directly.
create policy "owner can join own circle"
    on circle_members for insert
    with check (
        user_id = auth.uid()
        and auth.uid() = (select owner_id from circles where id = circle_id)
    );

-- delete: a member can leave (remove their own row); the owner can remove anyone.
create policy "members can leave, owner can remove"
    on circle_members for delete
    using (
        user_id = auth.uid()
        or auth.uid() = (select owner_id from circles where id = circle_id)
    );

-- update: owner only (reserved for future role changes, e.g. promote a member).
create policy "owner can update membership"
    on circle_members for update
    using (auth.uid() = (select owner_id from circles where id = circle_id))
    with check (auth.uid() = (select owner_id from circles where id = circle_id));
