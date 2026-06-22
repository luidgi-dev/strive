-- is_circle_member
-- returns true if the given user (defaults to the caller) belongs to the circle.
--
-- security definer: this helper exists to break RLS recursion. circle_members
-- policies need to ask "is the caller a member of this circle?" — but querying
-- circle_members from inside its own policy re-triggers the policy and raises
-- "infinite recursion detected". Running as the function owner bypasses RLS for
-- this single, scoped lookup, so every circle policy stays simple and safe.
--
-- language plpgsql (not sql) on purpose: the body is late-bound, so the function
-- can be created BEFORE circle_members exists. It is applied before the circle
-- tables because their policies depend on it.

create or replace function is_circle_member(
    p_circle_id uuid,
    p_user_id   uuid default auth.uid()
)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
begin
    return exists (
        select 1
        from circle_members
        where circle_id = p_circle_id
          and user_id = p_user_id
    );
end;
$$;
