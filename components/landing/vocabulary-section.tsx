import type { LandingVocabularyItem } from "@/components/landing/types";
import {
  LandingEyebrow,
  LandingSection,
  LandingSectionTitle,
} from "@/components/landing/landing-shell";

type VocabularySectionProps = {
  eyebrow: string;
  title: string;
  items: LandingVocabularyItem[];
};

export function VocabularySection({
  eyebrow,
  title,
  items,
}: VocabularySectionProps) {
  return (
    <LandingSection>
      <LandingEyebrow>{eyebrow}</LandingEyebrow>
      <LandingSectionTitle>{title}</LandingSectionTitle>
      <div className="space-y-6">
        {items.map((item) => (
          <div key={item.to} className="group flex items-start gap-6">
            <span className="min-w-[120px] pt-0.5 text-right font-sans text-sm text-muted-foreground/60 line-through">
              {item.from}
            </span>
            <div>
              <span className="font-heading text-lg font-bold">{item.to}</span>
              <p className="mt-0.5 font-sans text-sm text-muted-foreground">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </LandingSection>
  );
}
