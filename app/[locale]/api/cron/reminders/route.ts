import { getTranslations } from "next-intl/server";

import { hourInTimeZone, todayInTimeZone } from "@/lib/date";
import { selectOneTimeDueToday } from "@/lib/reminders/select";
import { deliverToUser } from "@/lib/push/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { StriveSupabaseClient } from "@/lib/ai/types";
import type { Locale } from "@/lib/locales";

// web-push relies on Node crypto for VAPID signing — force the Node runtime.
export const runtime = "nodejs";
export const maxDuration = 60;

// Morning ritual reminder (LUI-85). Sends one push per user listing the day's
// one_time rituals (dated events) that aren't logged yet — recurring habits are
// intentionally excluded. Triggered hourly by Supabase pg_cron (see
// design/push-notifications.md) and fires only for users whose LOCAL hour is the
// morning slot, so everyone is reached ~8am in their own timezone.
//
// No user session here, so the only gate is the shared CRON_SECRET. We call
// `deliverToUser` directly with the admin client (the /api/notifications/send
// route requires getUser(), which a cron has no way to satisfy).
//
// Lives under `[locale]/` because proxy.ts rewrites every non-static request
// with a locale prefix; the trigger still calls the unprefixed path.
const MORNING_HOUR = 8;
const CHUNK_SIZE = 5;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

type Translators = Record<Locale, Awaited<ReturnType<typeof getTranslations>>>;

type EligibleUser = { id: string; timezone: string };

async function remindUser(
  supabase: StriveSupabaseClient,
  user: EligibleUser,
  translators: Translators,
): Promise<"sent" | "skipped"> {
  const today = todayInTimeZone(user.timezone);

  const { data: rituals } = await supabase
    .from("rituals")
    .select("id, name, ritual_type, due_date, is_active, archived_at")
    .eq("user_id", user.id)
    .eq("ritual_type", "one_time")
    .eq("due_date", today)
    .eq("is_active", true)
    .is("archived_at", null);
  if (!rituals?.length) return "skipped";

  const ids = rituals.map((r) => r.id);
  const { data: logs } = await supabase
    .from("ritual_logs")
    .select("ritual_id")
    .eq("user_id", user.id)
    .eq("status_id", "completed")
    .in("ritual_id", ids);
  const completed = new Set((logs ?? []).map((l) => l.ritual_id));

  const due = selectOneTimeDueToday(rituals, today, completed);
  if (!due.length) return "skipped";

  // Claim the day's slot BEFORE sending: insert first so an overlapping run or a
  // crash mid-send can never produce a duplicate. The unique(user_id,type,sent_on)
  // constraint makes a second claim fail fast.
  const { error: claimError } = await supabase
    .from("notification_log")
    .insert({ user_id: user.id, type: "ritual_reminder", sent_on: today });
  if (claimError) {
    if (claimError.code === "23505") return "skipped"; // already reminded today
    throw claimError;
  }

  const count = due.length;
  const firstName = due[0].name;
  await deliverToUser(supabase, user.id, (locale) => ({
    title: translators[locale]("title"),
    body: count === 1 ? firstName : translators[locale]("bodyMany", { count }),
    url: "/protected/flow",
    tag: "ritual-reminder",
  }));
  return "sent";
}

async function handle(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return new Response("CRON_SECRET not configured", { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Test affordance: `?force=1` bypasses the morning-hour gate on non-production
  // deploys, so iOS reception can be validated on a preview at any time.
  const force =
    new URL(req.url).searchParams.get("force") === "1" &&
    process.env.VERCEL_ENV !== "production";

  const supabase = createAdminClient();

  // Eligible = reminders enabled, active, AND at least one device subscribed
  // (push_subscriptions!inner). One row per such profile.
  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, timezone, push_subscriptions!inner(user_id)")
    .eq("smart_reminders_enabled", true)
    .eq("is_active", true);

  if (error) {
    console.error("[cron/reminders] failed to list eligible users", error);
    return new Response("Failed to list users", { status: 500 });
  }

  const dueNow: EligibleUser[] = (users ?? [])
    .map((u) => ({ id: u.id, timezone: u.timezone }))
    .filter((u) => force || hourInTimeZone(u.timezone) === MORNING_HOUR);

  const translators = {
    en: await getTranslations({ locale: "en", namespace: "notifications.ritualReminder" }),
    fr: await getTranslations({ locale: "fr", namespace: "notifications.ritualReminder" }),
  } satisfies Translators;

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const group of chunk(dueNow, CHUNK_SIZE)) {
    const results = await Promise.allSettled(
      group.map((user) => remindUser(supabase, user, translators)),
    );
    results.forEach((result, i) => {
      if (result.status === "fulfilled") {
        if (result.value === "sent") sent += 1;
        else skipped += 1;
      } else {
        failed += 1;
        console.error("[cron/reminders] failed for user", group[i].id, result.reason);
      }
    });
  }

  return Response.json({
    eligible: users?.length ?? 0,
    due: dueNow.length,
    sent,
    skipped,
    failed,
  });
}

export const GET = handle;
export const POST = handle;
