import { MoreHorizontal } from "lucide-react";
import { getTranslations } from "next-intl/server";

import {
  deriveMomentumStatus,
  type RitualProgressEntry,
  type RitualWithCategory,
} from "@/lib/data/rituals";

import { MomentumPill } from "./momentum-pill";
import { RitualCardTrigger } from "./ritual-card-trigger";

type Props = {
  ritual: RitualWithCategory;
  progress: RitualProgressEntry | undefined;
};

export async function RitualCard({ ritual, progress }: Props) {
  const t = await getTranslations("rituals");

  const status = deriveMomentumStatus(
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
    <RitualCardTrigger>
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
      <MoreHorizontal
        aria-hidden
        className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
      />
    </RitualCardTrigger>
  );
}
