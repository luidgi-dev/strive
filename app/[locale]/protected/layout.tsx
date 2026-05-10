// app/[locale]/protected/layout.tsx
import { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { UserAvatar } from "@/components/ui/user-avatar";
import { getTranslations } from "next-intl/server";
import { getAuthenticatedProfile } from "@/lib/profile";

export default async function ProtectedBaseLayout({ 
  children,
  params
}: { 
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("common");
  
  // Clean extraction of logic
  const { user, profile } = await getAuthenticatedProfile();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between px-6 bg-background/80 backdrop-blur-md">
        <Link href={`/${locale}/protected/flow`} className="text-2xl font-bold tracking-tighter">
          {t("appName")}
        </Link>

        <Link href={`/${locale}/protected/settings`} className="min-w-[44px] min-h-[44px] flex items-center justify-center">
          <UserAvatar 
            src={profile?.avatar_url} 
            name={profile?.username || user.email} 
          />
        </Link>
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}