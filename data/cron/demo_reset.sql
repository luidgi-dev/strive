-- demo-reset cron job (LUI-43)
-- runs nightly at 03:00 UTC and rebuilds the demo account's current week: clears
-- this week's logs, re-inserts a realistic pattern, resets AI credits to 5 and
-- re-seeds the frozen Insight Cards. The actual work lives in the Next.js route
-- /api/cron/demo-reset (see app/[locale]/api/cron/demo-reset/route.ts); pg_cron
-- only triggers it over HTTP.
--
-- Why pg_cron and not a third Vercel Cron: the Vercel Hobby plan caps at two cron
-- jobs and both are taken by the Insights crons (see vercel.json). The hourly
-- reminders already ride on pg_cron + pg_net for the same reason, so the demo
-- reset follows that pattern (see design/push-notifications.md).
--
-- Requires the pg_cron and pg_net extensions, and a Vault secret named
-- 'cron_secret' holding `Bearer <CRON_SECRET>`'s value (the same one the reminders
-- cron uses). Enable extensions once under Database > Extensions on Supabase.
--
-- Apply this on its own (SQL Editor / psql -f). Replace <APP_URL> with the live
-- origin (https://striveapp.cc) if it differs. Idempotent: re-running re-creates
-- the schedule.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- drop any previous definition first so this file stays idempotent.
select cron.unschedule('demo-reset')
where exists (select 1 from cron.job where jobname = 'demo-reset');

select cron.schedule(
    'demo-reset',
    '0 3 * * *',
    $$
    select net.http_post(
        url     := 'https://striveapp.cc/api/cron/demo-reset',
        headers := jsonb_build_object(
            'Authorization',
            (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret'),
            'Content-Type', 'application/json'
        )
    );
    $$
);
