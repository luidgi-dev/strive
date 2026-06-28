import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/lib/i18n/navigation";
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
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-2xl px-6 py-16">
        <Link
          href="/"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {t("backHome")}
        </Link>

        <h1 className="mt-6 font-heading text-3xl font-bold tracking-tight">
          {tp("title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{tp("lastUpdated")}</p>

        <div className="mt-8 flex flex-col gap-8 text-sm leading-relaxed">
          <p>{tp("intro")}</p>

          <Section title={tp("controllerTitle")}>
            <p>{tp("controllerBody")}</p>
          </Section>

          <Section title={tp("dataTitle")}>
            <p>{tp("dataIntro")}</p>
            <List items={dataItems} />
          </Section>

          <Section title={tp("useTitle")}>
            <p>{tp("useBody")}</p>
          </Section>

          <Section title={tp("legalBasisTitle")}>
            <p>{tp("legalBasisBody")}</p>
          </Section>

          <Section title={tp("retentionTitle")}>
            <p>{tp("retentionBody")}</p>
          </Section>

          <Section title={tp("rightsTitle")}>
            <p>{tp("rightsBody")}</p>
          </Section>

          <Section title={tp("processorsTitle")}>
            <p>{tp("processorsIntro")}</p>
            <List items={processorsItems} />
            <p className="text-muted-foreground">{tp("processorsOutro")}</p>
          </Section>

          <Section title={tp("cookiesTitle")}>
            <p>{tp("cookiesBody")}</p>
          </Section>

          <Section title={tp("deletionTitle")}>
            <p>{tp("deletionBody")}</p>
          </Section>

          <Section title={tp("changesTitle")}>
            <p>{tp("changesBody")}</p>
          </Section>

          <Section title={tp("contactTitle")}>
            <p>{tp("contactBody")}</p>
          </Section>
        </div>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-heading text-lg font-semibold tracking-tight">
        {title}
      </h2>
      {children}
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="flex list-disc flex-col gap-1.5 pl-5 text-muted-foreground">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
