// Neutral locale constants importable from both Server and Client Components.
// Kept separate from i18n.ts so the i18n config (which uses next/headers) does
// not leak into client bundles.

export const locales = ["en", "fr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

/** Landing path for a locale: English URLs carry no prefix (see proxy.ts). */
export function homePath(locale: Locale): string {
  return locale === defaultLocale ? "/" : `/${locale}`;
}

/**
 * Locale from a URL pathname, for code running outside next-intl (the root
 * `global-error.tsx` replaces the layout that provides it).
 */
export function localeFromPathname(pathname: string): Locale {
  const segment = pathname.split("/")[1];
  return locales.find((locale) => locale === segment) ?? defaultLocale;
}
