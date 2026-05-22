export default function ArchivedRitualsLoading() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      <div className="-mx-2 flex items-center gap-1">
        <div className="size-11" />
        <div className="h-5 w-40 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border border-border bg-card py-2 pl-3.5 pr-2"
          >
            <div className="size-9 shrink-0 animate-pulse rounded-md bg-muted" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-3.5 w-[140px] animate-pulse rounded-md bg-muted" />
              <div className="h-2.5 w-[110px] animate-pulse rounded-md bg-muted" />
            </div>
            <div className="h-11 w-[88px] shrink-0 animate-pulse rounded-full bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
