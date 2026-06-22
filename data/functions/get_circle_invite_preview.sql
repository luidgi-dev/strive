-- get_circle_invite_preview
-- the public preview for the /i/[code] landing page: enough to show "you've been
-- invited to {circle}" without exposing the circle_invites table. The code is the
-- capability — anyone holding a valid code can read this; an unknown code returns
-- no row. Never lists invites and never leaks private circle data.
--
-- security definer: circle_invites and circles are not readable by the anon role
-- (or by a non-member), so the landing page — which runs for logged-out users —
-- must read through this scoped function rather than the tables directly.

create or replace function get_circle_invite_preview(p_code text)
returns table (
    circle_id        uuid,
    circle_name      text,
    description      text,
    creator_username text,
    member_count     integer,
    is_expired       boolean,
    is_full          boolean
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
    return query
    select
        c.id,
        c.name,
        c.description,
        p.username,
        (select count(*) from circle_members m where m.circle_id = c.id)::int,
        (ci.expires_at <= now()
            or (ci.max_uses is not null and ci.uses_count >= ci.max_uses)),
        ((select count(*) from circle_members m where m.circle_id = c.id) >= 8)
    from circle_invites ci
    join circles c on c.id = ci.circle_id
    join profiles p on p.id = c.owner_id
    where ci.code = p_code;
end;
$$;
