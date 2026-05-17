// app/[locale]/protected/layout.tsx
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getAuthenticatedProfile } from "@/lib/profile";
import { ProtectedHeader } from "@/components/layout/protected-header";

export default async function ProtectedBaseLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { user, profile } = await getAuthenticatedProfile();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <ProtectedHeader
        avatarUrl={profile?.avatar_url ?? null}
        displayName={profile?.username ?? user.email ?? null}
      />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
