export default function RhythmLoading() {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      {/* Day bar: title + date, then the coach line. */}
      <div className="flex flex-col gap-2 px-1 pb-1.5">
        <div className="flex items-baseline justify-between">
          <div className="h-6 w-[88px] animate-pulse rounded-md bg-muted" />
          <div className="h-3.5 w-[72px] animate-pulse rounded-md bg-muted" />
        </div>
        <div className="h-3.5 w-[110px] animate-pulse rounded-md bg-muted" />
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
        <div className="size-10 shrink-0 animate-pulse rounded-md bg-muted" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="h-4 w-[55%] animate-pulse rounded-md bg-muted" />
          <div className="h-3 w-[35%] animate-pulse rounded-md bg-muted" />
        </div>
        <div className="size-8 shrink-0 animate-pulse rounded-full bg-muted" />
      </div>
      <div className="h-[5px] w-full animate-pulse rounded-full bg-muted" />
    </div>
  );
}
