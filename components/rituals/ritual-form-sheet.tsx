"use client";

import { useTranslations } from "next-intl";

import {
  Sheet,
  SheetCloseButton,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import type { RitualCategoryRow } from "@/lib/data/rituals";

import {
  RitualForm,
  type RitualFormInitialValues,
} from "./ritual-form/ritual-form";

type Mode = "create" | "edit";

type Props = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  mode: Mode;
  categories: RitualCategoryRow[];
  initialValues?: RitualFormInitialValues;
};

export function RitualFormSheet({
  open,
  onOpenChange,
  mode,
  categories,
  initialValues,
}: Props) {
  const t = useTranslations("rituals");

  const title = mode === "create" ? t("create.title") : t("edit.title");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <header className="flex items-center justify-between gap-3 pb-1">
          <SheetTitle>{title}</SheetTitle>
          <SheetCloseButton label={t("form.actions.close")} />
        </header>
        <RitualForm
          mode={mode}
          categories={categories}
          initialValues={initialValues}
          onSuccess={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
