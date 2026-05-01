import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { defaultLocale } from "@/i18n";

type ConfirmedPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ConfirmedPage({ params }: ConfirmedPageProps) {
  const { locale } = await params;
  const t = await getTranslations("auth");
  const tCommon = await getTranslations("common");
  const protectedHref = locale === defaultLocale ? "/protected" : `/${locale}/protected`;

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-8">
        <div className="w-fit mx-auto overflow-hidden rounded-2xl shadow-sm mb-4">
          <Image
            src="/icon.svg"
            alt={`${tCommon("appName")} logo`}
            width={80}
            height={80}
            className="block dark:invert"
          />
        </div>

        <div className="space-y-4">
          <h1 className="font-sora text-4xl font-bold tracking-tight">
            {t("confirmedTitle")}
          </h1>
          <p className="font-dm-sans text-lg text-muted-foreground leading-relaxed">
            {t("confirmedDescription")}
          </p>
        </div>

        <div className="pt-4">
          <Button size="lg" className="h-12 rounded-full px-10 font-medium">
            <Link href={protectedHref}>{t("openApp")}</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
