# Observability — Error Monitoring (Sentry)

Strive uses [Sentry](https://strive-vq.sentry.io) to capture runtime errors in production so bugs are detected proactively instead of through user reports. Org `strive-vq`, project `strive-app`, EU data region (`*.de.sentry.io`).

The setup is deliberately **errors-only and privacy-conscious**: errors are captured at 100%, but performance tracing, Session Replay and PII collection are all off. Everything is reversible — see [Extending](#extending) to turn features on later.

---

## What is wired up

| File | Runtime | Role |
|---|---|---|
| `instrumentation-client.ts` | Browser | `Sentry.init` for client errors; also exports `onRouterTransitionStart` |
| `instrumentation.ts` | Server/Edge | `register()` loads the server/edge config; exports `onRequestError` (captures Server Components, route handlers, Server Actions) |
| `sentry.server.config.ts` | Node | `Sentry.init` for the Node server runtime |
| `sentry.edge.config.ts` | Edge | `Sentry.init` for the edge runtime |
| `next.config.ts` | Build | Wrapped with `withSentryConfig(...)` for source-map upload |
| `app/global-error.tsx` | Browser | Root-layout error boundary — calls `Sentry.captureException` |
| `app/[locale]/protected/(app)/error.tsx` | Browser | App-section error boundary — calls `Sentry.captureException` |
| `proxy.ts` | Server | Manual `try/catch` + `captureException` around the Supabase `getUser()` (see caveat below) |

### How capture works

- **Automatic** — once initialized, the SDK records unhandled errors in the browser, and server-side errors flow through `onRequestError`.
- **Manual** — React render errors caught by an error boundary do not reach Sentry on their own, so each `error.tsx` / `global-error.tsx` calls `Sentry.captureException(error)` in its `useEffect`. Add the same call to any new error boundary.

### `proxy.ts` caveat (Next.js 16)

Next.js 16 renamed `middleware.ts` to `proxy.ts` and **does not forward errors thrown inside `proxy.ts` to `onRequestError`** ([vercel/next.js#85261](https://github.com/vercel/next.js/issues/85261)). Because the proxy runs `supabase.auth.getUser()` on every request, that call is wrapped in a `try/catch` that reports to Sentry manually and degrades to an unauthenticated request rather than 500-ing the page. Any future logic added to `proxy.ts` that can throw must be captured the same way.

---

## Configuration choices

- **`tracesSampleRate: 0`** — performance tracing off. Errors are unaffected (always 100%). Raise to `~0.2` to start sampling Web Vitals / route performance.
- **`sendDefaultPii: false`** — no automatic IP / headers / cookies. GDPR-conscious given the EU region and real users. Attach a controlled `user.id` explicitly via `Sentry.setUser` if a specific bug needs it.
- **No Session Replay** — removed from the client config (bundle size + quota + privacy).
- **`environment`** — events are tagged per environment so local dev noise stays separate from production:
  - server / edge read `VERCEL_ENV` (`production` | `preview` | `development`), falling back to `NODE_ENV`.
  - the client reads `NEXT_PUBLIC_VERCEL_ENV` (expose it in Vercel for a preview/production split), falling back to `NODE_ENV`.

---

## Source maps

`withSentryConfig` uploads source maps at build time so stack traces point to the original TypeScript, not minified output. This requires `SENTRY_AUTH_TOKEN`:

- **Local** — stored in `.env.sentry-build-plugin` (gitignored, created by the Sentry wizard). Only needed to test source-map upload locally; not needed for `next dev`.
- **Vercel** — provided by the official [Vercel ↔ Sentry integration](https://vercel.com/integrations/sentry), which injects the token into builds and links releases to deployments.

The DSN is **not** a secret (it ships in the client bundle by design) and is hardcoded in the init files — no env var needed for capture to work.

> Source-map upload works under Next.js 16's default Turbopack build — verified end-to-end (a thrown error resolves to `…/page.tsx:line` in the dashboard).

---

## Triage workflow — Sentry → Linear

The Sentry ↔ Linear integration is configured in the Sentry dashboard (Settings → Integrations → Linear). From any Sentry issue you can **Create Linear issue**, pre-filled with the stack trace and context, so prod bugs become tracked work in one click. Currently used **manually**; a Sentry alert rule can automate "new issue → create Linear issue" later if needed (watch for noise).

A readable stack trace (source maps) plus breadcrumbs is what lets a human — or an agent — diagnose and fix an issue from the Linear ticket alone. Sentry's own Seer / Autofix can also propose a root cause directly on an issue.

---

## Testing the setup

There is no committed test page. To verify capture, temporarily add a route **under `app/[locale]/`** (so the proxy locale rewrite resolves it — a top-level route would 404) with a button that throws, plus a Server Action that throws for the server path. Run `npm run build && npm run start` to validate that the dashboard stack trace points to the TypeScript source, then delete the route. Do **not** use the Sentry wizard's `/sentry-example-page` — it lives outside `[locale]` and 404s against our routing.

---

## Extending

- **Performance / Web Vitals** — bump `tracesSampleRate` to `~0.2` in the three config files.
- **Session Replay** — re-add `Sentry.replayIntegration()` to `instrumentation-client.ts` (reassess PII first).
- **Richer user context** — call `Sentry.setUser({ id })` after auth, keeping PII off.
