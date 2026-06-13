-- -------------------------
-- ritual_progress
-- -------------------------
-- one row per active ritual for the current user
-- computes logs count and completion rate for the current period
-- period is determined by frequency_unit (day / week / month)
-- open rituals have no target: completion_rate is null
-- security_invoker: the view runs with the querying user's privileges so the
-- underlying tables' RLS is enforced (a user only ever sees their own rows).
--
-- Two distinct readings coexist here:
--   * logs_this_period / completion_rate : CALENDAR period (since week/month
--     start). Drives "done this period / leaves the Rhythm" and the day strip.
--   * momentum_count / momentum_target : ROLLING window sized to the cadence
--     (daily 7d, weekly 7d, monthly 30d). Drives the momentum status pill, so a
--     calendar reset (Monday) no longer wipes momentum and a single log after a
--     gap can't read as "Strong". Status itself (paceToStatus) is derived in JS.

create or replace view ritual_progress with (security_invoker = on) as
select
    r.id                                                as ritual_id,
    r.user_id,
    r.name,
    r.icon,
    r.color,
    rc.name                                             as category,
    r.ritual_type,
    r.frequency_unit,
    r.frequency_value                                   as target,
    r.started_at,
    r.ends_at,
 
    -- count completed logs for the current period only
    count(rl.id) filter (
        where rl.status_id = 'completed'
        and rl.logged_at >= case r.frequency_unit
            when 'day'   then current_date
            when 'week'  then date_trunc('week', current_date)::date
            when 'month' then date_trunc('month', current_date)::date
            else current_date
        end
    )                                                   as logs_this_period,
 
    -- completion rate: null for open rituals (no target)
    case
        when r.ritual_type = 'open' or r.frequency_value is null then null
        else round(
            count(rl.id) filter (
                where rl.status_id = 'completed'
                and rl.logged_at >= case r.frequency_unit
                    when 'day'   then current_date
                    when 'week'  then date_trunc('week', current_date)::date
                    when 'month' then date_trunc('month', current_date)::date
                    else current_date
                end
            )::numeric / r.frequency_value * 100
        , 0)
    end                                                 as completion_rate,

    -- rolling momentum count over a window sized to the cadence:
    --   day   -> distinct days logged in the last 7 days
    --   week  -> logs in the last 7 days
    --   month -> logs in the last 30 days
    --   open / one_time -> null (no momentum)
    case r.frequency_unit
        when 'day' then count(distinct rl.logged_at) filter (
            where rl.status_id = 'completed'
            and rl.logged_at >= current_date - 6
        )
        when 'week' then count(rl.id) filter (
            where rl.status_id = 'completed'
            and rl.logged_at >= current_date - 6
        )
        when 'month' then count(rl.id) filter (
            where rl.status_id = 'completed'
            and rl.logged_at >= current_date - 29
        )
        else null
    end                                                 as momentum_count,

    -- target the rolling count is paced against
    --   day -> 7 (distinct days per week), week/month -> the frequency value
    case r.frequency_unit
        when 'day'   then 7
        when 'week'  then r.frequency_value
        when 'month' then r.frequency_value
        else null
    end                                                 as momentum_target

from rituals r
left join ritual_categories rc on rc.id = r.category_id
left join ritual_logs rl on rl.ritual_id = r.id
 
where r.is_active = true
  and r.archived_at is null
 
group by r.id, rc.name;