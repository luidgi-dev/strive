"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { UserAvatar } from "@/components/ui/user-avatar";

type Props = {
  avatarUrl: string | null;
  displayName: string | null;
};

export function ProtectedHeader({ avatarUrl, displayName }: Props) {
  const pathname = usePathname();
  const t = useTranslations("common");

  if (pathname === "/protected/settings" || pathname.startsWith("/protected/settings/")) {
    return null;
  }

  // Ritual detail pages provide their own back header.
  if (pathname.startsWith("/protected/rituals/")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between bg-background px-6">
      <Link
        href="/protected/flow"
        aria-label={t("homeLabel")}
        className="text-2xl font-bold tracking-tighter"
      >
        {t("appName")}
      </Link>

      <Link
        href="/protected/settings"
        aria-label={t("settingsLabel")}
        className="flex min-h-[44px] min-w-[44px] items-center justify-center"
      >
        <UserAvatar src={avatarUrl} name={displayName} />
      </Link>
    </header>
  );
}
