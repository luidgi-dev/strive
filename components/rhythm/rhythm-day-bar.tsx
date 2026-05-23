import { getFormatter, getTranslations } from "next-intl/server";

import { cn } from "@/lib/utils";

type Props = {
  /** Today as YYYY-MM-DD in the user's timezone. */
  today: string;
  /** Rituals in scope today. */
  total: number;
  /** Of those, how many are satisfied. */
  logged: number;
};

export async function RhythmDayBar({ today, total, logged }: Props) {
  const t = await getTranslations("rhythm");
  const format = await getFormatter();

  // Covers both "everything logged" and "nothing scheduled today" (total 0).
  const allDone = logged >= total;

  return (
    <div className="flex flex-col gap-1 px-1 pb-1.5">
      <div className="flex items-baseline justify-between">
        <h1 className="font-heading text-[22px] font-bold tracking-tight text-foreground">
          {t("today")}
        </h1>
        <span className="text-xs tracking-wide text-muted-foreground">
          {format.dateTime(new Date(`${today}T00:00:00`), {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
      <span className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
        <span
          aria-hidden
          className={cn(
            "size-1.5 rounded-full",
            allDone ? "bg-momentum" : "bg-muted-foreground",
          )}
        />
        {allDone ? t("coach.allDone") : t("coach.summary", { x: logged, y: total })}
      </span>
    </div>
  );
}
