"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import { RouteError } from "@/components/ui/route-error";

/**
 * Error boundary for the whole authenticated app section (Rhythm, Rituals,
 * Circles, Settings). Keeps the header/nav from the layout and offers a retry.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error("[protected/app] route error", error);
  }, [error]);

  return <RouteError reset={reset} />;
}
