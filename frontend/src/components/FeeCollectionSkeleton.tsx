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

function PanelHeaderSkeleton({ action = false }: { action?: boolean }) {
  return (
    <div className="flex min-h-16 items-center justify-between gap-3 border-b border-slate-100 px-4 sm:px-5">
      <div className="flex items-center gap-3">
        <SkeletonBlock tone="strong" className="size-10" />
        <div className="space-y-2">
          <SkeletonBlock tone="strong" className="h-3 w-36" />
          <SkeletonBlock className="h-2 w-56 max-w-[42vw]" />
        </div>
      </div>
      {action && <SkeletonBlock className="h-8 w-24 rounded-full" />}
    </div>
  )
}

function FeeHeadSkeleton() {
  return (
    <div className="skeleton-action flex items-center gap-3 rounded-2xl p-3 sm:gap-4 sm:p-4">
      <SkeletonBlock tone="strong" className="size-6 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <SkeletonBlock tone="strong" className="h-3 w-32" />
          <SkeletonBlock className="h-6 w-16 rounded-full" />
        </div>
        <SkeletonBlock className="mt-3 h-1.5 w-full rounded-full" />
        <div className="mt-3 grid grid-cols-3 gap-2">
          <SkeletonBlock className="h-2.5 w-20 max-w-full" />
          <SkeletonBlock className="h-2.5 w-20 max-w-full" />
          <SkeletonBlock className="ml-auto h-2.5 w-20 max-w-full" />
        </div>
      </div>
    </div>
  )
}

function TransactionSkeleton() {
  return (
    <div className="skeleton-action rounded-2xl p-4 lg:grid lg:grid-cols-[.75fr_1.1fr_1fr_.75fr_.75fr_.65fr_auto] lg:items-center lg:gap-4 lg:rounded-none lg:border-x-0 lg:border-t-0">
      {Array.from({ length: 7 }, (_, index) => (
        <SkeletonBlock
          key={index}
          tone={
            index === 0 || index === 3 || index === 6 ? "strong" : "default"
          }
          className="mt-3 h-2.5 w-20 lg:mt-0"
        />
      ))}
    </div>
  )
}

export default function FeeCollectionSkeleton() {
  return (
    <div
      className="fee-collection-skeleton app-skeleton min-h-screen dashboard-bg pb-16"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading fee collection"
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

      <main className="mx-auto w-full min-w-0 max-w-none space-y-4 p-4 sm:space-y-5 sm:p-6 xl:p-8">
        <section className="fee-collection-skeleton-hero relative overflow-hidden rounded-3xl p-5 sm:p-7">
          <span className="absolute -right-16 -top-20 size-64 rounded-full border border-white/10 bg-white/5" />
          <span className="absolute -bottom-28 left-1/3 size-56 rounded-full border-[36px] border-white/5" />
          <div className="relative grid items-center gap-6 lg:grid-cols-[1fr_24rem]">
            <div>
              <SkeletonBlock
                tone="light"
                className="h-7 w-48 rounded-full opacity-75"
              />
              <SkeletonBlock
                tone="light"
                className="mt-4 h-9 w-96 max-w-[88%]"
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <SkeletonBlock tone="light" className="h-2 w-24 opacity-65" />
                  <SkeletonBlock tone="light" className="h-8 w-24" />
                </div>
                <div className="space-y-2 border-l border-white/10 pl-3">
                  <SkeletonBlock tone="light" className="h-2 w-20 opacity-65" />
                  <SkeletonBlock tone="light" className="h-8 w-24" />
                </div>
              </div>
              <SkeletonBlock
                tone="light"
                className="mt-4 h-2.5 w-full rounded-full opacity-65"
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
                  <SkeletonBlock tone="strong" className="h-7 w-20" />
                </div>
                <SkeletonBlock tone="strong" className="size-9 sm:size-10" />
              </div>
              <SkeletonBlock className="mt-3 h-2 w-28 max-w-full" />
            </article>
          ))}
        </section>

        <section className="skeleton-card overflow-hidden rounded-2xl">
          <PanelHeaderSkeleton action />
          <div className="p-4 sm:p-5">
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <SkeletonBlock tone="strong" className="h-11 flex-1" />
              <SkeletonBlock tone="strong" className="h-11 w-full sm:w-24" />
              <SkeletonBlock className="h-11 w-full sm:w-20" />
            </div>
            <div className="mt-4 flex gap-2.5 overflow-hidden sm:grid sm:grid-cols-3 xl:grid-cols-6">
              {Array.from({ length: 6 }, (_, index) => (
                <div
                  key={index}
                  className="skeleton-action min-w-56 rounded-2xl p-3 sm:min-w-0"
                >
                  <div className="flex items-center gap-3">
                    <SkeletonBlock tone="strong" className="size-9 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <SkeletonBlock tone="strong" className="h-2.5 w-24" />
                      <SkeletonBlock className="h-2 w-20" />
                    </div>
                  </div>
                  <div className="mt-3 flex justify-between">
                    <SkeletonBlock className="h-2 w-14" />
                    <SkeletonBlock className="h-5 w-16 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid items-start gap-4 sm:gap-5 xl:grid-cols-[1.1fr_.9fr]">
          <div className="space-y-4 sm:space-y-5">
            <section className="fee-collection-account-skeleton relative overflow-hidden rounded-2xl p-4 sm:p-6">
              <div className="flex items-center gap-4">
                <SkeletonBlock
                  tone="light"
                  className="size-16 shrink-0 sm:size-20"
                />
                <div className="flex-1">
                  <SkeletonBlock tone="light" className="h-5 w-40" />
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <SkeletonBlock
                      tone="light"
                      className="h-2 w-28 opacity-65"
                    />
                    <SkeletonBlock
                      tone="light"
                      className="h-2 w-28 opacity-65"
                    />
                    <SkeletonBlock
                      tone="light"
                      className="h-2 w-32 opacity-65"
                    />
                    <SkeletonBlock
                      tone="light"
                      className="h-2 w-28 opacity-65"
                    />
                  </div>
                </div>
              </div>
              <SkeletonBlock
                tone="light"
                className="mt-5 h-2 w-full rounded-full opacity-65"
              />
              <div className="mt-3 grid grid-cols-3 gap-2">
                {Array.from({ length: 3 }, (_, index) => (
                  <SkeletonBlock
                    key={index}
                    tone="light"
                    className="h-14 w-full opacity-65"
                  />
                ))}
              </div>
            </section>

            <section className="skeleton-card overflow-hidden rounded-2xl">
              <PanelHeaderSkeleton action />
              <div className="space-y-2.5 p-3 sm:p-4">
                {Array.from({ length: 4 }, (_, index) => (
                  <FeeHeadSkeleton key={index} />
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 sm:px-5">
                <SkeletonBlock className="h-2.5 w-28" />
                <SkeletonBlock tone="strong" className="h-3 w-32" />
              </div>
            </section>
          </div>

          <section className="skeleton-card overflow-hidden rounded-2xl">
            <PanelHeaderSkeleton action />
            <div className="grid grid-cols-2 gap-4 p-4 sm:p-6">
              <div className="col-span-2">
                <SkeletonBlock className="mb-2 h-2 w-28" />
                <SkeletonBlock tone="strong" className="h-11 w-full" />
              </div>
              {Array.from({ length: 2 }, (_, index) => (
                <div key={index}>
                  <SkeletonBlock className="mb-2 h-2 w-20" />
                  <SkeletonBlock tone="strong" className="h-11 w-full" />
                </div>
              ))}
              <div className="col-span-2">
                <SkeletonBlock className="mb-2 h-2 w-16" />
                <SkeletonBlock tone="strong" className="h-11 w-full" />
              </div>
            </div>
            <div className="px-4 pb-4 sm:px-6 sm:pb-6">
              <SkeletonBlock className="h-20 w-full" />
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 p-4 sm:p-5">
              <SkeletonBlock className="h-10 w-28" />
              <SkeletonBlock tone="strong" className="h-10 w-28" />
            </div>
          </section>
        </section>

        <section className="skeleton-card overflow-hidden rounded-2xl">
          <PanelHeaderSkeleton />
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
          <div className="hidden grid-cols-[.75fr_1.1fr_1fr_.75fr_.75fr_.65fr_auto] gap-4 border-b border-slate-100 p-4 lg:grid">
            {Array.from({ length: 7 }, (_, index) => (
              <SkeletonBlock key={index} className="h-2 w-16" />
            ))}
          </div>
          <div className="grid gap-3 p-3 lg:block lg:p-0">
            {Array.from({ length: 5 }, (_, index) => (
              <TransactionSkeleton key={index} />
            ))}
          </div>
        </section>
      </main>
      <span className="sr-only">
        Loading student fee accounts and transaction history
      </span>
    </div>
  )
}
