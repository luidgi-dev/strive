-- single settings row (id = true). ai_enabled defaults to true (AI on).
-- safe to re-run: keeps the existing kill-switch value if the row already exists.

insert into system_settings (id) values (true)
on conflict (id) do nothing;
