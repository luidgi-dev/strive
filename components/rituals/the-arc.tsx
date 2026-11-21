"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useId, useState } from "react";

import { parseIsoDateUtc } from "@/lib/date";
import {
  buildArcGeometry,
  type ArcDay,
  type ArcModel,
} from "@/lib/rituals/arc";
import { cn } from "@/lib/utils";

type ArcNav = {
  canGoEarlier: boolean;
  canGoLater: boolean;
  onEarlier: () => void;
  onLater: () => void;
};

type Props = {
  model: ArcModel;
  /** The ritual has no log at all (not just in this window). */
  isEmpty: boolean;
  /** Window navigation; absent when there is only one window. */
  nav?: ArcNav;
  className?: string;
};

const CHART_WIDTH = 330;
const CHART_HEIGHT = 96;

export function TheArc({ model, isEmpty, nav, className }: Props) {
  const t = useTranslations("rituals.detail.arc");
  const format = useFormatter();
  const gradientId = useId();

  const { weeks, weeklyTarget } = model;
  const [selectedWeek, setSelectedWeek] = useState(weeks.length - 1);

  // The Arc's dates are calendar days, parsed and formatted in UTC so the day
  // letters never shift with the viewer's zone (next-intl otherwise formats in
  // the server's zone, one day off every browser east of it).
  const formatShortDate = (value: string) =>
    format.dateTime(parseIsoDateUtc(value), {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  const formatDayLetter = (value: string) =>
    format.dateTime(parseIsoDateUtc(value), {
      weekday: "short",
      timeZone: "UTC",
    });

  if (isEmpty) {
    return (
      <section
        className={cn("rounded-xl border border-border bg-card p-4", className)}
      >
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
  const range = format.dateTimeRange(
    parseIsoDateUtc(weeks[0].startDate),
    parseIsoDateUtc(weeks[weeks.length - 1].endDate),
    { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" },
  );
  const meta =
    weeklyTarget === null
      ? t("metaCount", { n: week.count })
      : t("meta", { n: week.count, target: weeklyTarget });

  return (
    <section
      className={cn(
        "flex flex-col gap-3.5 rounded-xl border border-border bg-card p-4 text-foreground",
        className,
      )}
    >
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2 px-0.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {t("labelWeeks", { weeks: weeks.length })}
          </span>
          {weeklyTarget !== null ? (
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              {t("targetLabel", { n: weeklyTarget })}
            </span>
          ) : null}
        </div>

        {nav ? (
          <div className="-mx-2.5 -my-1.5 flex items-center justify-between">
            <button
              type="button"
              onClick={nav.onEarlier}
              disabled={!nav.canGoEarlier}
              aria-label={t("earlier")}
              className="flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span
              aria-live="polite"
              className="text-[11px] font-semibold tracking-[0.04em] text-foreground"
            >
              {range}
            </span>
            <button
              type="button"
              onClick={nav.onLater}
              disabled={!nav.canGoLater}
              aria-label={t("later")}
              className="flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        ) : null}

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
            <DayCell
              key={day.date}
              day={day}
              letter={formatDayLetter(day.date)}
            />
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
            : day.status === "before"
              ? "text-muted-foreground/50"
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
          // Not started yet: a flat faint dot, unlike the dashed rest/missed ring.
          day.status === "before" && "bg-muted-foreground/10",
        )}
      />
    </div>
  );
}
