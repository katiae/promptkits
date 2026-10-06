export function EntrySkeleton({ index }: { index: number }) {
  return (
    <div className="template-skeleton flex flex-col rounded-2xl bg-card p-2.5" aria-hidden="true">
      <div className={`skeleton-art skeleton-palette-${index % 3} relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-tray`}>
        <div className="skeleton-cloud skeleton-cloud-first" />
        <div className="skeleton-cloud skeleton-cloud-second" />
        <div className="absolute inset-0 grid place-items-center">
          <div className="flex w-3/5 flex-col items-center gap-3 opacity-50">
            <div className="h-2 w-12 rounded-full bg-card" />
            <div className="h-5 w-full rounded bg-card" />
            <div className="h-5 w-4/5 rounded bg-card" />
            <div className="mt-1 h-2 w-2/3 rounded-full bg-card" />
          </div>
        </div>
      </div>
      <div className="flex items-start justify-between gap-3 px-2.5 pt-4">
        <div className="flex-1">
          <div className="h-5 w-2/5 rounded bg-muted" />
          <div className="mt-2 h-3.5 w-11/12 rounded bg-secondary" />
          <div className="mt-2 h-3.5 w-2/3 rounded bg-secondary" />
        </div>
        <div className="size-7 rounded-full bg-secondary" />
      </div>
      <div className="flex gap-1.5 px-2.5 pb-2 pt-3">
        <div className="h-5 w-16 rounded-full bg-secondary" />
        <div className="h-5 w-20 rounded-full bg-secondary" />
        <div className="h-5 w-14 rounded-full bg-secondary" />
      </div>
    </div>
  );
}