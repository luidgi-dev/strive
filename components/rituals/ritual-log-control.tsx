"use client";

import { Check, Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { useRitualLog } from "./ritual-log-provider";

type Props = {
  name: string;
};

// Outline circle "+" matching the wireframe `.btn-log`.
const BTN_LOG_CLASS =
  "flex size-8 items-center justify-center rounded-full border-[1.5px] border-muted-foreground/35 text-muted-foreground transition-colors hover:border-foreground hover:text-foreground";

export function RitualLogControl({ name }: Props) {
  const t = useTranslations("rituals.detail");
  const { count, ritualType, pulseTick, log, unlog } = useRitualLog();

  // A green ring briefly illuminates the control on each log, then settles.
  const glow =
    pulseTick > 0 ? (
      <span
        key={pulseTick}
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full animate-log-pulse"
      />
    ) : null;

  // One-time: mark done / undo, no stepper (a single event).
  if (ritualType === "one_time") {
    return (
      <span className="relative inline-flex shrink-0">
        {count > 0 ? (
          <button
            type="button"
            onClick={unlog}
            aria-label={t("log.undoDone")}
            className="flex size-8 items-center justify-center rounded-full bg-momentum text-background transition-opacity hover:opacity-90"
          >
            <Check aria-hidden className="size-4" strokeWidth={2.5} />
          </button>
        ) : (
          <button
            type="button"
            onClick={log}
            aria-label={t("log.markDone")}
            className={BTN_LOG_CLASS}
          >
            <Plus aria-hidden className="size-4" />
          </button>
        )}
        {glow}
      </span>
    );
  }

  // Recurring / open: "+" until the first log, then a stepper to log again or undo.
  if (count > 0) {
    return (
      <span className="relative inline-flex shrink-0">
        <div
          role="group"
          aria-label={t("log.adjust")}
          className="inline-flex h-8 items-center overflow-hidden rounded-full border border-border bg-accent text-foreground"
        >
          <button
            type="button"
            onClick={unlog}
            aria-label={t("log.undo")}
            className="flex h-full w-7 items-center justify-center transition-colors hover:bg-foreground/[0.06]"
          >
            <Minus aria-hidden className="size-3" strokeWidth={2.25} />
          </button>
          <span className="min-w-[18px] px-0.5 text-center font-heading text-[13px] font-bold tracking-tight">
            {count}
          </span>
          <button
            type="button"
            onClick={log}
            aria-label={t("log.logAgain")}
            className="flex h-full w-7 items-center justify-center transition-colors hover:bg-foreground/[0.06]"
          >
            <Plus aria-hidden className="size-3" strokeWidth={2.25} />
          </button>
        </div>
        {glow}
      </span>
    );
  }

  return (
    <span className="relative inline-flex shrink-0">
      <button
        type="button"
        onClick={log}
        aria-label={t("logAria", { name })}
        className={BTN_LOG_CLASS}
      >
        <Plus aria-hidden className="size-4" />
      </button>
      {glow}
    </span>
  );
}
