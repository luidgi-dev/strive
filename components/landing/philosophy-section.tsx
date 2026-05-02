import {
  LandingEyebrow,
  LandingSection,
  LandingSectionTitle,
} from "@/components/landing/landing-shell";

type PhilosophySectionProps = {
  eyebrow: string;
  title: string;
  paragraphs: string[];
};

export function PhilosophySection({
  eyebrow,
  title,
  paragraphs,
}: PhilosophySectionProps) {
  return (
    <LandingSection>
      <LandingEyebrow>{eyebrow}</LandingEyebrow>
      <LandingSectionTitle>{title}</LandingSectionTitle>
      <div className="space-y-5 font-sans text-base leading-relaxed text-foreground/80 md:text-lg">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </LandingSection>
  );
}
