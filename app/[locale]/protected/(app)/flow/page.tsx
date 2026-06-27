import { getTranslations, setRequestLocale } from "next-intl/server";

import { RhythmCard } from "@/components/rhythm/rhythm-card";
import { RhythmDayBar } from "@/components/rhythm/rhythm-day-bar";
import { RhythmDoneSection } from "@/components/rhythm/rhythm-done-section";
import { RhythmEmptyState } from "@/components/rhythm/rhythm-empty-state";
import { DefineRitualButton } from "@/components/rituals/define-ritual-button";
import { startOfWeek } from "@/lib/date";
import {
  getCompletedRitualIds,
  getRitualsForActiveUser,
  getVisibleCategoriesForUser,
  getWeekCompletedLogs,
} from "@/lib/data/rituals";
import { getUserToday } from "@/lib/profile";
import { selectTodayRituals } from "@/lib/rhythm/today-rituals";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ locale: string }> };

export default async function RhythmPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("rhythm");
  const supabase = await createClient();

  // getUserToday, rituals and categories are independent — fetch them together
  // instead of blocking the rituals/categories queries behind the timezone read.
  const [today, { rituals, progressByRitualId }, categories] =
    await Promise.all([
      getUserToday(supabase),
      getRitualsForActiveUser(supabase),
      getVisibleCategoriesForUser(supabase),
    ]);

  if (rituals.length === 0) {
    return <RhythmEmptyState categories={categories} />;
  }

  const weekStart = startOfWeek(today);
  const oneTimeIds = rituals
    .filter((r) => r.ritual_type === "one_time")
    .map((r) => r.id);
  // weekLogs needs weekStart, completedOneTimeIds needs the one-time ids — both
  // are known now, so run them in parallel instead of one after the other.
  const [weekLogs, completedOneTimeIds] = await Promise.all([
    getWeekCompletedLogs(supabase, weekStart),
    getCompletedRitualIds(supabase, oneTimeIds),
  ]);

  const { active, done } = selectTodayRituals({
    rituals,
    progressByRitualId,
    weekLogs,
    completedOneTimeIds,
    today,
  });

  // Open rituals are ad-hoc and excluded from the day count; every "done" item
  // counts toward the day.
  const total =
    active.filter((item) => item.countsTowardDay).length + done.length;

  return (
    <div className="flex flex-col gap-3">
      <RhythmDayBar today={today} total={total} logged={done.length} />

      {active.map((item) => (
        <RhythmCard
          key={item.ritual.id}
          ritual={item.ritual}
          progress={item.progress}
          initialLogCount={item.initialLogCount}
          weekDaysCount={item.weekDaysCount}
          today={today}
        />
      ))}

      <DefineRitualButton
        variant="ghost"
        categories={categories}
        label={t("addRitual")}
      />

      {done.length > 0 ? (
        <RhythmDoneSection count={done.length}>
          {done.map((item) => (
            <RhythmCard
              key={item.ritual.id}
              ritual={item.ritual}
              progress={item.progress}
              initialLogCount={item.initialLogCount}
              weekDaysCount={item.weekDaysCount}
              today={today}
            />
          ))}
        </RhythmDoneSection>
      ) : null}
    </div>
  );
}
