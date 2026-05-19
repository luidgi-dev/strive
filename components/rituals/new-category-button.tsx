import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function NewCategoryButton() {
  const t = await getTranslations("rituals");

  return (
    <button
      type="button"
      disabled
      className="flex w-full min-h-[44px] items-center gap-2 rounded-xl border border-dashed border-muted-foreground/30 px-4 py-3 text-left text-sm font-medium text-foreground/80 disabled:cursor-not-allowed"
      aria-label={t("newCategory")}
    >
      <Plus aria-hidden className="size-3.5" />
      <span>{t("newCategory")}</span>
    </button>
  );
}
