"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { safeError } from "@/lib/i18n/safe-error";
import { useState, useTransition } from "react";

import {
  createCategory,
  updateCategory,
} from "@/app/[locale]/protected/(app)/rituals/actions";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type Mode = "create" | "edit";

type Props = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  mode: Mode;
  /** Required in edit mode: the user-owned category being renamed. */
  category?: { id: string; name: string };
  /** Fired after a successful create, with the new category. */
  onCreated?: (category: { id: string; name: string }) => void;
};

export function CategoryFormSheet({
  open,
  onOpenChange,
  mode,
  category,
  onCreated,
}: Props) {
  const t = useTranslations("rituals");
  const [name, setName] = useState(category?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Reset the field when the sheet transitions to open — done during render
  // (React's "adjust state on prop change" pattern) rather than in an effect.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName(category?.name ?? "");
      setError(null);
    }
  }

  const onSubmit = () => {
    setError(null);
    startTransition(async () => {
      if (mode === "edit" && category) {
        const result = await updateCategory(category.id, name);
        if (!result.ok) {
          setError(result.error);
          return;
        }
      } else {
        const result = await createCategory(name);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        if (result.data) onCreated?.({ id: result.data.id, name: name.trim() });
      }
      onOpenChange(false);
    });
  };

  const title =
    mode === "create" ? t("category.manage.createTitle") : t("category.manage.editTitle");
  const cta = mode === "create" ? t("category.manage.create") : t("category.manage.save");

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
        <form
          onSubmit={(e) => {
            e.preventDefault();
            // The sheet is portaled but stays a React descendant of the ritual
            // form; stop propagation so its submit doesn't bubble up and submit
            // the ritual too.
            e.stopPropagation();
            onSubmit();
          }}
          className="flex flex-col gap-3"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label={t("category.manage.nameLabel")}
            placeholder={t("category.manage.namePlaceholder")}
            autoComplete="off"
            maxLength={50}
            className="rounded-lg border border-transparent bg-accent px-3.5 py-3 text-base font-medium text-foreground outline-none focus:border-foreground/35 focus:bg-card placeholder:text-muted-foreground"
          />
          {error ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {safeError(t, error, "category.manage.errors")}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={isPending || name.trim().length === 0}
            className={cn(
              "mt-1 w-full rounded-full bg-foreground px-4 py-3 text-sm font-bold text-background transition-opacity",
              isPending || name.trim().length === 0
                ? "opacity-50"
                : "hover:opacity-90",
            )}
          >
            {isPending ? t("form.actions.saving") : cta}
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
