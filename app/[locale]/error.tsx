"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import { ErrorPage } from "@/components/errors/error-page";
import { RouteError } from "@/components/ui/route-error";

/**
 * Error boundary for public pages (landing, auth, help, legal, invites). The
 * authenticated app has its own, closer boundary that keeps its header and nav.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error("[locale] route error", error);
  }, [error]);

  return (
    <ErrorPage>
      <RouteError reset={reset} className="min-h-0 pb-0" />
    </ErrorPage>
  );
}
