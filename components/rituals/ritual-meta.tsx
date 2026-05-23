import { getFormatter } from "next-intl/server";

type Props = {
  category: string | null;
  scheduledDays: number[] | null;
  scheduledTime: string | null;
};

// 2024-01-01 is a Monday, used to map ISO weekdays (1=Mon..7=Sun) to a date.
const REF_MONDAY = Date.UTC(2024, 0, 1);
const MS_PER_DAY = 86_400_000;

/**
 * Slim metadata row shown on every ritual detail (below The Arc or the
 * one-time hero): category and schedule (days/time), without repeating the
 * Started KPI. Renders nothing when there is nothing to show.
 */
export async function RitualMeta({ category, scheduledDays, scheduledTime }: Props) {
  const format = await getFormatter();
  const items: string[] = [];

  if (category) items.push(category);

  if (scheduledDays && scheduledDays.length > 0) {
    const days = [...scheduledDays]
      .sort((a, b) => a - b)
      .map((day) =>
        format.dateTime(new Date(REF_MONDAY + (day - 1) * MS_PER_DAY), {
          weekday: "short",
        }),
      );
    items.push(days.join("/"));
  }

  if (scheduledTime) items.push(scheduledTime.slice(0, 5));

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-1 text-xs text-muted-foreground">
      {items.map((item, index) => (
        <span key={item} className="flex items-center gap-2">
          {index > 0 ? <span aria-hidden className="text-muted-foreground/50">·</span> : null}
          {item}
        </span>
      ))}
    </div>
  );
}
