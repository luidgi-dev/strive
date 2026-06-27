// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://0983db5f1cc26a0828dec44fab9093ef@o4511632102391808.ingest.de.sentry.io/4511632115105872",

  // Separate dashboard events by environment. On Vercel, VERCEL_ENV is
  // "production" | "preview" | "development"; fall back to NODE_ENV locally.
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,

  // Errors are always captured at 100% — this only governs performance traces.
  // Disabled for the errors-only setup; raise to ~0.2 to start sampling later.
  tracesSampleRate: 0,

  // Do not auto-attach PII (IP, headers, cookies) — GDPR-conscious default.
  sendDefaultPii: false,
});
