-- reset_ai_credits
-- monthly credit reset, invoked by the pg_cron job (see cron/reset_ai_credits.sql).
-- resets every user whose window has elapsed (reset_at <= now()): balance is set
-- to their tier quota, used cleared, and reset_at advanced to the start of next
-- month. one statement covers all due rows; safe to run more than once per day.

create or replace function reset_ai_credits()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
    update user_credits uc
        set balance = tq.monthly_quota,
            used = 0,
            reset_at = date_trunc('month', now()) + interval '1 month',
            updated_at = now()
        from profiles p, tier_quotas tq
        where uc.user_id = p.id
          and tq.tier = p.tier
          and uc.reset_at <= now();
end;
$$;
