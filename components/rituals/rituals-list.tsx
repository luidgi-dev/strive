import { getTranslations } from "next-intl/server";

import {
  groupRitualsByCategory,
  type RitualCategoryRow,
  type RitualWithCategory,
  type RitualProgressEntry,
} from "@/lib/data/rituals";

import { CategorySection } from "./category-section";
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
        <CategorySection
          key={group.key}
          title={group.categoryName ?? t("other")}
          count={group.rituals.length}
        >
          {group.rituals.map((ritual) => (
            <RitualCard
              key={ritual.id}
              ritual={ritual}
              progress={progressByRitualId.get(ritual.id)}
              categories={categories}
            />
          ))}
        </CategorySection>
      ))}

      <NewCategoryButton />
    </div>
  );
}
