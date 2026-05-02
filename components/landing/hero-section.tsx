import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type HeroSectionProps = {
  logoAlt: string;
  title: string;
  description: string;
  ctaLabel: string;
  authHref: string;
  isAvailable?: boolean;
};

export function HeroSection({
  logoAlt,
  title,
  description,
  ctaLabel,
  authHref,
  isAvailable = false,
}: HeroSectionProps) {
  return (
    <section className="flex min-h-[85vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-12 overflow-hidden rounded-2xl shadow-sm ring-1 ring-border/8">
        <Image
          src="/strive-logo.jpeg"
          alt={logoAlt}
          width={80}
          height={80}
          className="size-20 object-cover"
          priority
        />
      </div>
      <h1 className="mb-6 font-heading text-5xl font-bold tracking-tight md:text-7xl">
        {title}
      </h1>
      <p className="max-w-md font-sans text-lg text-muted-foreground md:text-xl">
        {description}
      </p>
      <div className="mt-12">
        {isAvailable ? (
          <Button size="lg" className="h-14 px-10 rounded-full text-lg">
            <Link href={authHref}>{ctaLabel}</Link>
          </Button>
        ) : (
          <Button disabled size="lg" className="h-14 px-10 rounded-full text-lg">
            {ctaLabel}
          </Button>
        )}
      </div>
    </section>
  );
}
