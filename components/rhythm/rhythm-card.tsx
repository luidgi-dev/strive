import { getTranslations } from "next-intl/server";

import { MomentumPill } from "@/components/rituals/momentum-pill";
import { RitualLogControl } from "@/components/rituals/ritual-log-control";
import { RitualLogProvider } from "@/components/rituals/ritual-log-provider";
import {
  deriveDailyMomentum,
  deriveMomentumStatus,
  type MomentumStatus,
  type RitualProgressEntry,
  type RitualWithCategory,
} from "@/lib/data/rituals";
import { isoWeekday } from "@/lib/date";
import { cn } from "@/lib/utils";

type Props = {
  ritual: RitualWithCategory;
  progress: RitualProgressEntry | undefined;
  /** Today's completed-log count (one-time: 1 once done), seeds the log control. */
  initialLogCount: number;
  /** Distinct days logged this week (drives the daily ritual's X/7). */
  weekDaysCount: number;
  /** Today as YYYY-MM-DD in the user's timezone. */
  today: string;
};

const FRESH_RITUAL_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const DAILY_WEEK_TARGET = 7;

const barClassByStatus: Record<MomentumStatus, string> = {
  strong: "bg-momentum",
  steady: "bg-caution",
  resting: "bg-muted-foreground/40",
};

export async function RhythmCard({
  ritual,
  progress,
  initialLogCount,
  weekDaysCount,
  today,
}: Props) {
  const t = await getTranslations("rituals");

  const loggedToday = initialLogCount > 0;

  const isDaily =
    ritual.ritual_type === "recurring" && ritual.frequency_unit === "day";
  const isPeriodic =
    ritual.ritual_type === "recurring" &&
    (ritual.frequency_unit === "week" || ritual.frequency_unit === "month") &&
    (ritual.frequency_value ?? 0) > 0;

  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const isFresh =
    now - new Date(ritual.created_at).getTime() < FRESH_RITUAL_WINDOW_MS;

  // A fraction + colored bar + momentum pill only apply to rituals that
  // accumulate over a period: daily counts distinct days this week (X/7, paced
  // against days elapsed); weekly/monthly count logs against their target.
  let numerator: number | null = null;
  let denominator = 0;
  let status: MomentumStatus | null = null;
  let barWidth = 0;

  if (isDaily) {
    numerator = weekDaysCount;
    denominator = DAILY_WEEK_TARGET;
    barWidth = (weekDaysCount / DAILY_WEEK_TARGET) * 100;
    status =
      weekDaysCount === 0 && isFresh
        ? null
        : deriveDailyMomentum(weekDaysCount, isoWeekday(today));
  } else if (isPeriodic) {
    numerator = progress?.logsThisPeriod ?? 0;
    denominator = ritual.frequency_value ?? 0;
    barWidth = Math.min(100, Math.max(0, progress?.completionRate ?? 0));
    status =
      numerator === 0 && isFresh
        ? null
        : deriveMomentumStatus(ritual.ritual_type, progress?.completionRate ?? null);
  }

  const showProgress = numerator !== null;
  const meta = buildMeta();

  function buildMeta(): string {
    if (ritual.ritual_type === "one_time") return t("type.oneTime");
    if (ritual.ritual_type === "open") return t("type.open");
    const value = ritual.frequency_value ?? 1;
    switch (ritual.frequency_unit) {
      case "day":
        return t("frequency.daily");
      case "week":
        return t("frequency.weekly", { n: value });
      case "month":
        return t("frequency.monthly", { n: value });
      default:
        return t("type.open");
    }
  }

  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 transition-colors",
        // Logged today: subtle off-white outline (same cue as elsewhere).
        loggedToday && "border-foreground/20",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-lg text-muted-foreground"
        >
          {ritual.icon ?? "•"}
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-heading text-[15px] font-semibold leading-tight tracking-tight text-foreground">
            {ritual.name}
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="font-medium">{meta}</span>
            {status ? (
              <>
                <span aria-hidden>·</span>
                <MomentumPill status={status} />
              </>
            ) : null}
          </span>
        </div>

        {showProgress ? (
          <span className="shrink-0 font-heading text-2xl font-bold leading-none tracking-tight text-foreground">
            {numerator}
            <span className="font-sans text-sm font-medium text-muted-foreground">
              /{denominator}
            </span>
          </span>
        ) : null}

        <RitualLogProvider
          ritualId={ritual.id}
          today={today}
          initialCount={initialLogCount}
          ritualType={ritual.ritual_type}
        >
          <RitualLogControl name={ritual.name} />
        </RitualLogProvider>
      </div>

      {showProgress ? (
        <div className="h-[5px] w-full overflow-hidden rounded-full bg-muted-foreground/15">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              barClassByStatus[status ?? "resting"],
            )}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      ) : null}
    </article>
  );
}
