import { Skeleton } from "@/components/ui/skeleton";

export default function RitualDetailLoading() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      <div className="-mx-2 flex items-center justify-between">
        <Skeleton className="size-11 rounded-full" />
        <Skeleton className="size-11 rounded-full" />
      </div>

      <div className="flex flex-col gap-2 px-1 pb-1">
        <Skeleton className="h-6 w-[160px]" />
        <Skeleton className="h-3.5 w-[100px]" />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Skeleton className="h-[88px] rounded-xl border border-border bg-card" />
        <Skeleton className="h-[88px] rounded-xl border border-border bg-card" />
      </div>

      <Skeleton className="h-[260px] rounded-xl border border-border bg-card" />
    </div>
  );
}
