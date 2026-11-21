import { notFound } from "next/navigation";

/**
 * Catch-all so unmatched URLs render the localized `[locale]/not-found.tsx`
 * instead of the root one. Unprefixed URLs reach it too: proxy.ts rewrites
 * them under `/en`.
 */
export default function CatchAll() {
  notFound();
}
