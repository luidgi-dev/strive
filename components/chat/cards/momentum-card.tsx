"use client";

import { TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";

import { MomentumMeter } from "./momentum-meter";
import type { MomentumRitual } from "./schemas";

/**
 * Renders `get_momentum_summary` as a clean card: one row per ritual with its
 * X/target bar. Rituals without a target (open / one-time) show a muted dash.
 */
export function MomentumCard({ rituals }: { rituals: MomentumRitual[] }) {
  const t = useTranslations("rituals.ai.cards");
  if (rituals.length === 0) return null;

  return (
    <div className="w-[88%] max-w-[88%] self-start rounded-2xl border border-border bg-card p-3">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <TrendingUp aria-hidden className="size-3.5" strokeWidth={2} />
        {t("momentumTitle")}
      </div>
      <ul className="flex flex-col gap-1.5">
        {rituals.map((ritual, index) => (
          <li key={`${ritual.name}-${index}`} className="flex items-center gap-3">
            <span className="flex-1 truncate text-sm text-foreground">
              {ritual.name}
            </span>
            {ritual.target != null && ritual.logs_this_period != null ? (
              <MomentumMeter
                logs={ritual.logs_this_period}
                target={ritual.target}
                status={ritual.momentum_status}
              />
            ) : ritual.logs_this_period != null ? (
              // Open / one-time rituals have no target: show this week's raw count.
              <span className="w-9 shrink-0 text-right text-xs font-semibold tabular-nums text-foreground">
                {ritual.logs_this_period}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
