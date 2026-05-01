"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

const NON_DEFAULT_LOCALE_PREFIX = "/fr";

function toLocalePath(pathname: string, locale: string) {
  const normalizedPathname = pathname || "/";
  const isFrenchPath =
    normalizedPathname === NON_DEFAULT_LOCALE_PREFIX ||
    normalizedPathname.startsWith(`${NON_DEFAULT_LOCALE_PREFIX}/`);

  if (locale === "fr") {
    if (isFrenchPath) return normalizedPathname;
    return normalizedPathname === "/"
      ? NON_DEFAULT_LOCALE_PREFIX
      : `${NON_DEFAULT_LOCALE_PREFIX}${normalizedPathname}`;
  }

  if (!isFrenchPath) return normalizedPathname;
  const withoutPrefix = normalizedPathname.replace(/^\/fr(?=\/|$)/, "");
  return withoutPrefix || "/";
}

export function LocaleSwitcher() {
  const t = useTranslations("settings");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1">
      <Button
        type="button"
        size="sm"
        variant={locale === "en" ? "secondary" : "ghost"}
        onClick={() => router.push(toLocalePath(pathname, "en"))}
        aria-label={`${t("language")}: English`}
      >
        EN
      </Button>
      <Button
        type="button"
        size="sm"
        variant={locale === "fr" ? "secondary" : "ghost"}
        onClick={() => router.push(toLocalePath(pathname, "fr"))}
        aria-label={`${t("language")}: Francais`}
      >
        FR
      </Button>
    </div>
  );
}
