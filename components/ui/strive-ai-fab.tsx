"use client";

import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

/**
 * Floating action button that opens the AI chat. Purely presentational: it
 * forwards button props (notably `onClick`) so the owner (`ChatPanel`) drives
 * the open state, and so the client-only guard + settings-page hiding live in
 * one place. Sits above the bottom nav (z-40, offset for the safe area).
 */
export function StriveAiFab({
  className,
  ...props
}: React.ComponentProps<"button">) {
  const t = useTranslations("rituals.ai");

  return (
    <button
      type="button"
      aria-label={t("openLabel")}
      className={cn(
        "fixed right-5 z-40 inline-flex size-[52px] items-center justify-center rounded-full bg-foreground text-background shadow-[0_8px_24px_oklch(0_0_0/0.18),0_2px_6px_oklch(0_0_0/0.1)] transition-opacity hover:opacity-90 bottom-[calc(64px+env(safe-area-inset-bottom)+32px)]",
        className,
      )}
      {...props}
    >
      <Sparkles aria-hidden className="size-[22px]" strokeWidth={1.75} />
    </button>
  );
}
