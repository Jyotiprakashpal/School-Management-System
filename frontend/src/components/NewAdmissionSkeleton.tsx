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

function FieldSkeleton() {
  return (
    <div>
      <SkeletonBlock className="mb-2 h-2 w-24" />
      <SkeletonBlock tone="strong" className="h-11 w-full" />
    </div>
  )
}

function SectionSkeleton({
  fields,
  columns = "xl:grid-cols-3",
}: {
  fields: number
  columns?: string
}) {
  return (
    <section className="skeleton-card overflow-hidden rounded-2xl">
      <div className="flex min-h-16 items-center gap-3 border-b border-slate-100 px-4 sm:px-5">
        <SkeletonBlock tone="strong" className="size-10 sm:size-11" />
        <div className="space-y-2">
          <SkeletonBlock tone="strong" className="h-3 w-44" />
          <SkeletonBlock className="h-2 w-52 max-w-[48vw]" />
        </div>
        <SkeletonBlock className="ml-auto h-7 w-20 rounded-full" />
      </div>
      <div className={`grid gap-4 p-4 sm:grid-cols-2 sm:p-5 ${columns}`}>
        {Array.from({ length: fields }, (_, index) => (
          <FieldSkeleton key={index} />
        ))}
      </div>
    </section>
  )
}

export default function NewAdmissionSkeleton() {
  return (
    <div
      className="new-admission-skeleton app-skeleton min-h-screen dashboard-bg pb-16"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading new admission form"
    >
      <header className="skeleton-header flex min-h-20 items-center border-b px-4 sm:px-6 lg:px-7">
        <div className="ml-12 space-y-2 lg:ml-0">
          <SkeletonBlock tone="strong" className="h-5 w-36" />
          <SkeletonBlock className="h-2.5 w-96 max-w-[55vw]" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <SkeletonBlock className="hidden h-10 w-32 sm:block" />
          <SkeletonBlock tone="strong" className="size-11 rounded-2xl" />
          <SkeletonBlock className="hidden h-11 w-28 sm:block" />
        </div>
      </header>

      <main className="mx-auto max-w-[100rem] space-y-4 p-3 sm:space-y-5 sm:p-6 xl:p-8">
        <section className="new-admission-skeleton-hero relative overflow-hidden rounded-3xl p-4 sm:p-6">
          <span className="absolute -right-16 -top-20 size-64 rounded-full border border-white/10 bg-white/5" />
          <span className="absolute -bottom-28 left-1/3 size-56 rounded-full border-[36px] border-white/5" />
          <div className="relative grid items-center gap-5 sm:grid-cols-[1fr_22rem]">
            <div className="flex items-center gap-4">
              <SkeletonBlock
                tone="light"
                className="size-14 shrink-0 sm:size-16"
              />
              <div className="flex-1 space-y-3">
                <SkeletonBlock tone="light" className="h-6 w-44" />
                <SkeletonBlock
                  tone="light"
                  className="h-2.5 w-72 max-w-[70%] opacity-65"
                />
              </div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
              <div className="flex justify-between">
                <SkeletonBlock tone="light" className="h-2.5 w-28 opacity-65" />
                <SkeletonBlock tone="light" className="h-3 w-10" />
              </div>
              <SkeletonBlock
                tone="light"
                className="mt-3 h-2 w-full rounded-full opacity-65"
              />
              <div className="mt-3 flex gap-2">
                {Array.from({ length: 3 }, (_, index) => (
                  <SkeletonBlock
                    key={index}
                    tone="light"
                    className="h-6 w-16 rounded-full opacity-65"
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <SectionSkeleton fields={10} />
        <SectionSkeleton fields={8} columns="xl:grid-cols-4" />
        <SectionSkeleton fields={7} />

        <div className="grid gap-5 lg:grid-cols-2">
          <SectionSkeleton fields={1} columns="" />
          <section className="skeleton-card overflow-hidden rounded-2xl">
            <div className="flex min-h-16 items-center gap-3 border-b border-slate-100 px-4 sm:px-5">
              <SkeletonBlock tone="strong" className="size-10 sm:size-11" />
              <div className="space-y-2">
                <SkeletonBlock tone="strong" className="h-3 w-32" />
                <SkeletonBlock className="h-2 w-44" />
              </div>
              <SkeletonBlock className="ml-auto h-7 w-20 rounded-full" />
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <FieldSkeleton />
              <SkeletonBlock tone="strong" className="h-24 w-full" />
            </div>
          </section>
        </div>

        <section className="skeleton-card grid grid-cols-2 gap-2.5 rounded-2xl p-3 sm:flex sm:justify-end sm:gap-3 sm:p-4">
          <SkeletonBlock className="h-11 w-full sm:w-20" />
          <SkeletonBlock className="h-11 w-full sm:w-28" />
          <SkeletonBlock
            tone="strong"
            className="col-span-2 -order-1 h-12 w-full sm:order-none sm:h-11 sm:w-32"
          />
        </section>
      </main>
      <span className="sr-only">
        Loading admission details and enrollment form
      </span>
    </div>
  )
}
