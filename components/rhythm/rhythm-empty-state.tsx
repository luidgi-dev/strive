import { AudioWaveform } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { DefineRitualButton } from "@/components/rituals/define-ritual-button";
import type { RitualCategoryRow } from "@/lib/data/rituals";

type Props = {
  categories: RitualCategoryRow[];
};

/**
 * Shown only when the user has no active ritual at all. The "nothing left to do
 * today" case is handled by the day-bar coach line, not here.
 */
export async function RhythmEmptyState({ categories }: Props) {
  const t = await getTranslations("rhythm");

  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-md flex-col items-center justify-center gap-4 px-2 pb-24 text-center">
      <div
        aria-hidden
        className="flex size-16 items-center justify-center rounded-2xl bg-accent text-muted-foreground"
      >
        <AudioWaveform className="size-8" strokeWidth={1.5} />
      </div>
      <h2 className="max-w-[280px] font-heading text-[22px] font-bold leading-tight tracking-tight text-foreground">
        {t("empty.title")}
      </h2>
      <p className="max-w-[280px] text-[13.5px] leading-relaxed text-muted-foreground">
        {t("empty.body")}
      </p>
      <DefineRitualButton variant="cta" categories={categories} />
    </div>
  );
}
