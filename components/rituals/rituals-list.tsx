import { getTranslations } from "next-intl/server";

import {
  groupRitualsByCategory,
  type RitualCategoryRow,
  type RitualWithCategory,
  type RitualProgressEntry,
} from "@/lib/data/rituals";

import { NewCategoryButton } from "./new-category-button";
import { RitualCard } from "./ritual-card";

type Props = {
  rituals: RitualWithCategory[];
  progressByRitualId: Map<string, RitualProgressEntry>;
  categories: RitualCategoryRow[];
};

export async function RitualsList({
  rituals,
  progressByRitualId,
  categories,
}: Props) {
  const t = await getTranslations("rituals.category");
  const groups = groupRitualsByCategory(rituals);

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <section key={group.key} className="flex flex-col gap-2">
          <h2 className="px-1 pb-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {group.categoryName ?? t("other")}
          </h2>
          <div className="flex flex-col gap-2">
            {group.rituals.map((ritual) => (
              <RitualCard
                key={ritual.id}
                ritual={ritual}
                progress={progressByRitualId.get(ritual.id)}
                categories={categories}
              />
            ))}
          </div>
        </section>
      ))}

      <NewCategoryButton />
    </div>
  );
}
