import { Compass } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { ErrorPage } from "@/components/errors/error-page";
import { ErrorState } from "@/components/errors/error-state";
import { ButtonLink } from "@/components/ui/button-link";
import { homePath, type Locale } from "@/lib/locales";

/** 404 content, shared by the localized and the root `not-found.tsx`. */
export async function NotFoundState({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "error" });

  return (
    <ErrorPage>
      <ErrorState
        code="404"
        className="min-h-0 pb-0"
        title={t("notFound.title")}
        body={t("notFound.body")}
        icon={<Compass />}
      >
        {/* Landing redirects signed-in users to Rhythm (proxy.ts). */}
        <ButtonLink
          href={homePath(locale)}
          size="lg"
          className="min-h-[44px] px-5"
        >
          {t("back")}
        </ButtonLink>
      </ErrorState>
    </ErrorPage>
  );
}
