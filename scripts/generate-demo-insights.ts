/**
 * Generate the demo's frozen Insight Cards (LUI-43), for BOTH cadences.
 *
 * Runs the REAL insights engine against the seeded demo history: pure calculators
 * produce the facts, Gemini phrases them with the app's prompts (numbers are never
 * invented). For each cadence (weekly = 8-week windows, monthly = 12-week windows)
 * it curates the set to lead with the non-obvious cards (correlation, anchor pair,
 * adjustment), then fills up to the cadence's card budget.
 *
 * Writes the curated cards into the demo's `insights` rows (current week / current
 * month) and prints a `DEMO_INSIGHTS` literal to paste into lib/demo-data.ts so
 * the nightly cron can re-insert them verbatim.
 *
 * Prereq: scripts/seed-demo.ts has run and DEMO_USER_ID is set.
 *   npx tsx --env-file=.env.local scripts/generate-demo-insights.ts
 *
 * Required env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 * GOOGLE_GENERATIVE_AI_API_KEY, DEMO_USER_ID.
 */
import { generateObject } from "ai";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { striveAIModel } from "@/lib/ai/client";
import type { StriveSupabaseClient } from "@/lib/ai/types";
import { getRitualsForActiveUser } from "@/lib/data/rituals";
import { addDaysIso, DEMO_TIMEZONE, type DemoInsight } from "@/lib/demo-data";
import { daysInMonth, startOfWeek, todayInTimeZone } from "@/lib/date";
import {
  computeAdjustments,
  computeAnchorPairs,
  computeBestDay,
  computeCorrelations,
  computeStrengths,
  fetchCompletedLogsSince,
  type CalculatorResult,
  type InsightLog,
  type InsightRitual,
  type InsightType,
} from "@/lib/insights/calculators";
import { insightSystemPrompt, insightUserPrompt } from "@/lib/insights/prompts";
import type { Database } from "@/lib/supabase/database.types";

const url = required("NEXT_PUBLIC_SUPABASE_URL");
const serviceKey = required("SUPABASE_SERVICE_ROLE_KEY");
const demoUserId = required("DEMO_USER_ID");

const admin = createClient<Database>(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const CardSchema = z.object({
  en: z.object({ headline: z.string().min(1), body: z.string().min(1) }),
  fr: z.object({ headline: z.string().min(1), body: z.string().min(1) }),
});

const PRIORITY: InsightType[] = ["correlation", "anchor_pair", "adjustment"];

type Cadence = "weekly" | "monthly";
const CADENCE_CONFIG: Record<
  Cadence,
  { correlation: number; adjustment: number; strength: number; rhythm: number; maxCards: number }
> = {
  weekly: { correlation: 8, adjustment: 4, strength: 4, rhythm: 8, maxCards: 4 },
  monthly: { correlation: 12, adjustment: 8, strength: 8, rhythm: 12, maxCards: 6 },
};

async function main() {
  const today = todayInTimeZone(DEMO_TIMEZONE);
  const since = addDaysIso(startOfWeek(today), -12 * 7);

  const supabase = admin as unknown as StriveSupabaseClient;
  const [logs, ritualsData] = await Promise.all([
    fetchCompletedLogsSince(supabase, demoUserId, since),
    getRitualsForActiveUser(supabase, demoUserId),
  ]);
  const rituals: InsightRitual[] = ritualsData.rituals.map((r) => ({
    id: r.id,
    name: r.name,
    ritual_type: r.ritual_type,
    frequency_unit: r.frequency_unit,
    frequency_value: r.frequency_value,
  }));
  const nameById = new Map(rituals.map((r) => [r.id, r.name]));

  const frozen: DemoInsight[] = [];
  const rows: Database["public"]["Tables"]["insights"]["Insert"][] = [];

  for (const cadence of ["weekly", "monthly"] as Cadence[]) {
    const cfg = CADENCE_CONFIG[cadence];
    const candidates = candidatesFor(logs, rituals, today, cfg);
    console.log(
      `→ ${cadence} candidates:`,
      candidates.map((c) => `${c.type}(${c.confidence.toFixed(2)})`).join(", ") || "none",
    );
    const picks = curate(candidates, cfg.maxCards);
    console.log(`  picked:`, picks.map((c) => c.type).join(", ") || "none");

    const period = periodFor(cadence, today);
    for (const candidate of picks) {
      const { object: copy } = await generateObject({
        model: striveAIModel,
        schema: CardSchema,
        system: insightSystemPrompt(candidate.type),
        prompt: insightUserPrompt(candidate),
      });
      frozen.push({
        cadence,
        type: candidate.type,
        ritualName: candidate.ritualId ? nameById.get(candidate.ritualId) ?? null : null,
        confidence: candidate.confidence,
        basisWeeks: candidate.basisWeeks,
        basisLabel: `Last ${candidate.basisWeeks} weeks`,
        copy,
        payload: { ...candidate.payload, basisWeeks: candidate.basisWeeks },
      });
      rows.push({
        user_id: demoUserId,
        cadence,
        type: candidate.type,
        headline: copy.en.headline,
        body: copy.en.body,
        translations: { en: copy.en, fr: copy.fr },
        basis_label: `Last ${candidate.basisWeeks} weeks`,
        confidence: candidate.confidence,
        ritual_id: candidate.ritualId,
        payload: { ...candidate.payload, basisWeeks: candidate.basisWeeks },
        period_start: period.start,
        period_end: period.end,
      });
    }
  }

  console.log("→ Writing demo insights rows");
  await admin.from("insights").delete().eq("user_id", demoUserId);
  const { error } = await admin.from("insights").insert(rows);
  if (error) throw error;

  console.log("\n// ---- Paste into lib/demo-data.ts (DEMO_INSIGHTS) ----\n");
  console.log(`export const DEMO_INSIGHTS: DemoInsight[] = ${JSON.stringify(frozen, null, 2)};`);
}

function candidatesFor(
  logs: InsightLog[],
  rituals: InsightRitual[],
  today: string,
  cfg: (typeof CADENCE_CONFIG)[Cadence],
): CalculatorResult[] {
  return [
    ...computeCorrelations(logs, rituals, today, { weeks: cfg.correlation }),
    ...computeAdjustments(logs, rituals, today, { weeks: cfg.adjustment }),
    ...computeStrengths(logs, rituals, today, { weeks: cfg.strength }),
    ...computeBestDay(logs, today, { weeks: cfg.rhythm }),
    ...computeAnchorPairs(logs, rituals, today, { weeks: cfg.rhythm }),
  ]
    .filter((c) => c.confidence >= 0.5)
    .sort((a, b) => b.confidence - a.confidence);
}

// Lead with the non-obvious types, then fill by confidence. One card per type so
// the report stays varied (no two "target too high" cards, etc.).
function curate(candidates: CalculatorResult[], max: number): CalculatorResult[] {
  const picks: CalculatorResult[] = [];
  const usedTypes = new Set<InsightType>();
  const tryPush = (c: CalculatorResult | undefined): void => {
    if (!c || picks.includes(c) || usedTypes.has(c.type)) return;
    picks.push(c);
    usedTypes.add(c.type);
  };
  for (const type of PRIORITY) tryPush(candidates.find((c) => c.type === type));
  for (const c of candidates) {
    if (picks.length >= max) break;
    tryPush(c);
  }
  return picks.slice(0, max);
}

function periodFor(cadence: Cadence, today: string): { start: string; end: string } {
  if (cadence === "monthly") {
    const month = today.slice(0, 7);
    return { start: `${month}-01`, end: `${month}-${String(daysInMonth(today)).padStart(2, "0")}` };
  }
  const start = startOfWeek(today);
  return { start, end: addDaysIso(start, 6) };
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

main().catch((err) => {
  console.error("Generation failed:", err);
  process.exitCode = 1;
});
