-- seed_test.sql
-- fake data for local development and view testing
-- run after all table migrations and seeds have been applied
-- must be executed with service_role (bypasses RLS) via supabase sql editor or psql

-- fixed uuids for reproducibility across runs
-- user a: luidgi (main test user)
-- user b: fame (secondary user, for social/circle tests)

-- -------------------------
-- profiles
-- -------------------------
-- note: in a real supabase env, profiles are created via trigger from auth.users
-- for local testing, we insert directly (requires service_role to bypass fk to auth.users)

SET session_replication_role = 'replica';

insert into profiles (id, username, avatar_url, timezone, created_at, updated_at) values
    ('00000000-0000-0000-0000-000000000001', 'luidgi',   null, 'Europe/Paris',    now() - interval '90 days', now()),
    ('00000000-0000-0000-0000-000000000002', 'fame',    null, 'Europe/London',   now() - interval '30 days', now())
on conflict (id) do nothing;

-- -------------------------
-- ritual_categories (custom, user-defined)
-- system categories are already seeded via seed_ritual_categories.sql
-- -------------------------

insert into ritual_categories (id, user_id, name, description, icon, color) values
    ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Side projects', 'Coding and building things', '💻', '#6366f1')
on conflict (id) do nothing;

-- -------------------------
-- rituals
-- -------------------------
-- we need the id of the system category 'Sport' — use a subquery
-- ritual a: recurring, sport, 3x/week (backdated 90 days ago)
-- ritual b: recurring, personal dev, 1x/day
-- ritual c: open, no target, just counting
-- ritual d: one_time, upcoming event

insert into rituals (
    id, user_id, category_id, ritual_type,
    name, description, icon, color,
    frequency_unit, frequency_value,
    scheduled_time, scheduled_days,
    due_date, ends_at, started_at,
    is_active, archived_at
) values
    (
        '00000000-0000-0000-0000-000000000020',
        '00000000-0000-0000-0000-000000000001',
        (select id from ritual_categories where name = 'Sport' and user_id is null),
        'recurring',
        'Morning run', 'Run at least 20 minutes outside', '🏃', '#f97316',
        'week', 3,
        '07:00', '{1,3,5}',
        null, null, (current_date - interval '90 days')::date,
        true, null
    ),
    (
        '00000000-0000-0000-0000-000000000021',
        '00000000-0000-0000-0000-000000000001',
        (select id from ritual_categories where name = 'Personal development' and user_id is null),
        'recurring',
        'Evening journal', 'Write at least 3 lines about the day', '📓', '#60a5fa',
        'day', 1,
        '21:00', null,
        null, null, (current_date - interval '60 days')::date,
        true, null
    ),
    (
        '00000000-0000-0000-0000-000000000022',
        '00000000-0000-0000-0000-000000000001',
        (select id from ritual_categories where name = 'Well-being' and user_id is null),
        'open',
        'Meditation', 'No target — just track how often I meditate', '🧘', '#a78bfa',
        null, null,
        null, null,
        null, null, null,
        true, null
    ),
    (
        '00000000-0000-0000-0000-000000000023',
        '00000000-0000-0000-0000-000000000001',
        null,
        'one_time',
        'Dentist appointment', 'Annual checkup', '🦷', '#94a3b8',
        null, null,
        null, null,
        (current_date + interval '14 days')::date, null, null,
        true, null
    )
on conflict (id) do nothing;

-- -------------------------
-- ritual_logs
-- -------------------------
-- simulate ~4 weeks of logs for the morning run (ritual a) at 3x/week
-- and ~4 weeks of logs for the evening journal (ritual b) at 1x/day
-- and a few open meditation logs (ritual c)

insert into ritual_logs (id, ritual_id, user_id, status_id, logged_at, note, logged_via) values

    -- morning run logs (3x/week, mon/wed/fri pattern, last 4 weeks)
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 'completed', current_date - 28, null, 'manual'),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 'completed', current_date - 26, null, 'manual'),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 'rest',      current_date - 24, 'legs were tired', 'manual'),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 'completed', current_date - 21, null, 'ai'),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 'completed', current_date - 19, null, 'ai'),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 'completed', current_date - 17, null, 'manual'),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 'completed', current_date - 14, null, 'manual'),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 'missed',    current_date - 12, null, 'auto'),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 'completed', current_date - 10, null, 'manual'),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 'completed', current_date - 7,  null, 'ai'),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 'completed', current_date - 5,  null, 'manual'),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 'completed', current_date - 3,  null, 'manual'),

    -- evening journal logs (1x/day, most days logged)
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', 'completed', current_date - 7,  'good day overall', 'manual'),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', 'completed', current_date - 6,  null, 'ai'),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', 'rest',      current_date - 5,  'took the evening off', 'manual'),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', 'completed', current_date - 4,  null, 'manual'),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', 'completed', current_date - 3,  null, 'ai'),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', 'completed', current_date - 2,  'wrote about the project', 'manual'),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', 'completed', current_date - 1,  null, 'manual'),

    -- meditation logs (open ritual, no target, sporadic)
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', 'completed', current_date - 10, '10 min breathwork', 'manual'),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', 'completed', current_date - 6,  null, 'manual'),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', 'completed', current_date - 1,  '20 min guided session', 'ai');

-- -------------------------
-- circles (empty for now, phase 4)
-- -------------------------
insert into circles (id, name, owner_id) values
    ('00000000-0000-0000-0000-000000000030', 'Morning crew', '00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

-- -------------------------
-- circle_members (empty for now, phase 4)
-- -------------------------
insert into circle_members (id, circle_id, user_id, role) values
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000001', 'admin'),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000002', 'member')
on conflict (id) do nothing;


SET session_replication_role = 'origin';
