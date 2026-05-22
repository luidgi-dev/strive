"use client";

import { Menu } from "@base-ui/react/menu";
import { Archive, MoreHorizontal, Pencil, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { archiveCategory } from "@/app/[locale]/protected/(app)/rituals/actions";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import { CategoryFormSheet } from "./category-form-sheet";

type Props = {
  /** Always a user-owned category; system categories render no actions. */
  category: { id: string; name: string };
};

export function CategoryActions({ category }: Props) {
  const t = useTranslations("rituals");
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onEdit = () => {
    setMenuOpen(false);
    setEditOpen(true);
  };

  const onAskArchive = () => {
    setMenuOpen(false);
    setArchiveError(null);
    setConfirmOpen(true);
  };

  const onConfirmArchive = () => {
    setArchiveError(null);
    startTransition(async () => {
      const result = await archiveCategory(category.id);
      if (!result.ok) {
        setArchiveError(result.error);
        return;
      }
      setConfirmOpen(false);
    });
  };

  return (
    <>
      <Menu.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <Menu.Trigger
          aria-label={t("category.manage.menuLabel", { category: category.name })}
          className="flex h-7 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground data-[popup-open]:bg-foreground/5 data-[popup-open]:text-foreground"
        >
          <MoreHorizontal aria-hidden className="size-4" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner side="bottom" align="end" sideOffset={6} className="z-50">
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
                {t("category.manage.edit")}
              </Menu.Item>
              <Menu.Item
                onClick={onAskArchive}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-destructive outline-none transition-colors data-[highlighted]:bg-destructive/10"
              >
                <Archive aria-hidden className="size-3.5" />
                {t("category.manage.archive")}
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <Sheet open={confirmOpen} onOpenChange={setConfirmOpen}>
        <SheetContent>
          <header className="flex items-center justify-between gap-3 pb-1">
            <SheetTitle>{t("category.manage.archiveConfirmTitle")}</SheetTitle>
            <SheetClose
              aria-label={t("form.actions.close")}
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X aria-hidden className="size-4" />
            </SheetClose>
          </header>
          <p className="text-sm text-muted-foreground">
            {t("category.manage.archiveConfirmBody")}
          </p>
          {archiveError ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {t(`category.manage.errors.${archiveError}`)}
            </p>
          ) : null}
          <div className="mt-1 flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="flex-1 rounded-full border border-border bg-transparent px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/5 min-h-[44px]"
            >
              {t("category.manage.archiveCancel")}
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
              {isPending ? t("actions.archiving") : t("category.manage.archiveConfirm")}
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <CategoryFormSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        category={category}
      />
    </>
  );
}
