import { getTranslations } from "next-intl/server";

import {
  deriveMomentumStatus,
  type RitualCategoryRow,
  type RitualProgressEntry,
  type RitualWithCategory,
} from "@/lib/data/rituals";
import { isRitualFresh, ritualPeriodLabel } from "@/lib/rituals/presentation";

import { MomentumPill } from "./momentum-pill";
import { RitualCardActions } from "./ritual-card-actions";
import { RitualCardTrigger } from "./ritual-card-trigger";

type Props = {
  ritual: RitualWithCategory;
  progress: RitualProgressEntry | undefined;
  categories: RitualCategoryRow[];
};

export async function RitualCard({ ritual, progress, categories }: Props) {
  const t = await getTranslations("rituals");

  const logsThisPeriod = progress?.logsThisPeriod ?? 0;
  const status =
    logsThisPeriod === 0 && isRitualFresh(ritual.created_at)
      ? null
      : deriveMomentumStatus(
          ritual.ritual_type,
          progress?.completionRate ?? null,
        );

  const meta = ritualPeriodLabel(ritual, t);

  return (
    <div className="flex items-stretch rounded-xl border border-border bg-card transition-colors hover:border-foreground/20">
      <RitualCardTrigger ritualId={ritual.id}>
        <span
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-base text-muted-foreground"
        >
          {ritual.icon ?? "•"}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-heading text-sm font-semibold leading-tight tracking-tight">
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
      </RitualCardTrigger>
      <RitualCardActions ritual={ritual} categories={categories} />
    </div>
  );
}
