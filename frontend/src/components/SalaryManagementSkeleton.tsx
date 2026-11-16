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

function EmployeeCardSkeleton() {
  return (
    <article className="skeleton-action rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <SkeletonBlock
          tone="strong"
          className="size-11 shrink-0 rounded-2xl"
        />
        <div className="min-w-0 flex-1">
          <div className="flex justify-between gap-2">
            <div className="space-y-2">
              <SkeletonBlock tone="strong" className="h-3 w-28" />
              <SkeletonBlock className="h-2 w-32" />
            </div>
            <SkeletonBlock className="h-6 w-16 rounded-full" />
          </div>
          <SkeletonBlock className="mt-2 h-2 w-36" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <SkeletonBlock className="h-14 w-full" />
        <SkeletonBlock className="h-14 w-full" />
        <SkeletonBlock className="h-14 w-full" />
      </div>
      <SkeletonBlock tone="strong" className="mt-3 h-16 w-full" />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <SkeletonBlock className="h-10 w-full" />
        <SkeletonBlock className="h-10 w-full" />
      </div>
    </article>
  );
}

export default function SalaryManagementSkeleton() {
  return (
    <div
      className="salary-management-skeleton app-skeleton min-h-screen dashboard-bg pb-16"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading salary management"
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

      <main className="mx-auto max-w-7xl space-y-5 p-3 sm:p-6 xl:p-8">
        <section className="salary-management-skeleton-hero relative overflow-hidden rounded-3xl p-5 sm:p-7">
          <span className="absolute -right-20 -top-24 size-72 rounded-full border border-white/10 bg-white/5" />
          <span className="absolute -bottom-28 left-1/3 size-60 rounded-full bg-white/5" />
          <div className="relative grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-center">
            <div>
              <SkeletonBlock
                tone="light"
                className="h-7 w-40 rounded-full"
              />
              <SkeletonBlock
                tone="light"
                className="mt-5 h-2.5 w-52 opacity-65"
              />
              <SkeletonBlock
                tone="light"
                className="mt-3 h-9 w-44"
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
                  className="h-11 w-full sm:w-40"
                />
                <SkeletonBlock
                  tone="light"
                  className="h-11 w-full opacity-70 sm:w-36"
                />
              </div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/5 p-3 sm:p-4">
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 3 }, (_, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-white/10 bg-white/5 p-3"
                  >
                    <SkeletonBlock
                      tone="light"
                      className="mx-auto h-6 w-8"
                    />
                    <SkeletonBlock
                      tone="light"
                      className="mx-auto mt-2 h-2 w-12 opacity-60"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between">
                <SkeletonBlock
                  tone="light"
                  className="h-2 w-28 opacity-70"
                />
                <SkeletonBlock tone="light" className="h-2 w-10" />
              </div>
              <SkeletonBlock
                tone="light"
                className="mt-2 h-2 w-full rounded-full opacity-70"
              />
            </div>
          </div>
        </section>

        <section className="skeleton-card overflow-hidden rounded-2xl">
          <div className="flex min-h-14 items-center justify-between gap-3 border-b border-slate-100 px-5">
            <div className="flex items-center gap-3">
              <SkeletonBlock tone="strong" className="size-9" />
              <div className="space-y-2">
                <SkeletonBlock tone="strong" className="h-3 w-28" />
                <SkeletonBlock className="h-2 w-52" />
              </div>
            </div>
            <SkeletonBlock className="h-7 w-24 rounded-full" />
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-[repeat(3,minmax(0,1fr))_auto] sm:items-end sm:p-5">
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
            <SkeletonBlock tone="strong" className="h-10 w-full sm:w-28" />
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
                  <SkeletonBlock tone="strong" className="h-6 w-24 max-w-full" />
                </div>
                <SkeletonBlock tone="strong" className="size-10" />
              </div>
              <SkeletonBlock className="mt-3 h-2 w-28 max-w-full" />
            </article>
          ))}
        </section>

        <div className="grid items-start gap-5 xl:grid-cols-[1fr_18rem]">
          <section className="skeleton-card overflow-hidden rounded-2xl">
            <div className="flex min-h-16 items-center justify-between gap-3 border-b border-slate-100 px-4 sm:px-5">
              <div className="flex items-center gap-3">
                <SkeletonBlock tone="strong" className="size-9" />
                <div className="space-y-2">
                  <SkeletonBlock tone="strong" className="h-3 w-40" />
                  <SkeletonBlock className="h-2 w-32" />
                </div>
              </div>
              <SkeletonBlock tone="strong" className="h-10 w-24" />
            </div>
            <div className="border-b border-slate-100 p-4">
              <SkeletonBlock tone="strong" className="h-11 w-full lg:max-w-md" />
            </div>

            <div className="grid gap-3 p-3 lg:hidden">
              <EmployeeCardSkeleton />
              <EmployeeCardSkeleton />
              <EmployeeCardSkeleton />
            </div>

            <div className="hidden lg:block">
              <div className="grid grid-cols-7 gap-4 border-b border-slate-100 p-4">
                {Array.from({ length: 7 }, (_, index) => (
                  <SkeletonBlock
                    key={index}
                    className={`h-2 ${index === 0 ? "w-28" : "w-16"}`}
                  />
                ))}
              </div>
              {Array.from({ length: 6 }, (_, row) => (
                <div
                  key={row}
                  className="grid grid-cols-7 items-center gap-4 border-b border-slate-100 p-4"
                >
                  <div className="flex items-center gap-3">
                    <SkeletonBlock
                      tone="strong"
                      className="size-10 shrink-0"
                    />
                    <div className="space-y-2">
                      <SkeletonBlock tone="strong" className="h-2.5 w-20" />
                      <SkeletonBlock className="h-2 w-24" />
                    </div>
                  </div>
                  {Array.from({ length: 6 }, (_, column) => (
                    <SkeletonBlock
                      key={column}
                      tone={column === 3 ? "strong" : "default"}
                      className="h-2.5 w-16"
                    />
                  ))}
                </div>
              ))}
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SkeletonBlock tone="strong" className="size-8" />
                  <SkeletonBlock tone="strong" className="h-3 w-28" />
                </div>
                <SkeletonBlock className="h-6 w-12 rounded-full" />
              </div>
              <div className="mt-4 flex items-center gap-3">
                <SkeletonBlock tone="strong" className="size-14 shrink-0" />
                <div className="flex-1">
                  <SkeletonBlock className="h-2 w-full rounded-full" />
                  <SkeletonBlock className="mt-3 h-2.5 w-32" />
                </div>
              </div>
            </section>
          </aside>
        </div>
      </main>
      <span className="sr-only">Loading payroll records and salary calculations</span>
    </div>
  );
}
