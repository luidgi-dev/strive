-- -------------------------
-- ritual_log_history
-- -------------------------
-- full log history per ritual
-- used for heatmap / arc visualization
-- ordered most recent first
 
create or replace view ritual_log_history as
select
    rl.ritual_id,
    rl.user_id,
    r.name as ritual_name,
    rl.logged_at,
    rl.status_id,
    rl.note,
    rl.logged_via
from ritual_logs rl
join rituals r on r.id = rl.ritual_id
order by rl.logged_at desc;