import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";

export const locales = ["en", "fr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export default getRequestConfig(async ({ requestLocale }) => {
  const resolvedLocale = (await requestLocale) ?? defaultLocale;

  if (!locales.includes(resolvedLocale as Locale)) {
    notFound();
  }

  return {
    locale: resolvedLocale,
    messages: (await import(`./messages/${resolvedLocale}.json`)).default,
  };
});
