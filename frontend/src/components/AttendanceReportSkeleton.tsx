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

function StudentRowSkeleton() {
  return (
    <div className="skeleton-action rounded-2xl p-3 sm:p-4">
      <div className="flex items-center gap-3">
        <SkeletonBlock tone="strong" className="size-10 shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonBlock tone="strong" className="h-3 w-36 max-w-[70%]" />
          <SkeletonBlock className="h-2 w-28 max-w-[55%]" />
        </div>
        <SkeletonBlock className="h-6 w-16 rounded-full" />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <SkeletonBlock className="h-2 flex-1 rounded-full" />
        <SkeletonBlock tone="strong" className="h-3 w-10" />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <div className="flex flex-1 gap-3">
          <SkeletonBlock className="h-2 w-16" />
          <SkeletonBlock className="h-2 w-16" />
          <SkeletonBlock className="hidden h-2 w-16 sm:block" />
        </div>
        <SkeletonBlock tone="strong" className="h-8 w-20" />
      </div>
    </div>
  )
}

export default function AttendanceReportSkeleton() {
  return (
    <div
      className="attendance-report-skeleton app-skeleton min-h-screen dashboard-bg pb-16"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading attendance report"
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

      <main className="mx-auto max-w-[100rem] space-y-4 p-4 sm:space-y-5 sm:p-6 xl:p-8">
        <section className="attendance-report-skeleton-hero relative overflow-hidden rounded-3xl p-5 sm:p-7">
          <span className="absolute -right-16 -top-20 size-64 rounded-full border border-white/10 bg-white/5" />
          <div className="relative grid items-center gap-6 sm:grid-cols-[1fr_auto]">
            <div>
              <SkeletonBlock
                tone="light"
                className="h-6 w-48 rounded-full opacity-75"
              />
              <SkeletonBlock
                tone="light"
                className="mt-4 h-8 w-72 max-w-[85%]"
              />
              <SkeletonBlock
                tone="light"
                className="mt-3 h-2.5 w-96 max-w-[80%] opacity-65"
              />
            </div>
            <div className="w-full rounded-2xl border border-white/15 bg-white/5 p-4 sm:w-56">
              <SkeletonBlock tone="light" className="h-2.5 w-24 opacity-65" />
              <SkeletonBlock tone="light" className="mt-3 h-10 w-32" />
              <SkeletonBlock
                tone="light"
                className="mt-3 h-2 w-full rounded-full opacity-65"
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
                  <SkeletonBlock tone="strong" className="h-7 w-16" />
                </div>
                <SkeletonBlock tone="strong" className="size-9 sm:size-10" />
              </div>
              <SkeletonBlock className="mt-3 h-2 w-28 max-w-full" />
            </article>
          ))}
        </section>

        <section className="skeleton-card overflow-hidden rounded-2xl">
          <div className="flex min-h-16 items-center gap-3 border-b border-slate-100 px-4 sm:px-5">
            <SkeletonBlock tone="strong" className="size-10" />
            <div className="space-y-2">
              <SkeletonBlock tone="strong" className="h-3 w-28" />
              <SkeletonBlock className="h-2 w-64 max-w-[55vw]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 p-3 max-sm:[&>:first-child]:col-span-2 sm:grid-cols-3 sm:p-4">
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
          </div>
        </section>

        <SkeletonBlock tone="strong" className="h-20 w-full rounded-2xl" />

        <div className="grid items-start gap-4 sm:gap-5 xl:grid-cols-[1.5fr_.5fr]">
          <section className="skeleton-card overflow-hidden rounded-2xl">
            <div className="flex min-h-16 items-center justify-between gap-3 border-b border-slate-100 px-4 sm:px-5">
              <div className="flex items-center gap-3">
                <SkeletonBlock tone="strong" className="size-10" />
                <div className="space-y-2">
                  <SkeletonBlock tone="strong" className="h-3 w-40" />
                  <SkeletonBlock className="h-2 w-24" />
                </div>
              </div>
              <div className="flex gap-2">
                <SkeletonBlock className="h-9 w-16" />
                <SkeletonBlock className="h-9 w-20" />
              </div>
            </div>
            <div className="border-b border-slate-100 p-3 sm:p-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_11rem_auto]">
                <SkeletonBlock
                  tone="strong"
                  className="col-span-2 h-11 w-full sm:col-span-1"
                />
                <SkeletonBlock tone="strong" className="h-11 w-full" />
                <SkeletonBlock tone="strong" className="h-11 w-full sm:w-20" />
              </div>
              <div className="mt-3 flex gap-2">
                {["w-20", "w-20", "w-24", "w-20"].map((width, index) => (
                  <SkeletonBlock
                    key={index}
                    className={`h-7 ${width} rounded-full`}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2.5 p-3 sm:p-4">
              {Array.from({ length: 5 }, (_, index) => (
                <StudentRowSkeleton key={index} />
              ))}
            </div>
          </section>

          <aside className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-1">
            <section className="skeleton-card rounded-2xl p-5">
              <SkeletonBlock tone="strong" className="h-3 w-32" />
              <div className="mx-auto mt-5 grid size-40 place-items-center rounded-full border-[18px] border-slate-100">
                <div className="space-y-2 text-center">
                  <SkeletonBlock tone="strong" className="h-7 w-16" />
                  <SkeletonBlock className="h-2 w-20" />
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {Array.from({ length: 3 }, (_, index) => (
                  <SkeletonBlock key={index} className="h-12 w-full" />
                ))}
              </div>
            </section>
            <section className="skeleton-card rounded-2xl p-5">
              <SkeletonBlock tone="strong" className="h-3 w-28" />
              <div className="mt-4 space-y-4">
                {Array.from({ length: 4 }, (_, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 space-y-2">
                      <SkeletonBlock tone="strong" className="h-2.5 w-28" />
                      <SkeletonBlock className="h-2 w-16" />
                    </div>
                    <SkeletonBlock className="h-3 w-10" />
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </main>
      <span className="sr-only">
        Loading attendance metrics and student records
      </span>
    </div>
  )
}
