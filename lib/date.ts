/**
 * Today's date as an ISO `YYYY-MM-DD` string, resolved in the given IANA time
 * zone. `en-CA` formats as `YYYY-MM-DD`, which is exactly the shape stored in
 * `ritual_logs.logged_at`. Falls back to UTC if the time zone is invalid.
 */
export function todayInTimeZone(timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

/** ISO weekday for a `YYYY-MM-DD` date: 1 = Monday … 7 = Sunday. */
export function isoWeekday(isoDate: string): number {
  // Parse at midnight UTC to avoid local-offset drift on the date part.
  const day = new Date(`${isoDate}T00:00:00Z`).getUTCDay(); // 0 = Sun … 6 = Sat
  return day === 0 ? 7 : day;
}

/**
 * Monday of the week containing `isoDate`, as `YYYY-MM-DD`. Matches Postgres
 * `date_trunc('week', ...)` (Monday-based), which the ritual_progress view uses.
 */
export function startOfWeek(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - (isoWeekday(isoDate) - 1));
  return d.toISOString().slice(0, 10);
}

/** Number of days in the month containing `isoDate` (28–31). */
export function daysInMonth(isoDate: string): number {
  const [year, month] = isoDate.split("-").map(Number);
  // Day 0 of the next month is the last day of this one.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
