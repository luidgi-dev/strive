import { getTranslations } from "next-intl/server";

import { todayInTimeZone } from "@/lib/date";
import {
  generateInsightsForUser,
  type InsightCadence,
} from "@/lib/insights/orchestrator";
import { sendOncePerDay } from "@/lib/push/notify";
import { createAdminClient } from "@/lib/supabase/admin";
import { chunk, isNonProductionEnv } from "@/lib/utils";
import type { StriveSupabaseClient } from "@/lib/ai/types";
import type { Locale } from "@/lib/locales";

// web-push (in the insight_ready notification) relies on Node crypto.
export const runtime = "nodejs";

// Scheduled Insights generation. Triggered by Vercel Cron (see vercel.json):
//   - weekly  report every Monday  (?cadence=weekly)
//   - monthly report on the 1st    (?cadence=monthly), staggered an hour later so
//     a Monday-on-the-1st runs both without overlapping.
// Runs under the service role for all premium/lifetime users — there is no user
// session here, so the only gate is the shared CRON_SECRET.
//
// Lives under `[locale]/` because proxy.ts rewrites every non-static request
// with a locale prefix; Vercel still calls the unprefixed `/api/cron/insights`.
//
// Vercel Cron invokes the path with a GET request and, when a `CRON_SECRET` env
// var is set, automatically attaches `Authorization: Bearer <CRON_SECRET>`. We
// verify that header so the endpoint cannot be triggered by anyone else.
export const maxDuration = 60; // Hobby caps at 60s; raise toward 300 on Pro if the cohort grows

// Users are processed in parallel chunks: a whole run is one cron trigger, but
// within it we fan out CHUNK_SIZE users at a time. This keeps wall-clock low
// (so a single 60s function handles many users) while bounding concurrent Gemini
// calls so we don't trip provider rate limits. Bump on Pro if needed.
const CHUNK_SIZE = 5;

function parseCadence(value: string | null): InsightCadence {
  return value === "monthly" ? "monthly" : "weekly";
}

type Translators = Record<Locale, Awaited<ReturnType<typeof getTranslations>>>;

type InsightUser = {
  id: string;
  timezone: string;
  smart_reminders_enabled: boolean;
};

// Generate this user's insights, then notify them if new cards were produced and
// they've opted in. The notification is best-effort: a push failure is logged but
// never fails generation (so the cron's success/failure counts track generation).
async function processUser(
  supabase: StriveSupabaseClient,
  user: InsightUser,
  cadence: InsightCadence,
  translators: Translators,
  force: boolean,
): Promise<{ generated: number }> {
  const { generated } = await generateInsightsForUser(supabase, user.id, {
    cadence,
  });

  if ((generated > 0 || force) && user.smart_reminders_enabled) {
    try {
      await sendOncePerDay(
        supabase,
        user.id,
        "insight_ready",
        todayInTimeZone(user.timezone),
        (locale) => ({
          title:
            cadence === "weekly"
              ? translators[locale]("titleWeekly")
              : translators[locale]("titleMonthly"),
          body: translators[locale]("body"),
          url: "/protected/settings/insights",
          tag: "insight-ready",
        }),
      );
    } catch (err) {
      console.error("[cron/insights] notify failed for user", user.id, err);
    }
  }

  return { generated };
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return new Response("CRON_SECRET not configured", { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(req.url);
  const cadence = parseCadence(url.searchParams.get("cadence"));
  // Test affordance: `?force=1` also notifies when generation produced no new
  // cards, on non-production deploys — lets us validate reception without
  // depending on real insight data.
  const force = url.searchParams.get("force") === "1" && isNonProductionEnv();
  const supabase = createAdminClient();

  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, timezone, smart_reminders_enabled")
    .in("tier", ["premium", "lifetime"])
    .eq("is_active", true);

  if (error) {
    console.error("[cron/insights] failed to list eligible users", error);
    return new Response("Failed to list users", { status: 500 });
  }

  const translators = {
    en: await getTranslations({ locale: "en", namespace: "notifications.insightReady" }),
    fr: await getTranslations({ locale: "fr", namespace: "notifications.insightReady" }),
  } satisfies Translators;

  let succeeded = 0;
  let failed = 0;
  let cards = 0;

  // Fan out CHUNK_SIZE users at a time; chunks run one after another so the
  // number of concurrent Gemini calls stays bounded.
  for (const group of chunk(users ?? [], CHUNK_SIZE)) {
    const results = await Promise.allSettled(
      group.map((user) => processUser(supabase, user, cadence, translators, force)),
    );
    results.forEach((result, i) => {
      if (result.status === "fulfilled") {
        cards += result.value.generated;
        succeeded += 1;
      } else {
        console.error(
          "[cron/insights] generation failed for user",
          group[i].id,
          result.reason,
        );
        failed += 1;
      }
    });
  }

  return Response.json({
    cadence,
    users: users?.length ?? 0,
    succeeded,
    failed,
    cards,
  });
}
