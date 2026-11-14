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

function FieldSkeleton({ wide = false }: { wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <SkeletonBlock className="mb-2 h-2 w-20 rounded-md" />
      <SkeletonBlock tone="strong" className="h-11 w-full" />
    </div>
  );
}

function PanelHeading({ width = "w-28" }: { width?: string }) {
  return (
    <div className="flex min-h-14 items-center gap-2 border-b border-slate-100 px-5">
      <SkeletonBlock tone="strong" className="size-5 rounded-md" />
      <SkeletonBlock tone="strong" className={`h-3.5 ${width}`} />
    </div>
  );
}

function UserCardSkeleton({ owner = false }: { owner?: boolean }) {
  return (
    <article className="skeleton-card flex min-h-64 flex-col overflow-hidden rounded-2xl">
      <div className="flex-1 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <SkeletonBlock
            tone="strong"
            className="size-11 shrink-0 rounded-2xl sm:size-12 sm:rounded-xl"
          />
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBlock tone="strong" className="h-3 w-32" />
            <SkeletonBlock className="h-2.5 w-20" />
          </div>
          <SkeletonBlock className="h-6 w-16 rounded-full sm:hidden" />
        </div>
        <div className="mt-4 flex items-center justify-between gap-2">
          <SkeletonBlock
            tone={owner ? "strong" : "default"}
            className="h-7 w-24 rounded-full"
          />
          <SkeletonBlock className="hidden h-6 w-16 rounded-full sm:block" />
        </div>
        <div className="skeleton-action mt-4 rounded-xl p-3 sm:rounded-none sm:border-x-0 sm:border-b-0 sm:bg-transparent sm:px-0 sm:pb-0">
          <SkeletonBlock className="h-2 w-16" />
          <SkeletonBlock tone="strong" className="mt-2 h-2.5 w-36" />
        </div>
      </div>
      <div className="border-t border-slate-100 p-3">
        <SkeletonBlock
          tone={owner ? "default" : "strong"}
          className="h-10 w-full"
        />
      </div>
    </article>
  );
}

export default function UserManagementSkeleton() {
  return (
    <div
      className="user-management-skeleton app-skeleton min-h-screen dashboard-bg pb-20"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading user management"
    >
      <header className="skeleton-header flex min-h-20 items-center border-b px-4 sm:px-6 lg:px-7">
        <div className="ml-12 space-y-2 lg:ml-0">
          <SkeletonBlock tone="strong" className="h-5 w-44" />
          <SkeletonBlock className="h-2.5 w-56 max-w-[55vw]" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <SkeletonBlock className="hidden h-10 w-32 sm:block" />
          <SkeletonBlock tone="strong" className="size-11 rounded-2xl" />
          <SkeletonBlock className="hidden h-11 w-28 sm:block" />
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-4 p-3 sm:space-y-5 sm:p-6 xl:p-8">
        <nav className="skeleton-card grid grid-cols-3 gap-1.5 rounded-2xl p-2 sm:max-w-xl">
          {[24, 20, 24].map((width, index) => (
            <div
              key={index}
              className="skeleton-action flex min-h-11 items-center justify-center gap-2 rounded-xl px-2"
            >
              <SkeletonBlock
                tone={index === 0 ? "strong" : "default"}
                className="size-4 rounded-md"
              />
              <SkeletonBlock
                tone={index === 0 ? "strong" : "default"}
                className={`h-2.5 ${width === 24 ? "w-16" : "w-14"}`}
              />
            </div>
          ))}
        </nav>

        <div className="grid gap-5 lg:grid-cols-5 lg:items-start">
          <section className="skeleton-card overflow-hidden rounded-2xl lg:col-span-3">
            <PanelHeading width="w-24" />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <FieldSkeleton wide />
              <FieldSkeleton />
              <FieldSkeleton />
              <FieldSkeleton wide />
            </div>
            <div className="flex border-t border-slate-100 p-4 sm:justify-end sm:px-5">
              <SkeletonBlock tone="strong" className="h-10 w-full sm:w-28" />
            </div>
          </section>

          <section className="skeleton-card overflow-hidden rounded-2xl lg:col-span-2">
            <PanelHeading width="w-32" />
            <div className="space-y-4 p-5">
              <FieldSkeleton />
              <FieldSkeleton />
            </div>
            <div className="flex border-t border-slate-100 p-4 sm:justify-end sm:px-5">
              <SkeletonBlock tone="strong" className="h-10 w-full sm:w-32" />
            </div>
          </section>
        </div>

        <section className="skeleton-card overflow-hidden rounded-2xl">
          <div className="flex min-h-14 items-center justify-between gap-3 border-b border-slate-100 px-5">
            <div className="flex items-center gap-2">
              <SkeletonBlock tone="strong" className="size-5 rounded-md" />
              <SkeletonBlock tone="strong" className="h-3.5 w-32" />
            </div>
            <SkeletonBlock className="h-7 w-16 rounded-full" />
          </div>
          <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-3">
            <UserCardSkeleton owner />
            <UserCardSkeleton />
            <UserCardSkeleton />
          </div>
        </section>
      </main>
      <span className="sr-only">Loading user accounts and permissions</span>
    </div>
  );
}
