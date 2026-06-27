// Lightweight liveness probe for the keep-alive cron (an external pinger hits
// this every few minutes to mitigate Vercel free-tier cold starts). It must
// reach the serverless function to keep it warm, so it is force-dynamic and
// never served from a static/CDN cache.
//
// Lives under `[locale]/` because proxy.ts rewrites every unprefixed request
// with a locale prefix; the pinger still calls the bare `/api/health`.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ status: "ok" });
}
