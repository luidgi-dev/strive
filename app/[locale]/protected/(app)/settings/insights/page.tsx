import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/lib/i18n/navigation";
import type { InsightCadence } from "@/lib/insights/orchestrator";
import { getMembership } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

import {
  InsightsView,
  type InsightsReport,
} from "./components/insights-view";
import type { InsightCardData } from "./components/insight-card";

type Props = { params: Promise<{ locale: string }> };

type InsightRow = {
  id: string;
  cadence: string;
  type: string;
  headline: string;
  body: string;
  payload: unknown;
  generated_at: string;
  period_start: string;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function basisWeeksOf(payload: unknown, fallback: number): number {
  if (payload && typeof payload === "object" && "basisWeeks" in payload) {
    const value = (payload as { basisWeeks?: unknown }).basisWeeks;
    if (typeof value === "number") return value;
  }
  return fallback;
}

function daysSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / MS_PER_DAY));
}

/** Keep only the latest period's cards for one cadence (rows arrive newest-first). */
function reportFor(rows: InsightRow[], cadence: InsightCadence): InsightsReport {
  const ofCadence = rows.filter((r) => r.cadence === cadence);
  if (ofCadence.length === 0) return { cards: [], updatedDays: null };

  const latestPeriod = ofCadence[0].period_start;
  const latest = ofCadence.filter((r) => r.period_start === latestPeriod);
  const fallbackWeeks = cadence === "monthly" ? 12 : 8;

  const cards: InsightCardData[] = latest.map((r) => ({
    id: r.id,
    type: r.type === "correlation" ? "correlation" : "adjustment",
    headline: r.headline,
    body: r.body,
    basisWeeks: basisWeeksOf(r.payload, fallbackWeeks),
    generatedAt: r.generated_at,
  }));

  const freshest = latest.reduce(
    (max, r) => (Date.parse(r.generated_at) > Date.parse(max) ? r.generated_at : max),
    latest[0].generated_at,
  );

  return { cards, updatedDays: daysSince(freshest) };
}

function pickDefault(weekly: InsightsReport, monthly: InsightsReport): InsightCadence {
  if (weekly.cards.length === 0) return "monthly";
  if (monthly.cards.length === 0) return "weekly";
  const newest = (cards: InsightCardData[]) =>
    Math.max(...cards.map((c) => Date.parse(c.generatedAt)));
  return newest(monthly.cards) > newest(weekly.cards) ? "monthly" : "weekly";
}

export default async function InsightsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Premium gate: lite users never reach the page (the Settings link is hidden
  // for them too). This doubles as the access paywall, per the wireframe.
  const membership = await getMembership();
  if (!membership) redirect(`/${locale}/auth/login`);
  if (membership.tier === "lite") redirect(`/${locale}/protected/settings`);

  const t = await getTranslations("insights");
  const tSettings = await getTranslations("settings");

  // Pure read of the cache. RLS scopes rows to the current user.
  const supabase = await createClient();
  const { data } = await supabase
    .from("insights")
    .select("id, cadence, type, headline, body, payload, generated_at, period_start")
    .is("dismissed_at", null)
    .order("period_start", { ascending: false })
    .order("confidence", { ascending: false });

  const rows = (data ?? []) as InsightRow[];
  const weekly = reportFor(rows, "weekly");
  const monthly = reportFor(rows, "monthly");
  const hasAny = weekly.cards.length > 0 || monthly.cards.length > 0;

  return (
    <div className="-mx-6 -mb-32 -mt-4 flex flex-1 flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-1 bg-background px-2">
        <Link
          href="/protected/settings"
          aria-label={tSettings("back")}
          className="inline-flex size-11 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="font-heading text-base font-semibold tracking-tight">
          {t("title")}
        </h1>
      </header>

      <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-6 pb-16 pt-2">
        {hasAny ? (
          <InsightsView
            weekly={weekly}
            monthly={monthly}
            defaultCadence={pickDefault(weekly, monthly)}
          />
        ) : (
          <div className="flex flex-col items-center gap-1.5 px-4 py-16 text-center">
            <p className="font-heading text-base font-semibold tracking-tight text-foreground">
              {t("empty.title")}
            </p>
            <p className="text-sm text-muted-foreground">{t("empty.body")}</p>
          </div>
        )}

        <p className="px-1 pt-2 text-center text-[11.5px] tracking-[0.01em] text-muted-foreground">
          {t("footer")}
        </p>
      </div>
    </div>
  );
}
