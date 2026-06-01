import type { ToolSet } from "ai";

import type { StriveSupabaseClient } from "@/lib/ai/types";

/**
 * Factory returning the tool set available to the Strive agent, with the
 * Supabase client and verified user id already bound (server-side context).
 *
 * Tools always operate on the `userId` passed here — never on an id derived
 * from the conversation. Concrete tools (log a ritual, read momentum, …) land
 * in LUI-37; for now this returns an empty set so the chat route streams plain
 * conversational replies.
 */
export function striveTools(
  supabase: StriveSupabaseClient,
  userId: string,
): ToolSet {
  // Bound context is unused until the concrete tools land in LUI-37.
  void supabase;
  void userId;

  return {};
}
