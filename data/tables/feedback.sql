-- feedback
-- in-app feedback widget (LUI-91): bug reports / suggestions from early testers.
-- each row is mirrored into a Linear issue by the submit action; the linear_*
-- columns keep the link for traceability. resolution status lives in Linear, not
-- here (no is_resolved column).

drop table if exists feedback cascade;

create table feedback (
    id               uuid primary key default gen_random_uuid(),
    -- keep feedback even if the author later deletes their account (set null,
    -- not cascade). references profiles like the rest of the schema; profiles
    -- itself cascades from auth.users.
    user_id          uuid references profiles(id) on delete set null,
    tag              text not null check (tag in ('bug', 'suggestion', 'other')),
    title            text,
    body             text not null,
    screenshot_url   text,
    linear_issue_id  text,
    linear_issue_url text,
    created_at       timestamptz not null default now()
);

-- rls
alter table feedback enable row level security;

-- users can only submit feedback as themselves. there is intentionally no select
-- policy: testers never read feedback back (no in-app history). the submit action
-- uses the service role for the insert/update round-trip so it can read the new
-- row id back without exposing a select policy.
create policy "users can insert feedback"
    on feedback for insert
    to authenticated
    with check (auth.uid() = user_id);
