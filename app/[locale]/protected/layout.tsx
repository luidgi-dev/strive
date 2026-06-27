// app/[locale]/protected/layout.tsx
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getAuthenticatedProfile } from "@/lib/profile";
import { getUnseenNudges } from "@/lib/data/nudges";
import { createClient } from "@/lib/supabase/server";
import { ProtectedHeader } from "@/components/layout/protected-header";
import { NudgeToaster } from "@/components/nudges/nudge-toaster";

export default async function ProtectedBaseLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate the session once, then fan out the profile + nudges queries in
  // parallel on the same client — avoids two extra getUser() round-trips and a
  // sequential waterfall on every protected page load.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  // Unseen nudges surface as a one-time toast on app open, across any screen.
  const [{ profile }, nudges] = await Promise.all([
    getAuthenticatedProfile(supabase, user),
    getUnseenNudges(supabase, user),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <ProtectedHeader
        avatarUrl={profile?.avatar_url ?? null}
        displayName={profile?.username ?? user.email ?? null}
      />
      <main className="flex flex-1 flex-col">{children}</main>
      {nudges.length > 0 ? <NudgeToaster nudges={nudges} /> : null}
    </div>
  );
}
