import type { CircleSharedRitual } from "@/lib/data/circles";

const MAX_VISIBLE = 3;

type Props = {
  rituals: CircleSharedRitual[];
};

/** "What this circle is building": a row of shared-ritual chips, then "+N". */
export function CircleSharedRituals({ rituals }: Props) {
  const visible = rituals.slice(0, MAX_VISIBLE);
  const overflow = rituals.length - visible.length;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visible.map((ritual) => (
        <span
          key={ritual.ritualId}
          className="inline-flex items-center gap-1.5 rounded-full bg-accent py-1 pl-2 pr-2.5 text-[11.5px] text-foreground"
        >
          {ritual.icon ? (
            <span aria-hidden className="text-[13px] leading-none">
              {ritual.icon}
            </span>
          ) : null}
          <span className="max-w-[140px] truncate">{ritual.name}</span>
        </span>
      ))}
      {overflow > 0 ? (
        <span className="inline-flex items-center rounded-full bg-accent px-2.5 py-1 text-[11.5px] text-muted-foreground">
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}
