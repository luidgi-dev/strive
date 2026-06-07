-- consume_ai_credit
-- atomically reserves one AI credit for the calling user (auth.uid()).
-- locks the row (select ... for update) so concurrent requests can't overspend,
-- then decrements balance / increments used when credits remain.
-- security definer: runs as the function owner and bypasses RLS, but always acts
-- on the verified caller via auth.uid() — a user can never touch another's row.
-- returns: status ('ok' | 'insufficient' | 'no_row'), the resulting balance, and
-- reset_at (so the caller can tell the user when credits renew).

create or replace function consume_ai_credit()
returns table (status text, balance int, reset_at timestamptz)
language plpgsql
security definer set search_path = public
as $$
declare
    uid uuid := auth.uid();
    current_balance int;
    current_reset timestamptz;
begin
    if uid is null then
        return query select 'no_row'::text, 0, null::timestamptz;
        return;
    end if;

    select uc.balance, uc.reset_at
        into current_balance, current_reset
        from user_credits uc
        where uc.user_id = uid
        for update;

    if not found then
        return query select 'no_row'::text, 0, null::timestamptz;
        return;
    end if;

    if current_balance <= 0 then
        return query select 'insufficient'::text, current_balance, current_reset;
        return;
    end if;

    update user_credits
        set balance = balance - 1,
            used = used + 1,
            updated_at = now()
        where user_id = uid
        returning balance, reset_at into current_balance, current_reset;

    return query select 'ok'::text, current_balance, current_reset;
end;
$$;
