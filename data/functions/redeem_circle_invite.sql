-- redeem_circle_invite
-- the join path for /i/[code]. circle_members can only be self-inserted by the
-- circle owner under RLS, so a joining member cannot add themselves directly —
-- this security-definer function validates the invite and performs the insert.
--
-- Validates: the code exists, is not expired, and is under max_uses; skips when
-- the caller is already a member (the creator counts as one); enforces the
-- 8-member cap (the trigger raises check_violation, caught here as 'full'). On
-- success it inserts the membership (role 'member') and increments uses_count.
-- Returns a status the route maps to a redirect or a friendly message;
-- auth.uid() identifies the joining user.

create or replace function redeem_circle_invite(p_code text)
returns table (status text, circle_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_uid    uuid := auth.uid();
    v_invite circle_invites%rowtype;
begin
    if v_uid is null then
        return query select 'unauthenticated'::text, null::uuid;
        return;
    end if;

    select * into v_invite from circle_invites where code = p_code;
    if not found then
        return query select 'invalid'::text, null::uuid;
        return;
    end if;

    if v_invite.expires_at <= now()
       or (v_invite.max_uses is not null and v_invite.uses_count >= v_invite.max_uses) then
        return query select 'expired'::text, v_invite.circle_id;
        return;
    end if;

    if exists (
        select 1 from circle_members
        where circle_id = v_invite.circle_id and user_id = v_uid
    ) then
        return query select 'already_member'::text, v_invite.circle_id;
        return;
    end if;

    begin
        insert into circle_members (circle_id, user_id, role)
        values (v_invite.circle_id, v_uid, 'member');
    exception when check_violation then
        return query select 'full'::text, v_invite.circle_id;
        return;
    end;

    update circle_invites set uses_count = uses_count + 1 where id = v_invite.id;

    return query select 'joined'::text, v_invite.circle_id;
end;
$$;
