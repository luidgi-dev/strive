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
  const t = await getTranslations({ locale, namespace: "legal.terms" });
  return { title: t("title") };
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("legal");
  const tt = await getTranslations("legal.terms");
  const acceptableUseItems = tt.raw("acceptableUseItems") as string[];

  return (
    <LegalShell
      backLabel={t("backHome")}
      title={tt("title")}
      lastUpdated={tt("lastUpdated")}
    >
      <p>{tt("intro")}</p>

      <LegalSection title={tt("acceptanceTitle")}>
        <p>{tt("acceptanceBody")}</p>
      </LegalSection>

      <LegalSection title={tt("accountTitle")}>
        <p>{tt("accountBody")}</p>
      </LegalSection>

      <LegalSection title={tt("acceptableUseTitle")}>
        <p>{tt("acceptableUseIntro")}</p>
        <LegalList items={acceptableUseItems} />
      </LegalSection>

      <LegalSection title={tt("aiTitle")}>
        <p>{tt("aiBody")}</p>
      </LegalSection>

      <LegalSection title={tt("availabilityTitle")}>
        <p>{tt("availabilityBody")}</p>
      </LegalSection>

      <LegalSection title={tt("ipTitle")}>
        <p>{tt("ipBody")}</p>
      </LegalSection>

      <LegalSection title={tt("terminationTitle")}>
        <p>{tt("terminationBody")}</p>
      </LegalSection>

      <LegalSection title={tt("liabilityTitle")}>
        <p>{tt("liabilityBody")}</p>
      </LegalSection>

      <LegalSection title={tt("internationalTitle")}>
        <p>{tt("internationalBody")}</p>
      </LegalSection>

      <LegalSection title={tt("changesTitle")}>
        <p>{tt("changesBody")}</p>
      </LegalSection>

      <LegalSection title={tt("lawTitle")}>
        <p>{tt("lawBody")}</p>
      </LegalSection>

      <LegalSection title={tt("contactTitle")}>
        <p>{tt("contactBody")}</p>
      </LegalSection>
    </LegalShell>
  );
}
