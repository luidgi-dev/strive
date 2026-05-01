import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { defaultLocale } from "@/i18n";

type SignUpSuccessPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function SignUpSuccessPage({ params }: SignUpSuccessPageProps) {
  const { locale } = await params;
  const t = await getTranslations("auth");
  const logoAlt = "Strive logo";
  const loginHref = locale === defaultLocale ? "/auth/login" : `/${locale}/auth/login`;

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md space-y-8">
        <div className="w-fit mx-auto overflow-hidden rounded-2xl shadow-sm border border-border/70">
          <Image src="/icon.svg" alt={logoAlt} width={64} height={64} className="block" />
        </div>

        <Card className="border-border bg-card shadow-lg">
          <CardHeader className="space-y-4 p-6 pt-8 text-center">
            <CardTitle className="font-sora text-3xl font-bold tracking-tight">
              {t("signupSuccessTitle")}
            </CardTitle>
            <CardDescription className="font-dm-sans text-base leading-relaxed text-muted-foreground">
              {t("signupSuccessDescription")}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 pt-0 text-center space-y-6">
            <p className="font-dm-sans text-sm text-muted-foreground leading-relaxed">
              {t("signupSuccessBody")}
            </p>

            <div className="pt-2">
              <p className="font-dm-sans text-xs text-muted-foreground/60 italic">
                {t("signupSuccessHint")}
              </p>
            </div>

            <Link href={loginHref} className="text-sm text-primary underline underline-offset-4">
              {t("backToLogin")}
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
