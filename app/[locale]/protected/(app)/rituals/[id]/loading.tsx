export default function RitualDetailLoading() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      <div className="-mx-2 flex items-center justify-between">
        <div className="size-11 animate-pulse rounded-full bg-muted" />
        <div className="size-11 animate-pulse rounded-full bg-muted" />
      </div>

      <div className="flex flex-col gap-2 px-1 pb-1">
        <div className="h-6 w-[160px] animate-pulse rounded-md bg-muted" />
        <div className="h-3.5 w-[100px] animate-pulse rounded-md bg-muted" />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="h-[88px] animate-pulse rounded-xl border border-border bg-card" />
        <div className="h-[88px] animate-pulse rounded-xl border border-border bg-card" />
      </div>

      <div className="h-[260px] animate-pulse rounded-xl border border-border bg-card" />
    </div>
  );
}
