function SkeletonBlock({
  className = "",
  tone = "default",
}: {
  className?: string;
  tone?: "default" | "light" | "strong";
}) {
  return (
    <div
      className={`skeleton-block skeleton-block-${tone} rounded-xl ${className}`}
    />
  );
}

function FieldSkeleton() {
  return (
    <div>
      <SkeletonBlock className="mb-2 h-2 w-20 rounded-md" />
      <SkeletonBlock tone="strong" className="h-11 w-full" />
    </div>
  );
}

function NoticeCardSkeleton({ priority = false }: { priority?: boolean }) {
  return (
    <article className="skeleton-card relative overflow-hidden rounded-2xl">
      <span
        className={`absolute inset-x-0 top-0 h-1 ${priority ? "bg-rose-400" : "bg-(--app-accent)"}`}
      />
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          <SkeletonBlock
            tone="strong"
            className="size-11 shrink-0 rounded-2xl sm:size-12"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <SkeletonBlock tone="strong" className="h-3.5 w-52 max-w-full" />
              <SkeletonBlock className="h-6 w-20 rounded-full" />
            </div>
            <SkeletonBlock className="mt-3 h-2.5 w-full" />
            <SkeletonBlock className="mt-2 h-2.5 w-4/5" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="skeleton-action flex min-w-0 items-center gap-2 rounded-xl p-2.5"
            >
              <SkeletonBlock className="size-7 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonBlock className="h-1.5 w-12" />
                <SkeletonBlock tone="strong" className="h-2 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 border-t border-slate-100 p-3">
        <SkeletonBlock tone="strong" className="h-10 w-full" />
        <SkeletonBlock className="h-10 w-full" />
        <SkeletonBlock className="h-10 w-full" />
      </div>
    </article>
  );
}

export default function NoticeSkeleton() {
  return (
    <div
      className="notice-skeleton app-skeleton min-h-screen dashboard-bg pb-16"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading notices"
    >
      <header className="skeleton-header flex min-h-20 items-center border-b px-4 sm:px-6 lg:px-7">
        <div className="ml-12 space-y-2 lg:ml-0">
          <SkeletonBlock tone="strong" className="h-5 w-28" />
          <SkeletonBlock className="h-2.5 w-72 max-w-[55vw]" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <SkeletonBlock className="hidden h-10 w-32 sm:block" />
          <SkeletonBlock tone="strong" className="size-11 rounded-2xl" />
          <SkeletonBlock className="hidden h-11 w-28 sm:block" />
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 p-3 sm:p-6 xl:p-8">
        <section className="notice-skeleton-hero relative overflow-hidden rounded-3xl p-5 sm:p-7">
          <span className="absolute -right-16 -top-24 size-64 rounded-full border border-white/10 bg-white/5" />
          <span className="absolute -bottom-20 right-1/3 size-44 rounded-full bg-white/5" />
          <div className="relative grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-2xl">
              <SkeletonBlock
                tone="light"
                className="h-7 w-44 rounded-full"
              />
              <SkeletonBlock
                tone="light"
                className="mt-4 h-7 w-96 max-w-full sm:h-8"
              />
              <SkeletonBlock
                tone="light"
                className="mt-3 h-2.5 w-full max-w-xl opacity-70"
              />
              <SkeletonBlock
                tone="light"
                className="mt-2 h-2.5 w-4/5 max-w-lg opacity-70"
              />
              <div className="mt-4 flex gap-2">
                <SkeletonBlock
                  tone="light"
                  className="h-7 w-20 rounded-full"
                />
                <SkeletonBlock
                  tone="light"
                  className="h-7 w-24 rounded-full"
                />
                <SkeletonBlock
                  tone="light"
                  className="hidden h-7 w-24 rounded-full sm:block"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
              <SkeletonBlock
                tone="light"
                className="h-11 w-full sm:w-44"
              />
              <SkeletonBlock
                tone="light"
                className="h-10 w-full opacity-70 sm:w-44"
              />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <article
              key={index}
              className="skeleton-card relative overflow-hidden rounded-2xl p-3.5 sm:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <SkeletonBlock className="h-2.5 w-20" />
                  <SkeletonBlock tone="strong" className="h-7 w-10" />
                </div>
                <SkeletonBlock
                  tone="strong"
                  className="size-10 rounded-xl"
                />
              </div>
              <SkeletonBlock className="mt-3 h-2 w-28 max-w-full" />
            </article>
          ))}
        </section>

        <section className="skeleton-card overflow-hidden rounded-2xl">
          <div className="flex min-h-14 items-center gap-3 border-b border-slate-100 px-5">
            <SkeletonBlock tone="strong" className="size-9" />
            <div className="space-y-2">
              <SkeletonBlock tone="strong" className="h-3 w-28" />
              <SkeletonBlock className="h-2 w-20" />
            </div>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-2 sm:gap-4 sm:p-5 xl:grid-cols-[1.4fr_1fr_1fr_1fr_auto] xl:items-end">
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
            <SkeletonBlock
              tone="strong"
              className="h-10 w-full sm:col-span-2 xl:col-span-1 xl:w-28"
            />
          </div>
        </section>

        <div className="grid items-start gap-5 xl:grid-cols-[1fr_18rem]">
          <section className="space-y-4">
            <div className="flex items-end justify-between gap-3">
              <div className="space-y-2">
                <SkeletonBlock tone="strong" className="h-4 w-36" />
                <SkeletonBlock className="h-2.5 w-60 max-w-[65vw]" />
              </div>
              <SkeletonBlock className="h-7 w-20 rounded-full" />
            </div>
            <NoticeCardSkeleton priority />
            <NoticeCardSkeleton />
          </section>

          <aside className="space-y-5">
            <section className="skeleton-card overflow-hidden rounded-2xl">
              <div className="p-5">
                <div className="flex items-center gap-2">
                  <SkeletonBlock tone="strong" className="size-9" />
                  <SkeletonBlock tone="strong" className="h-3 w-28" />
                </div>
                <SkeletonBlock className="mt-3 h-2.5 w-full" />
                <SkeletonBlock className="mt-2 h-2.5 w-3/4" />
              </div>
              <div className="space-y-2 p-4 pt-0">
                {Array.from({ length: 4 }, (_, index) => (
                  <div
                    key={index}
                    className="skeleton-action flex items-center justify-between rounded-xl p-3"
                  >
                    <SkeletonBlock className="h-2.5 w-28" />
                    <SkeletonBlock tone="strong" className="size-7 rounded-lg" />
                  </div>
                ))}
              </div>
            </section>
            <section className="skeleton-card rounded-2xl p-5">
              <div className="flex items-center gap-2">
                <SkeletonBlock tone="strong" className="size-5 rounded-md" />
                <SkeletonBlock tone="strong" className="h-3 w-24" />
              </div>
              <SkeletonBlock className="mt-3 h-2.5 w-full" />
              <SkeletonBlock className="mt-2 h-2.5 w-4/5" />
            </section>
          </aside>
        </div>
      </main>
      <span className="sr-only">Loading school notices</span>
    </div>
  );
}
