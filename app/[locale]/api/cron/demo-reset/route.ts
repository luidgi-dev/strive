import { daysInMonth, startOfWeek, todayInTimeZone } from "@/lib/date";
import {
  addDaysIso,
  currentWeekLogDates,
  DEMO_INSIGHTS,
  DEMO_RITUALS,
  DEMO_TIMEZONE,
  DEMO_TODAY_PENDING,
} from "@/lib/demo-data";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";

// Runs under the service role (no user session). Force the Node runtime to match
// the other cron routes and keep parity with their tooling.
export const runtime = "nodejs";
export const maxDuration = 60;

// Nightly demo reset (LUI-43). Triggered by Supabase pg_cron at 03:00 UTC (see
// data/cron/demo_reset.sql) rather than a Vercel Cron: the Hobby plan caps at two
// cron jobs and both are already taken by the Insights crons, so the demo reset
// rides on pg_cron like the hourly reminders do.
//
// Lives under `[locale]/` because proxy.ts rewrites every non-static request with
// a locale prefix; pg_cron still calls the unprefixed `/api/cron/demo-reset`.
//
// Resets the demo user's rituals (back to the DEMO_RITUALS definition, e.g.
// un-archived), their CURRENT-WEEK logs, AI credits and insights. The older log
// history (which feeds The Arc and the frozen insights) and each ritual's
// started_at anchor are left untouched.
async function handle(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return new Response("CRON_SECRET not configured", { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const demoUserId = process.env.DEMO_USER_ID;
  if (!demoUserId) {
    // No demo account configured for this deploy: nothing to reset.
    return Response.json({ skipped: "no_demo_user" });
  }

  const supabase = createAdminClient();
  const today = todayInTimeZone(DEMO_TIMEZONE);
  const weekStart = startOfWeek(today);

  // 1. Clear this week's logs (keep older history so The Arc stays lived-in).
  const { error: deleteLogsError } = await supabase
    .from("ritual_logs")
    .delete()
    .eq("user_id", demoUserId)
    .gte("logged_at", weekStart);
  if (deleteLogsError) {
    console.error("[cron/demo-reset] clear week logs failed", deleteLogsError);
    return new Response("Failed to clear logs", { status: 500 });
  }

  // 2. Resolve the demo rituals by name (so we never hardcode seeded UUIDs) and
  //    re-flatten them to the DEMO_RITUALS definition. Visitors can archive or
  //    edit rituals (those actions carry no demo guard) and nothing else restores
  //    them, so the nightly reset is what keeps the showcase consistent.
  const { data: rituals, error: ritualsError } = await supabase
    .from("rituals")
    .select("id, name")
    .eq("user_id", demoUserId);
  if (ritualsError) {
    console.error("[cron/demo-reset] list rituals failed", ritualsError);
    return new Response("Failed to list rituals", { status: 500 });
  }
  const ritualIdByName = new Map((rituals ?? []).map((r) => [r.name, r.id]));

  // System ritual categories are global (user_id is null); resolve slug -> id so
  // the reset can restore each ritual's category alongside the rest of its shape.
  const { data: categories, error: categoriesError } = await supabase
    .from("ritual_categories")
    .select("id, slug")
    .is("user_id", null);
  if (categoriesError) {
    console.error("[cron/demo-reset] load categories failed", categoriesError);
    return new Response("Failed to load categories", { status: 500 });
  }
  const categoryIdBySlug = new Map(
    (categories ?? []).map((c) => [c.slug, c.id]),
  );

  // Reset the editable fields to the canonical definition: un-archive, re-activate
  // and restore category/icon/frequency/schedule. started_at is intentionally left
  // alone so the seeded history (The Arc) keeps its anchor.
  let ritualsReset = 0;
  for (const def of DEMO_RITUALS) {
    const ritualId = ritualIdByName.get(def.name);
    if (!ritualId) continue;
    const patch: TablesUpdate<"rituals"> = {
      category_id: categoryIdBySlug.get(def.categorySlug) ?? null,
      ritual_type: "recurring",
      icon: def.icon,
      frequency_unit: def.frequencyUnit,
      frequency_value: def.frequencyValue,
      scheduled_days: def.days,
      is_active: true,
      archived_at: null,
      updated_at: new Date().toISOString(),
    };
    const { error: resetRitualError } = await supabase
      .from("rituals")
      .update(patch)
      .eq("id", ritualId);
    if (resetRitualError) {
      console.error(
        "[cron/demo-reset] reset ritual failed",
        def.name,
        resetRitualError,
      );
      return new Response("Failed to reset rituals", { status: 500 });
    }
    ritualsReset += 1;
  }

  // 3. Re-insert realistic current-week logs (Mon..today) from the shared pattern.
  const logRows: TablesInsert<"ritual_logs">[] = [];
  for (const def of DEMO_RITUALS) {
    const ritualId = ritualIdByName.get(def.name);
    if (!ritualId) continue;
    // A couple of daily rituals stay unlogged today so Rhythm has something to do.
    const skipToday = DEMO_TODAY_PENDING.includes(def.name);
    for (const loggedAt of currentWeekLogDates(today, def.days, skipToday)) {
      logRows.push({
        ritual_id: ritualId,
        user_id: demoUserId,
        status_id: "completed",
        logged_at: loggedAt,
        logged_via: "auto",
      });
    }
  }
  if (logRows.length > 0) {
    const { error: insertLogsError } = await supabase
      .from("ritual_logs")
      .insert(logRows);
    if (insertLogsError) {
      console.error("[cron/demo-reset] insert week logs failed", insertLogsError);
      return new Response("Failed to insert logs", { status: 500 });
    }
  }

  // 4. Reset AI credits to the daily demo cap. reset_at is set to tomorrow so the
  //    Settings "resets on" label reflects the daily cadence. Note: the generic
  //    monthly reset_ai_credits() is harmless here, the lite quota is also 5.
  const { error: creditsError } = await supabase.from("user_credits").upsert(
    {
      user_id: demoUserId,
      balance: 5,
      used: 0,
      reset_at: `${addDaysIso(today, 1)}T03:00:00.000Z`,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (creditsError) {
    console.error("[cron/demo-reset] reset credits failed", creditsError);
    return new Response("Failed to reset credits", { status: 500 });
  }

  // 5. Re-seed the frozen Insight Cards. Full reset (delete + insert) so a visitor
  //    dismissing a card doesn't make it vanish until the next deploy. Skipped
  //    while DEMO_INSIGHTS is empty (before the one-off generation has run).
  let insightsInserted = 0;
  if (DEMO_INSIGHTS.length > 0) {
    // Weekly cards cover the current ISO week; monthly cards cover the calendar
    // month, mirroring how the real orchestrator stamps each cadence.
    const weekPeriod = { start: weekStart, end: addDaysIso(weekStart, 6) };
    const month = today.slice(0, 7);
    const monthPeriod = {
      start: `${month}-01`,
      end: `${month}-${String(daysInMonth(today)).padStart(2, "0")}`,
    };

    const insightRows: TablesInsert<"insights">[] = DEMO_INSIGHTS.map((card) => {
      const period = card.cadence === "monthly" ? monthPeriod : weekPeriod;
      return {
        user_id: demoUserId,
        cadence: card.cadence,
        type: card.type,
        headline: card.copy.en.headline,
        body: card.copy.en.body,
        translations: { en: card.copy.en, fr: card.copy.fr },
        basis_label: card.basisLabel,
        confidence: card.confidence,
        ritual_id: card.ritualName
          ? ritualIdByName.get(card.ritualName) ?? null
          : null,
        payload: { ...card.payload, basisWeeks: card.basisWeeks },
        period_start: period.start,
        period_end: period.end,
      };
    });

    const { error: deleteInsightsError } = await supabase
      .from("insights")
      .delete()
      .eq("user_id", demoUserId);
    if (deleteInsightsError) {
      console.error(
        "[cron/demo-reset] clear insights failed",
        deleteInsightsError,
      );
      return new Response("Failed to clear insights", { status: 500 });
    }

    const { error: insertInsightsError } = await supabase
      .from("insights")
      .insert(insightRows);
    if (insertInsightsError) {
      console.error(
        "[cron/demo-reset] insert insights failed",
        insertInsightsError,
      );
      return new Response("Failed to insert insights", { status: 500 });
    }
    insightsInserted = insightRows.length;
  }

  return Response.json({
    weekStart,
    ritualsReset,
    logs: logRows.length,
    credits: 5,
    insights: insightsInserted,
  });
}

export const GET = handle;
export const POST = handle;
