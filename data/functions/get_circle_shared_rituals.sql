-- get_circle_shared_rituals
-- the rituals shared in each circle the caller belongs to, with their display
-- name and icon, for the "what this circle is building" strip on a circle card.
--
-- security definer: shared rituals are opt-in and meant to be visible to the
-- circle, but rituals is owner-only RLS, so a member can't resolve another
-- member's ritual name/icon directly. This returns only rituals that someone
-- explicitly shared (a row in circle_rituals), scoped to circles the caller is a
-- member of — nothing about a private ritual ever leaks.

create or replace function get_circle_shared_rituals()
returns table (
    circle_id uuid,
    ritual_id uuid,
    name      text,
    icon      text
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
    return query
    select cr.circle_id, r.id, r.name, r.icon
    from circle_rituals cr
    join circle_members me
        on me.circle_id = cr.circle_id and me.user_id = auth.uid()
    join rituals r on r.id = cr.ritual_id
    order by cr.circle_id, r.name;
end;
$$;
