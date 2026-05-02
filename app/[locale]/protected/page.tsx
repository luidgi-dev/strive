import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";

import {
  AiConversationSection,
  HeroSection,
  LandingDivider,
  PhilosophySection,
  RitualVisualizationSection,
  VocabularySection,
  LandingFooter,
} from "@/components/landing";
import type { LandingContent } from "@/components/landing/types";
import { defaultLocale } from "@/i18n";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function Home({ params }: HomePageProps) {
  const { locale } = await params;
  const messages = await getMessages();
  const landing = messages.landing as LandingContent | undefined;

  if (!landing) {
    notFound();
  }

  const authPath =
    locale === defaultLocale ? "/auth/login" : `/${locale}/auth/login`;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <HeroSection
        logoAlt={landing.meta.logoAlt}
        title={landing.hero.title}
        description={landing.hero.description}
        ctaLabel={landing.hero.cta}
        authHref={authPath}
        isAvailable={false} 
    />

      <LandingDivider />
      <PhilosophySection
        eyebrow={landing.philosophy.eyebrow}
        title={landing.philosophy.title}
        paragraphs={landing.philosophy.paragraphs}
      />

      <LandingDivider />
      <AiConversationSection
        eyebrow={landing.intelligence.eyebrow}
        title={landing.intelligence.title}
        paragraphs={landing.intelligence.paragraphs}
        messages={landing.intelligence.messages}
      />

      <LandingDivider />
      <VocabularySection
        eyebrow={landing.vocabulary.eyebrow}
        title={landing.vocabulary.title}
        items={landing.vocabulary.items}
      />

      <LandingDivider />
      <RitualVisualizationSection
        eyebrow={landing.visualization.eyebrow}
        title={landing.visualization.title}
        card={landing.visualization.card}
      />

      <LandingDivider />
      <LandingFooter 
        thanks={landing.footer.thanks}
        cta={landing.footer.cta}
      />

    </main>
  );
}
