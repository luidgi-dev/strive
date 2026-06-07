-- reset-ai-credits cron job
-- runs daily at 00:05 UTC and resets credits for any user whose monthly window
-- has elapsed (see functions/reset_ai_credits.sql). a daily cadence with the
-- reset_at <= now() filter keeps it correct across timezones and missed runs.
--
-- requires the pg_cron extension. on Supabase, enable it once under
-- Database > Extensions (or via the statement below if your role allows it).
-- this file is applied last by migrate.py so the rest of the schema still lands
-- even if pg_cron is not yet available.

create extension if not exists pg_cron;

-- drop any previous definition first so this file stays idempotent.
select cron.unschedule('reset-ai-credits')
where exists (select 1 from cron.job where jobname = 'reset-ai-credits');

select cron.schedule(
    'reset-ai-credits',
    '5 0 * * *',
    $$select public.reset_ai_credits();$$
);
