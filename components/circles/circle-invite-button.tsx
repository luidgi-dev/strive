"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";

/**
 * The hero "Invite" action. The button is fully styled; the bottom sheet is a
 * placeholder until invite-link generation + native share lands in the dedicated
 * invite issue (LUI-64/65), which will swap the sheet body for the real flow.
 */
export function CircleInviteButton() {
  const t = useTranslations("circles.detail");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ml-auto inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-dashed border-muted-foreground/30 px-3 py-1.5 text-[11.5px] font-medium tracking-wide text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
      >
        <Plus aria-hidden className="size-3" strokeWidth={2.5} />
        {t("invite")}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetTitle>{t("inviteComingSoon.title")}</SheetTitle>
          <SheetDescription>{t("inviteComingSoon.body")}</SheetDescription>
        </SheetContent>
      </Sheet>
    </>
  );
}
