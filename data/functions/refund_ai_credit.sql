-- refund_ai_credit
-- returns one previously-reserved credit to the calling user (auth.uid()). used
-- when an AI request fails before producing a response (see lib/ai/guard.ts).
-- balance is capped at the user's tier quota so a refund racing with a monthly
-- reset can't push the balance above the allowed maximum; used is clamped at 0.

create or replace function refund_ai_credit()
returns void
language plpgsql
security definer set search_path = public
as $$
declare
    uid uuid := auth.uid();
begin
    if uid is null then
        return;
    end if;

    update user_credits uc
        set balance = least(uc.balance + 1, tq.monthly_quota),
            used = greatest(uc.used - 1, 0),
            updated_at = now()
        from profiles p, tier_quotas tq
        where uc.user_id = uid
          and p.id = uc.user_id
          and tq.tier = p.tier;
end;
$$;
