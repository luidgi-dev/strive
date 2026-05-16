import { type LucideIcon, Repeat, TrendingUp, Zap } from "lucide-react";
import {
  LandingEyebrow,
  LandingSection,
  LandingSectionTitle,
} from "@/components/landing/landing-shell";

type Pillar = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const pillars: Pillar[] = [
  {
    icon: Repeat,
    title: "Flexible targets",
    description: "Miss a day. Still win the week.",
  },
  {
    icon: Zap,
    title: "Zero-friction logging",
    description: "One tap. Or just tell the AI.",
  },
  {
    icon: TrendingUp,
    title: "Momentum, not streaks",
    description: "Progress that decays slowly, never resets to zero.",
  },
];

type PillarsSectionProps = {
  eyebrow: string;
  title: string;
};

export function PillarsSection({ eyebrow, title }: PillarsSectionProps) {
  return (
    <LandingSection className="max-w-3xl">
      <LandingEyebrow>{eyebrow}</LandingEyebrow>
      <LandingSectionTitle>{title}</LandingSectionTitle>

      <div className="grid gap-10 md:grid-cols-3 md:gap-8">
        {pillars.map(({ icon: Icon, title: pillarTitle, description }) => (
          <div key={pillarTitle} className="flex flex-col gap-3">
            <Icon className="size-7 text-foreground/85" />
            <h3 className="font-heading text-lg font-bold">{pillarTitle}</h3>
            <p className="font-sans text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
        ))}
      </div>
    </LandingSection>
  );
}
