-- circles_rls.sql
-- RLS + trigger verification for the circles schema. Safe to run anywhere:
-- everything happens inside ONE transaction that is rolled back at the end, so
-- no data persists.
--
-- Run with a privileged connection (postgres / service_role). The script
-- switches to the "authenticated" role and sets request.jwt.claims to simulate
-- specific users, which is exactly what auth.uid() reads under the hood.
--
--   psql "$DATABASE_URL" -f data/tests/circles_rls.sql
--
-- Positive checks abort the run on error (ON_ERROR_STOP). Negative checks use a
-- do-block that fails loudly if the expected denial did NOT happen.

\set ON_ERROR_STOP on

begin;

-- ---------------------------------------------------------------------------
-- fixtures: 9 throwaway users (to reach the 8-member cap) + their rituals.
-- profiles FK to auth.users, so we bypass FK with replica mode for setup only.
-- replica mode also disables triggers, so we switch back to origin before any
-- trigger-dependent check.
-- ---------------------------------------------------------------------------
set session_replication_role = replica;

insert into profiles (id, username) values
    ('aaaaaaaa-0000-0000-0000-000000000001', 'rls_owner'),
    ('aaaaaaaa-0000-0000-0000-000000000002', 'rls_member'),
    ('aaaaaaaa-0000-0000-0000-000000000003', 'rls_outsider'),
    ('aaaaaaaa-0000-0000-0000-000000000004', 'rls_u4'),
    ('aaaaaaaa-0000-0000-0000-000000000005', 'rls_u5'),
    ('aaaaaaaa-0000-0000-0000-000000000006', 'rls_u6'),
    ('aaaaaaaa-0000-0000-0000-000000000007', 'rls_u7'),
    ('aaaaaaaa-0000-0000-0000-000000000008', 'rls_u8'),
    ('aaaaaaaa-0000-0000-0000-000000000009', 'rls_u9');

insert into rituals (id, user_id, ritual_type, name) values
    ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002', 'open', 'rls member ritual'),
    ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000003', 'open', 'rls outsider ritual');

set session_replication_role = origin;

-- ---------------------------------------------------------------------------
-- 1. owner creates a circle and joins it (tests circles INSERT + owner self-join)
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001"}';

insert into circles (id, name, owner_id)
    values ('cccccccc-0000-0000-0000-000000000001', 'RLS test circle', 'aaaaaaaa-0000-0000-0000-000000000001');
insert into circle_members (circle_id, user_id, role)
    values ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'admin');
\echo 'PASS 1 — owner created a circle and joined it'

-- ---------------------------------------------------------------------------
-- 2. add a member (privileged: the owner cannot add OTHERS via RLS — that path
--    is redeem_circle_invite() in LUI-65; here we just seed the membership)
-- ---------------------------------------------------------------------------
set local role postgres;
insert into circle_members (circle_id, user_id, role)
    values ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002', 'member');

-- ---------------------------------------------------------------------------
-- 3. a member can read the circle and ALL co-members
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000002"}';
do $$ begin
    assert (select count(*) from circles where id = 'cccccccc-0000-0000-0000-000000000001') = 1,
        'member should see the circle';
    assert (select count(*) from circle_members where circle_id = 'cccccccc-0000-0000-0000-000000000001') = 2,
        'member should see both co-members';
end $$;
\echo 'PASS 2 — member reads the circle and its co-members'

-- ---------------------------------------------------------------------------
-- 4. an outsider sees nothing of the circle
-- ---------------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000003"}';
do $$ begin
    assert (select count(*) from circles where id = 'cccccccc-0000-0000-0000-000000000001') = 0,
        'outsider must not see the circle';
    assert (select count(*) from circle_members where circle_id = 'cccccccc-0000-0000-0000-000000000001') = 0,
        'outsider must not see any member';
end $$;
\echo 'PASS 3 — outsider sees no circle data'

-- ---------------------------------------------------------------------------
-- 5. an outsider cannot self-insert into a circle (owner-only insert policy)
-- ---------------------------------------------------------------------------
do $$ begin
    begin
        insert into circle_members (circle_id, user_id, role)
            values ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000003', 'member');
        raise exception 'EXPECTED FAILURE: outsider self-insert should be blocked by RLS';
    exception when insufficient_privilege then null;  -- RLS denial: expected
    end;
end $$;
\echo 'PASS 4 — outsider cannot self-insert into a circle'

-- ---------------------------------------------------------------------------
-- 6. opt-in sharing: a member can share their OWN ritual, never someone else's
-- ---------------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000002"}';
insert into circle_rituals (circle_id, user_id, ritual_id)
    values ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000001');
\echo 'PASS 5 — member can share their own ritual'

do $$ begin
    begin
        insert into circle_rituals (circle_id, user_id, ritual_id)
            values ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000002');
        raise exception 'EXPECTED FAILURE: sharing a non-owned ritual should be blocked';
    exception when insufficient_privilege then null;  -- WITH CHECK denial: expected
    end;
end $$;
\echo 'PASS 6 — member cannot share a ritual they do not own'

-- ---------------------------------------------------------------------------
-- 7. the 8-member cap trigger (privileged inserts; RLS off, trigger still fires)
--    current members: owner + member = 2. add u4..u9 (6) -> 8. a 9th must fail.
-- ---------------------------------------------------------------------------
set local role postgres;
insert into circle_members (circle_id, user_id, role) values
    ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000004', 'member'),
    ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000005', 'member'),
    ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000006', 'member'),
    ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000007', 'member'),
    ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000008', 'member'),
    ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000009', 'member');

do $$ begin
    begin
        insert into circle_members (circle_id, user_id, role)
            values ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000003', 'member');
        raise exception 'EXPECTED FAILURE: 9th member should be rejected by the cap trigger';
    exception when check_violation then null;  -- trigger denial: expected
    end;
end $$;
\echo 'PASS 7 — 8-member cap enforced (9th rejected)'

-- ---------------------------------------------------------------------------
-- 8. leaving a circle cleans up the member's shared rituals and nudges
--    (cleanup_circle_membership trigger). the member shared a ritual in check 6;
--    add a nudge, then remove the membership and assert both are gone.
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000002"}';
insert into nudges (circle_id, sender_id, receiver_id)
    values ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001');

set local role postgres;
do $$ begin
    assert (select count(*) from circle_rituals
            where circle_id = 'cccccccc-0000-0000-0000-000000000001'
              and user_id = 'aaaaaaaa-0000-0000-0000-000000000002') = 1,
        'precondition: member has 1 shared ritual';
    assert (select count(*) from nudges
            where circle_id = 'cccccccc-0000-0000-0000-000000000001'
              and (sender_id = 'aaaaaaaa-0000-0000-0000-000000000002'
                   or receiver_id = 'aaaaaaaa-0000-0000-0000-000000000002')) = 1,
        'precondition: 1 nudge involves the member';
end $$;

delete from circle_members
    where circle_id = 'cccccccc-0000-0000-0000-000000000001'
      and user_id = 'aaaaaaaa-0000-0000-0000-000000000002';

do $$ begin
    assert (select count(*) from circle_rituals
            where circle_id = 'cccccccc-0000-0000-0000-000000000001'
              and user_id = 'aaaaaaaa-0000-0000-0000-000000000002') = 0,
        'leaving must remove the member''s shared rituals';
    assert (select count(*) from nudges
            where circle_id = 'cccccccc-0000-0000-0000-000000000001'
              and (sender_id = 'aaaaaaaa-0000-0000-0000-000000000002'
                   or receiver_id = 'aaaaaaaa-0000-0000-0000-000000000002')) = 0,
        'leaving must remove the member''s nudges';
end $$;
\echo 'PASS 8 — leaving a circle cleans up shared rituals and nudges'

rollback;

\echo ''
\echo 'All circles RLS + trigger checks passed. Transaction rolled back — nothing persisted.'
