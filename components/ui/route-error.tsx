"use client";

import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

type Props = {
  /** The reset handler from the route's `error.tsx` boundary. */
  reset: () => void;
};

/**
 * Shared UI for App Router `error.tsx` boundaries — a calm, centered message
 * with a retry action, in the app's quiet style. Each segment's `error.tsx`
 * logs the error and renders this.
 */
export function RouteError({ reset }: Props) {
  const t = useTranslations("error");

  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-md flex-col items-center justify-center gap-4 px-2 pb-24 text-center">
      <div
        aria-hidden
        className="flex size-16 items-center justify-center rounded-2xl bg-accent text-muted-foreground"
      >
        <RotateCcw className="size-7" strokeWidth={1.5} />
      </div>
      <h2 className="max-w-[280px] font-heading text-[22px] font-bold leading-tight tracking-tight text-foreground">
        {t("title")}
      </h2>
      <p className="max-w-[280px] text-[13.5px] leading-relaxed text-muted-foreground">
        {t("body")}
      </p>
      <Button onClick={reset} size="lg" className="mt-2 min-h-[44px]">
        {t("retry")}
      </Button>
    </div>
  );
}
