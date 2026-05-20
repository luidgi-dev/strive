"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useId, useState } from "react";

import { buildArcGeometry, type ArcDay, type ArcModel } from "@/lib/rituals/arc";
import { cn } from "@/lib/utils";

type Props = {
  model: ArcModel;
};

const CHART_WIDTH = 330;
const CHART_HEIGHT = 96;

// Parse a YYYY-MM-DD string into a local Date for display formatting only.
function toLocalDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

export function TheArc({ model }: Props) {
  const t = useTranslations("rituals.detail.arc");
  const format = useFormatter();
  const gradientId = useId();

  const { weeks, weeklyTarget, totalLogs } = model;
  const [selectedWeek, setSelectedWeek] = useState(weeks.length - 1);

  const formatShortDate = (value: string) =>
    format.dateTime(toLocalDate(value), { month: "short", day: "numeric" });
  const formatDayLetter = (value: string) =>
    format.dateTime(toLocalDate(value), { weekday: "short" });

  if (totalLogs === 0) {
    return (
      <section className="rounded-xl border border-border bg-card p-4">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {t("label")}
        </span>
        <div className="flex flex-col items-center gap-1.5 px-4 py-10 text-center">
          <p className="font-heading text-sm font-semibold tracking-tight text-foreground">
            {t("emptyTitle")}
          </p>
          <p className="max-w-[16rem] text-xs leading-relaxed text-muted-foreground">
            {t("emptyBody")}
          </p>
        </div>
      </section>
    );
  }

  const geometry = buildArcGeometry(
    weeks,
    weeklyTarget,
    CHART_WIDTH,
    CHART_HEIGHT,
  );
  const week = weeks[selectedWeek];
  const selectedPoint = geometry.points[selectedWeek];
  const meta =
    weeklyTarget === null
      ? t("metaCount", { n: week.count })
      : t("meta", { n: week.count, target: weeklyTarget });

  return (
    <section className="flex flex-col gap-3.5 rounded-xl border border-border bg-card p-4 text-foreground">
      <div className="flex flex-col gap-2.5">
        <span className="px-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {t("labelWeeks", { weeks: weeks.length })}
        </span>

        <div className="relative h-24 w-full">
          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full overflow-visible"
            role="img"
            aria-label={t("chartLabel", { weeks: weeks.length })}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>

            {geometry.targetY !== null ? (
              <line
                x1="0"
                y1={geometry.targetY}
                x2={CHART_WIDTH}
                y2={geometry.targetY}
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.22"
                vectorEffect="non-scaling-stroke"
              />
            ) : null}

            <path d={geometry.areaPath} fill={`url(#${gradientId})`} />
            <path
              d={geometry.linePath}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.6"
              vectorEffect="non-scaling-stroke"
            />

            <line
              x1={selectedPoint.x}
              y1={selectedPoint.y}
              x2={selectedPoint.x}
              y2={CHART_HEIGHT}
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="2 3"
              opacity="0.3"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* Points are HTML so they stay perfectly round at any width: the
              SVG above is stretched with preserveAspectRatio="none". */}
          {geometry.points.map((point) => {
            const isSelected = point.weekIndex === selectedWeek;
            return (
              <button
                key={point.weekIndex}
                type="button"
                onClick={() => setSelectedWeek(point.weekIndex)}
                aria-label={t("selectWeek", {
                  date: formatShortDate(weeks[point.weekIndex].startDate),
                })}
                aria-pressed={isSelected}
                className="absolute flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                style={{
                  left: `${(point.x / CHART_WIDTH) * 100}%`,
                  top: `${(point.y / CHART_HEIGHT) * 100}%`,
                }}
              >
                <span
                  className={cn(
                    "rounded-full bg-foreground transition-all",
                    isSelected
                      ? "size-2.5 ring-4 ring-foreground/20"
                      : "size-1.5 opacity-45",
                  )}
                />
              </button>
            );
          })}

          {weeklyTarget !== null ? (
            <span className="pointer-events-none absolute right-0 top-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
              {t("target", { n: weeklyTarget })}
            </span>
          ) : null}
        </div>

        <div className="flex justify-between text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          <span>{formatShortDate(weeks[0].startDate)}</span>
          <span>{formatShortDate(weeks[weeks.length - 1].startDate)}</span>
        </div>
      </div>

      <div className="-mx-4 h-px bg-border" />

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {t("weekOf", { date: formatShortDate(week.startDate) })}
          </span>
          <span className="text-[11px] font-semibold tracking-[0.04em] text-foreground">
            {meta}
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {week.days.map((day) => (
            <DayCell key={day.date} day={day} letter={formatDayLetter(day.date)} />
          ))}
        </div>
      </div>
    </section>
  );
}

function DayCell({ day, letter }: { day: ArcDay; letter: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-md border border-border bg-background py-2.5",
        day.isToday && "border-foreground/35 bg-foreground/[0.04]",
      )}
    >
      <span
        className={cn(
          "text-[10px] font-bold uppercase tracking-[0.08em]",
          day.status === "logged" || day.isToday
            ? "text-foreground"
            : day.status === "future"
              ? "text-muted-foreground/55"
              : "text-muted-foreground",
        )}
      >
        {letter}
      </span>
      <span
        className={cn(
          "size-3 rounded-full",
          // A halo ring marks days with more than one log (flexible targets).
          day.status === "logged" &&
            (day.count > 1
              ? "bg-foreground ring-2 ring-foreground/30"
              : "bg-foreground"),
          day.status === "rest" &&
            "border border-dashed border-muted-foreground/35 bg-transparent",
          day.status === "future" &&
            "border border-dashed border-muted-foreground/20 bg-transparent",
        )}
      />
    </div>
  );
}
