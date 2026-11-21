import type { Metadata } from "next";

import { NotFoundState } from "@/components/errors/not-found-state";
import { defaultLocale } from "@/lib/locales";

export const metadata: Metadata = { robots: { index: false } };

/**
 * Fallback for paths proxy.ts never rewrites (e.g. a missing `/foo.png`):
 * they land on `[locale]` with an invalid locale, whose layout calls
 * `notFound()`. No locale is known here, so it renders in English.
 */
export default function RootNotFound() {
  return <NotFoundState locale={defaultLocale} />;
}
