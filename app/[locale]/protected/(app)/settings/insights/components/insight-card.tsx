"use client";

import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

export type InsightType =
  | "correlation"
  | "adjustment"
  | "strength"
  | "best_day"
  | "anchor_pair";

export type InsightCardData = {
  id: string;
  type: InsightType;
  headline: string;
  body: string;
  /** Lookback window in weeks, for the "Last N weeks" basis label. */
  basisWeeks: number;
  /** When the card was generated (ISO), used to pick the freshest report. */
  generatedAt: string;
};

/**
 * One minimal Insight Card, matching design/wireframes/insights.html. The
 * headline + body come from the AI (stored per row); only the chrome is
 * translated. Styling uses design tokens only — no hardcoded colors.
 */
export function InsightCard({
  card,
  onDismiss,
}: {
  card: InsightCardData;
  onDismiss: (id: string) => void;
}) {
  const t = useTranslations("insights");

  return (
    <article className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
      <div className="inline-flex items-center gap-1.5">
        <Sparkles
          aria-hidden
          className="size-3.5 text-muted-foreground"
          strokeWidth={1.75}
        />
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {t(`type.${card.type}`)}
        </span>
      </div>

      <h3 className="font-heading text-[15px] font-semibold tracking-tight text-foreground">
        {card.headline}
      </h3>
      <p className="text-[13px] leading-relaxed text-muted-foreground">
        {card.body}
      </p>

      <div className="flex items-center justify-between gap-3 pt-1">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.04em] text-muted-foreground/80">
          {t("basis.lastNWeeks", { count: card.basisWeeks })}
        </span>
        <button
          type="button"
          onClick={() => onDismiss(card.id)}
          className="rounded-full border border-border px-3 py-1.5 text-[11.5px] font-semibold text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          {t("actions.dismiss")}
        </button>
      </div>
    </article>
  );
}
