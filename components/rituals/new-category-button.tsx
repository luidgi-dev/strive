"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { CategoryFormSheet } from "./category-form-sheet";

export function NewCategoryButton() {
  const t = useTranslations("rituals");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full min-h-[44px] items-center gap-2 rounded-xl border border-dashed border-muted-foreground/30 px-4 py-3 text-left text-sm font-medium text-foreground/80 transition-colors hover:border-muted-foreground/50 hover:text-foreground"
        aria-label={t("newCategory")}
      >
        <Plus aria-hidden className="size-3.5" />
        <span>{t("newCategory")}</span>
      </button>

      <CategoryFormSheet open={open} onOpenChange={setOpen} mode="create" />
    </>
  );
}
