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

function LearnerRowSkeleton() {
  return (
    <div className="skeleton-action rounded-2xl border-l-4 p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <SkeletonBlock tone="strong" className="size-10 shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBlock tone="strong" className="h-3 w-36" />
            <SkeletonBlock className="h-2 w-28" />
          </div>
          <SkeletonBlock className="ml-auto h-6 w-16 rounded-full sm:hidden" />
        </div>
        <div className="flex items-center gap-3">
          <SkeletonBlock className="hidden h-6 w-16 rounded-full sm:block" />
          <div className="grid flex-1 grid-cols-3 gap-1 rounded-xl border border-slate-100 p-1 sm:w-72">
            {Array.from({ length: 3 }, (_, index) => (
              <SkeletonBlock
                key={index}
                tone={index === 0 ? "strong" : "default"}
                className="h-9 w-full"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DailyAttendanceSkeleton() {
  return (
    <div
      className="daily-attendance-skeleton app-skeleton min-h-screen dashboard-bg pb-28 sm:pb-16"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading daily attendance"
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

      <main className="mx-auto max-w-[100rem] space-y-4 p-4 sm:space-y-5 sm:p-6 xl:p-8">
        <section className="daily-attendance-skeleton-hero relative overflow-hidden rounded-3xl p-5 sm:p-7">
          <span className="absolute -right-16 -top-20 size-64 rounded-full border border-white/10 bg-white/5" />
          <span className="absolute -bottom-28 left-1/3 size-56 rounded-full border-[34px] border-white/5" />
          <div className="relative grid items-center gap-6 lg:grid-cols-[1fr_25rem]">
            <div>
              <SkeletonBlock
                tone="light"
                className="h-7 w-64 max-w-[75%] rounded-full opacity-75"
              />
              <SkeletonBlock
                tone="light"
                className="mt-4 h-9 w-72 max-w-[85%]"
              />
              <SkeletonBlock
                tone="light"
                className="mt-3 h-2.5 w-52 opacity-65"
              />
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
              <div className="flex items-end justify-between">
                <SkeletonBlock tone="light" className="h-2.5 w-28 opacity-65" />
                <SkeletonBlock tone="light" className="h-9 w-20" />
              </div>
              <SkeletonBlock
                tone="light"
                className="mt-4 h-2.5 w-full rounded-full opacity-65"
              />
              <div className="mt-3 flex gap-4">
                <SkeletonBlock tone="light" className="h-2 w-16 opacity-65" />
                <SkeletonBlock tone="light" className="h-2 w-16 opacity-65" />
                <SkeletonBlock tone="light" className="h-2 w-16 opacity-65" />
              </div>
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
                  <SkeletonBlock className="h-2.5 w-20" />
                  <SkeletonBlock tone="strong" className="h-7 w-14" />
                </div>
                <SkeletonBlock tone="strong" className="size-9 sm:size-10" />
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
                <SkeletonBlock tone="strong" className="h-3 w-24" />
                <SkeletonBlock className="h-2 w-64 max-w-[48vw]" />
              </div>
            </div>
            <SkeletonBlock className="h-9 w-24" />
          </div>
          <div className="grid grid-cols-2 gap-3 p-3 max-sm:[&>:last-child]:col-span-2 sm:grid-cols-3 sm:p-4">
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
          </div>
        </section>

        <section className="skeleton-card overflow-hidden rounded-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
            <div className="flex items-center gap-3">
              <SkeletonBlock tone="strong" className="size-10" />
              <div className="space-y-2">
                <SkeletonBlock tone="strong" className="h-3 w-32" />
                <SkeletonBlock className="h-2 w-52 max-w-[45vw]" />
              </div>
            </div>
            <div className="flex gap-2">
              <SkeletonBlock className="h-9 w-24" />
              <SkeletonBlock className="h-9 w-24" />
              <SkeletonBlock className="h-9 w-20" />
            </div>
          </div>
          <div className="border-b border-slate-100 p-3 sm:p-4">
            <SkeletonBlock tone="strong" className="h-11 w-full" />
            <div className="mt-3 flex gap-2 overflow-hidden">
              {["w-20", "w-24", "w-20", "w-20", "w-20"].map((width, index) => (
                <SkeletonBlock
                  key={index}
                  className={`h-7 shrink-0 ${width} rounded-full`}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2.5 p-3 sm:p-4">
            {Array.from({ length: 6 }, (_, index) => (
              <LearnerRowSkeleton key={index} />
            ))}
          </div>
        </section>
      </main>

      <div className="skeleton-card fixed inset-x-0 bottom-0 z-30 flex items-center justify-between border-t px-4 py-3 sm:static sm:mx-6 sm:rounded-2xl xl:mx-8">
        <SkeletonBlock className="h-3 w-24" />
        <div className="flex gap-2">
          <SkeletonBlock className="h-10 w-20" />
          <SkeletonBlock tone="strong" className="h-10 w-36" />
        </div>
      </div>
      <span className="sr-only">
        Loading class roster and attendance records
      </span>
    </div>
  )
}
