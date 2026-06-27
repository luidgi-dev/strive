// Demo account helpers (LUI-43).
//
// The live demo runs on a single shared Supabase user (demo@striveapp.cc) whose
// week of logs, AI credits and insights are reset nightly by the demo-reset cron.
// Account-level and destructive actions are blocked for it so visitors can
// explore the app without mutating the showcase or each other's session.
//
// DEMO_USER_ID is set in the deploy env (and .env.local for local work). It is
// intentionally server-only (no NEXT_PUBLIC_ prefix): client components never
// read it, they receive a plain `isDemoUser` boolean drilled from a Server
// Component. When the var is absent every check below is a no-op, so non-demo
// environments are unaffected.

const DEMO_USER_ID = process.env.DEMO_USER_ID ?? "";

/**
 * Typed error returned by blocked Server Actions (kept in the repo's
 * `ActionResult` shape, e.g. `{ ok: false, error: DEMO_RESTRICTED }`). The client
 * maps it to the right toast / disabled-state copy.
 */
export const DEMO_RESTRICTED = "demo_restricted" as const;

/** True when the given user id is the shared demo account. */
export function isDemoUser(userId: string | null | undefined): boolean {
  return DEMO_USER_ID.length > 0 && userId === DEMO_USER_ID;
}
