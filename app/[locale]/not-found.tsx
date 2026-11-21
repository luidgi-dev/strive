import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

import { NotFoundState } from "@/components/errors/not-found-state";
import type { Locale } from "@/lib/locales";

export const metadata: Metadata = { robots: { index: false } };

/** Unknown URLs (via `[...rest]`) and every `notFound()` under a locale. */
export default async function LocaleNotFound() {
  const locale = (await getLocale()) as Locale;
  return <NotFoundState locale={locale} />;
}
