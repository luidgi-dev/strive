import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import {
  HelpSections,
  type HelpBlock,
  type HelpSection,
} from "@/components/help/help-sections";
import { locales, type Locale } from "@/lib/locales";
import { localeAlternates, localizedUrl } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

// Order shown on the page and in the table of contents. Install lives last: it
// is the least "in-app" part, so it does not sit between two product sections.
const SECTION_IDS = [
  "rhythm",
  "rituals",
  "momentum",
  "logging",
  "circles",
  "install",
] as const;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "help.meta" });
  const url = localizedUrl(locale as Locale, "/help");

  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: url, languages: localeAlternates("/help") },
    openGraph: {
      type: "article",
      url,
      title: t("title"),
      description: t("description"),
    },
  };
}

export default async function HelpPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "help" });

  const sections: HelpSection[] = SECTION_IDS.map((id) => {
    let blocks: HelpBlock[];
    if (id === "logging") {
      blocks = [
        { kind: "p", text: t("logging.intro") },
        { kind: "examples", items: t.raw("logging.examples") as string[] },
        { kind: "p", text: t("logging.after") },
        { kind: "note", text: t("logging.note") },
      ];
    } else if (id === "install") {
      blocks = [
        { kind: "p", text: t("install.intro") },
        {
          kind: "steps",
          items: t.raw("install.steps") as { label: string; text: string }[],
        },
        { kind: "p", text: t("install.after") },
      ];
    } else {
      blocks = (t.raw(`${id}.p`) as string[]).map((text) => ({
        kind: "p",
        text,
      }));
    }
    return { id, title: t(`${id}.title`), blocks };
  });

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-6 py-16 md:py-24">
        <p className="mb-6 flex items-center gap-2 font-sans text-xs font-medium tracking-wide text-muted-foreground">
          <span className="size-1.5 rounded-full bg-momentum" aria-hidden />
          {t("eyebrow")}
        </p>
        <h1 className="mb-4 font-heading text-4xl font-bold tracking-tight md:text-5xl">
          {t("title")}
        </h1>
        <p className="mb-10 max-w-xl font-sans text-lg leading-relaxed text-muted-foreground">
          {t("lede")}
        </p>

        <nav
          aria-label={t("tocLabel")}
          className="mb-10 flex flex-wrap gap-x-5 gap-y-1.5 border-y border-border py-4"
        >
          <span className="w-full font-sans text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {t("tocLabel")}
          </span>
          {SECTION_IDS.map((id) => (
            <a
              key={id}
              href={`#${id}`}
              className="font-sans text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t(`${id}.title`)}
            </a>
          ))}
        </nav>

        <HelpSections sections={sections} />
      </div>
    </main>
  );
}
