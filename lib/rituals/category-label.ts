import type { RitualCategoryRow } from "@/lib/data/rituals";

/**
 * Resolves the display label for a category.
 *
 * System categories (user_id null) carry a stable `slug` and are translated via
 * next-intl (`rituals.category.system.<slug>`). User-created categories have no
 * slug and are shown by their literal `name` (already in the user's language).
 * A null category (uncategorised rituals) falls back to the "Other" label.
 *
 * Pass a translator scoped to `rituals` (server `getTranslations("rituals")` or
 * client `useTranslations("rituals")`).
 */
export function getCategoryLabel(
  category: Pick<RitualCategoryRow, "slug" | "name"> | null,
  t: (key: string) => string,
  otherLabel: string,
): string {
  if (!category) return otherLabel;
  return category.slug ? t(`category.system.${category.slug}`) : category.name;
}
