"use client";

import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";

type Props = {
  children: ReactNode;
};

export function RitualCardTrigger({ children }: Props) {
  const t = useTranslations("rituals.comingSoon");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex w-full min-h-[44px] items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-3 text-left text-card-foreground transition-colors hover:border-foreground/20"
      >
        {children}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetTitle>{t("title")}</SheetTitle>
          <SheetDescription>{t("body")}</SheetDescription>
        </SheetContent>
      </Sheet>
    </>
  );
}
