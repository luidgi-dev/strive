import { getTranslations } from "next-intl/server";

import { FaqAccordion, type FaqItem } from "@/components/landing/faq-accordion";
import {
  LandingEyebrow,
  LandingSection,
  LandingSectionTitle,
} from "@/components/landing/landing-shell";

/**
 * Conversion FAQ at the bottom of the landing, just above the final CTA.
 * Localized (EN/FR) and paired with FAQPage JSON-LD so Google can surface the
 * answers as rich snippets. The structured data is built from the same items
 * the accordion renders, keeping the markup and the visible content in sync.
 */
export async function FaqSection() {
  const t = await getTranslations("landing.faq");
  const items = t.raw("items") as FaqItem[];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <LandingSection>
      <div className="text-center">
        <LandingEyebrow>{t("eyebrow")}</LandingEyebrow>
        <LandingSectionTitle>{t("title")}</LandingSectionTitle>
      </div>
      <FaqAccordion items={items} />
      {/* JSON-LD is inert data, not executable script. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </LandingSection>
  );
}
