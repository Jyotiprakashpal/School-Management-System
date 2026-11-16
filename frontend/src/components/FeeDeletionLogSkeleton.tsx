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

function AuditRowSkeleton() {
  return (
    <div className="skeleton-action rounded-2xl p-4 lg:grid lg:grid-cols-[1.2fr_.75fr_1fr_.7fr_.75fr_1fr_1.1fr_auto] lg:items-center lg:gap-4 lg:rounded-none lg:border-x-0 lg:border-t-0">
      <div className="flex items-center gap-3">
        <SkeletonBlock tone="strong" className="size-9 shrink-0" />
        <div className="space-y-2">
          <SkeletonBlock tone="strong" className="h-2.5 w-28" />
          <SkeletonBlock className="h-2 w-20" />
        </div>
      </div>
      <SkeletonBlock className="mt-4 h-2.5 w-20 lg:mt-0" />
      <SkeletonBlock className="mt-3 h-2.5 w-24 lg:mt-0" />
      <SkeletonBlock tone="strong" className="mt-3 h-3 w-16 lg:mt-0" />
      <SkeletonBlock className="mt-3 h-6 w-20 rounded-full lg:mt-0" />
      <SkeletonBlock className="mt-3 h-2.5 w-24 lg:mt-0" />
      <div className="mt-3 space-y-2 lg:mt-0">
        <SkeletonBlock className="h-2.5 w-full" />
        <SkeletonBlock className="h-2.5 w-20" />
      </div>
      <SkeletonBlock tone="strong" className="mt-4 h-8 w-20 lg:mt-0" />
    </div>
  )
}

export default function FeeDeletionLogSkeleton() {
  return (
    <div
      className="fee-deletion-log-skeleton app-skeleton min-h-screen dashboard-bg pb-16"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading fee deletion log"
    >
      <header className="skeleton-header flex min-h-20 items-center border-b px-4 sm:px-6 lg:px-7">
        <div className="ml-12 space-y-2 lg:ml-0">
          <SkeletonBlock tone="strong" className="h-5 w-44" />
          <SkeletonBlock className="h-2.5 w-72 max-w-[55vw]" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <SkeletonBlock className="hidden h-10 w-32 sm:block" />
          <SkeletonBlock tone="strong" className="size-11 rounded-2xl" />
          <SkeletonBlock className="hidden h-11 w-28 sm:block" />
        </div>
      </header>

      <main className="mx-auto max-w-[100rem] space-y-4 p-4 sm:space-y-5 sm:p-6 xl:p-8">
        <section className="fee-deletion-skeleton-hero relative overflow-hidden rounded-3xl p-5 sm:p-7">
          <span className="absolute -right-16 -top-20 size-64 rounded-full border border-white/10 bg-white/5" />
          <span className="absolute -bottom-28 left-1/3 size-56 rounded-full border-[36px] border-white/5" />
          <div className="relative grid items-center gap-6 lg:grid-cols-[1fr_22rem]">
            <div>
              <SkeletonBlock
                tone="light"
                className="h-7 w-44 rounded-full opacity-75"
              />
              <SkeletonBlock
                tone="light"
                className="mt-4 h-9 w-80 max-w-[88%]"
              />
              <SkeletonBlock
                tone="light"
                className="mt-3 h-2.5 w-full max-w-xl opacity-65"
              />
              <SkeletonBlock
                tone="light"
                className="mt-2 h-2.5 w-4/5 max-w-lg opacity-65"
              />
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <SkeletonBlock
                    tone="light"
                    className="h-2.5 w-24 opacity-65"
                  />
                  <SkeletonBlock tone="light" className="h-8 w-28" />
                </div>
                <SkeletonBlock tone="light" className="size-11" />
              </div>
              <SkeletonBlock tone="light" className="mt-4 h-10 w-full" />
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
                  <SkeletonBlock tone="strong" className="h-7 w-20" />
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
                <SkeletonBlock tone="strong" className="h-3 w-44" />
                <SkeletonBlock className="h-2 w-36" />
              </div>
            </div>
            <SkeletonBlock className="h-9 w-24" />
          </div>

          <div className="grid grid-cols-2 gap-3 border-b border-slate-100 p-3 sm:grid-cols-[1fr_10rem_10rem_auto] sm:p-4 xl:grid-cols-[1fr_12rem_12rem_auto]">
            <SkeletonBlock
              tone="strong"
              className="col-span-2 h-11 w-full sm:col-span-1"
            />
            <SkeletonBlock tone="strong" className="h-11 w-full" />
            <SkeletonBlock tone="strong" className="h-11 w-full" />
            <SkeletonBlock
              tone="strong"
              className="col-span-2 h-11 w-full sm:col-span-1 sm:w-20"
            />
          </div>

          <div className="hidden grid-cols-[1.2fr_.75fr_1fr_.7fr_.75fr_1fr_1.1fr_auto] gap-4 border-b border-slate-100 p-4 lg:grid">
            {Array.from({ length: 8 }, (_, index) => (
              <SkeletonBlock key={index} className="h-2 w-16" />
            ))}
          </div>
          <div className="grid gap-3 p-3 lg:block lg:p-0">
            {Array.from({ length: 5 }, (_, index) => (
              <AuditRowSkeleton key={index} />
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 p-4">
            <SkeletonBlock className="h-2.5 w-36" />
            <div className="flex gap-2">
              <SkeletonBlock className="size-9" />
              <SkeletonBlock tone="strong" className="size-9" />
              <SkeletonBlock className="size-9" />
            </div>
          </div>
        </section>
      </main>
      <span className="sr-only">
        Loading deletion metrics and audit records
      </span>
    </div>
  )
}
