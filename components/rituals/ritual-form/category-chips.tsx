"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import type { RitualCategoryRow } from "@/lib/data/rituals";
import { getCategoryLabel } from "@/lib/rituals/category-label";
import { cn } from "@/lib/utils";

import { CategoryFormSheet } from "../category-form-sheet";

type Props = {
  value: string | null;
  onChange: (next: string | null) => void;
  categories: RitualCategoryRow[];
};

export function CategoryChips({ value, onChange, categories }: Props) {
  const t = useTranslations("rituals");
  const [formOpen, setFormOpen] = useState(false);
  // Categories created from within this form, kept locally so they appear and
  // stay selected before the server list revalidates.
  const [created, setCreated] = useState<RitualCategoryRow[]>([]);

  const allCategories = useMemo(() => {
    const ids = new Set(categories.map((c) => c.id));
    return [...categories, ...created.filter((c) => !ids.has(c.id))];
  }, [categories, created]);

  const handleCreated = (cat: { id: string; name: string }) => {
    setCreated((prev) =>
      prev.some((c) => c.id === cat.id)
        ? prev
        : [...prev, { id: cat.id, name: cat.name, slug: null, user_id: null }],
    );
    onChange(cat.id);
  };

  return (
    <>
      <div
        role="radiogroup"
        aria-label={t("form.fields.category")}
        className="flex flex-wrap gap-1.5"
      >
        {allCategories.map((category) => {
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
              {getCategoryLabel(category, t, category.name)}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="rounded-full border border-dashed border-border px-3.5 py-2 text-xs font-medium text-muted-foreground transition-colors min-h-[44px] hover:text-foreground"
        >
          {t("category.new")}
        </button>
      </div>

      <CategoryFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        mode="create"
        onCreated={handleCreated}
      />
    </>
  );
}
