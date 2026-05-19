"use client";

import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { usePathname } from "@/lib/i18n/navigation";

export function StriveAiFab() {
  const pathname = usePathname();
  const t = useTranslations("rituals.ai");

  if (
    pathname === "/protected/settings" ||
    pathname.startsWith("/protected/settings/")
  ) {
    return null;
  }

  return (
    <button
      type="button"
      aria-label={t("openLabel")}
      className="fixed right-5 z-40 inline-flex size-[52px] items-center justify-center rounded-full bg-foreground text-background shadow-[0_8px_24px_oklch(0_0_0/0.18),0_2px_6px_oklch(0_0_0/0.1)] transition-opacity hover:opacity-90 bottom-[calc(64px+env(safe-area-inset-bottom)+32px)]"
    >
      <Sparkles aria-hidden className="size-[22px]" strokeWidth={1.75} />
    </button>
  );
}
