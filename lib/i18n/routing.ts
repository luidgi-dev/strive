import { defineRouting } from "next-intl/routing";
import { defaultLocale, locales } from "@/i18n";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
  localeDetection: false,
});
