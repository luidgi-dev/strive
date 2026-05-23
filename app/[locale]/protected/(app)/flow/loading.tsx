import { Skeleton } from "@/components/ui/skeleton";

export default function RhythmLoading() {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      {/* Day bar: title + date, then the coach line. */}
      <div className="flex flex-col gap-2 px-1 pb-1.5">
        <div className="flex items-baseline justify-between">
          <Skeleton className="h-6 w-[88px]" />
          <Skeleton className="h-3.5 w-[72px]" />
        </div>
        <Skeleton className="h-3.5 w-[110px]" />
      </div>

      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 shrink-0" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Skeleton className="h-4 w-[55%]" />
          <Skeleton className="h-3 w-[35%]" />
        </div>
        <Skeleton className="size-8 shrink-0 rounded-full" />
      </div>
      <Skeleton className="h-[5px] w-full rounded-full" />
    </div>
  );
}
