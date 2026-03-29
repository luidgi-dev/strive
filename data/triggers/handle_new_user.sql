-- Triggers a function when a new user is created
-- Creates a new profile for the user
-- Sets the username to the email address
-- Sets the timezone to the user's timezone
-- Sets the avatar to the user's avatar
-- Sets the created_at to the current timestamp
-- Sets the updated_at to the current timestamp


create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
    candidate_username text;
    final_username text;
    is_taken boolean;
begin
    candidate_username := coalesce(
        new.raw_user_meta_data->>'username',
        split_part(lower(new.email), '@', 1)
    );

    final_username := candidate_username;

    loop
        select exists (
            select 1 from profiles where username = final_username
        ) into is_taken;

        exit when not is_taken;

        final_username := candidate_username || '-' || substring(md5(random()::text) from 1 for 4);
    end loop;

    insert into profiles (id, username, timezone, avatar_url, created_at, updated_at)
    values (
        new.id,
        final_username,
        coalesce(new.raw_user_meta_data->>'timezone', 'UTC'),
        new.raw_user_meta_data->>'avatar_url',
        now(),
        now()
    );

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure handle_new_user();