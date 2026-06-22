import { Skeleton } from "@/components/ui/skeleton";

export default function CirclesLoading() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      <div className="flex items-center justify-between gap-3 px-1">
        <Skeleton className="h-7 w-[120px]" />
        <Skeleton className="h-[36px] w-[120px] rounded-full" />
      </div>

      <section className="flex flex-col gap-2">
        <Skeleton className="ml-1 h-3 w-20 rounded-sm" />
        <div className="flex flex-col gap-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </section>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-[18px]">
      <div className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-[130px]" />
          <Skeleton className="h-3 w-[180px]" />
        </div>
        <div className="flex -space-x-2">
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="size-8 rounded-full" />
        </div>
      </div>
      <div className="flex gap-1.5">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-10 rounded-full" />
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border pt-3.5">
        <Skeleton className="h-3 w-[120px]" />
        <Skeleton className="h-3 w-[90px]" />
      </div>
    </div>
  );
}
