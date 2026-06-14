// Recipient authorization for notification sends. Pure and dependency-free so it
// is trivially unit-testable and reusable by any send path (the self-send route
// today, future internal senders).
//
// The invariant: a request can only ever target the authenticated user. The
// authenticated id always comes from supabase.auth.getUser() server-side; a
// client-supplied target is accepted ONLY when it matches. This prevents any
// cross-user / broadcast send.

export class RecipientForbiddenError extends Error {
  constructor(message = "Cross-user notification send is not allowed") {
    super(message);
    this.name = "RecipientForbiddenError";
  }
}

/**
 * Resolve the recipient for a send.
 *
 * @param authenticatedUserId the verified session user id (from getUser())
 * @param requestedUserId     an optional client-supplied target
 * @returns the authenticated user id (the only legal recipient)
 * @throws RecipientForbiddenError if a target is supplied and differs from the
 *         authenticated user
 */
export function authorizeRecipient(
  authenticatedUserId: string,
  requestedUserId?: string | null,
): string {
  if (!authenticatedUserId) {
    throw new RecipientForbiddenError("Missing authenticated user");
  }
  if (
    requestedUserId != null &&
    requestedUserId !== "" &&
    requestedUserId !== authenticatedUserId
  ) {
    throw new RecipientForbiddenError();
  }
  return authenticatedUserId;
}
