"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

// ISO weekday: 1 = Monday … 7 = Sunday
const DAYS = [
  { value: 1, key: "mon" },
  { value: 2, key: "tue" },
  { value: 3, key: "wed" },
  { value: 4, key: "thu" },
  { value: 5, key: "fri" },
  { value: 6, key: "sat" },
  { value: 7, key: "sun" },
] as const;

type Props = {
  value: number[];
  onChange: (next: number[]) => void;
};

export function WeekdayChips({ value, onChange }: Props) {
  const t = useTranslations("rituals.form.days");

  const toggle = (day: number) => {
    if (value.includes(day)) {
      onChange(value.filter((d) => d !== day));
    } else {
      onChange([...value, day].sort((a, b) => a - b));
    }
  };

  return (
    <div role="group" aria-label={t("toggle")} className="flex gap-1.5">
      {DAYS.map((day) => {
        const active = value.includes(day.value);
        return (
          <button
            key={day.value}
            type="button"
            onClick={() => toggle(day.value)}
            aria-pressed={active}
            className={cn(
              "flex size-11 flex-1 items-center justify-center rounded-full border text-xs font-semibold tracking-wide transition-colors",
              active
                ? "border-foreground/35 bg-foreground/15 text-foreground"
                : "border-border bg-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t(day.key)}
          </button>
        );
      })}
    </div>
  );
}
