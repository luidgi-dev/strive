export default function SettingsLoading() {
  return (
    <div className="-mx-6 -mb-24 -mt-4 flex flex-1 flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-1 bg-background/80 px-2 backdrop-blur-md">
        <div className="size-11" aria-hidden />
        <div className="h-4 w-20 animate-pulse rounded-md bg-muted" aria-hidden />
      </header>

      <div className="mx-auto flex w-full max-w-md flex-col gap-8 px-6 pb-16 pt-2">
        <section className="flex flex-col items-center gap-4 py-6">
          <div className="size-28 animate-pulse rounded-full bg-muted" aria-hidden />
          <div className="h-6 w-32 animate-pulse rounded-md bg-muted" aria-hidden />
          <div className="h-4 w-40 animate-pulse rounded-md bg-muted" aria-hidden />
        </section>

        <SkeletonSection rows={3} />
        <SkeletonSection rows={3} />

        <section className="flex flex-col gap-3">
          <div className="h-11 w-full animate-pulse rounded-md bg-muted" aria-hidden />
        </section>
      </div>
    </div>
  );
}

function SkeletonSection({ rows }: { rows: number }) {
  return (
    <section className="flex flex-col gap-3" aria-hidden>
      <div className="h-3 w-24 animate-pulse rounded-sm bg-muted" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <div className="flex min-h-[44px] items-center justify-between gap-3">
            <div className="h-4 w-24 animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-16 animate-pulse rounded-md bg-muted" />
          </div>
          {i < rows - 1 ? <div className="h-px bg-border" /> : null}
        </div>
      ))}
    </section>
  );
}
