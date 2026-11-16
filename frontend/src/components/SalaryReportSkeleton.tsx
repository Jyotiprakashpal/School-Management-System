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

function DataPanelSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <section className="skeleton-card overflow-hidden rounded-2xl">
      <div className="flex min-h-16 items-center justify-between gap-3 border-b border-slate-100 px-4 sm:px-5">
        <div className="flex items-center gap-3">
          <SkeletonBlock tone="strong" className="size-9" />
          <div className="space-y-2">
            <SkeletonBlock tone="strong" className="h-3 w-40" />
            <SkeletonBlock className="hidden h-2 w-24 sm:block" />
          </div>
        </div>
        <SkeletonBlock className="h-7 w-16 rounded-full sm:hidden" />
      </div>
      <div className="hidden sm:block">
        <div className="grid grid-cols-6 gap-4 border-b border-slate-100 p-4">
          {Array.from({ length: 6 }, (_, index) => (
            <SkeletonBlock
              key={index}
              className={`h-2 ${index === 0 ? "w-24" : "w-16"}`}
            />
          ))}
        </div>
        {Array.from({ length: rows }, (_, row) => (
          <div
            key={row}
            className="grid grid-cols-6 items-center gap-4 border-b border-slate-100 p-4"
          >
            {Array.from({ length: 6 }, (_, column) => (
              <SkeletonBlock
                key={column}
                tone={column === 0 || column === 4 ? "strong" : "default"}
                className={`h-2.5 ${column === 0 ? "w-24" : "w-16"}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="grid gap-3 p-3 sm:hidden">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="skeleton-action rounded-2xl p-4"
          >
            <div className="flex items-center gap-3">
              <SkeletonBlock tone="strong" className="size-10 shrink-0" />
              <div className="flex-1 space-y-2">
                <SkeletonBlock tone="strong" className="h-3 w-28" />
                <SkeletonBlock className="h-2 w-20" />
              </div>
              <SkeletonBlock className="h-6 w-16 rounded-full" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <SkeletonBlock className="h-14 w-full" />
              <SkeletonBlock className="h-14 w-full" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function SalaryReportSkeleton() {
  return (
    <div
      className="salary-report-skeleton app-skeleton min-h-screen dashboard-bg pb-16"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading salary report"
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

      <main className="mx-auto max-w-7xl space-y-5 p-3 sm:p-6 xl:p-8">
        <section className="salary-report-skeleton-hero relative overflow-hidden rounded-3xl p-5 sm:p-7">
          <span className="absolute -right-20 -top-24 size-72 rounded-full border border-white/10 bg-white/5" />
          <span className="absolute -bottom-24 left-1/3 size-56 rounded-full bg-white/5" />
          <div className="relative grid gap-6 lg:grid-cols-[1fr_21rem] lg:items-center">
            <div>
              <SkeletonBlock
                tone="light"
                className="h-7 w-52 rounded-full"
              />
              <SkeletonBlock
                tone="light"
                className="mt-5 h-2.5 w-36 opacity-65"
              />
              <SkeletonBlock
                tone="light"
                className="mt-3 h-9 w-48"
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
                <SkeletonBlock
                  tone="light"
                  className="h-10 w-full sm:w-40"
                />
                <SkeletonBlock
                  tone="light"
                  className="h-10 w-full opacity-70 sm:w-36"
                />
              </div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/5 p-4 sm:p-5">
              <div className="flex justify-between gap-4">
                <div className="space-y-2">
                  <SkeletonBlock
                    tone="light"
                    className="h-2.5 w-28 opacity-70"
                  />
                  <SkeletonBlock tone="light" className="h-8 w-20" />
                </div>
                <SkeletonBlock
                  tone="light"
                  className="size-11 rounded-2xl"
                />
              </div>
              <SkeletonBlock
                tone="light"
                className="mt-4 h-2 w-full rounded-full opacity-70"
              />
              <div className="mt-4 grid grid-cols-2 gap-2">
                <SkeletonBlock tone="light" className="h-14 w-full" />
                <SkeletonBlock tone="light" className="h-14 w-full" />
              </div>
            </div>
          </div>
        </section>

        <section className="skeleton-card overflow-hidden rounded-2xl">
          <div className="flex min-h-14 items-center justify-between gap-3 border-b border-slate-100 px-5">
            <div className="flex items-center gap-3">
              <SkeletonBlock tone="strong" className="size-9" />
              <div className="space-y-2">
                <SkeletonBlock tone="strong" className="h-3 w-32" />
                <SkeletonBlock className="h-2 w-48" />
              </div>
            </div>
            <SkeletonBlock className="hidden h-7 w-32 rounded-full sm:block" />
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-2 sm:gap-4 sm:p-5 xl:grid-cols-[1fr_1fr_1fr_1fr_auto] xl:items-end">
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

        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <article
              key={index}
              className="skeleton-card relative overflow-hidden rounded-2xl p-3.5 sm:p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-2">
                  <SkeletonBlock className="h-2.5 w-24 max-w-full" />
                  <SkeletonBlock tone="strong" className="h-6 w-20" />
                </div>
                <SkeletonBlock tone="strong" className="size-10" />
              </div>
              <SkeletonBlock className="mt-3 h-2 w-28 max-w-full" />
            </article>
          ))}
        </section>

        <div className="grid items-start gap-5 xl:grid-cols-[1fr_18rem]">
          <section className="skeleton-card overflow-hidden rounded-2xl">
            <div className="flex min-h-16 items-center justify-between gap-3 border-b border-slate-100 px-5">
              <div className="space-y-2">
                <SkeletonBlock tone="strong" className="h-3 w-32" />
                <SkeletonBlock className="h-2 w-52" />
              </div>
              <SkeletonBlock className="h-3 w-40" />
            </div>
            <div className="p-4 sm:p-5">
              <div className="skeleton-action flex h-72 items-end gap-3 rounded-2xl p-5">
                {["h-36", "h-44", "h-40", "h-52", "h-48", "h-56"].map(
                  (height, index) => (
                    <div
                      key={index}
                      className="flex h-full flex-1 items-end justify-center gap-1"
                    >
                      <SkeletonBlock className={`w-2 rounded-b-none sm:w-3 ${height}`} />
                      <SkeletonBlock tone="strong" className={`w-2 rounded-b-none sm:w-3 ${height}`} />
                      <SkeletonBlock className={`w-2 rounded-b-none sm:w-3 ${height}`} />
                    </div>
                  ),
                )}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <SkeletonBlock className="h-16 w-full" />
                <SkeletonBlock className="h-16 w-full" />
                <SkeletonBlock className="h-16 w-full" />
              </div>
            </div>
          </section>

          <aside className="space-y-5">
            <section className="skeleton-card rounded-2xl p-5">
              <div className="flex items-center gap-2">
                <SkeletonBlock tone="strong" className="size-9" />
                <SkeletonBlock tone="strong" className="h-3 w-28" />
              </div>
              <SkeletonBlock className="mt-3 h-2.5 w-full" />
              <div className="mt-5 space-y-4">
                {Array.from({ length: 4 }, (_, index) => (
                  <div key={index}>
                    <div className="flex justify-between">
                      <SkeletonBlock className="h-2.5 w-24" />
                      <SkeletonBlock className="h-2.5 w-16" />
                    </div>
                    <SkeletonBlock className="mt-2 h-2 w-full rounded-full" />
                  </div>
                ))}
              </div>
            </section>
            <section className="skeleton-card rounded-2xl p-5">
              <SkeletonBlock tone="strong" className="h-3 w-32" />
              <SkeletonBlock tone="strong" className="mt-4 h-7 w-28" />
              <SkeletonBlock className="mt-3 h-2.5 w-full" />
              <SkeletonBlock className="mt-2 h-2.5 w-4/5" />
            </section>
          </aside>
        </div>

        <DataPanelSkeleton rows={5} />
        <DataPanelSkeleton rows={4} />
      </main>
      <span className="sr-only">Loading payroll analytics and salary records</span>
    </div>
  );
}
