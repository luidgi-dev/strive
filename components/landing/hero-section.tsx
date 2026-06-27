import Image from "next/image";
import Link from "next/link";

import { signInAsDemo } from "@/app/[locale]/actions";
import { Button } from "@/components/ui/button";

type HeroSectionProps = {
  logoAlt: string;
  title: string;
  tagline: React.ReactNode;
  ctaLabel: string;
  authHref: string;
  /** Secondary "Try the demo" CTA. Omit to hide the demo entry point entirely. */
  demoCtaLabel?: string;
};

export function HeroSection({
  logoAlt,
  title,
  tagline,
  ctaLabel,
  authHref,
  demoCtaLabel,
}: HeroSectionProps) {
  return (
    <section className="flex min-h-[85vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-12 overflow-hidden rounded-2xl shadow-sm ring-1 ring-border/8">
        <Image
          src="/strive-app-dark.svg"
          alt={logoAlt}
          width={80}
          height={80}
          className="hidden size-20 object-cover dark:block"
          priority
        />
        <Image
          src="/strive-app-light.svg"
          alt={logoAlt}
          width={80}
          height={80}
          className="block size-20 object-cover dark:hidden"
          priority
        />
      </div>
      <h1 className="mb-6 font-heading text-5xl font-bold tracking-tight md:text-7xl">
        {title}
      </h1>
      <p className="max-w-md font-sans text-lg leading-relaxed text-muted-foreground md:text-xl">
        {tagline}
      </p>
      <div className="mt-12 flex flex-col items-center gap-5">
        <Button className="h-14 rounded-full px-10 text-base font-medium transition-transform hover:scale-[1.02] active:scale-[0.98]">
          <Link href={authHref}>{ctaLabel}</Link>
        </Button>
        {demoCtaLabel ? (
          <form action={signInAsDemo}>
            <Button
              type="submit"
              variant="ghost"
              className="h-12 rounded-full border border-dashed border-border px-6 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
            >
              {demoCtaLabel}
            </Button>
          </form>
        ) : null}
      </div>
    </section>
  );
}
