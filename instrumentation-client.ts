// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://0983db5f1cc26a0828dec44fab9093ef@o4511632102391808.ingest.de.sentry.io/4511632115105872",

  // Separate dashboard events by environment. Client bundles only inline
  // NEXT_PUBLIC_* vars, so we read NEXT_PUBLIC_VERCEL_ENV (expose it in Vercel
  // for a preview/production split) and fall back to NODE_ENV locally.
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,

  // Errors are always captured at 100% — this only governs performance traces.
  // Disabled for the errors-only setup; raise to ~0.2 to start sampling Web
  // Vitals / route performance later.
  tracesSampleRate: 0,

  // Do not auto-attach PII (IP, headers, cookies) — GDPR-conscious default.
  // Attach a controlled user id explicitly via Sentry.setUser if a bug needs it.
  sendDefaultPii: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
