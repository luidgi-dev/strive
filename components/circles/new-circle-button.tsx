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
  /** Demo account: creating circles is blocked (server also rejects it). */
  disabled?: boolean;
};

/**
 * Entry point to create a circle. Opens a bottom sheet running the create flow
 * (name + optional note, then a confirmation with the shareable invite link).
 * In demo mode the button renders disabled with a tooltip instead of opening.
 */
export function NewCircleButton({ variant, disabled = false }: Props) {
  const t = useTranslations("circles");
  const [open, setOpen] = useState(false);
  const label = variant === "cta" ? t("empty.cta") : t("newCircle");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        title={disabled ? t("demoDisabled") : undefined}
        aria-label={disabled ? t("demoDisabled") : undefined}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-full bg-foreground font-semibold text-background transition-opacity hover:opacity-90",
          "disabled:pointer-events-none disabled:opacity-50",
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

      {disabled ? null : (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent>
            <CircleCreateFlow onClose={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
