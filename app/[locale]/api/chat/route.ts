import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";

import { striveAIModel } from "@/lib/ai/client";
import { buildStriveSystemPrompt } from "@/lib/ai/prompt";
import { striveTools } from "@/lib/ai/tools";
import { createClient } from "@/lib/supabase/server";

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
  const { messages }: { messages: UIMessage[] } = await req.json();

  // Authenticate server-side; proxy.ts has already refreshed the session cookie.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const result = streamText({
    model: striveAIModel,
    system: buildStriveSystemPrompt(),
    messages: await convertToModelMessages(messages),
    tools: striveTools(supabase, user.id),
    // Allow message → tool call → tool result → final text (multi-step).
    stopWhen: stepCountIs(3),
  });

  return result.toUIMessageStreamResponse();
}
