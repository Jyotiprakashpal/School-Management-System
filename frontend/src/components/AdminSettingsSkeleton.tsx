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

export default function AdminSettingsSkeleton() {
  return (
    <div
      className="admin-settings-skeleton app-skeleton min-h-screen dashboard-bg pb-20"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading admin settings"
    >
      <header className="skeleton-header flex min-h-20 items-center border-b px-4 sm:px-6 lg:px-7">
        <SkeletonBlock tone="strong" className="size-10 lg:hidden" />
        <div className="ml-4 space-y-2 lg:ml-0">
          <SkeletonBlock tone="strong" className="h-5 w-36" />
          <SkeletonBlock className="h-2.5 w-56 max-w-[55vw]" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <SkeletonBlock className="hidden h-10 w-32 sm:block" />
          <SkeletonBlock tone="strong" className="size-11 rounded-2xl" />
          <SkeletonBlock className="hidden h-11 w-28 sm:block" />
        </div>
      </header>

      <main className="admin-settings-main mx-auto w-full min-w-0 max-w-none space-y-4 p-3 sm:space-y-5 sm:p-6 xl:p-8">
        {/* Automatic Backup Hero */}
        <section className="skeleton-card overflow-hidden rounded-2xl border border-slate-100 p-5 sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex items-start gap-4">
              <SkeletonBlock
                tone="strong"
                className="size-12 shrink-0 rounded-2xl"
              />
              <div className="flex-1 space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <SkeletonBlock tone="strong" className="h-5 w-40" />
                  <SkeletonBlock className="h-6 w-28 rounded-full" />
                </div>
                <SkeletonBlock className="h-2.5 w-full max-w-md" />
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <SkeletonBlock className="h-4 w-36" />
                  <SkeletonBlock className="h-4 w-40" />
                  <SkeletonBlock className="h-4 w-32" />
                  <SkeletonBlock className="h-4 w-36" />
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:w-64 lg:grid-cols-1">
              <SkeletonBlock tone="strong" className="h-11 w-full" />
              <SkeletonBlock className="h-11 w-full" />
            </div>
          </div>
        </section>

        {/* 2 Action Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <section className="skeleton-card flex flex-col rounded-2xl border border-slate-100 p-5">
            <div className="flex items-start gap-4">
              <SkeletonBlock
                tone="strong"
                className="size-11 shrink-0 rounded-xl"
              />
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonBlock tone="strong" className="h-4 w-44" />
                <SkeletonBlock className="h-2.5 w-full max-w-xs" />
              </div>
            </div>
            <SkeletonBlock tone="strong" className="mt-5 h-10 w-full sm:w-44" />
          </section>

          <section className="skeleton-card flex flex-col rounded-2xl border border-slate-100 p-5">
            <div className="flex items-start gap-4">
              <SkeletonBlock
                tone="strong"
                className="size-11 shrink-0 rounded-xl"
              />
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonBlock tone="strong" className="h-4 w-44" />
                <SkeletonBlock className="h-2.5 w-full max-w-xs" />
              </div>
            </div>
            <SkeletonBlock tone="strong" className="mt-5 h-10 w-full sm:w-44" />
          </section>
        </div>

        {/* Restore Backup Card */}
        <section className="skeleton-card overflow-hidden rounded-2xl border border-slate-100">
          <div className="flex items-start gap-4 border-b border-slate-100 p-5 sm:p-6">
            <SkeletonBlock
              tone="strong"
              className="size-11 shrink-0 rounded-xl"
            />
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <SkeletonBlock tone="strong" className="h-4 w-32" />
                <SkeletonBlock className="h-5 w-36 rounded-full" />
              </div>
              <SkeletonBlock className="h-2.5 w-full max-w-lg" />
            </div>
          </div>
          <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-2">
            <SkeletonBlock className="h-32 w-full rounded-2xl" />
            <SkeletonBlock className="h-32 w-full rounded-2xl" />
            <div className="lg:col-span-2 space-y-2">
              <SkeletonBlock className="h-2.5 w-40" />
              <SkeletonBlock tone="strong" className="h-11 w-full" />
            </div>
          </div>
          <div className="flex flex-col gap-3 border-t border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <SkeletonBlock className="h-3 w-56" />
            <SkeletonBlock tone="strong" className="h-10 w-full sm:w-32" />
          </div>
        </section>

        {/* Recovery Key Card */}
        <section className="skeleton-card rounded-2xl border border-slate-100 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <SkeletonBlock
              tone="strong"
              className="size-11 shrink-0 rounded-xl"
            />
            <div className="flex-1 space-y-2">
              <SkeletonBlock tone="strong" className="h-4 w-44" />
              <SkeletonBlock className="h-2.5 w-full max-w-md" />
            </div>
            <SkeletonBlock tone="strong" className="h-10 w-full sm:w-48" />
          </div>
        </section>

        {/* Google Drive Card */}
        <section className="skeleton-card rounded-2xl border border-slate-100 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <SkeletonBlock
              tone="strong"
              className="size-11 shrink-0 rounded-xl"
            />
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <SkeletonBlock tone="strong" className="h-4 w-48" />
                <SkeletonBlock className="h-5 w-24 rounded-full" />
              </div>
              <SkeletonBlock className="h-2.5 w-full max-w-sm" />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <SkeletonBlock tone="strong" className="h-10 w-full sm:w-36" />
              <SkeletonBlock className="h-10 w-full sm:w-28" />
            </div>
          </div>
        </section>

        {/* Email Backup Panel */}
        <section className="skeleton-card overflow-hidden rounded-2xl border border-slate-100">
          <div className="flex items-center gap-3 border-b border-slate-100 p-4 sm:p-5">
            <SkeletonBlock tone="strong" className="size-9 shrink-0 rounded-xl" />
            <div className="space-y-1.5">
              <SkeletonBlock tone="strong" className="h-4 w-28" />
              <SkeletonBlock className="h-2 w-48" />
            </div>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
            <div className="space-y-2">
              <SkeletonBlock className="h-2.5 w-24" />
              <SkeletonBlock tone="strong" className="h-11 w-full" />
            </div>
            <div className="space-y-2">
              <SkeletonBlock className="h-2.5 w-24" />
              <SkeletonBlock tone="strong" className="h-11 w-full" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <SkeletonBlock className="h-2.5 w-32" />
              <SkeletonBlock tone="strong" className="h-11 w-full" />
            </div>
            <div className="space-y-2">
              <SkeletonBlock className="h-2.5 w-20" />
              <SkeletonBlock tone="strong" className="h-11 w-full" />
            </div>
            <div className="space-y-2">
              <SkeletonBlock className="h-2.5 w-16" />
              <SkeletonBlock tone="strong" className="h-11 w-full" />
            </div>
            <div className="flex items-end sm:col-span-2">
              <SkeletonBlock tone="strong" className="h-11 w-full" />
            </div>
          </div>
        </section>

        {/* Saved Backups Panel */}
        <section className="skeleton-card overflow-hidden rounded-2xl border border-slate-100">
          <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5">
            <div className="flex items-center gap-2.5">
              <SkeletonBlock
                tone="strong"
                className="size-8 shrink-0 rounded-lg"
              />
              <div className="space-y-1">
                <SkeletonBlock tone="strong" className="h-4 w-28" />
                <SkeletonBlock className="h-2 w-36" />
              </div>
            </div>
            <SkeletonBlock className="h-6 w-24 rounded-full" />
          </div>

          <div className="p-4 sm:p-6">
            <div className="space-y-3">
              {Array.from({ length: 3 }, (_, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <SkeletonBlock
                      tone="strong"
                      className="size-9 shrink-0 rounded-xl"
                    />
                    <div className="space-y-1.5">
                      <SkeletonBlock tone="strong" className="h-3.5 w-52" />
                      <SkeletonBlock className="h-2.5 w-32" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <SkeletonBlock className="h-3 w-28" />
                    <SkeletonBlock className="h-3 w-16" />
                    <SkeletonBlock className="h-6 w-20 rounded-full" />
                    <SkeletonBlock tone="strong" className="h-9 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
