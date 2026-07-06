import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n.ts");

// Supabase origin (REST/Auth/Realtime) whitelisted in the CSP. Derived from the
// public URL so a project change only touches env, never this file. Realtime
// needs the same host over wss://; avatars are served from its Storage domain.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseOrigin = supabaseUrl ? new URL(supabaseUrl).origin : "";
const supabaseWs = supabaseOrigin.replace(/^https:/, "wss:");

// React + Turbopack use eval() in dev only (source maps, HMR); production React
// never does. Allow 'unsafe-eval' in development so the CSP doesn't break the
// dev server, while keeping the production policy free of it.
const isDev = process.env.NODE_ENV !== "production";

// Pragmatic, statically-servable CSP. 'unsafe-inline' on script-src is required
// because Next injects inline hydration/bootstrap scripts; a strict nonce would
// force per-request dynamic rendering (and thread through proxy.ts). The app has
// no user-controlled HTML (its only inline script is a static JSON-LD data
// block, which browsers never execute), so the residual XSS risk is low.
// Sentry (EU ingest) and Supabase are
// the only cross-origin endpoints; Vercel Analytics and /api/* are same-origin.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${supabaseOrigin ? ` ${supabaseOrigin}` : ""}`,
  "font-src 'self'",
  `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin} ${supabaseWs}` : ""} https://*.ingest.de.sentry.io https://*.sentry.io`,
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  // Drop the framework-revealing `x-powered-by: Next.js` response header.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  experimental: {
    // Allow image uploads (avatar) larger than the 1 MB Server Action default.
    // iPhone photos are routinely 3-8 MB. App-level cap is 5 MB; the 10 MB
    // margin here absorbs multipart overhead.
    serverActions: {
      bodySizeLimit: "10mb",
    },
    // Forward Sentry's trace headers to the client so App Router pageload
    // transactions connect to the originating server trace (recommended for
    // Next.js 15+ tracing).
    clientTraceMetadata: ["sentry-trace", "baggage"],
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "strive-vq",

  project: "strive-app",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // No tunnelRoute: it would need a non-locale-prefixed path that our proxy.ts
  // rewrites (e.g. /monitoring -> /en/monitoring), which breaks client error
  // reporting. Revisit (and exclude the route from the proxy matcher) only if
  // ad-blockers are observed dropping client events.

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
