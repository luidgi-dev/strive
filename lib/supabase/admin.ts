import { createClient } from "@supabase/supabase-js";

import type { StriveSupabaseClient } from "@/lib/ai/types";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Service-role Supabase client. BYPASSES Row Level Security — it is the privileged
 * context the weekly Insights cron runs in (it has no user session, so RLS would
 * otherwise return zero rows). Every query made with it MUST filter `user_id`
 * explicitly.
 *
 * Never import this into a client component or any user-session request path. It
 * exists only for trusted server-side jobs (the cron route).
 */
export function createAdminClient(): StriveSupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for the admin client.",
    );
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
