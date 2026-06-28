# Observability — Error Monitoring (Sentry)

Strive uses [Sentry](https://strive-vq.sentry.io) to capture runtime errors in production so bugs are detected proactively instead of through user reports. Org `strive-vq`, project `strive-app`, EU data region (`*.de.sentry.io`).

The setup is **privacy-conscious**: errors are captured at 100%, performance tracing is on (sampled), and cron jobs are monitored — but Session Replay and PII collection are off. Everything is reversible — see [Extending](#extending).

> **Stack boundary:** Sentry owns technical health (errors, performance/Web Vitals, cron monitoring). Product **usage** (visitors, page views, top pages) is owned by **Vercel Web Analytics** (`@vercel/analytics`, `<Analytics />` in `app/layout.tsx`) — cookieless and GDPR-friendly. `@vercel/speed-insights` is intentionally not used: Web Vitals already come from Sentry tracing.

---

## What is wired up

| File | Runtime | Role |
|---|---|---|
| `instrumentation-client.ts` | Browser | `Sentry.init` for client errors; also exports `onRouterTransitionStart` |
| `instrumentation.ts` | Server/Edge | `register()` loads the server/edge config; exports `onRequestError` (captures Server Components, route handlers, Server Actions) |
| `config/sentry.server.config.ts` | Node | `Sentry.init` for the Node server runtime |
| `config/sentry.edge.config.ts` | Edge | `Sentry.init` for the edge runtime |
| `next.config.ts` | Build | Wrapped with `withSentryConfig(...)` for source-map upload |
| `app/global-error.tsx` | Browser | Root-layout error boundary — calls `Sentry.captureException` |
| `app/[locale]/protected/(app)/error.tsx` | Browser | App-section error boundary — calls `Sentry.captureException` |
| `proxy.ts` | Server | Manual `try/catch` + `captureException` around the Supabase `getUser()` (see caveat below) |
| `app/[locale]/api/cron/insights/route.ts` | Server | Cron handler wrapped in `Sentry.withMonitor` (see [Cron monitoring](#cron-monitoring)) |

### How capture works

- **Automatic** — once initialized, the SDK records unhandled errors in the browser, and server-side errors flow through `onRequestError`.
- **Manual** — React render errors caught by an error boundary do not reach Sentry on their own, so each `error.tsx` / `global-error.tsx` calls `Sentry.captureException(error)` in its `useEffect`. Add the same call to any new error boundary.

### `proxy.ts` caveat (Next.js 16)

Next.js 16 renamed `middleware.ts` to `proxy.ts` and **does not forward errors thrown inside `proxy.ts` to `onRequestError`** ([vercel/next.js#85261](https://github.com/vercel/next.js/issues/85261)). Because the proxy runs `supabase.auth.getUser()` on every request, that call is wrapped in a `try/catch` that reports to Sentry manually and degrades to an unauthenticated request rather than 500-ing the page. Any future logic added to `proxy.ts` that can throw must be captured the same way.

---

## Configuration choices

- **`tracesSampleRate: 1`** — performance tracing on, sampled at 100% during the low-volume friends-and-family / perf-audit phase to get complete Web Vitals and slow-query data. Lower toward `~0.2` as traffic grows. Errors are unaffected (always 100%). `next.config.ts` also sets `experimental.clientTraceMetadata` so App Router pageload traces connect to their server trace.
- **`sendDefaultPii: false`** — no automatic IP / headers / cookies. GDPR-conscious given the EU region and real users. Attach a controlled `user.id` explicitly via `Sentry.setUser` if a specific bug needs it.
- **No Session Replay** — removed from the client config (bundle size + quota + privacy).
- **`environment`** — events are tagged per environment so local dev noise stays separate from production:
  - server / edge read `VERCEL_ENV` (`production` | `preview` | `development`), falling back to `NODE_ENV`.
  - the client reads `NEXT_PUBLIC_VERCEL_ENV` (expose it in Vercel for a preview/production split), falling back to `NODE_ENV`.

---

## Source maps

`withSentryConfig` uploads source maps at build time so stack traces point to the original TypeScript, not minified output. This requires `SENTRY_AUTH_TOKEN`:

- **Local** — stored in `.env.local` as `SENTRY_AUTH_TOKEN` (gitignored). Only needed to test source-map upload locally; not needed for `next dev`.
- **Vercel** — provided by the official [Vercel ↔ Sentry integration](https://vercel.com/integrations/sentry), which injects the token into builds and links releases to deployments.

The DSN is **not** a secret (it ships in the client bundle by design) and is hardcoded in the init files — no env var needed for capture to work.

> Source-map upload works under Next.js 16's default Turbopack build — verified end-to-end (a thrown error resolves to `…/page.tsx:line` in the dashboard).

---

## Cron monitoring

The scheduled Insights job (`app/[locale]/api/cron/insights/route.ts`) is wrapped in `Sentry.withMonitor`, with one monitor per cadence (`insights-weekly`, `insights-monthly`). Sentry flags a monitor as failed when a run is **missed**, **throws**, or **times out**. The monitors auto-create on first run from the `schedule` passed in code.

The crontab values in the route **must mirror `vercel.json`** (the source of truth) — Vercel runs crons in UTC. `automaticVercelMonitors` is not used: it does not support App Router route handlers and has no effect under Turbopack.

> A *handled* 500 (e.g. the user-list query fails and returns a `Response`) does not mark the monitor failed — only thrown errors, timeouts and missed runs do.

## Triage workflow — Sentry → Linear

The Sentry ↔ Linear integration is configured in the Sentry dashboard (Settings → Integrations → Linear). From any Sentry issue you can **Create Linear issue**, pre-filled with the stack trace and context, so prod bugs become tracked work in one click. Currently used **manually**; a Sentry alert rule can automate "new issue → create Linear issue" later if needed (watch for noise).

A readable stack trace (source maps) plus breadcrumbs is what lets a human — or an agent — diagnose and fix an issue from the Linear ticket alone. Sentry's own Seer / Autofix can also propose a root cause directly on an issue.

---

## Testing the setup

There is no committed test page. To verify capture, temporarily add a route **under `app/[locale]/`** (so the proxy locale rewrite resolves it — a top-level route would 404) with a button that throws, plus a Server Action that throws for the server path. Run `npm run build && npm run start` to validate that the dashboard stack trace points to the TypeScript source, then delete the route. Do **not** use the Sentry wizard's `/sentry-example-page` — it lives outside `[locale]` and 404s against our routing.

---

## Extending

- **Tune trace sampling** — lower `tracesSampleRate` toward `~0.2` in the three config files once traffic grows.
- **Session Replay** — re-add `Sentry.replayIntegration()` to `instrumentation-client.ts` (reassess PII first).
- **Richer user context** — call `Sentry.setUser({ id })` after auth, keeping PII off.
