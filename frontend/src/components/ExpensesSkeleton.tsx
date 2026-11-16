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

function LedgerRowSkeleton() {
  return (
    <article className="skeleton-action rounded-2xl p-3.5 sm:p-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_8rem_9rem_auto] xl:items-center">
        <div className="flex min-w-0 items-center gap-3 sm:col-span-2 xl:col-span-1">
          <SkeletonBlock
            tone="strong"
            className="size-11 shrink-0 rounded-2xl"
          />
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBlock tone="strong" className="h-3 w-40 max-w-full" />
            <div className="flex gap-2">
              <SkeletonBlock className="h-2 w-20" />
              <SkeletonBlock className="h-5 w-20 rounded-full" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
          <SkeletonBlock className="h-10 w-full" />
          <SkeletonBlock className="h-10 w-full" />
        </div>
        <SkeletonBlock tone="strong" className="h-12 w-full xl:h-3" />
        <SkeletonBlock className="hidden h-6 w-20 rounded-full xl:block" />
        <div className="grid grid-cols-3 gap-2 sm:col-span-2 xl:col-span-1">
          <SkeletonBlock className="h-9 w-full" />
          <SkeletonBlock className="h-9 w-full" />
          <SkeletonBlock className="h-9 w-full" />
        </div>
      </div>
    </article>
  )
}

export default function ExpensesSkeleton() {
  return (
    <div
      className="expenses-skeleton app-skeleton min-h-screen dashboard-bg pb-16"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading expenses"
    >
      <header className="skeleton-header flex min-h-20 items-center border-b px-4 sm:px-6 lg:px-7">
        <div className="ml-12 space-y-2 lg:ml-0">
          <SkeletonBlock tone="strong" className="h-5 w-36" />
          <SkeletonBlock className="h-2.5 w-80 max-w-[55vw]" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <SkeletonBlock className="hidden h-10 w-32 sm:block" />
          <SkeletonBlock tone="strong" className="size-11 rounded-2xl" />
          <SkeletonBlock className="hidden h-11 w-28 sm:block" />
        </div>
      </header>

      <main className="space-y-4 p-3 sm:space-y-5 sm:p-6 xl:p-8">
        <section className="expenses-skeleton-hero relative overflow-hidden rounded-3xl p-4 sm:p-6">
          <span className="absolute -right-14 -top-20 size-64 rounded-full bg-white/5 blur-2xl" />
          <span className="absolute -bottom-24 left-1/3 size-56 rounded-full bg-white/5 blur-2xl" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-center gap-3">
              <SkeletonBlock
                tone="light"
                className="size-12 shrink-0 rounded-2xl"
              />
              <div>
                <SkeletonBlock tone="light" className="h-2.5 w-48 opacity-65" />
                <SkeletonBlock tone="light" className="mt-3 h-9 w-40" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <SkeletonBlock
                tone="light"
                className="h-16 w-full opacity-70 sm:w-32"
              />
              <SkeletonBlock
                tone="light"
                className="h-16 w-full opacity-70 sm:w-32"
              />
              <SkeletonBlock
                tone="light"
                className="col-span-2 h-12 w-full sm:w-32"
              />
            </div>
          </div>
          <SkeletonBlock
            tone="light"
            className="relative mt-4 h-2.5 w-full max-w-xl opacity-65"
          />
          <div className="relative mt-5 rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4">
            <div className="flex justify-between gap-4">
              <SkeletonBlock tone="light" className="h-2.5 w-32" />
              <SkeletonBlock tone="light" className="h-2.5 w-40" />
            </div>
            <SkeletonBlock
              tone="light"
              className="mt-3 h-2.5 w-full rounded-full opacity-70"
            />
          </div>
        </section>

        <section className="grid auto-rows-fr grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <article
              key={index}
              className="skeleton-card rounded-2xl p-3 sm:p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-2">
                  <SkeletonBlock className="h-2.5 w-24 max-w-full" />
                  <SkeletonBlock tone="strong" className="h-7 w-24" />
                </div>
                <SkeletonBlock tone="strong" className="size-10" />
              </div>
              <SkeletonBlock className="mt-3 h-2 w-28 max-w-full" />
            </article>
          ))}
        </section>

        <section className="skeleton-card overflow-hidden rounded-2xl">
          <div className="flex min-h-16 items-center justify-between gap-3 border-b border-slate-100 px-4 sm:px-5">
            <div className="flex items-center gap-3">
              <SkeletonBlock tone="strong" className="size-10" />
              <div className="space-y-2">
                <SkeletonBlock tone="strong" className="h-3 w-28" />
                <SkeletonBlock className="h-2 w-44" />
              </div>
            </div>
            <SkeletonBlock className="h-6 w-20 rounded-full" />
          </div>
          <div className="grid gap-3 p-3 sm:p-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1.85fr)_auto] lg:items-end">
            <div className="skeleton-action rounded-2xl p-2.5">
              <SkeletonBlock className="h-2 w-24" />
              <SkeletonBlock tone="strong" className="mt-2 h-10 w-full" />
            </div>
            <div className="skeleton-action grid grid-cols-2 gap-2 rounded-2xl p-2 sm:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => (
                <div
                  key={index}
                  className={index === 2 ? "max-sm:col-span-2" : ""}
                >
                  <SkeletonBlock className="mb-2 h-2 w-14" />
                  <SkeletonBlock tone="strong" className="h-10 w-full" />
                </div>
              ))}
            </div>
            <SkeletonBlock tone="strong" className="h-12 w-full lg:w-32" />
          </div>
        </section>

        <div className="grid items-start gap-5 2xl:grid-cols-[minmax(0,1fr)_18rem]">
          <section className="skeleton-card overflow-hidden rounded-2xl">
            <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 sm:px-5">
              <div className="flex items-center gap-3">
                <SkeletonBlock tone="strong" className="size-10" />
                <div className="space-y-2">
                  <SkeletonBlock tone="strong" className="h-3 w-28" />
                  <SkeletonBlock className="h-2 w-44" />
                </div>
              </div>
              <SkeletonBlock className="h-9 w-28" />
            </div>
            <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_8rem_9rem_auto] gap-4 border-b border-slate-100 p-4 xl:grid">
              {Array.from({ length: 5 }, (_, index) => (
                <SkeletonBlock
                  key={index}
                  className={`h-2 ${index === 0 ? "w-24" : "w-16"}`}
                />
              ))}
            </div>
            <div className="space-y-2.5 p-2.5 sm:p-3">
              {Array.from({ length: 6 }, (_, index) => (
                <LedgerRowSkeleton key={index} />
              ))}
            </div>
            <footer className="flex flex-col gap-2 border-t border-slate-100 px-4 py-3.5 sm:flex-row sm:justify-between sm:px-5">
              <SkeletonBlock className="h-2.5 w-36" />
              <SkeletonBlock className="h-2.5 w-32" />
            </footer>
          </section>

          <aside className="space-y-4 sm:space-y-5">
            <section className="skeleton-card overflow-hidden rounded-2xl">
              <div className="flex items-center gap-3 border-b border-slate-100 p-4 sm:p-5">
                <SkeletonBlock tone="strong" className="size-10" />
                <div className="space-y-2">
                  <SkeletonBlock tone="strong" className="h-3 w-32" />
                  <SkeletonBlock className="h-2 w-28" />
                </div>
              </div>
              <div className="space-y-4 p-4 sm:p-5">
                {Array.from({ length: 5 }, (_, index) => (
                  <div key={index}>
                    <div className="flex justify-between gap-3">
                      <SkeletonBlock className="h-2.5 w-20" />
                      <SkeletonBlock className="h-2.5 w-16" />
                    </div>
                    <SkeletonBlock className="mt-2 h-2 w-full rounded-full" />
                  </div>
                ))}
              </div>
            </section>
            <section className="skeleton-card rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <SkeletonBlock tone="strong" className="size-10" />
                <div className="space-y-2">
                  <SkeletonBlock tone="strong" className="h-3 w-28" />
                  <SkeletonBlock className="h-2 w-32" />
                </div>
              </div>
              <div className="mt-5 flex items-end justify-between">
                <SkeletonBlock tone="strong" className="h-7 w-16" />
                <SkeletonBlock className="h-2.5 w-20" />
              </div>
              <SkeletonBlock className="mt-3 h-2.5 w-full rounded-full" />
              <SkeletonBlock className="mt-4 h-2.5 w-full" />
              <SkeletonBlock className="mt-2 h-2.5 w-4/5" />
            </section>
          </aside>
        </div>
      </main>
      <span className="sr-only">
        Loading expense records, budget summary, and category distribution
      </span>
    </div>
  )
}
