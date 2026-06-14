import { getTranslations } from "next-intl/server";

import {
  getCompletedRitualIds,
  getRitualsForActiveUser,
  getWeekCompletedLogs,
} from "@/lib/data/rituals";
import { hourInTimeZone, startOfWeek, todayInTimeZone } from "@/lib/date";
import { sendOncePerDay } from "@/lib/push/notify";
import { selectOneTimeDueToday } from "@/lib/reminders/select";
import { selectTodayRituals } from "@/lib/rhythm/today-rituals";
import { createAdminClient } from "@/lib/supabase/admin";
import { chunk, isNonProductionEnv } from "@/lib/utils";
import type { StriveSupabaseClient } from "@/lib/ai/types";
import type { Locale } from "@/lib/locales";

// web-push relies on Node crypto for VAPID signing — force the Node runtime.
export const runtime = "nodejs";
export const maxDuration = 60;

// Ritual reminders, triggered hourly by Supabase pg_cron (see
// design/push-notifications.md). One hourly trigger covers two local-time slots,
// so every user is reached at the right hour in their OWN timezone:
//   - 08:00 → morning reminder of the day's one_time rituals (dated events).
//   - 21:00 → evening nudge IF nothing was logged today but there are rituals to do.
//
// No user session here, so the only gate is the shared CRON_SECRET. We send via
// `sendOncePerDay` (claim-then-send dedup) with the service-role admin client.
//
// Lives under `[locale]/` because proxy.ts rewrites every non-static request
// with a locale prefix; the trigger still calls the unprefixed path.
const MORNING_HOUR = 8;
const EVENING_HOUR = 21;
const CHUNK_SIZE = 5;

type Slot = "morning" | "evening";
type Translators = Record<Locale, Awaited<ReturnType<typeof getTranslations>>>;
type EligibleUser = { id: string; timezone: string };

function slotForHour(hour: number): Slot | null {
  if (hour === MORNING_HOUR) return "morning";
  if (hour === EVENING_HOUR) return "evening";
  return null;
}

function parseSlot(value: string | null): Slot | null {
  return value === "morning" || value === "evening" ? value : null;
}

// Morning: remind about the day's one_time rituals (dated events) not yet logged.
async function remindMorning(
  supabase: StriveSupabaseClient,
  user: EligibleUser,
  t: Translators,
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

  const count = due.length;
  const firstName = due[0].name;
  return sendOncePerDay(supabase, user.id, "ritual_reminder", today, (locale) => ({
    title: t[locale]("title"),
    body:
      count === 1
        ? t[locale]("bodyOne", { name: firstName })
        : t[locale]("bodyMany", { count }),
    url: "/protected/flow",
    tag: "ritual-reminder",
  }));
}

// Evening: nudge only if the user logged NOTHING today yet still has rituals on
// today's Rhythm to clear. "Actionable today" reuses selectTodayRituals so it
// matches exactly what the user sees (daily/weekday schedules, met weekly/monthly
// targets drop off, open rituals don't count).
async function remindEvening(
  supabase: StriveSupabaseClient,
  user: EligibleUser,
  t: Translators,
): Promise<"sent" | "skipped"> {
  const today = todayInTimeZone(user.timezone);

  // Any log today (any status) means the user engaged → no nudge.
  const { data: anyLog } = await supabase
    .from("ritual_logs")
    .select("id")
    .eq("user_id", user.id)
    .eq("logged_at", today)
    .limit(1);
  if (anyLog?.length) return "skipped";

  const weekStart = startOfWeek(today);
  const [{ rituals, progressByRitualId }, weekLogs] = await Promise.all([
    getRitualsForActiveUser(supabase, user.id),
    getWeekCompletedLogs(supabase, weekStart, user.id),
  ]);
  if (!rituals.length) return "skipped";

  const oneTimeIds = rituals
    .filter((r) => r.ritual_type === "one_time")
    .map((r) => r.id);
  const completedOneTimeIds = await getCompletedRitualIds(
    supabase,
    oneTimeIds,
    user.id,
  );

  const { active } = selectTodayRituals({
    rituals,
    progressByRitualId,
    weekLogs,
    completedOneTimeIds,
    today,
  });
  // Open rituals are ad-hoc (countsTowardDay=false) — they don't create a "to do
  // today" obligation, so they don't trigger the nudge on their own.
  if (!active.some((item) => item.countsTowardDay)) return "skipped";

  return sendOncePerDay(supabase, user.id, "evening_nudge", today, (locale) => ({
    title: t[locale]("title"),
    body: t[locale]("body"),
    url: "/protected/flow",
    tag: "evening-nudge",
  }));
}

async function handle(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return new Response("CRON_SECRET not configured", { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Test affordance: `?slot=morning|evening` forces that slot for every eligible
  // user regardless of their local hour, on non-production deploys only.
  const forcedSlot = isNonProductionEnv()
    ? parseSlot(new URL(req.url).searchParams.get("slot"))
    : null;

  const supabase = createAdminClient();

  // Eligible = reminders enabled, active, AND at least one device subscribed.
  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, timezone, push_subscriptions!inner(user_id)")
    .eq("smart_reminders_enabled", true)
    .eq("is_active", true);

  if (error) {
    console.error("[cron/reminders] failed to list eligible users", error);
    return new Response("Failed to list users", { status: 500 });
  }

  // Assign each user the slot matching their local hour (or the forced slot).
  const tasks = (users ?? [])
    .map((u): { user: EligibleUser; slot: Slot } | null => {
      const slot = forcedSlot ?? slotForHour(hourInTimeZone(u.timezone));
      return slot ? { user: { id: u.id, timezone: u.timezone }, slot } : null;
    })
    .filter((task): task is { user: EligibleUser; slot: Slot } => task !== null);

  const reminderT = {
    en: await getTranslations({ locale: "en", namespace: "notifications.ritualReminder" }),
    fr: await getTranslations({ locale: "fr", namespace: "notifications.ritualReminder" }),
  } satisfies Translators;
  const nudgeT = {
    en: await getTranslations({ locale: "en", namespace: "notifications.eveningNudge" }),
    fr: await getTranslations({ locale: "fr", namespace: "notifications.eveningNudge" }),
  } satisfies Translators;

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const group of chunk(tasks, CHUNK_SIZE)) {
    const results = await Promise.allSettled(
      group.map(({ user, slot }) =>
        slot === "morning"
          ? remindMorning(supabase, user, reminderT)
          : remindEvening(supabase, user, nudgeT),
      ),
    );
    results.forEach((result, i) => {
      if (result.status === "fulfilled") {
        if (result.value === "sent") sent += 1;
        else skipped += 1;
      } else {
        failed += 1;
        console.error("[cron/reminders] failed for user", group[i].user.id, result.reason);
      }
    });
  }

  return Response.json({
    eligible: users?.length ?? 0,
    scheduled: tasks.length,
    sent,
    skipped,
    failed,
  });
}

export const GET = handle;
export const POST = handle;
