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

function ResultRowSkeleton() {
  return (
    <li className="grid gap-3 p-3.5 sm:p-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto] lg:items-center lg:gap-5">
      <div className="flex items-center gap-3">
        <SkeletonBlock tone="strong" className="size-10 shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonBlock tone="strong" className="h-3 w-32" />
          <SkeletonBlock className="h-2 w-24" />
        </div>
        <SkeletonBlock className="h-6 w-16 rounded-full lg:hidden" />
      </div>
      <div>
        <div className="flex justify-between">
          <SkeletonBlock className="h-2.5 w-20" />
          <SkeletonBlock tone="strong" className="h-2.5 w-12" />
        </div>
        <SkeletonBlock className="mt-2 h-1.5 w-full rounded-full" />
      </div>
      <div className="flex items-center justify-between gap-2.5">
        <SkeletonBlock tone="strong" className="size-8" />
        <SkeletonBlock className="h-8 w-28" />
      </div>
    </li>
  )
}

export default function ClassResultSkeleton() {
  return (
    <div
      className="class-result-skeleton app-skeleton min-h-screen dashboard-bg pb-16"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading class result"
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

      <main className="mx-auto max-w-[1600px] space-y-4 p-3 sm:space-y-5 sm:p-6 xl:p-8">
        <section className="class-result-skeleton-hero relative overflow-hidden rounded-3xl p-5 sm:p-7">
          <span className="absolute -right-20 -top-24 size-72 rounded-full border border-white/10 bg-white/5" />
          <span className="absolute -bottom-28 left-1/3 size-60 rounded-full bg-white/5" />
          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center">
            <div>
              <SkeletonBlock tone="light" className="h-7 w-44 rounded-full" />
              <SkeletonBlock
                tone="light"
                className="mt-5 h-2.5 w-48 opacity-60"
              />
              <SkeletonBlock
                tone="light"
                className="mt-3 h-9 w-96 max-w-[85%]"
              />
              <SkeletonBlock
                tone="light"
                className="mt-3 h-2.5 w-full max-w-xl opacity-70"
              />
              <SkeletonBlock
                tone="light"
                className="mt-2 h-2.5 w-4/5 max-w-lg opacity-70"
              />
              <div className="mt-5 grid grid-cols-2 gap-2 sm:flex">
                <SkeletonBlock tone="light" className="h-11 w-full sm:w-32" />
                <SkeletonBlock
                  tone="light"
                  className="h-11 w-full opacity-70 sm:w-36"
                />
              </div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/5 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <SkeletonBlock tone="light" className="size-12 shrink-0" />
                <div className="flex-1 space-y-2">
                  <SkeletonBlock
                    tone="light"
                    className="h-2.5 w-20 opacity-65"
                  />
                  <SkeletonBlock tone="light" className="h-5 w-32" />
                  <SkeletonBlock tone="light" className="h-2 w-28 opacity-60" />
                </div>
                <SkeletonBlock tone="light" className="h-8 w-10" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {Array.from({ length: 3 }, (_, index) => (
                  <SkeletonBlock
                    key={index}
                    tone="light"
                    className="h-14 w-full opacity-70"
                  />
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <SkeletonBlock
                  tone="light"
                  className="h-11 w-full opacity-65"
                />
                <SkeletonBlock
                  tone="light"
                  className="h-11 w-full opacity-65"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="skeleton-card overflow-hidden rounded-2xl">
          <div className="flex min-h-16 items-center justify-between gap-3 border-b border-slate-100 px-3.5 sm:px-5">
            <div className="flex items-center gap-3">
              <SkeletonBlock tone="strong" className="size-10" />
              <div className="space-y-2">
                <SkeletonBlock tone="strong" className="h-3 w-28" />
                <SkeletonBlock className="h-2 w-48" />
              </div>
            </div>
            <SkeletonBlock className="h-6 w-24 rounded-full" />
          </div>
          <div className="grid grid-cols-2 items-end gap-3 p-3.5 sm:p-5 md:grid-cols-4 xl:grid-cols-[1.3fr_1fr_.7fr_auto]">
            <div className="col-span-2 xl:col-span-1">
              <FieldSkeleton />
            </div>
            <FieldSkeleton />
            <FieldSkeleton />
            <SkeletonBlock
              tone="strong"
              className="col-span-2 h-10 w-full md:col-span-4 xl:col-span-1 xl:w-28"
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
                  <SkeletonBlock tone="strong" className="h-7 w-20" />
                </div>
                <SkeletonBlock tone="strong" className="size-10" />
              </div>
              <SkeletonBlock className="mt-3 h-2 w-28 max-w-full" />
            </article>
          ))}
        </section>

        <div className="grid items-start gap-4 sm:gap-5 xl:grid-cols-[1fr_1.15fr]">
          <section className="skeleton-card overflow-hidden rounded-2xl">
            <div className="flex items-center gap-3 border-b border-slate-100 p-4 sm:p-5">
              <SkeletonBlock tone="strong" className="size-10" />
              <div className="space-y-2">
                <SkeletonBlock tone="strong" className="h-3 w-32" />
                <SkeletonBlock className="h-2 w-40" />
              </div>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="skeleton-action rounded-xl p-3">
                  <div className="flex justify-between">
                    <SkeletonBlock className="h-2.5 w-24" />
                    <SkeletonBlock tone="strong" className="h-2.5 w-12" />
                  </div>
                  <SkeletonBlock className="mt-2 h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          </section>

          <section className="skeleton-card overflow-hidden rounded-2xl">
            <div className="flex items-center gap-3 border-b border-slate-100 p-4 sm:p-5">
              <SkeletonBlock tone="strong" className="size-10" />
              <div className="space-y-2">
                <SkeletonBlock tone="strong" className="h-3 w-32" />
                <SkeletonBlock className="h-2 w-44" />
              </div>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
              {Array.from({ length: 7 }, (_, index) => (
                <div
                  key={index}
                  className="skeleton-action flex items-center gap-3 rounded-xl p-3"
                >
                  <SkeletonBlock tone="strong" className="size-8 shrink-0" />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <SkeletonBlock className="h-2.5 w-12" />
                      <SkeletonBlock className="h-2.5 w-20" />
                    </div>
                    <SkeletonBlock className="mt-2 h-1.5 w-full rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="skeleton-card overflow-hidden rounded-2xl">
          <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-3.5 py-3 sm:px-5">
            <div className="flex items-center gap-3">
              <SkeletonBlock tone="strong" className="size-10" />
              <div className="space-y-2">
                <SkeletonBlock tone="strong" className="h-3 w-28" />
                <SkeletonBlock className="h-2 w-52" />
              </div>
            </div>
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
              <SkeletonBlock className="h-9 w-full sm:w-20" />
              <SkeletonBlock className="h-9 w-full sm:w-20" />
              <SkeletonBlock
                tone="strong"
                className="col-span-2 h-10 w-full sm:w-32"
              />
            </div>
          </div>
          <div className="space-y-3 border-b border-slate-100 p-3.5 sm:p-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2.5">
              <SkeletonBlock tone="strong" className="h-11 w-full" />
              <SkeletonBlock className="h-11 w-28" />
            </div>
            <div className="flex gap-2">
              {Array.from({ length: 3 }, (_, index) => (
                <SkeletonBlock
                  key={index}
                  tone={index === 0 ? "strong" : "default"}
                  className="h-8 w-24 rounded-full"
                />
              ))}
            </div>
          </div>
          <ul className="divide-y divide-slate-100">
            {Array.from({ length: 5 }, (_, index) => (
              <ResultRowSkeleton key={index} />
            ))}
          </ul>
          <div className="flex flex-col gap-3 border-t border-slate-100 px-3.5 py-3 sm:flex-row sm:justify-between sm:px-5">
            <SkeletonBlock className="h-2.5 w-48" />
            <SkeletonBlock className="h-9 w-40" />
          </div>
        </section>
      </main>
      <span className="sr-only">
        Loading class performance, rankings, and student results
      </span>
    </div>
  )
}
