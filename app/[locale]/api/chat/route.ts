import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";

import { striveAIModel } from "@/lib/ai/client";
import { guardAiRequest } from "@/lib/ai/guard";
import { buildStriveSystemPrompt } from "@/lib/ai/prompt";
import { striveTools } from "@/lib/ai/tools";
import { ensureProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

// HTTP status per block code. 402 (Payment Required) for an exhausted quota,
// 503 (Service Unavailable) for the global pause, 500 for anything unexpected.
const BLOCK_STATUS: Record<string, number> = {
  credits_exhausted: 402,
  ai_paused: 503,
  error: 500,
};

/**
 * Chat endpoint — the server-side brain of the Strive agent.
 *
 * Receives the running conversation from the client (`useChat`), authenticates
 * the user server-side, then streams the model's reply back token by token.
 * Tools are bound to the verified user id, never derived from message content.
 *
 * Lives under `[locale]/` because `proxy.ts` rewrites every non-static request
 * with a locale prefix; the client still posts to `/api/chat`.
 */
export async function POST(req: Request) {
  // Authenticate first: reject anonymous requests before doing any work, and
  // make it unambiguous that the user id comes only from the verified session
  // (proxy.ts has already refreshed the session cookie).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Heal a missing profile first so the credit guard can self-create the user's
  // credits row if needed (the row references profiles via FK).
  await ensureProfile(supabase, { id: user.id, email: user.email });

  // Only the conversation history is read from the request body; the user id is
  // never derived from it — tools are bound to the verified `user.id` below.
  // Parsed before the guard so a malformed body never burns a credit.
  const { messages }: { messages: UIMessage[] } = await req.json();

  // Pre-flight: global kill-switch + per-user credit reservation. On success one
  // credit is held; `refund` returns it if the model call fails below.
  const guard = await guardAiRequest(supabase);
  if (!guard.ok) {
    return Response.json(
      { code: guard.code, resetAt: guard.resetAt },
      { status: BLOCK_STATUS[guard.code] ?? 500 },
    );
  }

  const result = streamText({
    model: striveAIModel,
    system: buildStriveSystemPrompt(),
    messages: await convertToModelMessages(messages),
    tools: striveTools(supabase, user.id),
    // Allow message → tool call → tool result → final text (multi-step).
    stopWhen: stepCountIs(3),
    // The reserved credit pays for a delivered reply; refund if the call errors
    // before producing one (provider/network failure mid-flight).
    onError: async ({ error }) => {
      console.error("[chat] streamText error", error);
      await guard.refund();
    },
  });

  return result.toUIMessageStreamResponse();
}
