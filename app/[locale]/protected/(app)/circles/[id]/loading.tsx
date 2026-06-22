import { Skeleton } from "@/components/ui/skeleton";

export default function CircleDetailLoading() {
  return (
    <div className="flex flex-col gap-[18px]" aria-hidden>
      <div className="-mx-2 flex items-center justify-between">
        <Skeleton className="size-11 rounded-full" />
        <Skeleton className="size-11 rounded-full" />
      </div>

      <div className="flex flex-col gap-3 px-1 pb-1">
        <Skeleton className="h-6 w-[150px]" />
        <Skeleton className="h-3.5 w-[200px]" />
        <Skeleton className="mt-1 h-8 w-[160px] rounded-full" />
      </div>

      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-[90px]" />
        <Skeleton className="h-[120px] rounded-2xl border border-border bg-card" />
      </div>

      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-[110px]" />
        <Skeleton className="h-[140px] rounded-2xl border border-border bg-card" />
      </div>
    </div>
  );
}
