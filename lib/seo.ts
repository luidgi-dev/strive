import { defaultLocale, locales, type Locale } from "@/lib/locales";

// Canonical production origin. Mirrors the `metadataBase` fallback in
// app/layout.tsx so sitemap/robots/metadata all agree on one host.
export const SITE_URL = (
  process.env.STRIVE_LIVE_URL ?? "https://striveapp.cc"
).replace(/\/$/, "");

/**
 * Absolute URL for a public route in a given locale, honoring the
 * `as-needed` prefix strategy: the default locale (en) is served unprefixed,
 * other locales carry their `/<locale>` prefix. `path` is the locale-agnostic
 * route starting with "/" ("" for the home page).
 */
export function localizedUrl(locale: Locale, path = ""): string {
  const prefix = locale === defaultLocale ? "" : `/${locale}`;
  return `${SITE_URL}${prefix}${path || "/"}`;
}

/**
 * hreflang map for a public route: one entry per locale plus an `x-default`
 * pointing at the default locale (Google's recommended fallback). Used by both
 * sitemap alternates and page `alternates.languages` metadata.
 */
export function localeAlternates(path = ""): Record<string, string> {
  return {
    ...Object.fromEntries(
      locales.map((locale) => [locale, localizedUrl(locale, path)]),
    ),
    "x-default": localizedUrl(defaultLocale, path),
  };
}
