import { Check } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";

import { cn } from "@/lib/utils";

type Props = {
  dueDate: string | null;
  /** logged_at of the latest completed log, or null when never logged. */
  completedAt: string | null;
  /** Reference "today" as YYYY-MM-DD, in the user's timezone. */
  today: string;
};

type OneTimeState = "upcoming" | "done" | "overdue";

const MS_PER_DAY = 86_400_000;

function dayDiff(a: string, b: string): number {
  return Math.round(
    (Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / MS_PER_DAY,
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Adaptive status card for one-time rituals (replaces the KPI strip + The Arc,
 * which do not apply). Shows upcoming / done / past-due with a calm, neutral tone.
 */
export async function OneTimeStatus({ dueDate, completedAt, today }: Props) {
  const t = await getTranslations("rituals.detail.oneTime");
  const format = await getFormatter();

  const now = new Date();
  const fmtDate = (date: string) =>
    format.dateTime(new Date(`${date}T00:00:00`), { dateStyle: "medium" });
  const relDays = (date: string) =>
    format.relativeTime(new Date(`${date}T12:00:00`), { now, unit: "day" });

  let state: OneTimeState;
  let value: string;
  let sub: string | null = null;
  let note: string | null = null;

  if (completedAt) {
    state = "done";
    value = t("loggedOn", { date: fmtDate(completedAt) });
    if (dueDate) {
      const diff = dayDiff(dueDate, completedAt);
      sub = diff > 0 ? t("early", { n: diff }) : diff < 0 ? t("late", { n: -diff }) : t("onTime");
    }
  } else if (dueDate && dueDate < today) {
    state = "overdue";
    value = t("dueOn", { date: fmtDate(dueDate) });
    sub = relDays(dueDate);
    note = t("note");
  } else {
    state = "upcoming";
    value = dueDate ? capitalize(relDays(dueDate)) : t("status.upcoming");
    sub = dueDate ? fmtDate(dueDate) : null;
  }

  return (
    <section className="flex flex-col gap-3.5 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        {state === "done" ? (
          <Check aria-hidden className="size-[18px] text-momentum" />
        ) : null}
        <span
          className={cn(
            "text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground",
            state === "done" && "text-momentum",
            state === "overdue" && "text-caution",
          )}
        >
          {t(`status.${state}`)}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-heading text-[26px] font-bold leading-tight tracking-tight text-foreground">
          {value}
        </span>
        {sub ? (
          <span className="text-[13px] font-medium text-muted-foreground">{sub}</span>
        ) : null}
      </div>
      {note ? (
        <p className="border-t border-border pt-3.5 text-[13px] leading-relaxed text-muted-foreground">
          {note}
        </p>
      ) : null}
    </section>
  );
}
