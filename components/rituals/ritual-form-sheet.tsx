"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  Sheet,
  SheetClose,
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
          <SheetClose
            aria-label={t("form.actions.close")}
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X aria-hidden className="size-4" />
          </SheetClose>
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
