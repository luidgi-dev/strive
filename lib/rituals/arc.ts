// The Arc: pure data transforms for the 12-week ritual consistency view.
// No I/O here. The page RSC fetches logs and calls buildArcModel; the display
// component renders the result. Dates are handled as plain YYYY-MM-DD strings
// in UTC to avoid timezone/DST drift.

export type ArcDayStatus = "logged" | "rest" | "future";

export type ArcDay = {
  /** Calendar day, YYYY-MM-DD. */
  date: string;
  status: ArcDayStatus;
  /** Completed logs on that day (multiple per day are allowed). */
  count: number;
  /** Whether this day is the reference "today". */
  isToday: boolean;
};

export type ArcWeek = {
  /** Monday of the week, YYYY-MM-DD. */
  startDate: string;
  /** Sunday of the week, YYYY-MM-DD. */
  endDate: string;
  /** Completed logs during the week (multiple logs per day are summed). */
  count: number;
  /** Always 7 entries, Monday through Sunday. */
  days: ArcDay[];
};

export type ArcTrend = "up" | "flat" | "down";

export type ArcModel = {
  weeks: ArcWeek[];
  /** Weekly completion target, or null when the ritual has no weekly target. */
  weeklyTarget: number | null;
  trend: ArcTrend;
  /** Total completed logs across the visible window. */
  totalLogs: number;
};

/** Minimal shape read from the ritual_log_history view. */
export type ArcLog = {
  logged_at: string | null;
  status_id: string | null;
};

type BuildArcModelInput = {
  logs: ArcLog[];
  ritualType: string;
  frequencyUnit: string | null;
  frequencyValue: number | null;
  /** Reference "today" as YYYY-MM-DD, computed in the user's timezone server-side. */
  today: string;
  /**
   * When the ritual started (YYYY-MM-DD). The chart spans from the ritual's
   * first week up to now, so younger rituals render fewer weeks.
   */
  startDate?: string | null;
  /** Maximum number of weeks to render. Defaults to 12. */
  maxWeeks?: number;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DEFAULT_WEEKS = 12;
const DAYS_PER_WEEK = 7;

function parseISODate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(value: string, days: number): string {
  return toISODate(new Date(parseISODate(value).getTime() + days * MS_PER_DAY));
}

/** Monday-start week, matching Postgres date_trunc('week') and FR/EN locales. */
function mondayOf(value: string): string {
  const date = parseISODate(value);
  // getUTCDay: 0 = Sunday ... 6 = Saturday. Days elapsed since Monday:
  const offset = (date.getUTCDay() + 6) % 7;
  return addDays(value, -offset);
}

/** Derive a per-week completion target, or null when none applies. */
export function deriveWeeklyTarget(
  ritualType: string,
  frequencyUnit: string | null,
  frequencyValue: number | null,
): number | null {
  if (ritualType !== "recurring" || frequencyValue === null) return null;
  if (frequencyUnit === "week") return frequencyValue;
  if (frequencyUnit === "day") return frequencyValue * DAYS_PER_WEEK;
  // Monthly targets do not map cleanly onto a weekly chart.
  return null;
}

export function buildArcModel({
  logs,
  ritualType,
  frequencyUnit,
  frequencyValue,
  today,
  startDate,
  maxWeeks = DEFAULT_WEEKS,
}: BuildArcModelInput): ArcModel {
  // Count completed logs per calendar day.
  const completedByDate = new Map<string, number>();
  for (const log of logs) {
    if (log.status_id !== "completed" || !log.logged_at) continue;
    const date = log.logged_at.slice(0, 10);
    completedByDate.set(date, (completedByDate.get(date) ?? 0) + 1);
  }

  const currentMonday = mondayOf(today);
  const weeks = weeksToRender(startDate, currentMonday, maxWeeks);
  const firstMonday = addDays(currentMonday, -DAYS_PER_WEEK * (weeks - 1));

  const arcWeeks: ArcWeek[] = [];
  let totalLogs = 0;

  for (let w = 0; w < weeks; w++) {
    const startDate = addDays(firstMonday, w * DAYS_PER_WEEK);
    const days: ArcDay[] = [];
    let count = 0;

    for (let d = 0; d < DAYS_PER_WEEK; d++) {
      const date = addDays(startDate, d);
      const logged = completedByDate.get(date) ?? 0;
      count += logged;

      let status: ArcDayStatus;
      if (date > today) status = "future";
      else if (logged > 0) status = "logged";
      else status = "rest";

      days.push({ date, status, count: logged, isToday: date === today });
    }

    totalLogs += count;
    arcWeeks.push({
      startDate,
      endDate: addDays(startDate, DAYS_PER_WEEK - 1),
      count,
      days,
    });
  }

  return {
    weeks: arcWeeks,
    weeklyTarget: deriveWeeklyTarget(ritualType, frequencyUnit, frequencyValue),
    trend: deriveTrend(arcWeeks),
    totalLogs,
  };
}

/**
 * Overlay an optimistic count for today onto a built model, so the chart and
 * heatmap react instantly while a log/unlog server action is in flight.
 * Returns the same model reference when nothing changes.
 */
export function applyOptimisticToday(
  model: ArcModel,
  today: string,
  newCount: number,
): ArcModel {
  let delta = 0;
  const weeks = model.weeks.map((week) => {
    const index = week.days.findIndex((day) => day.date === today);
    if (index === -1) return week;
    const day = week.days[index];
    delta = newCount - day.count;
    if (delta === 0) return week;
    const days = week.days.slice();
    days[index] = {
      ...day,
      count: newCount,
      status: newCount > 0 ? "logged" : "rest",
    };
    return { ...week, days, count: week.count + delta };
  });

  if (delta === 0) return model;
  return { ...model, weeks, totalLogs: model.totalLogs + delta };
}

/**
 * Span from the ritual's first week up to the current week, capped at maxWeeks.
 * Rituals with no known start (or starting in the future) fall back to maxWeeks.
 */
function weeksToRender(
  startDate: string | null | undefined,
  currentMonday: string,
  maxWeeks: number,
): number {
  if (!startDate) return maxWeeks;
  const startMonday = mondayOf(startDate.slice(0, 10));
  const elapsedWeeks = Math.round(
    (parseISODate(currentMonday).getTime() - parseISODate(startMonday).getTime()) /
      (MS_PER_DAY * DAYS_PER_WEEK),
  );
  return Math.max(1, Math.min(maxWeeks, elapsedWeeks + 1));
}

/** Compare the last two fully elapsed weeks (the current week is partial). */
function deriveTrend(weeks: ArcWeek[]): ArcTrend {
  if (weeks.length < 3) return "flat";
  const previous = weeks[weeks.length - 2].count;
  const prior = weeks[weeks.length - 3].count;
  if (previous > prior) return "up";
  if (previous < prior) return "down";
  return "flat";
}

export type ArcPoint = {
  x: number;
  y: number;
  weekIndex: number;
};

export type ArcGeometry = {
  width: number;
  height: number;
  linePath: string;
  areaPath: string;
  points: ArcPoint[];
  /** Y coordinate of the target line, or null when there is no target. */
  targetY: number | null;
};

/**
 * Build SVG geometry for the weekly area chart on a [0,width] x [0,height]
 * canvas. Higher counts map to smaller y (towards the top). The curve is
 * smoothed with Catmull-Rom derived cubic Bezier control points.
 */
export function buildArcGeometry(
  weeks: ArcWeek[],
  weeklyTarget: number | null,
  width: number,
  height: number,
): ArcGeometry {
  const counts = weeks.map((week) => week.count);
  const yMax = Math.max(weeklyTarget ?? 0, ...counts, 1);

  const points: ArcPoint[] = weeks.map((_, index) => ({
    weekIndex: index,
    x: weeks.length === 1 ? width : (index / (weeks.length - 1)) * width,
    y: height - (counts[index] / yMax) * height,
  }));

  const linePath = buildSmoothPath(points);
  const areaPath =
    points.length > 0
      ? `${linePath} L ${width},${height} L 0,${height} Z`
      : "";

  return {
    width,
    height,
    linePath,
    areaPath,
    points,
    targetY:
      weeklyTarget === null ? null : height - (weeklyTarget / yMax) * height,
  };
}

function buildSmoothPath(points: ArcPoint[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;

  let path = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
  }
  return path;
}
