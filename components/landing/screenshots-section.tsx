import Image from "next/image";
import { type LucideIcon, List, LayoutGrid, MessageCircle } from "lucide-react";
import {
  LandingEyebrow,
  LandingSectionTitle,
} from "@/components/landing/landing-shell";

type Screenshot = {
  icon: LucideIcon;
  title: string;
  caption: string;
  preview?: { light: string; dark: string };
};

const screenshots: Screenshot[] = [
  {
    icon: List,
    title: "Rhythm",
    caption: "Today's rituals at a glance.",
    preview: {
      light: "/wireframes/rhythm-light.png",
      dark: "/wireframes/rhythm-dark.png",
    },
  },
  {
    icon: LayoutGrid,
    title: "The Arc",
    caption: "Twelve weeks of consistency, visualized.",
  },
  {
    icon: MessageCircle,
    title: "AI chat",
    caption: "Log a ritual in your own words.",
  },
];

type ScreenshotsSectionProps = {
  eyebrow: string;
  title: string;
};

export function ScreenshotsSection({
  eyebrow,
  title,
}: ScreenshotsSectionProps) {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16 md:py-24">
      <div className="text-center">
        <LandingEyebrow>{eyebrow}</LandingEyebrow>
        <LandingSectionTitle>{title}</LandingSectionTitle>
      </div>

      <div className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:px-0 md:pb-0">
        {screenshots.map(({ icon: Icon, title: itemTitle, caption, preview }) => (
          <figure
            key={itemTitle}
            className="flex w-64 shrink-0 snap-center flex-col gap-4 md:w-auto"
          >
            <div className="relative aspect-[7/12] overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-muted to-card">
              {preview ? (
                <>
                  {/* Screen area — inset so the gradient acts as a thin bezel.
                      bg-background matches the wireframe's own background so the
                      tiny letterbox from object-contain stays invisible. */}
                  <div className="absolute inset-2 overflow-hidden rounded-2xl bg-background">
                    <Image
                      src={preview.light}
                      alt={`${itemTitle} preview`}
                      fill
                      sizes="(min-width: 768px) 33vw, 256px"
                      className="object-contain dark:hidden"
                    />
                    <Image
                      src={preview.dark}
                      alt={`${itemTitle} preview`}
                      fill
                      sizes="(min-width: 768px) 33vw, 256px"
                      className="hidden object-contain dark:block"
                    />
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Icon className="size-14 text-muted-foreground/40" />
                  <span className="absolute bottom-4 font-sans text-[10px] uppercase tracking-widest text-muted-foreground/50">
                    placeholder
                  </span>
                </div>
              )}
            </div>
            <figcaption>
              <p className="font-heading text-base font-bold">{itemTitle}</p>
              <p className="mt-1 font-sans text-sm text-muted-foreground">
                {caption}
              </p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
