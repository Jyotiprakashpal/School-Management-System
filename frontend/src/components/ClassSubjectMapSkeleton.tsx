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
      <SkeletonBlock className="mb-2 h-2 w-16 rounded-md" />
      <SkeletonBlock tone="strong" className="h-11 w-full" />
    </div>
  )
}

function MappingRowSkeleton() {
  return (
    <li className="skeleton-action rounded-2xl p-3 sm:grid sm:grid-cols-[minmax(10rem,13rem)_minmax(0,1fr)_auto_auto] sm:items-center sm:gap-3 sm:px-4">
      <div className="flex items-center gap-3">
        <SkeletonBlock tone="strong" className="size-10 shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonBlock tone="strong" className="h-3 w-28" />
          <div className="flex gap-2">
            <SkeletonBlock className="h-2 w-16" />
            <SkeletonBlock className="h-5 w-16 rounded-full" />
          </div>
        </div>
      </div>
      <SkeletonBlock tone="strong" className="mt-3 h-10 w-full sm:mt-0" />
      <div className="mt-3 flex h-10 items-center sm:mt-0">
        <SkeletonBlock className="h-10 w-28" />
      </div>
      <SkeletonBlock className="mt-3 h-10 w-full sm:mt-0 sm:w-10" />
    </li>
  )
}

export default function ClassSubjectMapSkeleton() {
  return (
    <div
      className="class-subject-map-skeleton app-skeleton min-h-screen dashboard-bg pb-16"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading class subject map"
    >
      <header className="skeleton-header flex min-h-20 items-center border-b px-4 sm:px-6 lg:px-7">
        <div className="ml-12 space-y-2 lg:ml-0">
          <SkeletonBlock tone="strong" className="h-5 w-48" />
          <SkeletonBlock className="h-2.5 w-80 max-w-[55vw]" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <SkeletonBlock className="hidden h-10 w-32 sm:block" />
          <SkeletonBlock tone="strong" className="size-11 rounded-2xl" />
          <SkeletonBlock className="hidden h-11 w-28 sm:block" />
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-4 p-3 sm:space-y-5 sm:p-6 xl:p-8">
        <section className="class-subject-map-skeleton-hero relative overflow-hidden rounded-3xl p-5 sm:p-7">
          <span className="absolute -right-20 -top-24 size-72 rounded-full border border-white/10 bg-white/5" />
          <span className="absolute -bottom-28 left-1/3 size-60 rounded-full bg-white/5" />
          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center">
            <div>
              <SkeletonBlock tone="light" className="h-7 w-44 rounded-full" />
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
                <SkeletonBlock tone="light" className="h-11 w-full sm:w-36" />
                <SkeletonBlock
                  tone="light"
                  className="h-11 w-full opacity-70 sm:w-40"
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
                </div>
                <SkeletonBlock tone="light" className="size-12" />
              </div>
              <SkeletonBlock
                tone="light"
                className="mt-4 h-2.5 w-full rounded-full opacity-70"
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
          <div className="flex min-h-16 items-center justify-between gap-3 border-b border-slate-100 px-3.5 sm:px-5">
            <div className="flex items-center gap-3">
              <SkeletonBlock tone="strong" className="size-10" />
              <div className="space-y-2">
                <SkeletonBlock tone="strong" className="h-3 w-32" />
                <SkeletonBlock className="h-2 w-48" />
              </div>
            </div>
            <SkeletonBlock className="h-6 w-28 rounded-full" />
          </div>
          <div className="grid grid-cols-2 items-end gap-3 p-3.5 sm:p-5 xl:grid-cols-[1fr_1fr_1fr_auto]">
            <FieldSkeleton />
            <FieldSkeleton />
            <div className="col-span-2 xl:col-span-1">
              <FieldSkeleton />
            </div>
            <SkeletonBlock className="col-span-2 h-10 w-full xl:col-span-1 xl:w-36" />
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
                  <SkeletonBlock tone="strong" className="h-7 w-14" />
                </div>
                <SkeletonBlock tone="strong" className="size-10" />
              </div>
              <SkeletonBlock className="mt-3 h-2 w-28 max-w-full" />
            </article>
          ))}
        </section>

        <div className="grid items-start gap-4 sm:gap-5 xl:grid-cols-[1fr_20rem]">
          <section className="skeleton-card overflow-hidden rounded-2xl">
            <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-3.5 py-3 sm:px-5">
              <div className="flex items-center gap-3">
                <SkeletonBlock tone="strong" className="size-10" />
                <div className="space-y-2">
                  <SkeletonBlock tone="strong" className="h-3 w-36" />
                  <SkeletonBlock className="h-2 w-52" />
                </div>
              </div>
              <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
                <SkeletonBlock className="h-10 w-full sm:w-24" />
                <SkeletonBlock tone="strong" className="h-10 w-full sm:w-28" />
              </div>
            </div>
            <div className="space-y-3 border-b border-slate-100 p-3.5 sm:p-5">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2.5">
                <SkeletonBlock tone="strong" className="h-11 w-full" />
                <SkeletonBlock className="h-11 w-28" />
              </div>
              <div className="flex gap-2">
                {Array.from({ length: 4 }, (_, index) => (
                  <SkeletonBlock
                    key={index}
                    tone={index === 0 ? "strong" : "default"}
                    className="h-8 w-20 rounded-full"
                  />
                ))}
              </div>
            </div>
            <ul className="grid gap-2.5 p-3.5 sm:p-5">
              {Array.from({ length: 5 }, (_, index) => (
                <MappingRowSkeleton key={index} />
              ))}
            </ul>
            <footer className="flex flex-col gap-3 border-t border-slate-100 px-3.5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <SkeletonBlock className="h-2.5 w-44" />
              <div className="grid grid-cols-2 gap-2.5">
                <SkeletonBlock className="h-11 w-full sm:w-24" />
                <SkeletonBlock tone="strong" className="h-11 w-full sm:w-32" />
              </div>
            </footer>
          </section>

          <aside className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-1">
            <section className="skeleton-card overflow-hidden rounded-2xl">
              <div className="flex items-center gap-3 border-b border-slate-100 p-4 sm:p-5">
                <SkeletonBlock tone="strong" className="size-10" />
                <div className="space-y-2">
                  <SkeletonBlock tone="strong" className="h-3 w-32" />
                  <SkeletonBlock className="h-2 w-28" />
                </div>
              </div>
              <div className="p-4 sm:p-5">
                <div className="flex items-end justify-between">
                  <SkeletonBlock tone="strong" className="h-8 w-24" />
                  <SkeletonBlock className="h-6 w-20 rounded-full" />
                </div>
                <SkeletonBlock className="mt-4 h-2.5 w-full rounded-full" />
                <SkeletonBlock className="mt-4 h-2.5 w-full" />
                <SkeletonBlock className="mt-2 h-2.5 w-4/5" />
              </div>
            </section>

            <section className="skeleton-card overflow-hidden rounded-2xl">
              <div className="flex items-center gap-3 border-b border-slate-100 p-4 sm:p-5">
                <SkeletonBlock tone="strong" className="size-10" />
                <div className="space-y-2">
                  <SkeletonBlock tone="strong" className="h-3 w-28" />
                  <SkeletonBlock className="h-2 w-36" />
                </div>
              </div>
              <div className="space-y-4 p-4 sm:p-5">
                {Array.from({ length: 5 }, (_, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <SkeletonBlock tone="strong" className="size-9 shrink-0" />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <SkeletonBlock className="h-2.5 w-24" />
                        <SkeletonBlock className="h-2.5 w-6" />
                      </div>
                      <SkeletonBlock className="mt-2 h-1.5 w-full rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </main>
      <span className="sr-only">
        Loading class curriculum, teacher assignments, and timetable capacity
      </span>
    </div>
  )
}
