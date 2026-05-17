//i18n.ts
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";

import { defaultLocale, locales, type Locale } from "@/lib/locales";

// Re-export so server-only files that previously imported from "@/i18n" keep
// working. Client and shared modules should import from "@/lib/locales".
export { defaultLocale, locales };
export type { Locale };

export default getRequestConfig(async ({ requestLocale }) => {
  // Prefer the header stamped by proxy.ts. next-intl's `requestLocale`
  // auto-detection does not work reliably with our custom rewrite (the
  // default locale URL has no prefix, so next-intl cannot infer it from
  // the URL). Falling back to defaultLocale would serve EN on /fr/* routes.
  const headersList = await headers();
  const headerLocale = headersList.get("x-strive-locale");

  const resolvedLocale =
    headerLocale ?? (await requestLocale) ?? defaultLocale;

  if (!locales.includes(resolvedLocale as Locale)) {
    notFound();
  }

  return {
    locale: resolvedLocale,
    messages: (await import(`./messages/${resolvedLocale}.json`)).default,
  };
});
