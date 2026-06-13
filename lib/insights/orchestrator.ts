// Insights Orchestrator — glues the Stats Engine, the Prompt Library, Gemini and
// the cache together. Transport-agnostic: it takes a privileged Supabase client
// and a user id, with no HTTP or auth concern. Scheduled cron routes enumerate
// eligible users and call this for each.
//
// Two cadences share this path:
//   - weekly  (Mondays): an 8-week lookback, up to 4 cards.
//   - monthly (the 1st): a 12-week lookback, up to 6 cards — richer, with more
//     history behind each pattern.
// `cadence` is stored on every row, so a Monday-on-the-1st produces both reports
// without one overwriting the other.
//
// Flow: respect the global AI kill-switch, compute the facts, keep only the
// confident ones, phrase each with the AI, then replace this period's cached
// cards idempotently (dismissed cards are preserved and never resurrected).

import { generateObject } from "ai";
import { z } from "zod";

import { striveAIModel } from "@/lib/ai/client";
import { isAiEnabled } from "@/lib/ai/credits";
import type { StriveSupabaseClient } from "@/lib/ai/types";
import { daysInMonth, startOfWeek, todayInTimeZone } from "@/lib/date";
import { getRitualsForActiveUser } from "@/lib/data/rituals";
import {
  computeAdjustments,
  computeAnchorPairs,
  computeBestDay,
  computeCorrelations,
  computeStrengths,
  fetchCompletedLogsSince,
  type CalculatorResult,
  type InsightRitual,
} from "@/lib/insights/calculators";
import {
  insightSystemPrompt,
  insightUserPrompt,
  type InsightLocale,
} from "@/lib/insights/prompts";
import type { TablesInsert } from "@/lib/supabase/database.types";

export type InsightCadence = "weekly" | "monthly";

/** Cards below this confidence are dropped before reaching the AI. */
const CONFIDENCE_THRESHOLD = 0.5;
/** Keep variety: at most this many cards of the same type per report. */
const PER_TYPE_CAP = 2;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Per-cadence tuning. Monthly looks back further and shows more cards. */
const CADENCE_CONFIG: Record<
  InsightCadence,
  {
    correlationWeeks: number;
    adjustmentWeeks: number;
    strengthWeeks: number;
    rhythmWeeks: number;
    lookbackWeeks: number;
    maxCards: number;
  }
> = {
  weekly: {
    correlationWeeks: 8,
    adjustmentWeeks: 4,
    strengthWeeks: 4,
    rhythmWeeks: 8,
    lookbackWeeks: 8,
    maxCards: 4,
  },
  monthly: {
    correlationWeeks: 12,
    adjustmentWeeks: 8,
    strengthWeeks: 8,
    rhythmWeeks: 12,
    lookbackWeeks: 12,
    maxCards: 6,
  },
};

const InsightCardSchema = z.object({
  headline: z.string().min(1).max(120),
  body: z.string().min(1).max(400),
});

export type GenerateInsightsOptions = {
  /** Which report to generate. Defaults to "weekly". */
  cadence?: InsightCadence;
  /** Language the cards are written in. Defaults to "en" (no per-profile pref yet). */
  locale?: InsightLocale;
  /** Override "today" (YYYY-MM-DD) for tests; otherwise resolved from the profile timezone. */
  today?: string;
};

const addDaysISO = (iso: string, days: number): string =>
  new Date(Date.parse(`${iso}T00:00:00.000Z`) + days * MS_PER_DAY)
    .toISOString()
    .slice(0, 10);

/** Period [start, end] the report covers: the ISO week (weekly) or calendar month (monthly). */
function periodFor(cadence: InsightCadence, today: string): { start: string; end: string } {
  if (cadence === "monthly") {
    const start = `${today.slice(0, 7)}-01`;
    const end = `${today.slice(0, 7)}-${String(daysInMonth(today)).padStart(2, "0")}`;
    return { start, end };
  }
  const start = startOfWeek(today);
  return { start, end: addDaysISO(start, 6) };
}

function toInsightRituals(
  rituals: {
    id: string;
    name: string;
    ritual_type: string;
    frequency_unit: string | null;
    frequency_value: number | null;
  }[],
): InsightRitual[] {
  return rituals.map((r) => ({
    id: r.id,
    name: r.name,
    ritual_type: r.ritual_type,
    frequency_unit: r.frequency_unit,
    frequency_value: r.frequency_value,
  }));
}

async function resolveToday(
  supabase: StriveSupabaseClient,
  userId: string,
  override?: string,
): Promise<string> {
  if (override) return override;
  const { data } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", userId)
    .maybeSingle();
  return todayInTimeZone(data?.timezone ?? "UTC");
}

/**
 * Generate and cache one user's Insight Cards for the given cadence.
 *
 * Runs under the service role (the cron has no user session), so every query
 * filters `user_id` explicitly. Idempotent: re-running for the same (cadence,
 * period) replaces that report's non-dismissed cards and skips any (type, ritual)
 * the user already dismissed, so a dismissed card never reappears.
 */
export async function generateInsightsForUser(
  supabase: StriveSupabaseClient,
  userId: string,
  options: GenerateInsightsOptions = {},
): Promise<{ generated: number }> {
  const cadence: InsightCadence = options.cadence ?? "weekly";
  const locale: InsightLocale = options.locale ?? "en";
  const config = CADENCE_CONFIG[cadence];

  // Respect the global pause without consuming credits (generation is free /
  // tier-covered; the premium gate is the paywall).
  if (!(await isAiEnabled(supabase))) return { generated: 0 };

  const today = await resolveToday(supabase, userId, options.today);
  const period = periodFor(cadence, today);
  const since = addDaysISO(startOfWeek(today), -config.lookbackWeeks * 7);

  const [logs, ritualsData] = await Promise.all([
    fetchCompletedLogsSince(supabase, userId, since),
    getRitualsForActiveUser(supabase, userId),
  ]);
  const rituals = toInsightRituals(ritualsData.rituals);

  const candidates = [
    ...computeCorrelations(logs, rituals, today, { weeks: config.correlationWeeks }),
    ...computeAdjustments(logs, rituals, today, { weeks: config.adjustmentWeeks }),
    ...computeStrengths(logs, rituals, today, { weeks: config.strengthWeeks }),
    ...computeBestDay(logs, today, { weeks: config.rhythmWeeks }),
    ...computeAnchorPairs(logs, rituals, today, { weeks: config.rhythmWeeks }),
  ]
    .filter((c) => c.confidence >= CONFIDENCE_THRESHOLD)
    .sort((a, b) => b.confidence - a.confidence);

  // Don't resurrect cards the user already dismissed for this report.
  const { data: dismissed } = await supabase
    .from("insights")
    .select("type, ritual_id")
    .eq("user_id", userId)
    .eq("cadence", cadence)
    .eq("period_start", period.start)
    .not("dismissed_at", "is", null);
  const dismissedKeys = new Set(
    (dismissed ?? []).map((d) => `${d.type}|${d.ritual_id ?? ""}`),
  );

  // Select highest-confidence first, but cap each type so one calculator can't
  // fill the whole report — keeps a mix (e.g. a Strength alongside an Adjustment).
  const perType = new Map<string, number>();
  const selected: CalculatorResult[] = [];
  for (const c of candidates) {
    if (selected.length >= config.maxCards) break;
    if (dismissedKeys.has(`${c.type}|${c.ritualId ?? ""}`)) continue;
    const used = perType.get(c.type) ?? 0;
    if (used >= PER_TYPE_CAP) continue;
    perType.set(c.type, used + 1);
    selected.push(c);
  }

  const rows: TablesInsert<"insights">[] = [];
  for (const candidate of selected) {
    try {
      const { object } = await generateObject({
        model: striveAIModel,
        schema: InsightCardSchema,
        system: insightSystemPrompt(candidate.type, locale),
        prompt: insightUserPrompt(candidate),
      });
      rows.push(buildRow(userId, cadence, period, locale, candidate, object));
    } catch (error) {
      // One card failing must not abort the batch; there is no credit to refund.
      console.error("[insights] card generation failed", cadence, candidate.type, error);
    }
  }

  // Idempotent replace: clear this report's non-dismissed cards, then insert the
  // fresh batch. Other periods/cadences and dismissed cards are untouched.
  const { error: deleteError } = await supabase
    .from("insights")
    .delete()
    .eq("user_id", userId)
    .eq("cadence", cadence)
    .eq("period_start", period.start)
    .is("dismissed_at", null);
  if (deleteError) throw deleteError;

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from("insights").insert(rows);
    if (insertError) throw insertError;
  }

  return { generated: rows.length };
}

function buildRow(
  userId: string,
  cadence: InsightCadence,
  period: { start: string; end: string },
  locale: InsightLocale,
  candidate: CalculatorResult,
  card: z.infer<typeof InsightCardSchema>,
): TablesInsert<"insights"> {
  return {
    user_id: userId,
    cadence,
    type: candidate.type,
    headline: card.headline,
    body: card.body,
    basis_label: `Last ${candidate.basisWeeks} weeks`,
    confidence: candidate.confidence,
    ritual_id: candidate.ritualId,
    payload: { ...candidate.payload, basisWeeks: candidate.basisWeeks, locale },
    period_start: period.start,
    period_end: period.end,
  };
}
