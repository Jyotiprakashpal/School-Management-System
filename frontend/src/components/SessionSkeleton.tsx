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

function SessionCardSkeleton({ current = false }: { current?: boolean }) {
  return (
    <article className="skeleton-card overflow-hidden rounded-2xl">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <SkeletonBlock
              tone="strong"
              className="size-10 shrink-0 rounded-xl"
            />
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonBlock tone="strong" className="h-4 w-24" />
              <SkeletonBlock className="h-2.5 w-28" />
            </div>
          </div>
          <SkeletonBlock
            tone={current ? "strong" : "default"}
            className="h-7 w-20 rounded-full"
          />
        </div>
        <div className="skeleton-action mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl p-3">
          <div className="space-y-2">
            <SkeletonBlock className="h-2 w-10" />
            <SkeletonBlock tone="strong" className="h-2.5 w-20" />
          </div>
          <SkeletonBlock className="h-px w-6 rounded-none" />
          <div className="space-y-2">
            <SkeletonBlock className="ml-auto h-2 w-10" />
            <SkeletonBlock tone="strong" className="ml-auto h-2.5 w-20" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 border-t border-slate-100 p-3">
        {!current && (
          <SkeletonBlock
            tone="strong"
            className="col-span-2 h-9 w-full"
          />
        )}
        <SkeletonBlock
          className={`h-9 w-full ${current ? "col-span-2" : ""}`}
        />
        {!current && <SkeletonBlock className="h-9 w-full" />}
      </div>
    </article>
  );
}

export default function SessionSkeleton() {
  return (
    <div
      className="session-skeleton app-skeleton min-h-screen dashboard-bg pb-20"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading academic sessions"
    >
      <header className="skeleton-header flex min-h-20 items-center border-b px-4 sm:px-6 lg:px-7">
        <div className="ml-12 space-y-2 lg:ml-0">
          <SkeletonBlock tone="strong" className="h-5 w-28" />
          <SkeletonBlock className="h-2.5 w-44" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <SkeletonBlock className="hidden h-10 w-32 sm:block" />
          <SkeletonBlock tone="strong" className="size-11 rounded-2xl" />
          <SkeletonBlock className="hidden h-11 w-28 sm:block" />
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-4 p-3 sm:space-y-5 sm:p-6 xl:p-8">
        <div className="grid gap-4 lg:grid-cols-[minmax(17rem,.72fr)_minmax(0,1.28fr)] lg:items-stretch lg:gap-5">
          <section className="session-skeleton-hero relative min-h-64 overflow-hidden rounded-2xl border p-4 sm:min-h-72 sm:p-6">
            <span className="absolute -right-10 -top-12 size-40 rounded-full border border-white/10 bg-white/5" />
            <span className="absolute -bottom-16 -left-12 size-36 rounded-full bg-white/5" />
            <div className="relative flex h-full flex-col">
              <div className="flex items-start justify-between">
                <SkeletonBlock
                  tone="light"
                  className="size-12 rounded-2xl"
                />
                <SkeletonBlock
                  tone="light"
                  className="h-7 w-20 rounded-full"
                />
              </div>
              <SkeletonBlock
                tone="light"
                className="mt-6 h-2.5 w-28 opacity-70"
              />
              <SkeletonBlock
                tone="light"
                className="mt-3 h-8 w-36"
              />
              <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-3">
                <SkeletonBlock
                  tone="light"
                  className="h-2.5 w-28 opacity-60"
                />
                <SkeletonBlock
                  tone="light"
                  className="mt-3 h-3 w-52 max-w-full"
                />
              </div>
              <div className="mt-auto flex gap-2 pt-4">
                {["w-12", "w-10", "w-11", "w-12"].map((width, index) => (
                  <SkeletonBlock
                    key={index}
                    tone="light"
                    className={`h-6 ${width} rounded-full opacity-70`}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="skeleton-card flex min-w-0 flex-col overflow-hidden rounded-2xl">
            <div className="flex min-h-14 items-center gap-3 border-b border-slate-100 px-5">
              <SkeletonBlock tone="strong" className="size-8 rounded-lg" />
              <div className="space-y-2">
                <SkeletonBlock tone="strong" className="h-3 w-28" />
                <SkeletonBlock className="h-2 w-40" />
              </div>
            </div>
            <div className="flex flex-1 flex-col justify-center p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="space-y-2">
                  <SkeletonBlock tone="strong" className="h-2.5 w-32" />
                  <SkeletonBlock className="h-2 w-52 max-w-full" />
                </div>
                <SkeletonBlock className="hidden h-6 w-24 rounded-full sm:block" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(10rem,.8fr)_repeat(2,minmax(11rem,1fr))]">
                <div className="sm:col-span-2 xl:col-span-1">
                  <SkeletonBlock className="mb-2 h-2 w-20" />
                  <SkeletonBlock tone="strong" className="h-11 w-full" />
                </div>
                {[0, 1].map((item) => (
                  <div key={item}>
                    <SkeletonBlock className="mb-2 h-2 w-16" />
                    <SkeletonBlock tone="strong" className="h-11 w-full" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3 border-t border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="flex items-center gap-2">
                <SkeletonBlock className="size-7 shrink-0 rounded-lg" />
                <SkeletonBlock className="h-2.5 w-52 max-w-[65vw]" />
              </div>
              <SkeletonBlock tone="strong" className="h-10 w-full sm:w-28" />
            </div>
          </section>
        </div>

        <section className="skeleton-card overflow-hidden rounded-2xl">
          <div className="flex min-h-14 items-center justify-between gap-3 border-b border-slate-100 px-5">
            <div className="flex items-center gap-3">
              <SkeletonBlock tone="strong" className="size-8 rounded-lg" />
              <div className="space-y-2">
                <SkeletonBlock tone="strong" className="h-3 w-32" />
                <SkeletonBlock className="h-2 w-14" />
              </div>
            </div>
            <div className="hidden gap-2 sm:flex">
              <SkeletonBlock className="h-7 w-16 rounded-full" />
              <SkeletonBlock className="h-7 w-20 rounded-full" />
            </div>
          </div>
          <div className="grid items-start gap-3 p-3.5 sm:grid-cols-2 sm:p-5 2xl:grid-cols-3">
            <SessionCardSkeleton current />
            <SessionCardSkeleton />
            <SessionCardSkeleton />
          </div>
        </section>
      </main>
      <span className="sr-only">Loading academic session data</span>
    </div>
  );
}
