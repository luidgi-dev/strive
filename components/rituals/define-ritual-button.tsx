"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import type { RitualCategoryRow } from "@/lib/data/rituals";
import { cn } from "@/lib/utils";

import { RitualFormSheet } from "./ritual-form-sheet";

type Variant = "pill" | "cta" | "ghost";

type Props = {
  variant: Variant;
  categories: RitualCategoryRow[];
  /** Overrides the default trigger label (e.g. Rhythm's "Add a ritual"). */
  label?: string;
};

export function DefineRitualButton({ variant, categories, label }: Props) {
  const t = useTranslations("rituals");
  const [open, setOpen] = useState(false);

  const triggerLabel = label ?? (variant === "cta" ? t("defineFirst") : t("defineCta"));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-full font-semibold transition-opacity hover:opacity-90",
          variant !== "ghost" && "bg-foreground text-background",
          variant === "pill" &&
            "min-h-[44px] px-3.5 py-2 text-[11.5px] tracking-wide",
          variant === "cta" &&
            "mt-2 min-h-[44px] px-5 py-2.5 text-[13px] tracking-wide",
          // Discreet dashed pill — a secondary CTA that never competes with the
          // content (Rhythm's "Add a ritual").
          variant === "ghost" &&
            "min-h-[44px] gap-1.5 self-center border border-dashed border-muted-foreground/30 px-3.5 py-2 text-[12px] font-medium text-muted-foreground hover:border-border hover:text-foreground hover:opacity-100",
        )}
      >
        <Plus
          aria-hidden
          className={cn(variant === "pill" ? "size-3" : "size-3.5")}
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
