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

/**
 * Hour of day (0–23) in the given IANA time zone. Used by the reminders cron to
 * send only when it is the target morning hour in each user's local time. `now`
 * is injectable for deterministic tests. Falls back to UTC hour on a bad zone.
 */
export function hourInTimeZone(timeZone: string, now: Date = new Date()): number {
  try {
    const hour = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      hour12: false,
    }).format(now);
    const parsed = Number.parseInt(hour, 10);
    // en-GB can render midnight as "24"; normalize to 0.
    return parsed === 24 ? 0 : parsed;
  } catch {
    return now.getUTCHours();
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

/**
 * The UTC instant (ISO string) of the start of "today" in the given IANA time
 * zone — i.e. local midnight. Computed by subtracting the elapsed local
 * wall-clock time-of-day from `now`, so it stays correct across DST without an
 * offset table. `now` is injectable for deterministic tests. Falls back to UTC
 * midnight on an invalid zone.
 */
export function startOfLocalDayIso(
  timeZone: string,
  now: Date = new Date(),
): string {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(now);
    const get = (type: string) =>
      Number.parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);
    const hour = get("hour") % 24; // en-GB renders midnight as "24"
    const msIntoDay =
      ((hour * 60 + get("minute")) * 60 + get("second")) * 1000 +
      now.getMilliseconds();
    return new Date(now.getTime() - msIntoDay).toISOString();
  } catch {
    const utcMidnight = new Date(now);
    utcMidnight.setUTCHours(0, 0, 0, 0);
    return utcMidnight.toISOString();
  }
}
