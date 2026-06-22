import { getTranslations } from "next-intl/server";

import { cn } from "@/lib/utils";

type Props = {
  participantCount: number;
  onTrackCount: number;
};

/**
 * Collective momentum for a circle: a green "X of Y this week" when at least one
 * sharing member is on track, otherwise a calm amber "Steady this week". Only
 * rendered when participantCount > 0 (someone shares a measurable ritual).
 */
export async function CircleMomentumIndicator({
  participantCount,
  onTrackCount,
}: Props) {
  const t = await getTranslations("circles");
  const onTrack = onTrackCount >= 1;

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full",
          onTrack ? "bg-momentum" : "bg-caution",
        )}
      />
      <span
        className={cn(
          "text-[11px] font-semibold tracking-wide",
          onTrack ? "text-momentum" : "text-caution",
        )}
      >
        {onTrack
          ? t("momentum.onTrack", { x: onTrackCount, y: participantCount })
          : t("momentum.steady")}
      </span>
    </span>
  );
}
