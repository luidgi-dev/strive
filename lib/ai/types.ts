import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

/** Server-side, schema-typed Supabase client used by the Strive AI tools. */
export type StriveSupabaseClient = SupabaseClient<Database>;

/**
 * Context bound into every Strive tool, server-side: an authenticated Supabase
 * client and the verified user id.
 *
 * Tools always act on this `userId` — never on an id derived from the
 * conversation — so the model cannot read or mutate another user's data.
 */
export type StriveToolContext = {
  supabase: StriveSupabaseClient;
  userId: string;
};
