-- generate_circle_invite_code
-- returns a short, shareable invite code (8 chars) for the public /i/[code]
-- landing page. The alphabet drops visually ambiguous characters (0/O, 1/I/l)
-- so a code is easy to read aloud or retype.
--
-- Uniqueness is guaranteed by the `unique` constraint on circle_invites.code,
-- not by this function: with an 8-char, 56-symbol alphabet the space is ~9.6e13,
-- so the create-circle server action simply retries on the rare unique
-- violation. Pure (no table access) so it has no dependency on circle_invites
-- and can be used directly as that column's default.

create or replace function generate_circle_invite_code()
returns text
language plpgsql
volatile
as $$
declare
    alphabet constant text := 'abcdefghijkmnpqrstuvwxyz23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    code text := '';
    i int;
begin
    for i in 1..8 loop
        code := code || substr(alphabet, floor(random() * length(alphabet))::int + 1, 1);
    end loop;
    return code;
end;
$$;
