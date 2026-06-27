import Link from "next/link";
import { Button } from "@/components/ui/button";

type CtaFinalSectionProps = {
  headline: string;
  ctaLabel: string;
  authHref: string;
};

export function CtaFinalSection({
  headline,
  ctaLabel,
  authHref,
}: CtaFinalSectionProps) {
  return (
    <>
      <section className="flex flex-col items-center justify-center px-6 py-28 text-center md:py-36">
        <h2 className="mb-10 font-heading text-4xl font-bold tracking-tight md:text-6xl">
          {headline}
        </h2>
        <Button className="h-14 rounded-full px-10 text-base font-medium transition-transform hover:scale-[1.02] active:scale-[0.98]">
          <Link href={authHref}>{ctaLabel}</Link>
        </Button>
      </section>

      <footer className="border-t border-border px-6 py-8 text-center text-xs text-muted-foreground">
        <span>
          © 2026 Strive · Built by{" "}
          <Link
            href="https://github.com/luidgi-dev"
            target="_blank"
            rel="noopener noreferrer"
            className="border-b border-transparent transition-colors hover:border-border hover:text-foreground"
          >
            Luidgi
          </Link>
        </span>
      </footer>
    </>
  );
}
