import type { MetadataRoute } from "next";

import { locales } from "@/lib/locales";
import { localeAlternates, localizedUrl } from "@/lib/seo";

// Public, indexable routes (locale-agnostic paths). Auth/protected/api are
// excluded via robots.ts.
const publicPaths = ["", "/help", "/legal/privacy", "/legal/terms"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPaths.flatMap((path) => {
    const languages = localeAlternates(path);
    // One entry per locale URL, each advertising the full hreflang set.
    return locales.map((locale) => ({
      url: localizedUrl(locale, path),
      alternates: { languages },
    }));
  });
}
