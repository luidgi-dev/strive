"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import { CircleCreateFlow } from "./circle-create-flow";

type Variant = "pill" | "cta";

type Props = {
  variant: Variant;
};

/**
 * Entry point to create a circle. Opens a bottom sheet running the create flow
 * (name + optional note, then a confirmation with the shareable invite link).
 */
export function NewCircleButton({ variant }: Props) {
  const t = useTranslations("circles");
  const [open, setOpen] = useState(false);
  const label = variant === "cta" ? t("empty.cta") : t("newCircle");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-full bg-foreground font-semibold text-background transition-opacity hover:opacity-90",
          variant === "pill" &&
            "min-h-[44px] px-3.5 py-2 text-[11.5px] tracking-wide",
          variant === "cta" &&
            "mt-2 min-h-[44px] px-5 py-2.5 text-[13px] tracking-wide",
        )}
      >
        <Plus
          aria-hidden
          className={cn(variant === "pill" ? "size-3" : "size-3.5")}
          strokeWidth={2.5}
        />
        {label}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <CircleCreateFlow onClose={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
