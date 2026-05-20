"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import type { RitualCategoryRow } from "@/lib/data/rituals";
import { cn } from "@/lib/utils";

type Props = {
  value: string | null;
  onChange: (next: string | null) => void;
  categories: RitualCategoryRow[];
};

export function CategoryChips({ value, onChange, categories }: Props) {
  const t = useTranslations("rituals");
  const [comingSoonOpen, setComingSoonOpen] = useState(false);

  return (
    <>
      <div
        role="radiogroup"
        aria-label={t("form.fields.category")}
        className="flex flex-wrap gap-1.5"
      >
        {categories.map((category) => {
          const active = category.id === value;
          return (
            <button
              key={category.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(active ? null : category.id)}
              className={cn(
                "rounded-full border px-3.5 py-2 text-xs font-medium transition-colors min-h-[44px]",
                active
                  ? "border-foreground/35 bg-foreground/15 text-foreground"
                  : "border-border bg-transparent text-foreground hover:bg-foreground/5",
              )}
            >
              {category.name}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setComingSoonOpen(true)}
          className="rounded-full border border-dashed border-border px-3.5 py-2 text-xs font-medium text-muted-foreground transition-colors min-h-[44px] hover:text-foreground"
        >
          {t("category.new")}
        </button>
      </div>

      <Sheet open={comingSoonOpen} onOpenChange={setComingSoonOpen}>
        <SheetContent>
          <header className="flex items-center justify-between gap-3 pb-1">
            <SheetTitle>{t("category.comingSoon.title")}</SheetTitle>
            <SheetClose
              aria-label={t("form.actions.close")}
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X aria-hidden className="size-4" />
            </SheetClose>
          </header>
          <SheetDescription>{t("category.comingSoon.body")}</SheetDescription>
          <SheetClose className="mt-2 self-start rounded-full bg-foreground/10 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/15 min-h-[44px]">
            {t("form.actions.close")}
          </SheetClose>
        </SheetContent>
      </Sheet>
    </>
  );
}
