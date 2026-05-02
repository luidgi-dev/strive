import type {
  LandingVisualizationCard,
  LandingWeekdayState,
} from "@/components/landing/types";
import {
  LandingEyebrow,
  LandingSection,
  LandingSectionTitle,
} from "@/components/landing/landing-shell";
import { cn } from "@/lib/utils";

function weekdayCellClass(state: LandingWeekdayState) {
  switch (state) {
    case "logged":
      return "bg-momentum/15 font-medium text-momentum";
    case "rest":
      return "bg-muted text-muted-foreground";
    default:
      return "border border-border text-muted-foreground/40";
  }
}

type RitualVisualizationSectionProps = {
  eyebrow: string;
  title: string;
  card: LandingVisualizationCard;
};

export function RitualVisualizationSection({
  eyebrow,
  title,
  card,
}: RitualVisualizationSectionProps) {
  return (
    <LandingSection>
      <LandingEyebrow>{eyebrow}</LandingEyebrow>
      <LandingSectionTitle>{title}</LandingSectionTitle>

      <div className="rounded-2xl border border-border/8 bg-card p-8 shadow-sm ring-1 ring-border/8 md:p-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="font-heading text-xl font-bold">{card.name}</h3>
            <p className="mt-1 font-sans text-sm text-muted-foreground">
              {card.schedule}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="size-2.5 shrink-0 rounded-full bg-momentum"
              aria-hidden
            />
            <span className="font-sans text-sm font-medium text-momentum">
              {card.statusLabel}
            </span>
          </div>
        </div>

        <div className="mb-8 flex gap-3">
          {card.weekdays.map((day, index) => (
            <div
              key={`${day.shortLabel}-${index}`}
              className="flex flex-col items-center gap-2"
            >
              <span className="font-sans text-xs text-muted-foreground">
                {day.shortLabel}
              </span>
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-full font-sans text-xs",
                  weekdayCellClass(day.state)
                )}
              >
                {day.state === "logged" ? (
                  <span className="text-momentum" aria-hidden>
                    ·
                  </span>
                ) : day.state === "rest" ? (
                  <span aria-hidden>{card.restMarker}</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-border/8 pt-6">
          <div>
            <span className="font-sans text-xs font-medium tracking-wide text-muted-foreground">
              {card.momentumLabel}
            </span>
            <p className="mt-0.5 font-heading text-2xl font-bold">
              {card.momentumPrimary}{" "}
              <span className="font-sans text-sm font-normal text-muted-foreground">
                {card.momentumSecondary}
              </span>
            </p>
          </div>
          <div className="text-right">
            <span className="font-sans text-xs font-medium tracking-wide text-muted-foreground">
              {card.arcLabel}
            </span>
            <p className="mt-0.5 font-heading text-2xl font-bold">
              {card.arcPrimary}{" "}
              <span className="font-sans text-sm font-normal text-muted-foreground">
                {card.arcSecondary}
              </span>
            </p>
          </div>
        </div>
      </div>
    </LandingSection>
  );
}
