function SkeletonBlock({
  className = "",
  tone = "default",
}: {
  className?: string;
  tone?: "default" | "strong";
}) {
  return (
    <div
      className={`skeleton-block skeleton-block-${tone} rounded-xl ${className}`}
    />
  );
}

function MenuItem({ wide = false }: { wide?: boolean }) {
  return (
    <div className="flex min-h-12 items-center gap-2.5 rounded-xl px-2.5 lg:min-h-16 lg:gap-3 lg:px-3">
      <SkeletonBlock tone="strong" className="size-8 shrink-0 lg:size-9" />
      <div className="min-w-0 flex-1">
        <SkeletonBlock
          tone="strong"
          className={`h-2.5 ${wide ? "w-24" : "w-20"}`}
        />
        <SkeletonBlock className="mt-2 hidden h-2 w-full lg:block" />
      </div>
    </div>
  );
}

function FieldSkeleton({ wide = false }: { wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <SkeletonBlock className="mb-2 h-2 w-24 rounded-md" />
      <SkeletonBlock tone="strong" className="h-11 w-full" />
    </div>
  );
}

export default function SettingsSkeleton() {
  return (
    <div
      className="settings-skeleton app-skeleton min-h-screen dashboard-bg pb-20"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading settings"
    >
      <header className="skeleton-header flex min-h-20 items-center border-b px-4 sm:px-6 lg:px-7">
        <div className="ml-12 space-y-2 lg:ml-0">
          <SkeletonBlock tone="strong" className="h-5 w-28" />
          <SkeletonBlock className="h-2.5 w-56 max-w-[55vw]" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <SkeletonBlock className="hidden h-10 w-32 sm:block" />
          <SkeletonBlock tone="strong" className="size-11 rounded-2xl" />
          <SkeletonBlock className="hidden h-11 w-28 rounded-xl sm:block" />
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-3 sm:p-6 xl:p-8">
        <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start lg:gap-6">
          <aside className="skeleton-card rounded-2xl p-2 lg:p-3">
            <SkeletonBlock className="mx-3 mb-3 mt-2 hidden h-2 w-24 lg:block" />
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:block lg:space-y-1">
              <MenuItem wide />
              <MenuItem />
              <MenuItem wide />
              <MenuItem />
              <MenuItem />
            </div>
            <div className="skeleton-action mt-3 hidden rounded-xl p-4 lg:block">
              <div className="flex items-center gap-2">
                <SkeletonBlock tone="strong" className="size-4 rounded-full" />
                <SkeletonBlock tone="strong" className="h-2.5 w-28" />
              </div>
              <SkeletonBlock className="mt-3 h-2 w-36" />
            </div>
          </aside>

          <div className="space-y-5">
            <section className="skeleton-card overflow-hidden rounded-2xl">
              <div className="flex items-start gap-3 border-b border-slate-100 p-4 sm:p-6">
                <SkeletonBlock tone="strong" className="size-9 shrink-0 sm:size-10" />
                <div className="flex-1 space-y-2">
                  <SkeletonBlock tone="strong" className="h-4 w-36" />
                  <SkeletonBlock className="h-2.5 w-full max-w-md" />
                </div>
              </div>

              <div className="grid gap-4 p-4 sm:grid-cols-2 sm:gap-5 sm:p-6">
                <div className="skeleton-action flex flex-col gap-4 rounded-2xl p-4 sm:col-span-2 sm:flex-row sm:items-center">
                  <SkeletonBlock
                    tone="strong"
                    className="size-14 shrink-0 rounded-2xl sm:size-16"
                  />
                  <div className="flex-1 space-y-2">
                    <SkeletonBlock tone="strong" className="h-3 w-28" />
                    <SkeletonBlock className="h-2.5 w-full max-w-sm" />
                  </div>
                  <SkeletonBlock
                    tone="strong"
                    className="h-10 w-full sm:w-28"
                  />
                </div>
                <FieldSkeleton />
                <FieldSkeleton />
                <FieldSkeleton />
                <FieldSkeleton />
                <FieldSkeleton wide />
                <FieldSkeleton />
                <FieldSkeleton />
              </div>
            </section>

            <section className="skeleton-card flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <SkeletonBlock tone="strong" className="h-3 w-44" />
                <SkeletonBlock className="h-2.5 w-64 max-w-[70vw]" />
              </div>
              <SkeletonBlock
                tone="strong"
                className="h-10 w-full sm:w-32"
              />
            </section>
          </div>
        </div>
      </main>
      <span className="sr-only">Loading application settings</span>
    </div>
  );
}
