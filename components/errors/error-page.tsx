import type { ReactNode } from "react";

import { StriveLogo } from "@/components/ui/strive-logo";

/**
 * Full-page shell for error pages rendered outside the app layout (404, public
 * 500): brand header, content centered in the viewport. In-app errors skip it,
 * the app header and nav are already there.
 */
export function ErrorPage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-14 items-center gap-2.5 px-5">
        <StriveLogo size={28} />
        <span
          aria-hidden
          className="font-heading text-xl font-bold tracking-tight text-foreground"
        >
          Strive
        </span>
      </header>
      {/* Bottom padding mirrors the header height so the content sits at the true center. */}
      <main className="flex flex-1 flex-col justify-center pb-14">
        {children}
      </main>
    </div>
  );
}
