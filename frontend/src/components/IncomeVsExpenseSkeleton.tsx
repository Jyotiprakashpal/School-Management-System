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

function FieldSkeleton() {
  return (
    <div>
      <SkeletonBlock className="mb-2 h-2 w-20 rounded-md" />
      <SkeletonBlock tone="strong" className="h-11 w-full" />
    </div>
  )
}

function TransactionCardSkeleton() {
  return (
    <article className="skeleton-action rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <SkeletonBlock tone="strong" className="size-11 shrink-0 rounded-2xl" />
        <div className="min-w-0 flex-1">
          <div className="flex justify-between gap-3">
            <div className="space-y-2">
              <SkeletonBlock tone="strong" className="h-3 w-36" />
              <SkeletonBlock className="h-2 w-24" />
            </div>
            <SkeletonBlock tone="strong" className="h-3 w-16" />
          </div>
          <div className="mt-3 flex gap-2">
            <SkeletonBlock className="h-6 w-24 rounded-full" />
            <SkeletonBlock className="h-6 w-16 rounded-full" />
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <SkeletonBlock className="h-14 w-full" />
        <SkeletonBlock className="h-14 w-full" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <SkeletonBlock className="h-10 w-full" />
        <SkeletonBlock className="h-10 w-full" />
      </div>
    </article>
  )
}

export default function IncomeVsExpenseSkeleton() {
  const chartHeights = ["h-36", "h-44", "h-40", "h-52", "h-48", "h-56"]

  return (
    <div
      className="income-expense-skeleton app-skeleton min-h-screen dashboard-bg pb-16"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading income and expense dashboard"
    >
      <header className="skeleton-header flex min-h-20 items-center border-b px-4 sm:px-6 lg:px-7">
        <div className="ml-12 space-y-2 lg:ml-0">
          <SkeletonBlock tone="strong" className="h-5 w-44" />
          <SkeletonBlock className="h-2.5 w-80 max-w-[55vw]" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <SkeletonBlock className="hidden h-10 w-32 sm:block" />
          <SkeletonBlock tone="strong" className="size-11 rounded-2xl" />
          <SkeletonBlock className="hidden h-11 w-28 sm:block" />
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 p-3 sm:p-6 xl:p-8">
        <section className="income-expense-skeleton-hero relative overflow-hidden rounded-3xl p-5 sm:p-7">
          <span className="absolute -right-20 -top-24 size-72 rounded-full border border-white/10 bg-white/5" />
          <span className="absolute -bottom-28 left-1/3 size-60 rounded-full bg-white/5" />
          <div className="relative grid gap-6 lg:grid-cols-[1fr_21rem] lg:items-center">
            <div>
              <SkeletonBlock tone="light" className="h-7 w-48 rounded-full" />
              <SkeletonBlock
                tone="light"
                className="mt-5 h-2.5 w-44 opacity-60"
              />
              <SkeletonBlock tone="light" className="mt-3 h-10 w-48" />
              <SkeletonBlock
                tone="light"
                className="mt-2 h-2.5 w-32 opacity-70"
              />
              <SkeletonBlock
                tone="light"
                className="mt-4 h-2.5 w-full max-w-xl opacity-70"
              />
              <SkeletonBlock
                tone="light"
                className="mt-2 h-2.5 w-4/5 max-w-lg opacity-70"
              />
              <div className="mt-5 grid grid-cols-2 gap-2 sm:flex">
                <SkeletonBlock tone="light" className="h-10 w-full sm:w-32" />
                <SkeletonBlock
                  tone="light"
                  className="h-10 w-full opacity-70 sm:w-32"
                />
              </div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/5 p-4 sm:p-5">
              <div className="flex items-start justify-between">
                <div>
                  <SkeletonBlock
                    tone="light"
                    className="h-2.5 w-20 opacity-70"
                  />
                  <SkeletonBlock tone="light" className="mt-3 h-8 w-20" />
                </div>
                <SkeletonBlock tone="light" className="size-11" />
              </div>
              <SkeletonBlock
                tone="light"
                className="mt-4 h-2 w-full rounded-full opacity-70"
              />
              <div className="mt-4 grid grid-cols-2 gap-2">
                <SkeletonBlock
                  tone="light"
                  className="h-16 w-full opacity-70"
                />
                <SkeletonBlock
                  tone="light"
                  className="h-16 w-full opacity-70"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="skeleton-card overflow-hidden rounded-2xl">
          <div className="flex min-h-14 items-center justify-between gap-3 border-b border-slate-100 px-5">
            <div className="flex items-center gap-3">
              <SkeletonBlock tone="strong" className="size-9" />
              <div className="space-y-2">
                <SkeletonBlock tone="strong" className="h-3 w-32" />
                <SkeletonBlock className="h-2 w-52" />
              </div>
            </div>
            <SkeletonBlock className="h-6 w-24 rounded-full" />
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-[repeat(3,minmax(0,1fr))_auto] sm:items-end sm:p-5">
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
            <SkeletonBlock tone="strong" className="h-10 w-full sm:w-28" />
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <article
              key={index}
              className="skeleton-card relative overflow-hidden rounded-2xl p-3.5 sm:p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-2">
                  <SkeletonBlock className="h-2.5 w-20" />
                  <SkeletonBlock tone="strong" className="h-6 w-24" />
                </div>
                <SkeletonBlock tone="strong" className="size-10" />
              </div>
              <SkeletonBlock className="mt-3 h-2 w-28 max-w-full" />
            </article>
          ))}
        </section>

        <div className="grid items-start gap-5 xl:grid-cols-[1fr_19rem]">
          <section className="skeleton-card overflow-hidden rounded-2xl">
            <div className="flex min-h-16 items-center justify-between gap-3 border-b border-slate-100 px-4 sm:px-5">
              <div className="flex items-center gap-3">
                <SkeletonBlock tone="strong" className="size-5 rounded-md" />
                <div className="space-y-2">
                  <SkeletonBlock tone="strong" className="h-3 w-28" />
                  <SkeletonBlock className="h-2 w-40" />
                </div>
              </div>
              <div className="hidden gap-4 sm:flex">
                <SkeletonBlock className="h-2.5 w-16" />
                <SkeletonBlock className="h-2.5 w-16" />
              </div>
            </div>
            <div className="p-3.5 sm:p-5">
              <div className="skeleton-action relative flex h-72 items-end gap-3 overflow-hidden rounded-2xl border-b p-4 pb-0 sm:gap-6 sm:p-6 sm:pb-0">
                {chartHeights.map((height, index) => (
                  <div
                    key={index}
                    className="flex h-full flex-1 items-end justify-center gap-1 sm:gap-2"
                  >
                    <SkeletonBlock
                      tone="strong"
                      className={`${height} w-3 rounded-b-none sm:w-6`}
                    />
                    <SkeletonBlock
                      className={`${
                        index % 2 ? "h-28" : "h-32"
                      } w-3 rounded-b-none sm:w-6`}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
                {Array.from({ length: 3 }, (_, index) => (
                  <div key={index} className="skeleton-action rounded-xl p-3">
                    <SkeletonBlock className="h-2 w-16 max-w-full" />
                    <SkeletonBlock
                      tone="strong"
                      className="mt-2 h-3 w-20 max-w-full"
                    />
                    <SkeletonBlock className="mt-2 hidden h-2 w-14 sm:block" />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-5">
            <section className="skeleton-card rounded-2xl p-5">
              <div className="flex items-center gap-2">
                <SkeletonBlock tone="strong" className="size-9" />
                <SkeletonBlock tone="strong" className="h-3 w-36" />
              </div>
              <SkeletonBlock className="mt-3 h-2.5 w-44" />
              <div className="mt-5 space-y-4">
                {Array.from({ length: 5 }, (_, index) => (
                  <div key={index}>
                    <div className="flex justify-between">
                      <SkeletonBlock className="h-2.5 w-20" />
                      <SkeletonBlock className="h-2.5 w-16" />
                    </div>
                    <SkeletonBlock className="mt-2 h-2 w-full rounded-full" />
                  </div>
                ))}
              </div>
            </section>
            <section className="skeleton-card rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <SkeletonBlock tone="strong" className="h-3 w-32" />
                <SkeletonBlock className="h-6 w-16 rounded-full" />
              </div>
              <SkeletonBlock tone="strong" className="mt-5 h-8 w-20" />
              <SkeletonBlock className="mt-3 h-2.5 w-full" />
              <SkeletonBlock className="mt-2 h-2.5 w-4/5" />
            </section>
          </aside>
        </div>

        <section className="skeleton-card overflow-hidden rounded-2xl">
          <div className="flex min-h-16 items-center justify-between gap-3 border-b border-slate-100 px-4 sm:px-5">
            <div className="flex items-center gap-3">
              <SkeletonBlock tone="strong" className="size-9" />
              <div className="space-y-2">
                <SkeletonBlock tone="strong" className="h-3 w-28" />
                <SkeletonBlock className="h-2 w-24" />
              </div>
            </div>
            <SkeletonBlock tone="strong" className="h-9 w-20" />
          </div>
          <div className="grid grid-cols-2 gap-2.5 border-b border-slate-100 p-3 sm:grid-cols-[1fr_11rem] sm:p-4">
            <SkeletonBlock tone="strong" className="h-11 w-full" />
            <SkeletonBlock tone="strong" className="h-11 w-full" />
          </div>

          <div className="grid gap-3 p-3 lg:hidden">
            <TransactionCardSkeleton />
            <TransactionCardSkeleton />
            <TransactionCardSkeleton />
          </div>

          <div className="hidden lg:block">
            <div className="grid grid-cols-7 gap-4 border-b border-slate-100 p-4">
              {Array.from({ length: 7 }, (_, index) => (
                <SkeletonBlock
                  key={index}
                  className={`h-2 ${index === 1 ? "w-24" : "w-16"}`}
                />
              ))}
            </div>
            {Array.from({ length: 6 }, (_, row) => (
              <div
                key={row}
                className="grid grid-cols-7 items-center gap-4 border-b border-slate-100 p-4"
              >
                <SkeletonBlock className="h-2.5 w-20" />
                <div className="flex items-center gap-3">
                  <SkeletonBlock tone="strong" className="size-9 shrink-0" />
                  <div className="space-y-2">
                    <SkeletonBlock tone="strong" className="h-2.5 w-24" />
                    <SkeletonBlock className="h-2 w-16" />
                  </div>
                </div>
                {Array.from({ length: 5 }, (_, column) => (
                  <SkeletonBlock
                    key={column}
                    tone={column === 3 ? "strong" : "default"}
                    className="h-2.5 w-16"
                  />
                ))}
              </div>
            ))}
          </div>
        </section>
      </main>
      <span className="sr-only">
        Loading cash flow trends, financial summary, and transactions
      </span>
    </div>
  )
}
