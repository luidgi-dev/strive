"use client";

import { useTranslations } from "next-intl";

import type { ListRitual } from "./schemas";

/** Renders `list_rituals` as a clean card: name, optional category, period chip. */
export function RitualListCard({
  rituals,
  category,
}: {
  rituals: ListRitual[];
  category?: string | null;
}) {
  const t = useTranslations("rituals.ai.cards");
  if (rituals.length === 0) return null;

  return (
    <div className="w-[88%] max-w-[88%] self-start rounded-2xl border border-border bg-card p-3">
      <div className="mb-2 text-xs font-semibold text-muted-foreground">
        {category ? `${t("ritualsTitle")} · ${category}` : t("ritualsTitle")}
      </div>
      <ul className="flex flex-col gap-1.5">
        {rituals.map((ritual) => (
          <li key={ritual.id} className="flex items-center gap-2">
            <span className="flex-1 truncate text-sm text-foreground">
              {ritual.name}
            </span>
            {ritual.category ? (
              <span className="shrink-0 truncate text-xs text-muted-foreground">
                {ritual.category}
              </span>
            ) : null}
            <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {t(`period.${ritual.period_label}`)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
