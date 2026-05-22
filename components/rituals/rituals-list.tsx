import { getTranslations } from "next-intl/server";

import {
  groupRitualsByCategory,
  type RitualCategoryRow,
  type RitualGroup,
  type RitualWithCategory,
  type RitualProgressEntry,
} from "@/lib/data/rituals";
import { getCategoryLabel } from "@/lib/rituals/category-label";

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
  const t = await getTranslations("rituals");
  const otherLabel = t("category.other");

  const groups = groupRitualsByCategory(rituals);

  // Surface user-owned categories that currently have no rituals, so a freshly
  // created (or emptied) category stays visible and manageable. System
  // categories without rituals stay hidden to avoid clutter.
  const presentIds = new Set(
    groups.map((g) => g.category?.id).filter((id): id is string => Boolean(id)),
  );
  const emptyUserGroups: RitualGroup[] = categories
    .filter((c) => c.user_id !== null && !presentIds.has(c.id))
    .map((c) => ({ key: c.id, category: c, rituals: [] }));

  const sections = [...groups, ...emptyUserGroups]
    .map((group) => ({
      ...group,
      label: getCategoryLabel(group.category, t, otherLabel),
    }))
    // Alphabetical by displayed label, "Other" (no category) last.
    .sort((a, b) => {
      if (!a.category && !b.category) return 0;
      if (!a.category) return 1;
      if (!b.category) return -1;
      return a.label.localeCompare(b.label);
    });

  return (
    <div className="flex flex-col gap-4">
      {sections.map((section) => (
        <CategorySection
          key={section.key}
          title={section.label}
          count={section.rituals.length}
          category={
            section.category && section.category.user_id !== null
              ? { id: section.category.id, name: section.category.name }
              : null
          }
        >
          {section.rituals.length === 0 ? (
            <p className="px-1 text-xs text-muted-foreground/70">
              {t("category.manage.empty")}
            </p>
          ) : (
            section.rituals.map((ritual) => (
              <RitualCard
                key={ritual.id}
                ritual={ritual}
                progress={progressByRitualId.get(ritual.id)}
                categories={categories}
              />
            ))
          )}
        </CategorySection>
      ))}

      <NewCategoryButton />
    </div>
  );
}
