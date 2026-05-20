import { getTranslations } from "next-intl/server";

import {
  deriveMomentumStatus,
  type RitualCategoryRow,
  type RitualProgressEntry,
  type RitualWithCategory,
} from "@/lib/data/rituals";

import { MomentumPill } from "./momentum-pill";
import { RitualCardActions } from "./ritual-card-actions";
import { RitualCardTrigger } from "./ritual-card-trigger";

type Props = {
  ritual: RitualWithCategory;
  progress: RitualProgressEntry | undefined;
  categories: RitualCategoryRow[];
};

const FRESH_RITUAL_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export async function RitualCard({ ritual, progress, categories }: Props) {
  const t = await getTranslations("rituals");

  const logsThisPeriod = progress?.logsThisPeriod ?? 0;
  // Read of Date.now() is intentional: this Server Component re-renders per
  // request, so the value is stable within a single response and only used to
  // suppress the momentum pill for rituals created in the last 7 days.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const isFresh =
    now - new Date(ritual.created_at).getTime() < FRESH_RITUAL_WINDOW_MS;

  const status =
    logsThisPeriod === 0 && isFresh
      ? null
      : deriveMomentumStatus(
          ritual.ritual_type,
          progress?.completionRate ?? null,
        );

  let meta: string;
  if (ritual.ritual_type === "one_time") {
    meta = t("type.oneTime");
  } else if (ritual.ritual_type === "open") {
    meta = t("type.open");
  } else {
    const value = ritual.frequency_value ?? 1;
    switch (ritual.frequency_unit) {
      case "day":
        meta = t("frequency.daily");
        break;
      case "week":
        meta = t("frequency.weekly", { n: value });
        break;
      case "month":
        meta = t("frequency.monthly", { n: value });
        break;
      default:
        meta = ritual.ritual_type;
    }
  }

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
