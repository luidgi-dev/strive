import { ChevronLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/lib/i18n/navigation";

export default async function SettingsLoading() {
  const t = await getTranslations("settings");

  return (
    <div className="-mx-6 -mb-32 -mt-4 flex flex-1 flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-1 bg-background/80 px-2 backdrop-blur-md">
        <Link
          href="/protected/flow"
          aria-label={t("back")}
          className="inline-flex size-11 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="font-heading text-base font-semibold tracking-tight">
          {t("title")}
        </h1>
      </header>

      <div className="mx-auto flex w-full max-w-md flex-col gap-8 px-6 pb-16 pt-2">
        <section className="flex flex-col items-center gap-4 py-6" aria-hidden>
          <Skeleton className="size-28 rounded-full" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-40" />
        </section>

        <SkeletonSection rows={3} />
        <SkeletonSection rows={3} />

        <section className="flex flex-col gap-3" aria-hidden>
          <Skeleton className="h-11 w-full" />
        </section>
      </div>
    </div>
  );
}

function SkeletonSection({ rows }: { rows: number }) {
  return (
    <section className="flex flex-col gap-3" aria-hidden>
      <Skeleton className="h-3 w-24 rounded-sm" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <div className="flex min-h-[44px] items-center justify-between gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          {i < rows - 1 ? <div className="h-px bg-border" /> : null}
        </div>
      ))}
    </section>
  );
}
