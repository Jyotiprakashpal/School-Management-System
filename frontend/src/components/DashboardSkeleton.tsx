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

function PanelHeaderSkeleton() {
  return (
    <div className="flex min-h-16 items-center justify-between gap-3 border-b border-slate-100 px-4 sm:px-5">
      <div className="flex items-center gap-3">
        <SkeletonBlock tone="strong" className="size-9 shrink-0" />
        <div className="space-y-2">
          <SkeletonBlock tone="strong" className="h-3 w-32" />
          <SkeletonBlock className="h-2 w-44 max-w-[45vw]" />
        </div>
      </div>
      <SkeletonBlock className="h-9 w-20" />
    </div>
  )
}

export default function DashboardSkeleton() {
  return (
    <div
      className="dashboard-skeleton app-skeleton min-h-screen"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading dashboard data"
    >
      <header className="skeleton-header flex min-h-20 items-center border-b px-4 sm:px-6 lg:px-7">
        <SkeletonBlock tone="strong" className="size-10 lg:hidden" />
        <div className="ml-4 space-y-2 lg:ml-0">
          <SkeletonBlock tone="strong" className="h-5 w-36" />
          <SkeletonBlock className="h-2.5 w-72 max-w-[55vw]" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <SkeletonBlock className="hidden h-10 w-32 sm:block" />
          <SkeletonBlock tone="strong" className="size-11 rounded-2xl" />
          <SkeletonBlock className="hidden h-11 w-28 sm:block" />
        </div>
      </header>

      <main className="dashboard-bg space-y-5 p-3 pb-20 sm:p-6 sm:pb-20 xl:p-8">
        <section className="skeleton-hero grid gap-5 rounded-2xl p-5 sm:p-6 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex items-center gap-3">
            <SkeletonBlock tone="light" className="size-11 shrink-0 rounded-2xl" />
            <div className="space-y-2">
              <SkeletonBlock tone="light" className="h-5 w-48" />
              <SkeletonBlock
                tone="light"
                className="h-2.5 w-36 opacity-70"
              />
              <SkeletonBlock
                tone="light"
                className="h-7 w-40 rounded-full opacity-70"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="skeleton-hero-stat rounded-xl p-3">
                <SkeletonBlock tone="light" className="mx-auto size-4" />
                <SkeletonBlock
                  tone="light"
                  className="mx-auto mt-2 h-4 w-8"
                />
                <SkeletonBlock
                  tone="light"
                  className="mx-auto mt-2 h-2 w-16 opacity-60"
                />
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <article
              key={index}
              className="skeleton-card relative overflow-hidden rounded-2xl p-5"
            >
              <span
                className={`skeleton-card-accent skeleton-card-accent-${index + 1} absolute inset-x-0 top-0 h-1`}
              />
              <div className="flex items-center gap-4">
                <SkeletonBlock
                  tone="strong"
                  className="size-12 shrink-0 rounded-2xl"
                />
                <div className="flex-1 space-y-2.5">
                  <SkeletonBlock tone="strong" className="h-5 w-20" />
                  <SkeletonBlock className="h-3 w-28" />
                  <SkeletonBlock className="h-2.5 w-32 max-w-full" />
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="skeleton-card overflow-hidden rounded-2xl">
          <PanelHeaderSkeleton />
          <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4 lg:grid-cols-8">
            {Array.from({ length: 8 }, (_, index) => (
              <div
                key={index}
                className="skeleton-action grid min-h-24 place-items-center rounded-xl p-3"
              >
                <div>
                  <SkeletonBlock
                    tone="strong"
                    className="mx-auto size-10"
                  />
                  <SkeletonBlock className="mx-auto mt-3 h-2.5 w-16" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-3">
          <article className="skeleton-card overflow-hidden rounded-2xl xl:col-span-2">
            <PanelHeaderSkeleton />
            <div className="p-5">
              <SkeletonBlock tone="strong" className="h-6 w-32" />
              <div className="mt-7 flex h-44 items-end gap-3">
                {["h-16", "h-24", "h-20", "h-32", "h-28", "h-40", "h-24", "h-36"].map(
                  (height, index) => (
                    <SkeletonBlock
                      key={index}
                      tone={index === 7 ? "strong" : "default"}
                      className={`w-full rounded-b-none ${height}`}
                    />
                  ),
                )}
              </div>
            </div>
          </article>
          <article className="skeleton-card overflow-hidden rounded-2xl">
            <PanelHeaderSkeleton />
            <div className="grid place-items-center p-5">
              <SkeletonBlock
                tone="strong"
                className="size-32 rounded-full"
              />
              <div className="mt-5 grid grid-cols-3 gap-2">
                {Array.from({ length: 3 }, (_, index) => (
                  <SkeletonBlock key={index} className="h-12 w-16" />
                ))}
              </div>
            </div>
          </article>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          {Array.from({ length: 2 }, (_, panel) => (
            <article
              key={panel}
              className="skeleton-card overflow-hidden rounded-2xl"
            >
              <PanelHeaderSkeleton />
              <div className="divide-y divide-slate-100">
                {Array.from({ length: 4 }, (_, row) => (
                  <div key={row} className="flex items-center gap-3 p-4 sm:px-5">
                    <SkeletonBlock
                      tone="strong"
                      className="size-10 shrink-0"
                    />
                    <div className="flex-1 space-y-2">
                      <SkeletonBlock tone="strong" className="h-3 w-32" />
                      <SkeletonBlock className="h-2 w-48 max-w-full" />
                    </div>
                    <SkeletonBlock className="h-3 w-16" />
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      </main>
      <span className="sr-only">Loading dashboard data and summaries</span>
    </div>
  )
}
