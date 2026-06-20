-- cleanup_circle_membership
-- when a membership row is removed (a member leaves, or the owner removes them),
-- drop the data that membership made visible to the circle: the member's shared
-- rituals and any nudges they exchanged in that circle. Without this, those rows
-- linger (circle_rituals / nudges have no FK to circle_members) and the rest of
-- the circle would keep seeing a former member's shared progress — a cross-user
-- leak after the membership is gone.
--
-- security definer: the deletion can be triggered by the owner kicking someone
-- else, and nudges have no DELETE policy at all, so an invoker-rights cleanup
-- would be filtered by RLS and silently delete nothing. Running as the function
-- owner removes exactly the orphaned rows, scoped to (circle_id, user_id).
--
-- harmless during cascades: when a circle or profile is deleted, the same rows
-- are also cascade-deleted; the extra deletes here just match zero rows.

create or replace function cleanup_circle_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    delete from circle_rituals
    where circle_id = old.circle_id
      and user_id = old.user_id;

    delete from nudges
    where circle_id = old.circle_id
      and (sender_id = old.user_id or receiver_id = old.user_id);

    return old;
end;
$$;

drop trigger if exists cleanup_circle_membership on circle_members;
create trigger cleanup_circle_membership
    after delete on circle_members
    for each row execute procedure cleanup_circle_membership();
