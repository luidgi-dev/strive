import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { defaultLocale } from "@/i18n";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function Home({ params }: HomePageProps) {
  const { locale } = await params;
  const tHome = await getTranslations("home");
  const tCommon = await getTranslations("common");
  const authPath = locale === defaultLocale ? "/auth/login" : `/${locale}/auth/login`;

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-6 text-center">
      <div className="max-w-2xl space-y-10">
        <div className="flex flex-col items-center mb-8">
          <div className="overflow-hidden rounded-[22%] shadow-lg ring-1 ring-black/5">
            <Image
              src="/icon.svg"
              alt={`${tCommon("appName")} logo`}
              width={100}
              height={100}
              className="aspect-square object-cover"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="font-sora text-6xl font-bold tracking-tight sm:text-7xl">
            {tCommon("appName")}
          </h1>
          <p className="font-dm-sans text-xl text-muted-foreground sm:text-2xl">
            {tHome("tagline")} <br className="hidden sm:block" />
            <span className="text-foreground font-medium">
              {tHome("taglineEmphasis")}
            </span>
          </p>
        </div>

        <div className="pt-4">
          <Button
            size="lg"
            className="h-14 rounded-full px-10 text-lg font-medium transition-transform hover:scale-105 active:scale-95"
          >
            <Link href={authPath}>{tHome("cta")}</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
