function SkeletonBlock({
  className = "",
  tone = "default",
}: {
  className?: string
  tone?: "default" | "light" | "strong"
}) {
  return (
    <div
      className={`skeleton-block skeleton-block-${tone} rounded-xl ${className}`}
    />
  )
}

function TableRowSkeleton({ columns = 7 }: { columns?: number }) {
  return (
    <div
      className={`skeleton-action rounded-2xl p-4 lg:grid lg:items-center lg:gap-4 lg:rounded-none lg:border-x-0 lg:border-t-0 ${
        columns === 7
          ? "lg:grid-cols-[1.3fr_.65fr_.8fr_.8fr_.8fr_1fr_auto]"
          : "lg:grid-cols-[.75fr_1.1fr_.65fr_1fr_.75fr_.65fr_.75fr_auto]"
      }`}
    >
      {Array.from({ length: columns }, (_, index) =>
        index === 0 && columns === 7 ? (
          <div key={index} className="flex items-center gap-3">
            <SkeletonBlock tone="strong" className="size-9 shrink-0" />
            <div className="space-y-2">
              <SkeletonBlock tone="strong" className="h-2.5 w-28" />
              <SkeletonBlock className="h-2 w-20" />
            </div>
          </div>
        ) : (
          <SkeletonBlock
            key={index}
            tone={index === columns - 1 || index === 3 ? "strong" : "default"}
            className="mt-3 h-2.5 w-20 lg:mt-0"
          />
        ),
      )}
    </div>
  )
}

function PanelHeaderSkeleton() {
  return (
    <div className="flex min-h-16 items-center justify-between gap-3 border-b border-slate-100 px-4 sm:px-5">
      <div className="flex items-center gap-3">
        <SkeletonBlock tone="strong" className="size-10" />
        <div className="space-y-2">
          <SkeletonBlock tone="strong" className="h-3 w-40" />
          <SkeletonBlock className="h-2 w-64 max-w-[45vw]" />
        </div>
      </div>
      <SkeletonBlock className="h-9 w-24" />
    </div>
  )
}

export default function QuickFeeCollectSkeleton() {
  return (
    <div
      className="quick-fee-collect-skeleton app-skeleton min-h-screen dashboard-bg pb-16"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading quick fee collection"
    >
      <header className="skeleton-header flex min-h-20 items-center border-b px-4 sm:px-6 lg:px-7">
        <div className="ml-12 space-y-2 lg:ml-0">
          <SkeletonBlock tone="strong" className="h-5 w-40" />
          <SkeletonBlock className="h-2.5 w-80 max-w-[55vw]" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <SkeletonBlock className="hidden h-10 w-32 sm:block" />
          <SkeletonBlock tone="strong" className="size-11 rounded-2xl" />
          <SkeletonBlock className="hidden h-11 w-28 sm:block" />
        </div>
      </header>

      <main className="mx-auto w-full min-w-0 max-w-none space-y-4 p-4 sm:space-y-5 sm:p-6 xl:p-8">
        <section className="quick-fee-collect-skeleton-hero relative overflow-hidden rounded-3xl p-5 sm:p-7">
          <span className="absolute -right-16 -top-20 size-64 rounded-full border border-white/10 bg-white/5" />
          <span className="absolute -bottom-28 left-1/3 size-56 rounded-full border-[36px] border-white/5" />
          <div className="relative grid items-center gap-6 lg:grid-cols-[1fr_24rem]">
            <div>
              <SkeletonBlock
                tone="light"
                className="h-7 w-44 rounded-full opacity-75"
              />
              <SkeletonBlock
                tone="light"
                className="mt-4 h-9 w-80 max-w-[88%]"
              />
              <SkeletonBlock
                tone="light"
                className="mt-3 h-2.5 w-full max-w-xl opacity-65"
              />
              <SkeletonBlock
                tone="light"
                className="mt-2 h-2.5 w-4/5 max-w-lg opacity-65"
              />
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <SkeletonBlock tone="light" className="h-2 w-24 opacity-65" />
                  <SkeletonBlock tone="light" className="h-8 w-24" />
                </div>
                <div className="space-y-2 border-l border-white/10 pl-3">
                  <SkeletonBlock tone="light" className="h-2 w-20 opacity-65" />
                  <SkeletonBlock tone="light" className="h-8 w-16" />
                </div>
              </div>
              <SkeletonBlock
                tone="light"
                className="mt-4 h-2.5 w-full rounded-full opacity-65"
              />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <article
              key={index}
              className="skeleton-card rounded-2xl p-3 sm:p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-2">
                  <SkeletonBlock className="h-2.5 w-24 max-w-full" />
                  <SkeletonBlock tone="strong" className="h-7 w-20" />
                </div>
                <SkeletonBlock tone="strong" className="size-9 sm:size-10" />
              </div>
              <SkeletonBlock className="mt-3 h-2 w-28 max-w-full" />
            </article>
          ))}
        </section>

        <section className="skeleton-card overflow-hidden rounded-2xl">
          <PanelHeaderSkeleton />
          <div className="grid grid-cols-2 gap-3 border-b border-slate-100 p-3 sm:grid-cols-[1fr_9rem_9rem_auto] sm:p-4 xl:grid-cols-[1fr_12rem_12rem_auto]">
            <SkeletonBlock
              tone="strong"
              className="col-span-2 h-11 w-full sm:col-span-1"
            />
            <SkeletonBlock tone="strong" className="h-11 w-full" />
            <SkeletonBlock tone="strong" className="h-11 w-full" />
            <SkeletonBlock
              tone="strong"
              className="col-span-2 h-11 w-full sm:col-span-1 sm:w-20"
            />
          </div>
          <div className="hidden grid-cols-[1.3fr_.65fr_.8fr_.8fr_.8fr_1fr_auto] gap-4 border-b border-slate-100 p-4 lg:grid">
            {Array.from({ length: 7 }, (_, index) => (
              <SkeletonBlock key={index} className="h-2 w-16" />
            ))}
          </div>
          <div className="grid gap-3 p-3 lg:block lg:p-0">
            {Array.from({ length: 5 }, (_, index) => (
              <TableRowSkeleton key={index} />
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 p-4">
            <SkeletonBlock className="h-2.5 w-36" />
            <div className="flex gap-2">
              <SkeletonBlock className="size-9" />
              <SkeletonBlock tone="strong" className="size-9" />
              <SkeletonBlock className="size-9" />
            </div>
          </div>
        </section>

        <section className="skeleton-card overflow-hidden rounded-2xl">
          <PanelHeaderSkeleton />
          <div className="hidden grid-cols-[.75fr_1.1fr_.65fr_1fr_.75fr_.65fr_.75fr_auto] gap-4 border-b border-slate-100 p-4 lg:grid">
            {Array.from({ length: 8 }, (_, index) => (
              <SkeletonBlock key={index} className="h-2 w-16" />
            ))}
          </div>
          <div className="grid gap-3 p-3 lg:block lg:p-0">
            {Array.from({ length: 4 }, (_, index) => (
              <TableRowSkeleton key={index} columns={8} />
            ))}
          </div>
        </section>
      </main>
      <span className="sr-only">
        Loading student accounts and recent fee payments
      </span>
    </div>
  )
}
