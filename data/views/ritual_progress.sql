-- -------------------------
-- ritual_progress
-- -------------------------
-- one row per active ritual for the current user
-- computes logs count and completion rate for the current period
-- period is determined by frequency_unit (day / week / month)
-- open rituals have no target: completion_rate is null
 
create or replace view ritual_progress as
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
    end                                                 as completion_rate
 
from rituals r
left join ritual_categories rc on rc.id = r.category_id
left join ritual_logs rl on rl.ritual_id = r.id
 
where r.is_active = true
  and r.archived_at is null
 
group by r.id, rc.name;