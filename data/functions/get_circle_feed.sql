-- get_circle_feed
-- the weekly progress feed for a single circle: one row per member × shared
-- ritual, with the sharer's profile, the ritual's name/icon, and that member's
-- current rolling momentum (count vs target). Powers the "Week of …" feed on the
-- circle detail page. Members who share a ritual with no weekly target (open /
-- one_time) come back with null momentum_count/target — the UI renders them as
-- "resting" with no score.
--
-- security definer: rituals / ritual_logs are owner-only and the ritual_progress
-- view is security_invoker, so surfacing another member's progress needs a
-- privileged read. This is the per-member counterpart to get_circles_momentum,
-- which deliberately aggregates these rows away. Two guards keep it safe:
--   * access is gated to members of p_circle_id (is_circle_member), and
--   * only rituals someone explicitly shared (a row in circle_rituals) are
--     returned, joined to a current membership — a private ritual never leaks,
--     and a former member's shared rows can't surface (cleaned up on leave too).

create or replace function get_circle_feed(p_circle_id uuid)
returns table (
    user_id         uuid,
    username        text,
    avatar_url      text,
    ritual_id       uuid,
    ritual_name     text,
    ritual_icon     text,
    momentum_count  integer,
    momentum_target integer
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
    -- RLS is bypassed under security definer, so gate non-members explicitly.
    if not is_circle_member(p_circle_id, auth.uid()) then
        return;
    end if;

    return query
    select
        cr.user_id,
        p.username,
        p.avatar_url,
        r.id,
        r.name,
        r.icon,
        rp.momentum_count::int,
        rp.momentum_target::int
    from circle_rituals cr
    join circle_members sm
        on sm.circle_id = cr.circle_id and sm.user_id = cr.user_id
    join profiles p on p.id = cr.user_id
    join rituals r on r.id = cr.ritual_id
    join ritual_progress rp
        on rp.ritual_id = cr.ritual_id and rp.user_id = cr.user_id
    -- skip rituals a member archived but left shared, matching
    -- get_circle_shared_rituals / get_circles_momentum so the feed stays in sync.
    where cr.circle_id = p_circle_id
      and r.is_active = true
      and r.archived_at is null
    order by r.name, p.username;
end;
$$;
