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

function SubjectCardSkeleton() {
  return (
    <article className="skeleton-card flex min-h-64 flex-col overflow-hidden rounded-2xl">
      <SkeletonBlock tone="strong" className="h-1.5 w-full rounded-none" />
      <div className="flex flex-1 flex-col gap-3.5 p-4">
        <div className="flex items-start gap-3">
          <SkeletonBlock tone="strong" className="size-11 shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBlock tone="strong" className="h-3 w-28" />
            <SkeletonBlock className="h-2 w-16" />
          </div>
          <SkeletonBlock className="h-6 w-16 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <SkeletonBlock className="h-14 w-full" />
          <SkeletonBlock className="h-14 w-full" />
        </div>
        <SkeletonBlock className="h-11 w-full" />
        <div className="mt-auto flex gap-2 border-t border-slate-100 pt-3">
          <SkeletonBlock tone="strong" className="h-8 flex-1" />
          <SkeletonBlock className="size-8 shrink-0" />
          <SkeletonBlock className="size-8 shrink-0" />
        </div>
      </div>
    </article>
  )
}

export default function SubjectsSkeleton() {
  return (
    <div
      className="subjects-skeleton app-skeleton min-h-screen dashboard-bg pb-16"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading subjects"
    >
      <header className="skeleton-header flex min-h-20 items-center border-b px-4 sm:px-6 lg:px-7">
        <div className="ml-12 space-y-2 lg:ml-0">
          <SkeletonBlock tone="strong" className="h-5 w-32" />
          <SkeletonBlock className="h-2.5 w-72 max-w-[55vw]" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <SkeletonBlock className="hidden h-10 w-32 sm:block" />
          <SkeletonBlock tone="strong" className="size-11 rounded-2xl" />
          <SkeletonBlock className="hidden h-11 w-28 sm:block" />
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-4 p-3 sm:space-y-5 sm:p-6 xl:p-8">
        <section className="subjects-skeleton-hero relative overflow-hidden rounded-3xl p-5 sm:p-7">
          <span className="absolute -right-20 -top-24 size-72 rounded-full border border-white/10 bg-white/5" />
          <span className="absolute -bottom-28 left-1/3 size-60 rounded-full bg-white/5" />
          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center">
            <div>
              <SkeletonBlock tone="light" className="h-7 w-40 rounded-full" />
              <SkeletonBlock
                tone="light"
                className="mt-5 h-2.5 w-40 opacity-60"
              />
              <SkeletonBlock
                tone="light"
                className="mt-3 h-9 w-80 max-w-[85%]"
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
                  className="h-11 w-full opacity-70 sm:w-32"
                />
              </div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/5 p-4 sm:p-5">
              <div className="flex items-start justify-between">
                <div>
                  <SkeletonBlock
                    tone="light"
                    className="h-2.5 w-32 opacity-65"
                  />
                  <SkeletonBlock tone="light" className="mt-3 h-8 w-28" />
                  <SkeletonBlock
                    tone="light"
                    className="mt-2 h-2 w-36 opacity-60"
                  />
                </div>
                <SkeletonBlock tone="light" className="size-12" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {Array.from({ length: 4 }, (_, index) => (
                  <SkeletonBlock
                    key={index}
                    tone="light"
                    className="h-10 w-full opacity-70"
                  />
                ))}
              </div>
            </div>
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
                  <SkeletonBlock tone="strong" className="h-7 w-12" />
                </div>
                <SkeletonBlock tone="strong" className="size-10" />
              </div>
              <SkeletonBlock className="mt-3 h-2 w-28 max-w-full" />
            </article>
          ))}
        </section>

        <section className="skeleton-card overflow-hidden rounded-2xl">
          <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-3.5 py-3 sm:px-5">
            <div className="flex items-center gap-3">
              <SkeletonBlock tone="strong" className="size-10" />
              <div className="space-y-2">
                <SkeletonBlock tone="strong" className="h-3 w-28" />
                <SkeletonBlock className="h-2 w-32" />
              </div>
            </div>
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
              <SkeletonBlock className="h-10 w-full sm:w-24" />
              <SkeletonBlock tone="strong" className="h-10 w-full sm:w-28" />
            </div>
          </div>
          <div className="space-y-3 border-b border-slate-100 p-3.5 sm:p-4">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-[1fr_11rem_auto]">
              <SkeletonBlock
                tone="strong"
                className="col-span-2 h-11 w-full sm:col-span-1"
              />
              <SkeletonBlock tone="strong" className="h-11 w-full" />
              <SkeletonBlock className="h-11 w-full sm:w-24" />
            </div>
            <div className="flex gap-2 overflow-hidden">
              {Array.from({ length: 5 }, (_, index) => (
                <SkeletonBlock
                  key={index}
                  tone={index === 0 ? "strong" : "default"}
                  className="h-8 w-20 shrink-0 rounded-full"
                />
              ))}
            </div>
          </div>

          <div className="grid gap-3 p-3.5 sm:grid-cols-2 sm:gap-4 sm:p-4 2xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <SubjectCardSkeleton key={index} />
            ))}
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <SkeletonBlock className="h-2.5 w-40" />
            <div className="flex gap-2">
              <SkeletonBlock className="h-9 w-24" />
              <SkeletonBlock tone="strong" className="h-9 w-28" />
            </div>
          </div>
        </section>
      </main>
      <span className="sr-only">
        Loading subject catalog, teaching assignments, and class coverage
      </span>
    </div>
  )
}
