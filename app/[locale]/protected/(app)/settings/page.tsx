import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/lib/i18n/navigation";
import { getAuthenticatedProfile, getMembership } from "@/lib/profile";

import { DangerZoneSection } from "./components/danger-zone-section";
import { MembershipSection } from "./components/membership-section";
import { PreferencesSection } from "./components/preferences-section";
import { ProfileSection } from "./components/profile-section";

type Props = { params: Promise<{ locale: string }> };

export default async function SettingsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [{ user, profile }, membership] = await Promise.all([
    getAuthenticatedProfile(),
    getMembership(),
  ]);
  if (!user) redirect(`/${locale}/auth/login`);

  const t = await getTranslations("settings");

  const username = profile?.username ?? user.email?.split("@")[0] ?? "";
  const email = user.email ?? "";

  return (
    <div className="-mx-6 -mb-32 -mt-4 flex flex-1 flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-1 bg-background px-2">
        <Link
          href="/protected/flow"
          aria-label={t("back")}
          className="inline-flex size-11 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="font-heading text-base font-semibold tracking-tight">
          {t("title")}
        </h1>
      </header>

      <div className="mx-auto flex w-full max-w-md flex-col gap-8 px-6 pb-16 pt-2">
        <ProfileSection
          username={username}
          email={email}
          avatarUrl={profile?.avatar_url ?? null}
        />

        <PreferencesSection />

        <MembershipSection
          tier={membership?.tier}
          balance={membership?.balance}
          used={membership?.used}
          resetAt={membership?.resetAt}
        />

        <DangerZoneSection />
      </div>
    </div>
  );
}
