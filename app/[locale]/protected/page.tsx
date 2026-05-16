import { redirect } from "next/navigation";

import { defaultLocale } from "@/i18n";

type ProtectedHomeProps = {
  params: Promise<{ locale: string }>;
};

export default async function ProtectedHome({ params }: ProtectedHomeProps) {
  const { locale } = await params;
  const target =
    locale === defaultLocale
      ? "/protected/flow"
      : `/${locale}/protected/flow`;
  redirect(target);
}
