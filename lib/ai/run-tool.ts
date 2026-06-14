/** A structured failure the model already knows how to phrase (see prompt.ts). */
export type ToolError = { status: "error" };

/**
 * Run an AI tool's body so an unexpected throw (DB/runtime error) never reaches
 * the model or the client as a raw message. The real error is logged
 * server-side only; the model gets `{ status: "error" }` and replies with the
 * generic failure copy. Expected outcomes (not_found / ambiguous / validation)
 * are returned normally from within `fn` and pass straight through.
 *
 * Lives in its own module (free of server-only deps) so it stays unit-testable.
 */
export async function runTool<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T | ToolError> {
  try {
    return await fn();
  } catch (error) {
    console.error(`[ai-tool:${label}]`, error);
    return { status: "error" };
  }
}
