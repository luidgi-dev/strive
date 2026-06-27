"use client";

import { Menu } from "@base-ui/react/menu";
import {
  ChevronLeft,
  LogOut,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { safeError } from "@/lib/i18n/safe-error";
import { useState, useTransition } from "react";

import {
  deleteCircle,
  leaveCircle,
  renameCircle,
} from "@/app/[locale]/protected/(app)/circles/[id]/actions";
import { Input } from "@/components/ui/input";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

const ICON_BTN =
  "flex size-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent";
const TRIGGER =
  "flex size-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent data-[popup-open]:bg-accent";
const POPUP =
  "min-w-[10rem] overflow-hidden rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg outline-none transition-[opacity,transform] duration-150 ease-out data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0";
const ITEM =
  "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground outline-none transition-colors data-[highlighted]:bg-accent";
const ITEM_DESTRUCTIVE =
  "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-destructive outline-none transition-colors data-[highlighted]:bg-destructive/10";

type Props = {
  circleId: string;
  circleName: string;
  isOwner: boolean;
};

/**
 * Detail-page header: back arrow + a "···" menu. Owners can rename or delete the
 * circle; members can leave it. Rename opens a bottom sheet; leave/delete go
 * through a confirmation sheet, then redirect back to the circles list.
 */
export function CircleDetailHeader({ circleId, circleName, isOwner }: Props) {
  const t = useTranslations("circles.detail");
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [confirm, setConfirm] = useState<"leave" | "delete" | null>(null);
  const [name, setName] = useState(circleName);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const errorText = (code: string) => safeError(t, code);

  const openRename = () => {
    setMenuOpen(false);
    setName(circleName);
    setError(null);
    setRenameOpen(true);
  };

  const askConfirm = (kind: "leave" | "delete") => {
    setMenuOpen(false);
    setError(null);
    setConfirm(kind);
  };

  const onRename = () => {
    setError(null);
    startTransition(async () => {
      const result = await renameCircle(circleId, name);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setRenameOpen(false);
    });
  };

  const onConfirm = () => {
    setError(null);
    startTransition(async () => {
      const result =
        confirm === "delete"
          ? await deleteCircle(circleId)
          : await leaveCircle(circleId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      // The current circle is gone for this user; replace so back can't 404.
      router.replace("/protected/circles");
    });
  };

  return (
    <header className="-mx-2 flex items-center justify-between">
      <Link href="/protected/circles" aria-label={t("back")} className={ICON_BTN}>
        <ChevronLeft aria-hidden className="size-5" />
      </Link>

      <Menu.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <Menu.Trigger aria-label={t("menu.open")} className={TRIGGER}>
          <MoreHorizontal aria-hidden className="size-5" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner side="bottom" align="end" sideOffset={6} className="z-50">
            <Menu.Popup className={POPUP}>
              {isOwner ? (
                <>
                  <Menu.Item onClick={openRename} className={ITEM}>
                    <Pencil aria-hidden className="size-3.5" />
                    {t("menu.rename")}
                  </Menu.Item>
                  <Menu.Item
                    onClick={() => askConfirm("delete")}
                    className={ITEM_DESTRUCTIVE}
                  >
                    <Trash2 aria-hidden className="size-3.5" />
                    {t("menu.delete")}
                  </Menu.Item>
                </>
              ) : (
                <Menu.Item
                  onClick={() => askConfirm("leave")}
                  className={ITEM_DESTRUCTIVE}
                >
                  <LogOut aria-hidden className="size-3.5" />
                  {t("menu.leave")}
                </Menu.Item>
              )}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <Sheet open={renameOpen} onOpenChange={setRenameOpen}>
        <SheetContent>
          <header className="flex items-center justify-between gap-3 pb-1">
            <SheetTitle>{t("rename.title")}</SheetTitle>
            <SheetClose
              aria-label={t("rename.cancel")}
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X aria-hidden className="size-4" />
            </SheetClose>
          </header>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("rename.placeholder")}
            aria-label={t("rename.label")}
            maxLength={60}
            autoFocus
            className="h-11"
          />
          {error ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {errorText(error)}
            </p>
          ) : null}
          <button
            type="button"
            onClick={onRename}
            disabled={isPending || name.trim().length === 0}
            className={cn(
              "mt-1 min-h-[44px] rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90",
              (isPending || name.trim().length === 0) && "opacity-60",
            )}
          >
            {t("rename.save")}
          </button>
        </SheetContent>
      </Sheet>

      <Sheet
        open={confirm !== null}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
      >
        <SheetContent>
          <header className="flex items-center justify-between gap-3 pb-1">
            <SheetTitle>
              {confirm === "delete"
                ? t("confirm.deleteTitle")
                : t("confirm.leaveTitle")}
            </SheetTitle>
            <SheetClose
              aria-label={t("confirm.cancel")}
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X aria-hidden className="size-4" />
            </SheetClose>
          </header>
          <p className="text-sm text-muted-foreground">
            {confirm === "delete"
              ? t("confirm.deleteBody")
              : t("confirm.leaveBody")}
          </p>
          {error ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {errorText(error)}
            </p>
          ) : null}
          <div className="mt-1 flex gap-2">
            <button
              type="button"
              onClick={() => setConfirm(null)}
              className="min-h-[44px] flex-1 rounded-full border border-border bg-transparent px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/5"
            >
              {t("confirm.cancel")}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isPending}
              className={cn(
                "min-h-[44px] flex-1 rounded-full bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/20",
                isPending && "opacity-60",
              )}
            >
              {confirm === "delete"
                ? t("confirm.deleteConfirm")
                : t("confirm.leaveConfirm")}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
