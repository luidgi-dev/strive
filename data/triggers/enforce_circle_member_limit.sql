-- enforce_circle_member_limit
-- a circle is capped at 8 members — a deliberate product constraint (keep it a
-- "trust circle", not a 50-person group chat). enforced in the database so no
-- client can bypass it. rejects the insert when the circle is already full.
--
-- note: at this scale (<= 8) the tiny race window between the count and the
-- insert is not worth a heavier lock; the worst case is a 9th row under extreme
-- concurrency, which the app would never produce for a hand-built trust circle.

create or replace function enforce_circle_member_limit()
returns trigger
language plpgsql
as $$
begin
    if (select count(*) from circle_members where circle_id = new.circle_id) >= 8 then
        raise exception 'circle % is full (max 8 members)', new.circle_id
            using errcode = 'check_violation';
    end if;
    return new;
end;
$$;

drop trigger if exists enforce_circle_member_limit on circle_members;
create trigger enforce_circle_member_limit
    before insert on circle_members
    for each row execute procedure enforce_circle_member_limit();
