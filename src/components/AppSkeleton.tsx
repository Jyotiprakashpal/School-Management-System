function SkeletonBlock({ className = "", tone = "default" }: { className?: string; tone?: "default" | "light" | "strong" }) {
  return <div className={`skeleton-block skeleton-block-${tone} rounded-xl ${className}`} />;
}

export default function AppSkeleton() {
  return <div className="app-skeleton h-full min-h-screen overflow-hidden" role="status" aria-label="Loading application data">
    <aside className="skeleton-sidebar fixed inset-y-0 left-0 hidden w-64 p-5 lg:block">
      <div className="flex items-center gap-3">
        <SkeletonBlock tone="light" className="size-12 rounded-2xl" />
        <div className="flex-1 space-y-2"><SkeletonBlock tone="light" className="h-3 w-28" /><SkeletonBlock tone="light" className="h-2 w-20 opacity-70" /></div>
      </div>
      <SkeletonBlock tone="light" className="mt-8 h-2 w-12 opacity-50" />
      <SkeletonBlock tone="light" className="mt-3 h-12 w-full" />
      <div className="mt-7 space-y-5">
        {Array.from({ length: 4 }, (_, group) => <div key={group}>
          <SkeletonBlock tone="light" className="mb-3 h-2 w-16 opacity-40" />
          <div className="space-y-2">{Array.from({ length: group === 0 ? 3 : 2 }, (_, item) => <div key={item} className="flex items-center gap-3 rounded-xl px-2 py-2"><SkeletonBlock tone="light" className="size-7 shrink-0 opacity-60" /><SkeletonBlock tone="light" className={`h-2.5 ${item % 2 ? "w-28" : "w-32"} opacity-70`} /></div>)}</div>
        </div>)}
      </div>
    </aside>

    <div className="flex h-full min-w-0 flex-col lg:pl-64">
      <header className="skeleton-header flex min-h-20 items-center border-b px-4 sm:px-6 lg:px-7">
        <SkeletonBlock tone="strong" className="size-10 lg:hidden" />
        <div className="ml-4 space-y-2 lg:ml-0"><SkeletonBlock tone="strong" className="h-5 w-36" /><SkeletonBlock className="h-2.5 w-52" /></div>
        <div className="ml-auto flex items-center gap-2"><SkeletonBlock className="hidden h-10 w-32 sm:block" /><SkeletonBlock tone="strong" className="size-11 rounded-2xl" /><SkeletonBlock className="h-11 w-32 rounded-xl" /></div>
      </header>

      <main className="min-h-0 flex-1 space-y-5 overflow-hidden p-3 sm:p-6 xl:p-8">
        <section className="skeleton-hero grid gap-5 rounded-2xl p-5 sm:p-6 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex items-center gap-3">
            <SkeletonBlock tone="light" className="size-11 shrink-0 rounded-2xl" />
            <div className="space-y-2"><SkeletonBlock tone="light" className="h-5 w-48" /><SkeletonBlock tone="light" className="h-2.5 w-36 opacity-60" /><SkeletonBlock tone="light" className="h-7 w-40 opacity-70" /></div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="skeleton-hero-stat rounded-xl p-3"><SkeletonBlock tone="light" className="mx-auto size-4" /><SkeletonBlock tone="light" className="mx-auto mt-2 h-4 w-8" /><SkeletonBlock tone="light" className="mx-auto mt-2 h-2 w-16 opacity-60" /></div>)}</div>
        </section>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => <article key={index} className="skeleton-card relative overflow-hidden rounded-2xl p-5">
            <span className={`skeleton-card-accent skeleton-card-accent-${index + 1} absolute inset-x-0 top-0 h-1`} />
            <div className="flex items-center gap-4"><SkeletonBlock tone="strong" className="size-12 shrink-0 rounded-2xl" /><div className="flex-1 space-y-2.5"><SkeletonBlock tone="strong" className="h-5 w-20" /><SkeletonBlock className="h-3 w-28" /><SkeletonBlock className="h-2.5 w-32" /></div></div>
          </article>)}
        </div>

        <section className="skeleton-card overflow-hidden rounded-2xl">
          <div className="flex min-h-16 items-center gap-3 border-b border-slate-100 px-5"><SkeletonBlock tone="strong" className="size-9" /><SkeletonBlock tone="strong" className="h-3 w-28" /></div>
          <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4 lg:grid-cols-8">{Array.from({ length: 8 }, (_, index) => <div key={index} className="skeleton-action grid min-h-24 place-items-center rounded-xl p-3"><div><SkeletonBlock tone="strong" className="mx-auto size-10" /><SkeletonBlock className="mx-auto mt-3 h-2.5 w-16" /></div></div>)}</div>
        </section>

        <div className="grid gap-5 xl:grid-cols-3">
          <section className="skeleton-card rounded-2xl p-5 xl:col-span-2"><div className="flex items-center justify-between"><SkeletonBlock tone="strong" className="h-4 w-44" /><SkeletonBlock className="h-9 w-24" /></div><div className="mt-7 flex h-44 items-end gap-3">{["h-16", "h-24", "h-20", "h-32", "h-28", "h-40", "h-24", "h-36"].map((height, index) => <SkeletonBlock key={index} tone={index === 7 ? "strong" : "default"} className={`w-full rounded-b-none ${height}`} />)}</div></section>
          <section className="skeleton-card grid place-items-center rounded-2xl p-5"><div><SkeletonBlock tone="strong" className="mx-auto size-28 rounded-full" /><div className="mt-5 grid grid-cols-3 gap-2"><SkeletonBlock className="h-12 w-16" /><SkeletonBlock className="h-12 w-16" /><SkeletonBlock className="h-12 w-16" /></div></div></section>
        </div>
      </main>
    </div>
    <span className="sr-only">Loading school management dashboard</span>
  </div>;
}
