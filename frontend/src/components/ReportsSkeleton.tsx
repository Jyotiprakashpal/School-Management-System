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

function TemplateCardSkeleton() {
  return (
    <article className="skeleton-card flex min-h-48 flex-col justify-between overflow-hidden rounded-2xl p-4 sm:min-h-52 sm:p-5">
      <div>
        <div className="flex items-start justify-between">
          <SkeletonBlock tone="strong" className="size-11 sm:size-12" />
          <SkeletonBlock className="h-6 w-20 rounded-full" />
        </div>
        <SkeletonBlock tone="strong" className="mt-5 h-3.5 w-36" />
        <SkeletonBlock className="mt-3 h-2.5 w-full" />
        <SkeletonBlock className="mt-2 h-2.5 w-4/5" />
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <SkeletonBlock className="h-6 w-20 rounded-full" />
        <SkeletonBlock tone="strong" className="h-2.5 w-16" />
      </div>
    </article>
  )
}

function HistoryCardSkeleton() {
  return (
    <article className="skeleton-action rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <SkeletonBlock tone="strong" className="size-11 shrink-0 rounded-2xl" />
        <div className="min-w-0 flex-1">
          <SkeletonBlock tone="strong" className="h-3 w-36" />
          <SkeletonBlock className="mt-2 h-2 w-24" />
          <div className="mt-3 flex gap-2">
            <SkeletonBlock className="h-6 w-16 rounded-full" />
            <SkeletonBlock className="h-6 w-12 rounded-full" />
            <SkeletonBlock className="h-6 w-14 rounded-full" />
          </div>
        </div>
      </div>
      <SkeletonBlock className="mt-4 h-14 w-full" />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <SkeletonBlock tone="strong" className="h-10 w-full" />
        <SkeletonBlock className="h-10 w-full" />
      </div>
    </article>
  )
}

export default function ReportsSkeleton() {
  return (
    <div
      className="reports-skeleton app-skeleton min-h-screen dashboard-bg pb-16"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading reports"
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

      <main className="mx-auto max-w-7xl space-y-5 p-3 sm:p-6 xl:p-8">
        <section className="reports-skeleton-hero relative overflow-hidden rounded-3xl p-5 sm:p-7">
          <span className="absolute -right-20 -top-24 size-72 rounded-full border border-white/10 bg-white/5" />
          <span className="absolute -bottom-28 left-1/3 size-60 rounded-full bg-white/5" />
          <div className="relative grid gap-6 lg:grid-cols-[1fr_21rem] lg:items-center">
            <div>
              <SkeletonBlock tone="light" className="h-7 w-36 rounded-full" />
              <SkeletonBlock
                tone="light"
                className="mt-5 h-8 w-96 max-w-[85%]"
              />
              <SkeletonBlock
                tone="light"
                className="mt-3 h-2.5 w-full max-w-xl opacity-70"
              />
              <SkeletonBlock
                tone="light"
                className="mt-2 h-2.5 w-4/5 max-w-lg opacity-70"
              />
              <div className="mt-5 flex flex-wrap gap-2">
                {Array.from({ length: 3 }, (_, index) => (
                  <SkeletonBlock
                    key={index}
                    tone="light"
                    className="h-7 w-24 rounded-full opacity-75"
                  />
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/5 p-4 sm:p-5">
              <div className="flex items-start justify-between">
                <div>
                  <SkeletonBlock
                    tone="light"
                    className="h-2.5 w-28 opacity-70"
                  />
                  <SkeletonBlock tone="light" className="mt-3 h-8 w-12" />
                  <SkeletonBlock
                    tone="light"
                    className="mt-2 h-2 w-28 opacity-60"
                  />
                </div>
                <SkeletonBlock tone="light" className="size-11" />
              </div>
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

        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <article
              key={index}
              className="skeleton-card relative overflow-hidden rounded-2xl p-3.5 sm:p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-2">
                  <SkeletonBlock className="h-2.5 w-24 max-w-full" />
                  <SkeletonBlock tone="strong" className="h-7 w-12" />
                </div>
                <SkeletonBlock tone="strong" className="size-10" />
              </div>
              <SkeletonBlock className="mt-3 h-2 w-28 max-w-full" />
            </article>
          ))}
        </section>

        <section className="skeleton-card overflow-hidden rounded-2xl">
          <div className="flex min-h-14 items-center justify-between gap-3 border-b border-slate-100 px-5">
            <div className="flex items-center gap-3">
              <SkeletonBlock tone="strong" className="size-9" />
              <div className="space-y-2">
                <SkeletonBlock tone="strong" className="h-3 w-28" />
                <SkeletonBlock className="h-2 w-52" />
              </div>
            </div>
            <SkeletonBlock className="h-6 w-20 rounded-full" />
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-[1fr_15rem] sm:p-5">
            <SkeletonBlock tone="strong" className="h-11 w-full" />
            <SkeletonBlock tone="strong" className="h-11 w-full" />
          </div>
        </section>

        <section>
          <SkeletonBlock tone="strong" className="h-5 w-36" />
          <SkeletonBlock className="mt-2 h-2.5 w-72 max-w-[75%]" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => (
              <TemplateCardSkeleton key={index} />
            ))}
          </div>
        </section>

        <section className="skeleton-card overflow-hidden rounded-2xl">
          <div className="border-b border-slate-100 p-4 sm:flex sm:min-h-16 sm:items-center sm:justify-between sm:px-5">
            <div className="flex items-center gap-3">
              <SkeletonBlock tone="strong" className="size-10 shrink-0" />
              <div className="space-y-2">
                <SkeletonBlock tone="strong" className="h-3.5 w-28" />
                <SkeletonBlock className="h-2 w-48" />
              </div>
            </div>
            <SkeletonBlock className="mt-4 h-11 w-full sm:mt-0 sm:w-40" />
          </div>

          <div className="grid gap-3 p-3 lg:hidden">
            <HistoryCardSkeleton />
            <HistoryCardSkeleton />
            <HistoryCardSkeleton />
          </div>

          <div className="hidden lg:block">
            <div className="grid grid-cols-7 gap-4 border-b border-slate-100 p-4">
              {Array.from({ length: 7 }, (_, index) => (
                <SkeletonBlock
                  key={index}
                  className={`h-2 ${index === 0 ? "w-24" : "w-16"}`}
                />
              ))}
            </div>
            {Array.from({ length: 4 }, (_, row) => (
              <div
                key={row}
                className="grid grid-cols-7 items-center gap-4 border-b border-slate-100 p-4"
              >
                <div className="flex items-center gap-3">
                  <SkeletonBlock tone="strong" className="size-9 shrink-0" />
                  <SkeletonBlock tone="strong" className="h-2.5 w-28" />
                </div>
                {Array.from({ length: 6 }, (_, column) => (
                  <SkeletonBlock
                    key={column}
                    tone={column === 4 ? "strong" : "default"}
                    className="h-2.5 w-16"
                  />
                ))}
              </div>
            ))}
          </div>
        </section>
      </main>
      <span className="sr-only">
        Loading report templates and generated report history
      </span>
    </div>
  )
}
