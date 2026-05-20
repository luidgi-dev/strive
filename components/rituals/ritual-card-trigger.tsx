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
        className="group flex flex-1 min-w-0 items-center gap-3 rounded-l-xl py-3 pl-3.5 pr-2 text-left text-card-foreground transition-colors hover:bg-foreground/5 min-h-[44px]"
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
