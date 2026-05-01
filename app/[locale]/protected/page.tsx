import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/logout-button";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { createClient } from "@/lib/supabase/server";

type ProtectedPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ProtectedPage({ params }: ProtectedPageProps) {
  const { locale } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect(locale === "en" ? "/auth/login" : `/${locale}/auth/login`);
  }

  const t = await getTranslations("dashboard");

  return (
    <div className="flex h-svh w-full flex-col items-center justify-center gap-4 p-6 text-center">
      <LocaleSwitcher />
      <h1 className="text-2xl font-heading">{t("title")}</h1>
      <p className="text-muted-foreground">{t("subtitle")}</p>
      <p>
        {t("greeting", { email: data.claims.email ?? "unknown" })}
      </p>
      <LogoutButton />
    </div>
  );
}
