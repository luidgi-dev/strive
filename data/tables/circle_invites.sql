-- circle_invites
-- shareable invite links (Discord-style). A circle can have several active
-- links, so one can be revoked without breaking the others. The public landing
-- page /i/[code] reads an invite through a security-definer function (LUI-65),
-- not directly, so the table is never world-readable.

drop table if exists circle_invites cascade;

create table circle_invites (
    id         uuid primary key default gen_random_uuid(),
    circle_id  uuid not null references circles(id) on delete cascade,
    created_by uuid not null references profiles(id) on delete cascade,
    code       text not null unique default generate_circle_invite_code(),
    expires_at timestamptz not null default (now() + interval '7 days'),
    max_uses   integer,                                -- null = unlimited
    uses_count integer not null default 0,
    created_at timestamptz not null default now()
);

create index circle_invites_circle_id_idx on circle_invites (circle_id);

-- rls
alter table circle_invites enable row level security;

-- read: members can read their circle's invites (to display / copy the link).
-- the public, unauthenticated preview is served by a security-definer function
-- (LUI-65), so we deliberately do NOT expose the table with using(true), which
-- would let the anon role enumerate every invite.
create policy "members can read circle invites"
    on circle_invites for select
    using (is_circle_member(circle_id));

-- create / revoke: circle owner only
create policy "owner can create invites"
    on circle_invites for insert
    with check (
        created_by = auth.uid()
        and auth.uid() = (select owner_id from circles where id = circle_id)
    );

create policy "owner can delete invites"
    on circle_invites for delete
    using (auth.uid() = (select owner_id from circles where id = circle_id));
