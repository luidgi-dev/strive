import {
  CtaFinalSection,
  HeroSection,
  LandingDivider,
  PhilosophySection,
  PillarsSection,
  ScreenshotsSection,
  VocabularySection,
} from "@/components/landing";
import { PwaInstallNotice } from "@/components/pwa-install-notice";
import { defaultLocale } from "@/lib/locales";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

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
        ctaLabel="Get early access"
        authHref={authHref}
      />

      <LandingDivider />
      <ScreenshotsSection
        eyebrow="See it in action"
        title="A calm dashboard for your week."
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

      <CtaFinalSection
        headline="Find your rhythm."
        ctaLabel="Get early access"
        authHref={authHref}
      />
    </main>
  );
}
