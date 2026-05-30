import { getTranslations } from "next-intl/server";

import { MomentumPill } from "@/components/rituals/momentum-pill";
import { RitualLogControl } from "@/components/rituals/ritual-log-control";
import { RitualLogProvider } from "@/components/rituals/ritual-log-provider";
import type {
  RitualProgressEntry,
  RitualWithCategory,
} from "@/lib/data/rituals";
import { Link } from "@/lib/i18n/navigation";
import { deriveRhythmCardView } from "@/lib/rhythm/today-rituals";
import { MOMENTUM_TOKENS, ritualPeriodLabel } from "@/lib/rituals/presentation";
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

export async function RhythmCard({
  ritual,
  progress,
  initialLogCount,
  weekDaysCount,
  today,
}: Props) {
  const t = await getTranslations("rituals");

  const loggedToday = initialLogCount > 0;
  const meta = ritualPeriodLabel(ritual, t);
  const { numerator, denominator, status, barWidth, showProgress } =
    deriveRhythmCardView({ ritual, progress, weekDaysCount }, today);

  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-foreground/20",
        // Logged today: subtle off-white outline (same cue as elsewhere).
        loggedToday && "border-foreground/20",
      )}
    >
      <div className="flex items-center gap-3">
        {/* Tapping the ritual opens its detail / The Arc view, like Rituals. */}
        <Link
          href={`/protected/rituals/${ritual.id}`}
          className="group flex min-h-[44px] min-w-0 flex-1 items-center gap-3 rounded-lg text-left transition-opacity hover:opacity-80"
        >
          <span
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-lg text-muted-foreground"
          >
            {ritual.icon ?? "•"}
          </span>

          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
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
          </span>

          {showProgress ? (
            <span className="shrink-0 font-heading text-2xl font-bold leading-none tracking-tight text-foreground">
              {numerator}
              <span className="font-sans text-sm font-medium text-muted-foreground">
                /{denominator}
              </span>
            </span>
          ) : null}
        </Link>

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
              MOMENTUM_TOKENS[status ?? "resting"].bar,
            )}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      ) : null}
    </article>
  );
}
