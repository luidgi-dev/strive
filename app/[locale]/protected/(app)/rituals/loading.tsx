import { Skeleton } from "@/components/ui/skeleton";

export default function RitualsLoading() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      <div className="flex items-center justify-between gap-3 px-1">
        <Skeleton className="h-7 w-[120px]" />
        <Skeleton className="h-[36px] w-[140px] rounded-full" />
      </div>

      <SkeletonSection rows={2} />
      <SkeletonSection rows={2} />

      <Skeleton className="mt-2 h-[46px] w-full rounded-xl border border-dashed border-muted-foreground/20 bg-transparent" />
    </div>
  );
}

function SkeletonSection({ rows }: { rows: number }) {
  return (
    <section className="flex flex-col gap-2">
      <Skeleton className="ml-1 h-3 w-20 rounded-sm" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </section>
  );
}

function SkeletonCard() {
  return (
    <div className="flex min-h-[44px] items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-3">
      <Skeleton className="size-9 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className="h-3.5 w-[140px]" />
        <Skeleton className="h-2.5 w-[90px]" />
      </div>
      <Skeleton className="size-4 shrink-0 rounded-full" />
    </div>
  );
}
