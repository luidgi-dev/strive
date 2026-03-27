## Triggers a function when a new user is created
## Creates a new profile for the user
## Sets the username to the email address
## Sets the timezone to the user's timezone
## Sets the avatar to the user's avatar
## Sets the created_at to the current timestamp
## Sets the updated_at to the current timestamp


create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, timezone, avatar_url, created_at, updated_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
    new.raw_user_meta_data->>'timezone',
    new.raw_user_meta_data->>'avatar_url',
    now(),
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();