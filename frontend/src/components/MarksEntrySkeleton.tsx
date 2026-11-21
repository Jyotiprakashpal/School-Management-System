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

function MarkRowSkeleton() {
  return (
    <li className="skeleton-action grid gap-3 rounded-2xl p-3.5 sm:p-4 lg:grid-cols-[minmax(0,1.2fr)_auto_minmax(0,1fr)] lg:items-center lg:gap-5">
      <div className="flex items-center gap-3">
        <SkeletonBlock tone="strong" className="size-11 shrink-0 rounded-2xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonBlock tone="strong" className="h-3 w-32" />
          <SkeletonBlock className="h-2 w-40" />
        </div>
        <SkeletonBlock className="h-6 w-14 rounded-full lg:hidden" />
      </div>
      <div className="flex items-center gap-3">
        <SkeletonBlock tone="strong" className="h-11 w-24" />
        <SkeletonBlock className="h-2.5 w-10" />
        <SkeletonBlock className="hidden h-7 w-20 lg:block" />
      </div>
      <SkeletonBlock className="h-10 w-full" />
    </li>
  )
}

export default function MarksEntrySkeleton() {
  return (
    <div
      className="marks-entry-skeleton app-skeleton min-h-screen dashboard-bg pb-16"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading marks entry"
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

      <main className="mx-auto w-full min-w-0 max-w-none space-y-4 p-3 sm:space-y-5 sm:p-6 xl:p-8">
        <section className="marks-entry-skeleton-hero relative overflow-hidden rounded-3xl p-5 sm:p-7">
          <span className="absolute -right-20 -top-24 size-72 rounded-full border border-white/10 bg-white/5" />
          <span className="absolute -bottom-28 left-1/3 size-60 rounded-full bg-white/5" />
          <div className="relative flex flex-wrap items-center gap-4">
            <SkeletonBlock
              tone="light"
              className="size-14 shrink-0 rounded-2xl"
            />
            <div className="min-w-0 flex-1 basis-56">
              <SkeletonBlock tone="light" className="h-2.5 w-40 opacity-65" />
              <SkeletonBlock tone="light" className="mt-3 h-7 w-44" />
              <SkeletonBlock
                tone="light"
                className="mt-2 h-2.5 w-72 max-w-full opacity-70"
              />
            </div>
            <div className="flex items-center gap-3">
              <SkeletonBlock tone="light" className="size-11 rounded-full" />
              <div className="space-y-2">
                <SkeletonBlock tone="light" className="h-2.5 w-16" />
                <SkeletonBlock tone="light" className="h-2 w-20 opacity-60" />
              </div>
            </div>
            <SkeletonBlock tone="light" className="h-6 w-24 rounded-full" />
          </div>
          <div className="relative mt-5 grid grid-cols-2 items-end gap-3 rounded-2xl border border-white/20 bg-white p-3.5 sm:p-5 md:grid-cols-4 xl:grid-cols-[1.3fr_1fr_.7fr_1fr_.7fr_auto]">
            <div className="col-span-2 xl:col-span-1">
              <FieldSkeleton />
            </div>
            <FieldSkeleton />
            <FieldSkeleton />
            <div className="col-span-2 md:col-span-2 xl:col-span-1">
              <FieldSkeleton />
            </div>
            <FieldSkeleton />
            <SkeletonBlock
              tone="strong"
              className="col-span-2 h-10 w-full md:col-span-1 xl:w-32"
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

        <div className="grid items-start gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_17rem]">
          <section className="skeleton-card overflow-hidden rounded-2xl">
            <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-3.5 py-3 sm:px-5">
              <div className="flex items-center gap-3">
                <SkeletonBlock tone="strong" className="size-10" />
                <div className="space-y-2">
                  <SkeletonBlock tone="strong" className="h-3 w-36" />
                  <SkeletonBlock className="h-2 w-48" />
                </div>
              </div>
              <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto">
                {Array.from({ length: 3 }, (_, index) => (
                  <SkeletonBlock key={index} className="h-9 w-full sm:w-20" />
                ))}
              </div>
            </div>
            <div className="skeleton-action space-y-3 border-b border-slate-100 p-3.5 sm:p-4">
              <div className="flex items-center gap-3">
                <SkeletonBlock className="h-2.5 flex-1 rounded-full" />
                <SkeletonBlock className="h-7 w-24 rounded-full" />
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <SkeletonBlock tone="strong" className="h-11 w-full" />
                <div className="flex gap-2">
                  {Array.from({ length: 4 }, (_, index) => (
                    <SkeletonBlock
                      key={index}
                      tone={index === 0 ? "strong" : "default"}
                      className="h-9 w-20 rounded-full"
                    />
                  ))}
                </div>
              </div>
            </div>
            <ul className="space-y-2.5 p-2.5 sm:p-3">
              {Array.from({ length: 11 }, (_, index) => (
                <MarkRowSkeleton key={index} />
              ))}
            </ul>
            <footer className="flex flex-col gap-3 border-t border-slate-100 px-3.5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <SkeletonBlock className="h-2.5 w-56" />
              <SkeletonBlock tone="strong" className="h-10 w-full sm:w-32" />
            </footer>
          </section>

          <aside className="skeleton-card overflow-hidden rounded-2xl">
            <div className="flex items-center gap-3 border-b border-slate-100 p-4 sm:p-5">
              <SkeletonBlock tone="strong" className="size-10" />
              <div className="space-y-2">
                <SkeletonBlock tone="strong" className="h-3 w-32" />
                <SkeletonBlock className="h-2 w-28" />
              </div>
            </div>
            <div className="skeleton-action border-b border-slate-100 p-4 sm:p-5">
              <div className="flex items-start justify-between">
                <div>
                  <SkeletonBlock className="h-2.5 w-16" />
                  <SkeletonBlock tone="strong" className="mt-3 h-8 w-20" />
                </div>
                <SkeletonBlock tone="strong" className="size-12" />
              </div>
              <SkeletonBlock className="mt-4 h-2 w-full rounded-full" />
              <div className="mt-3 flex justify-between">
                <SkeletonBlock className="h-2 w-16" />
                <SkeletonBlock className="h-2 w-20" />
              </div>
            </div>
            <div className="space-y-3 p-4 sm:p-5">
              {Array.from({ length: 7 }, (_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <SkeletonBlock tone="strong" className="size-8 shrink-0" />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <SkeletonBlock className="h-2.5 w-16" />
                      <SkeletonBlock className="h-2.5 w-6" />
                    </div>
                    <SkeletonBlock className="mt-2 h-1.5 w-full rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </main>
      <span className="sr-only">
        Loading student roster, marks register, and grade distribution
      </span>
    </div>
  )
}
