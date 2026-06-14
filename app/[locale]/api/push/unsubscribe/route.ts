import { createClient } from "@/lib/supabase/server";

// Remove a push subscription for the signed-in user. Scoped to the verified
// session id so a user can only delete their own rows (RLS enforces this too).
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  let body: { endpoint?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!body.endpoint) return new Response("Missing endpoint", { status: 400 });

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", body.endpoint);

  if (error) {
    console.error("[push/unsubscribe] failed to delete subscription", error);
    return new Response("Failed to remove subscription", { status: 500 });
  }

  return Response.json({ ok: true });
}
