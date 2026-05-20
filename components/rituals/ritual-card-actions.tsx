"use client";

import { Menu } from "@base-ui/react/menu";
import { Archive, MoreHorizontal, Pencil, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { archiveRitual } from "@/app/[locale]/protected/(app)/rituals/actions";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import type {
  RitualCategoryRow,
  RitualWithCategory,
} from "@/lib/data/rituals";
import type { RitualFormValues } from "@/lib/data/rituals-schema";
import { cn } from "@/lib/utils";

import { RitualFormSheet } from "./ritual-form-sheet";

type Props = {
  ritual: RitualWithCategory;
  categories: RitualCategoryRow[];
  /** Trigger styling. Defaults to the right edge of a ritual card. */
  triggerClassName?: string;
  /** Side the menu opens towards. Cards open upward; the detail header downward. */
  menuSide?: "top" | "bottom";
};

const DEFAULT_TRIGGER_CLASS =
  "flex size-11 shrink-0 items-center justify-center rounded-r-xl text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground data-[popup-open]:bg-foreground/5 data-[popup-open]:text-foreground";

export function RitualCardActions({
  ritual,
  categories,
  triggerClassName,
  menuSide = "top",
}: Props) {
  const t = useTranslations("rituals");
  const [menuOpen, setMenuOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onEdit = () => {
    setMenuOpen(false);
    setFormOpen(true);
  };

  const onAskArchive = () => {
    setMenuOpen(false);
    setArchiveError(null);
    setConfirmOpen(true);
  };

  const onConfirmArchive = () => {
    setArchiveError(null);
    startTransition(async () => {
      const result = await archiveRitual(ritual.id);
      if (!result.ok) {
        setArchiveError(result.error);
        return;
      }
      setConfirmOpen(false);
    });
  };

  const initialValues = toFormInitialValues(ritual);

  return (
    <>
      <Menu.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <Menu.Trigger
          aria-label={t("actions.openLabel")}
          className={triggerClassName ?? DEFAULT_TRIGGER_CLASS}
        >
          <MoreHorizontal aria-hidden className="size-4" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner side={menuSide} align="end" sideOffset={6} className="z-50">
            <Menu.Popup
              className={cn(
                "min-w-[10rem] overflow-hidden rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg outline-none",
                "transition-[opacity,transform] duration-150 ease-out",
                "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
                "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
              )}
            >
              <Menu.Item
                onClick={onEdit}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground outline-none transition-colors data-[highlighted]:bg-accent"
              >
                <Pencil aria-hidden className="size-3.5" />
                {t("actions.edit")}
              </Menu.Item>
              <Menu.Item
                onClick={onAskArchive}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-destructive outline-none transition-colors data-[highlighted]:bg-destructive/10"
              >
                <Archive aria-hidden className="size-3.5" />
                {t("actions.archive")}
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <Sheet open={confirmOpen} onOpenChange={setConfirmOpen}>
        <SheetContent>
          <header className="flex items-center justify-between gap-3 pb-1">
            <SheetTitle>{t("actions.archiveConfirmTitle")}</SheetTitle>
            <SheetClose
              aria-label={t("form.actions.close")}
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X aria-hidden className="size-4" />
            </SheetClose>
          </header>
          <p className="text-sm text-muted-foreground">
            {t("actions.archiveConfirmBody")}
          </p>
          {archiveError ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {t(`form.errors.${archiveError}`)}
            </p>
          ) : null}
          <div className="mt-1 flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="flex-1 rounded-full border border-border bg-transparent px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/5 min-h-[44px]"
            >
              {t("actions.archiveCancel")}
            </button>
            <button
              type="button"
              onClick={onConfirmArchive}
              disabled={isPending}
              className={cn(
                "flex-1 rounded-full bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/20 min-h-[44px]",
                isPending && "opacity-60",
              )}
            >
              {isPending ? t("actions.archiving") : t("actions.archiveConfirm")}
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <RitualFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        mode="edit"
        categories={categories}
        initialValues={initialValues}
      />
    </>
  );
}

function asRitualType(
  value: string,
): "recurring" | "one_time" | "open" | null {
  if (value === "recurring" || value === "one_time" || value === "open") {
    return value;
  }
  return null;
}

function asFrequencyUnit(
  value: string | null | undefined,
): "day" | "week" | "month" | null {
  if (value === "day" || value === "week" || value === "month") return value;
  return null;
}

function toFormInitialValues(
  ritual: RitualWithCategory,
): (RitualFormValues & { id: string }) | undefined {
  const type = asRitualType(ritual.ritual_type);
  if (!type) return undefined;

  const base = {
    id: ritual.id,
    name: ritual.name,
    icon: ritual.icon ?? null,
    description: ritual.description ?? null,
    category_id: ritual.category_id ?? null,
  };

  if (type === "recurring") {
    const unit = asFrequencyUnit(ritual.frequency_unit) ?? "week";
    return {
      ...base,
      ritual_type: "recurring",
      frequency_unit: unit,
      frequency_value: ritual.frequency_value ?? (unit === "day" ? 1 : 3),
      scheduled_days: ritual.scheduled_days ?? null,
      scheduled_time: ritual.scheduled_time ?? null,
    };
  }

  if (type === "one_time") {
    return {
      ...base,
      ritual_type: "one_time",
      due_date: ritual.due_date ?? "",
      scheduled_time: ritual.scheduled_time ?? null,
    };
  }

  return {
    ...base,
    ritual_type: "open",
  };
}
