import { cn } from "@/lib/utils";

export function LandingDivider() {
  return (
    <div className="flex justify-center py-4">
      <div className="h-px w-12 bg-border" aria-hidden />
    </div>
  );
}

type LandingSectionProps = {
  children: React.ReactNode;
  className?: string;
};

export function LandingSection({ children, className }: LandingSectionProps) {
  return (
    <section
      className={cn("mx-auto max-w-2xl px-6 py-16 md:py-24", className)}
    >
      {children}
    </section>
  );
}

type LandingEyebrowProps = {
  children: React.ReactNode;
};

export function LandingEyebrow({ children }: LandingEyebrowProps) {
  return (
    <p className="mb-8 font-sans text-xs font-medium tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}

type LandingSectionTitleProps = {
  children: React.ReactNode;
};

export function LandingSectionTitle({ children }: LandingSectionTitleProps) {
  return (
    <h2 className="mb-8 font-heading text-3xl font-bold tracking-tight md:mb-10 md:text-4xl">
      {children}
    </h2>
  );
}
