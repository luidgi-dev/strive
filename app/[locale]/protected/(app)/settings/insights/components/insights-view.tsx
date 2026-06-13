"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import type { InsightCadence } from "@/lib/insights/orchestrator";
import { cn } from "@/lib/utils";

import { dismissInsight } from "../actions";
import { InsightCard, type InsightCardData } from "./insight-card";

export type InsightsReport = {
  cards: InsightCardData[];
  /** Whole days since the report was generated, or null when there is no report. */
  updatedDays: number | null;
};

const CADENCES: InsightCadence[] = ["weekly", "monthly"];

/**
 * Client shell for the Insights page: a Week / Month segmented control switching
 * between the two latest reports, the active report's "updated" meta, and its
 * cards. Dismiss removes the card optimistically and persists via a server action.
 */
export function InsightsView({
  weekly,
  monthly,
  defaultCadence,
}: {
  weekly: InsightsReport;
  monthly: InsightsReport;
  defaultCadence: InsightCadence;
}) {
  const t = useTranslations("insights");
  const [cadence, setCadence] = useState<InsightCadence>(defaultCadence);
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(new Set());
  const [, startTransition] = useTransition();

  const report = cadence === "weekly" ? weekly : monthly;
  const cards = report.cards.filter((c) => !dismissed.has(c.id));

  function handleDismiss(id: string) {
    setDismissed((prev) => new Set(prev).add(id));
    startTransition(() => {
      void dismissInsight(id);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label={t("title")}
        className="grid grid-cols-2 gap-0.5 rounded-lg bg-muted p-0.5"
      >
        {CADENCES.map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={cadence === c}
            onClick={() => setCadence(c)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              cadence === c
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(c === "weekly" ? "section.week" : "section.month")}
          </button>
        ))}
      </div>

      {report.updatedDays !== null ? (
        <p className="px-1 text-[12.5px] font-medium tracking-[0.01em] text-muted-foreground">
          {t("updated", { days: report.updatedDays })}
        </p>
      ) : null}

      {cards.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          {cards.map((card) => (
            <InsightCard key={card.id} card={card} onDismiss={handleDismiss} />
          ))}
        </div>
      ) : (
        <p className="px-1 py-6 text-center text-sm text-muted-foreground">
          {t("empty.body")}
        </p>
      )}
    </div>
  );
}
