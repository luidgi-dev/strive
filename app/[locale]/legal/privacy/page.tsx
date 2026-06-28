import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { LegalList, LegalSection, LegalShell } from "@/components/legal/legal-prose";
import { locales } from "@/lib/locales";

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.privacy" });
  return { title: t("title") };
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("legal");
  const tp = await getTranslations("legal.privacy");
  const dataItems = tp.raw("dataItems") as string[];
  const processorsItems = tp.raw("processorsItems") as string[];

  return (
    <LegalShell
      backLabel={t("backHome")}
      title={tp("title")}
      lastUpdated={tp("lastUpdated")}
    >
      <p>{tp("intro")}</p>

      <LegalSection title={tp("controllerTitle")}>
        <p>{tp("controllerBody")}</p>
      </LegalSection>

      <LegalSection title={tp("dataTitle")}>
        <p>{tp("dataIntro")}</p>
        <LegalList items={dataItems} />
      </LegalSection>

      <LegalSection title={tp("useTitle")}>
        <p>{tp("useBody")}</p>
      </LegalSection>

      <LegalSection title={tp("legalBasisTitle")}>
        <p>{tp("legalBasisBody")}</p>
      </LegalSection>

      <LegalSection title={tp("retentionTitle")}>
        <p>{tp("retentionBody")}</p>
      </LegalSection>

      <LegalSection title={tp("rightsTitle")}>
        <p>{tp("rightsBody")}</p>
      </LegalSection>

      <LegalSection title={tp("processorsTitle")}>
        <p>{tp("processorsIntro")}</p>
        <LegalList items={processorsItems} />
        <p className="text-muted-foreground">{tp("processorsOutro")}</p>
      </LegalSection>

      <LegalSection title={tp("cookiesTitle")}>
        <p>{tp("cookiesBody")}</p>
      </LegalSection>

      <LegalSection title={tp("deletionTitle")}>
        <p>{tp("deletionBody")}</p>
      </LegalSection>

      <LegalSection title={tp("changesTitle")}>
        <p>{tp("changesBody")}</p>
      </LegalSection>

      <LegalSection title={tp("contactTitle")}>
        <p>{tp("contactBody")}</p>
      </LegalSection>
    </LegalShell>
  );
}
