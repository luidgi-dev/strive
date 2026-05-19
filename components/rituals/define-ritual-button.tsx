"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import type { RitualCategoryRow } from "@/lib/data/rituals";
import { cn } from "@/lib/utils";

import { RitualFormSheet } from "./ritual-form-sheet";

type Variant = "pill" | "cta";

type Props = {
  variant: Variant;
  categories: RitualCategoryRow[];
};

export function DefineRitualButton({ variant, categories }: Props) {
  const t = useTranslations("rituals");
  const [open, setOpen] = useState(false);

  const triggerLabel = variant === "cta" ? t("defineFirst") : t("defineCta");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-full bg-foreground font-semibold text-background transition-opacity hover:opacity-90",
          variant === "pill" &&
            "min-h-[44px] px-3.5 py-2 text-[11.5px] tracking-wide",
          variant === "cta" &&
            "mt-2 min-h-[44px] px-5 py-2.5 text-[13px] tracking-wide",
        )}
      >
        <Plus
          aria-hidden
          className={cn(variant === "cta" ? "size-3.5" : "size-3")}
          strokeWidth={2.5}
        />
        {triggerLabel}
      </button>

      <RitualFormSheet
        open={open}
        onOpenChange={setOpen}
        mode="create"
        categories={categories}
      />
    </>
  );
}
