import Link from "next/link";
import { Button } from "@/components/ui/button";

type CtaFinalSectionProps = {
  headline: string;
  ctaLabel: string;
  authHref: string;
  helpHref: string;
  privacyHref: string;
  termsHref: string;
};

export function CtaFinalSection({
  headline,
  ctaLabel,
  authHref,
  helpHref,
  privacyHref,
  termsHref,
}: CtaFinalSectionProps) {
  return (
    <>
      <section className="flex flex-col items-center justify-center px-6 py-28 text-center md:py-36">
        <h2 className="mb-10 font-heading text-4xl font-bold tracking-tight md:text-6xl">
          {headline}
        </h2>
        <Button className="h-14 rounded-full px-10 text-base font-medium transition-transform hover:scale-[1.02] active:scale-[0.98]">
          <Link href={authHref} prefetch={false}>
            {ctaLabel}
          </Link>
        </Button>
      </section>

      <footer className="border-t border-border px-6 py-5 text-center text-xs text-muted-foreground">
        <span>
          © 2026 Strive · Built by{" "}
          {/* noreferrer drops the Referer header, so ?ref is what attributes
              the visit on the portfolio. */}
          <Link
            href="https://luidgi.dev?ref=strive"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center underline decoration-transparent underline-offset-4 transition-colors hover:text-foreground hover:decoration-border"
          >
            luidgi.dev
          </Link>
          {" · "}
          <Link
            href={privacyHref}
            className="inline-flex min-h-11 items-center underline decoration-transparent underline-offset-4 transition-colors hover:text-foreground hover:decoration-border"
          >
            Privacy
          </Link>
          {" · "}
          <Link
            href={termsHref}
            className="inline-flex min-h-11 items-center underline decoration-transparent underline-offset-4 transition-colors hover:text-foreground hover:decoration-border"
          >
            Terms
          </Link>
          {" · "}
          <Link
            href={helpHref}
            className="inline-flex min-h-11 items-center underline decoration-transparent underline-offset-4 transition-colors hover:text-foreground hover:decoration-border"
          >
            Help
          </Link>
        </span>
      </footer>
    </>
  );
}
