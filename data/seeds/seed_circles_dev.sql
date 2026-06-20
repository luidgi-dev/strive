-- seed_circles_dev.sql
-- Dev seed: one populated circle so the Circles tab (LUI-63) and the detail page
-- (LUI-66) have something to render before those flows can create a circle.
--
-- Prod/dev only — NOT part of migrate.py: it resolves real accounts by username,
-- which do not exist in a fresh database. Idempotent (fixed ids + on conflict).
-- Run with a privileged connection (service_role / postgres) so it bypasses RLS:
--
--   psql "$DATABASE_URL" -f data/seeds/seed_circles_dev.sql
--
-- Members are resolved by username and rituals by (owner, name), so the file
-- holds no hardcoded uuids for users. Owner = laluigeeee, member = ljo.

-- the circle
insert into circles (id, name, description, owner_id)
select 'dddddddd-0000-0000-0000-000000000001',
       'Strive crew',
       'Building rituals together.',
       id
from profiles where username = 'laluigeeee'
on conflict (id) do nothing;

-- members: owner (admin) + ljo (member)
insert into circle_members (circle_id, user_id, role)
select 'dddddddd-0000-0000-0000-000000000001', id, 'admin'
from profiles where username = 'laluigeeee'
on conflict (circle_id, user_id) do nothing;

insert into circle_members (circle_id, user_id, role)
select 'dddddddd-0000-0000-0000-000000000001', id, 'member'
from profiles where username = 'ljo'
on conflict (circle_id, user_id) do nothing;

-- shared rituals (opt-in). a lively mix: some on track this week, some behind.
insert into circle_rituals (circle_id, user_id, ritual_id)
select 'dddddddd-0000-0000-0000-000000000001', r.user_id, r.id
from rituals r
join profiles p on p.id = r.user_id
where (p.username, r.name) in (
    ('laluigeeee', 'Skincare matin'),
    ('laluigeeee', 'Musculation'),
    ('laluigeeee', 'Travailler sur Strive'),
    ('ljo', 'swimming'),
    ('ljo', 'Skincare')
)
on conflict (circle_id, user_id, ritual_id) do nothing;

-- a ready-to-share invite link (code auto-generated, 7-day expiry via defaults)
insert into circle_invites (id, circle_id, created_by)
select 'eeeeeeee-0000-0000-0000-000000000001',
       'dddddddd-0000-0000-0000-000000000001',
       id
from profiles where username = 'laluigeeee'
on conflict (id) do nothing;
