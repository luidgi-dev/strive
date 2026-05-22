import { HeartHandshake } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { RitualCategoryRow } from "@/lib/data/rituals";

import { ArchivedRitualsLink } from "./archived-rituals-link";
import { DefineRitualButton } from "./define-ritual-button";

type Props = {
  categories: RitualCategoryRow[];
  archivedCount: number;
};

export async function RitualsEmptyState({ categories, archivedCount }: Props) {
  const t = await getTranslations("rituals");

  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-md flex-col items-center justify-center gap-4 px-2 pb-24 text-center">
      <div
        aria-hidden
        className="flex size-16 items-center justify-center rounded-2xl bg-accent text-muted-foreground"
      >
        <HeartHandshake className="size-8" strokeWidth={1.5} />
      </div>
      <h2 className="max-w-[280px] font-heading text-[22px] font-bold leading-tight tracking-tight text-foreground">
        {t("empty.title")}
      </h2>
      <p className="max-w-[280px] text-[13.5px] leading-relaxed text-muted-foreground">
        {t("empty.body")}
      </p>
      <DefineRitualButton variant="cta" categories={categories} />
      {archivedCount > 0 ? (
        <div className="mt-2 w-full max-w-[280px]">
          <ArchivedRitualsLink count={archivedCount} />
        </div>
      ) : null}
    </div>
  );
}
