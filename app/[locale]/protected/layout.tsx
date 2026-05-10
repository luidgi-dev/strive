// app/[locale]/protected/layout.tsx
import { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserAvatar } from "@/components/ui/user-avatar";
import { getTranslations } from "next-intl/server";

export default async function ProtectedBaseLayout({ 
  children,
  params
}: { 
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("common");
  const supabase = await createClient();
  
  // Securely retrieve the user from the server session
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect(`/${locale}/auth/login`);
  }

  // Fetch profile using the verified server-side user ID
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between px-6 bg-background/80 backdrop-blur-md">
        <Link 
          href={`/${locale}/protected/flow`} 
          className="text-2xl font-bold tracking-tighter hover:opacity-80 transition-opacity"
        >
          {t("appName")}
        </Link>

        <Link 
          href={`/${locale}/protected/settings`} 
          className="transition-transform active:scale-95 flex items-center justify-center min-w-[44px] min-h-[44px]"
        >
          <UserAvatar 
            src={profile?.avatar_url} 
            name={profile?.username || user.email} 
          />
        </Link>
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}