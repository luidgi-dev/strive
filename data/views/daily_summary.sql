-- -------------------------
-- daily_summary
-- -------------------------
-- one row per user: snapshot of today's progress across all active rituals
-- useful for the top-level header in "the flow"
 
create or replace view daily_summary as
select
    r.user_id,
    count(distinct r.id) as rituals_total,
 
    count(distinct rl.ritual_id) filter (
        where rl.status_id = 'completed'
        and rl.logged_at = current_date
    ) as rituals_logged_today,
 
    count(distinct r.id) - count(distinct rl.ritual_id) filter (
        where rl.status_id = 'completed'
        and rl.logged_at = current_date
    ) as rituals_remaining_today
 
from rituals r
left join ritual_logs rl on rl.ritual_id = r.id
 
where r.is_active = true
  and r.archived_at is null
 
group by r.user_id;
 