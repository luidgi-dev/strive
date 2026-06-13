import { ChevronLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/lib/i18n/navigation";

export default async function InsightsLoading() {
  const [t, tSettings] = await Promise.all([
    getTranslations("insights"),
    getTranslations("settings"),
  ]);

  return (
    <div className="-mx-6 -mb-32 -mt-4 flex flex-1 flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-1 bg-background px-2">
        <Link
          href="/protected/settings"
          aria-label={tSettings("back")}
          className="inline-flex size-11 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="font-heading text-base font-semibold tracking-tight">
          {t("title")}
        </h1>
      </header>

      <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-6 pb-16 pt-2">
        <div className="flex flex-col gap-4" aria-hidden>
          {/* Week / Month toggle */}
          <div className="grid grid-cols-2 gap-0.5 rounded-lg bg-muted p-0.5">
            <Skeleton className="h-8 rounded-md" />
            <Skeleton className="h-8 rounded-md" />
          </div>

          {/* "Updated N days ago" */}
          <Skeleton className="ml-1 h-3.5 w-28" />

          {/* Cards */}
          <div className="flex flex-col gap-2.5">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>

        <Skeleton className="mx-auto h-3 w-52" />
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4" aria-hidden>
      <Skeleton className="h-2.5 w-20 rounded-sm" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <div className="flex items-center justify-between gap-3 pt-1">
        <Skeleton className="h-2.5 w-20 rounded-sm" />
        <Skeleton className="h-7 w-16 rounded-full" />
      </div>
    </div>
  );
}
