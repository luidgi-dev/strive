-- get_circles_momentum
-- per circle the caller belongs to, returns how many sharing members are "on
-- track" this week vs how many share a measurable (target-based) ritual.
--
-- security definer: rituals / ritual_logs are owner-only and the ritual_progress
-- view is security_invoker, so collective momentum needs a privileged read. It is
-- scoped to the caller's own circles (via auth.uid()) and returns only aggregate
-- counts: no per-member row ever leaves the function.
--
-- "on track" reuses the app's "strong" pace threshold (>= 0.8 of target), the
-- same bar as rollingMomentumStatus() / MomentumPill in lib/data/rituals.ts.
-- A member's weekly pace is the average, across their shared recurring rituals,
-- of momentum_count / momentum_target (capped at 1). Members who share only
-- open / one-time rituals have no weekly target and are excluded from both counts.

create or replace function get_circles_momentum()
returns table (
    circle_id         uuid,
    participant_count integer,
    on_track_count    integer
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
    return query
    with my_circles as (
        select cm.circle_id
        from circle_members cm
        where cm.user_id = auth.uid()
    ),
    member_pace as (
        select
            cr.circle_id,
            cr.user_id,
            avg(least(rp.momentum_count::numeric / rp.momentum_target, 1)) as pace
        from circle_rituals cr
        join my_circles mc on mc.circle_id = cr.circle_id
        join ritual_progress rp
            on rp.ritual_id = cr.ritual_id and rp.user_id = cr.user_id
        where rp.momentum_target is not null and rp.momentum_target > 0
        group by cr.circle_id, cr.user_id
    )
    select
        mc.circle_id,
        count(mp.user_id)::int                               as participant_count,
        count(mp.user_id) filter (where mp.pace >= 0.8)::int as on_track_count
    from my_circles mc
    left join member_pace mp on mp.circle_id = mc.circle_id
    group by mc.circle_id;
end;
$$;
