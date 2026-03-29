-- rituals
-- core entity, represents a habit belonging to a user
-- three types: recurring (frequency target), one_time (single event), open (no target)

drop table if exists rituals cascade;

create table rituals (
    id              uuid primary key default gen_random_uuid(),
    user_id         uuid not null references profiles(id) on delete cascade,
    category_id     uuid references ritual_categories(id) on delete set null,
    ritual_type     text not null check (ritual_type in ('recurring', 'one_time', 'open')),
    name            text not null,
    description     text,
    icon            text,
    color           text,
    frequency_unit  text check (frequency_unit in ('day', 'week', 'month')),
    frequency_value int,
    scheduled_time  time,
    scheduled_days  int[],
    due_date        date,
    ends_at         date,
    started_at      date,
    is_active       boolean not null default true,
    archived_at     timestamptz,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),

    -- recurring rituals must have a frequency unit and value
    constraint check_recurring_fields check (
        ritual_type <> 'recurring' or
        (frequency_unit is not null and frequency_value is not null)
    ),

    -- one_time rituals must have a due date
    constraint check_one_time_fields check (
        ritual_type <> 'one_time' or
        due_date is not null
    )
);

-- rls
alter table rituals enable row level security;

-- select/update/delete: users can only access their own rituals
create policy "users can manage their own rituals"
    on rituals for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);