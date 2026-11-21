"use client";

import { RotateCcw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { ErrorState } from "@/components/errors/error-state";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { homePath, type Locale } from "@/lib/locales";

type Props = {
  /** The reset handler from the route's `error.tsx` boundary. */
  reset: () => void;
  className?: string;
};

/**
 * Shared UI for App Router `error.tsx` boundaries: retry first, and a way out
 * when retrying does not help. Each segment's `error.tsx` logs the error and
 * renders this.
 */
export function RouteError({ reset, className }: Props) {
  const t = useTranslations("error");
  const locale = useLocale() as Locale;

  return (
    <ErrorState
      code="500"
      title={t("title")}
      body={t("body")}
      icon={<RotateCcw />}
      className={className}
    >
      <Button onClick={reset} size="lg" className="min-h-[44px] px-5">
        {t("retry")}
      </Button>
      {/* Landing redirects signed-in users to Rhythm (proxy.ts). */}
      <ButtonLink
        href={homePath(locale)}
        variant="link"
        className="min-h-[44px] text-muted-foreground"
      >
        {t("back")}
      </ButtonLink>
    </ErrorState>
  );
}
