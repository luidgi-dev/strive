-- circle_rituals
-- opt-in: which of a member's own rituals are surfaced in a given circle.
-- sharing a ritual is a conscious act — anything not listed here stays private.
-- one row per (circle, member, ritual). powers the weekly feed and the circle's
-- collective momentum (computed later, in LUI-63 / LUI-66).

drop table if exists circle_rituals cascade;

create table circle_rituals (
    id         uuid primary key default gen_random_uuid(),
    circle_id  uuid not null references circles(id) on delete cascade,
    user_id    uuid not null references profiles(id) on delete cascade,
    ritual_id  uuid not null references rituals(id) on delete cascade,
    created_at timestamptz not null default now(),
    unique (circle_id, user_id, ritual_id)
);

create index circle_rituals_circle_id_idx on circle_rituals (circle_id);

-- rls
alter table circle_rituals enable row level security;

-- read: any member of the circle can see what is shared in it (the feed).
create policy "members can read shared rituals"
    on circle_rituals for select
    using (is_circle_member(circle_id));

-- share: a member can only share THEIR OWN ritual, and only in a circle they
-- belong to.
create policy "members can share their own rituals"
    on circle_rituals for insert
    with check (
        user_id = auth.uid()
        and is_circle_member(circle_id)
        and exists (
            select 1 from rituals r
            where r.id = ritual_id and r.user_id = auth.uid()
        )
    );

-- unshare: a member can remove only their own shared rituals
create policy "members can unshare their own rituals"
    on circle_rituals for delete
    using (user_id = auth.uid());
