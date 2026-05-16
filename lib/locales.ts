// Neutral locale constants importable from both Server and Client Components.
// Kept separate from i18n.ts so the i18n config (which uses next/headers) does
// not leak into client bundles.

export const locales = ["en", "fr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
