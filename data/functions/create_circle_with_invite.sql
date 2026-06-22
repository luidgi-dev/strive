-- create_circle_with_invite
-- creates a circle in one shot: the circle, the creator's membership (role
-- 'admin' — the owner), and the first shareable invite link. Returns the new
-- circle id and the generated invite code so the create flow can show the link
-- immediately.
--
-- security invoker (the default): the caller is the owner, so RLS already permits
-- all three inserts (circles.owner_id = auth.uid(), the owner self-add on
-- circle_members, and owner-only circle_invites). Keeping it invoker leaves RLS
-- enforced; the value here is atomicity — a plpgsql function body runs in a single
-- transaction, so a failure at any step rolls the whole thing back (no orphan
-- circle without a membership). The invite code comes from the column default; on
-- the astronomically rare unique collision we retry a few times.

create or replace function create_circle_with_invite(
    p_name        text,
    p_description text default null
)
returns table (circle_id uuid, invite_code text)
language plpgsql
set search_path = public
as $$
declare
    v_uid    uuid := auth.uid();
    v_circle uuid;
    v_code   text;
begin
    if v_uid is null then
        raise exception 'not authenticated' using errcode = 'insufficient_privilege';
    end if;

    insert into circles (name, description, owner_id)
    values (p_name, nullif(btrim(coalesce(p_description, '')), ''), v_uid)
    returning id into v_circle;

    insert into circle_members (circle_id, user_id, role)
    values (v_circle, v_uid, 'admin');

    for i in 1..5 loop
        begin
            insert into circle_invites (circle_id, created_by)
            values (v_circle, v_uid)
            returning code into v_code;
            exit;
        exception when unique_violation then
            if i = 5 then raise; end if;
        end;
    end loop;

    return query select v_circle, v_code;
end;
$$;
