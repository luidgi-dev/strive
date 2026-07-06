import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import {
  CtaFinalSection,
  FaqSection,
  HeroSection,
  LandingDivider,
  PhilosophySection,
  PillarsSection,
  ScreenshotsSection,
  VocabularySection,
} from "@/components/landing";
import { PwaInstallNotice } from "@/components/pwa-install-notice";
import { defaultLocale, locales, type Locale } from "@/lib/locales";
import { localeAlternates, localizedUrl } from "@/lib/seo";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

// OpenGraph locale tags want the `xx_XX` form, not the bare BCP-47 code.
const ogLocales: Record<Locale, string> = {
  en: "en_US",
  fr: "fr_FR",
};

// The site-wide generated card (app/opengraph-image.tsx). Referenced explicitly
// because a page-level `openGraph` override otherwise drops the file-convention
// image. URL is resolved against `metadataBase` from the root layout.
const ogImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Strive, a calm habit tracker",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing.meta" });
  const title = t("title");
  const description = t("description");
  const url = localizedUrl(locale as Locale);

  return {
    title,
    description,
    keywords: t.raw("keywords") as string[],
    alternates: {
      canonical: url,
      languages: localeAlternates(),
    },
    openGraph: {
      type: "website",
      siteName: "Strive",
      locale: ogLocales[locale as Locale] ?? ogLocales.en,
      url,
      title,
      description,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage.url],
    },
  };
}

const philosophyParagraphs = [
  "We do not worship hustle. We do not celebrate grind. Strive comes from one simple belief: lasting progress grows from calm, not pressure.",
  "We celebrate momentum, the quiet strength that settles in when you honor your own rhythm. Every ritual you log traces an arc you can see over time.",
  "No guilt. No aggressive reminders. Just space to build, day by day, with intention.",
];

const vocabularyItems = [
  {
    from: "Habit",
    to: "Ritual",
    description: "Every recurring action deserves respect.",
  },
  {
    from: "Series, streak",
    to: "Rhythm",
    description: "Your personal cadence, not a race.",
  },
  {
    from: "Score",
    to: "Momentum",
    description: "A signal of progress, not a verdict.",
  },
  {
    from: "Failure",
    to: "Missed",
    description: "A softer day. Tomorrow is new.",
  },
  {
    from: "Skip",
    to: "Rest",
    description: "An intentional pause, not walking away.",
  },
];

export default async function Home({ params }: HomePageProps) {
  const { locale } = await params;
  const authHref =
    locale === defaultLocale ? "/auth/sign-up" : `/${locale}/auth/sign-up`;
  const privacyHref =
    locale === defaultLocale
      ? "/legal/privacy"
      : `/${locale}/legal/privacy`;
  const termsHref =
    locale === defaultLocale ? "/legal/terms" : `/${locale}/legal/terms`;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <PwaInstallNotice />

      <HeroSection
        logoAlt="Strive logo"
        title="Strive"
        tagline={
          <>
            An app for people who prefer{" "}
            <span className="font-semibold text-foreground">
              consistency over intensity
            </span>
            .
          </>
        }
        subline="A calm habit tracker built on momentum, not streaks."
        ctaLabel="Get early access"
        authHref={authHref}
        demoCtaLabel="Try the demo"
      />

      <LandingDivider />
      <ScreenshotsSection
        eyebrow="See it in action"
        title="A calm dashboard for your week."
        items={[
          {
            title: "Rhythm",
            caption: "Today's rituals at a glance.",
            alt: "Strive Rhythm screen showing today's rituals at a glance",
          },
          {
            title: "The Arc",
            caption: "Twelve weeks of consistency, visualized.",
            alt: "Strive Arc visualizing twelve weeks of consistency",
          },
          {
            title: "AI chat",
            caption: "Log a ritual in your own words.",
            alt: "Strive AI chat logging a ritual in natural language",
          },
        ]}
      />

      <LandingDivider />
      <PillarsSection eyebrow="Why Strive" title="Three quiet ideas." />

      <LandingDivider />
      <PhilosophySection
        eyebrow="Philosophy"
        title="A calm coach, not a drill sergeant."
        paragraphs={philosophyParagraphs}
      />

      <LandingDivider />
      <VocabularySection
        eyebrow="Vocabulary"
        title="Words matter."
        items={vocabularyItems}
      />

      <LandingDivider />
      <FaqSection />

      <CtaFinalSection
        headline="Find your rhythm."
        ctaLabel="Get early access"
        authHref={authHref}
        privacyHref={privacyHref}
        termsHref={termsHref}
      />
    </main>
  );
}
