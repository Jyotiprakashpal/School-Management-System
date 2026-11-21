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

function FieldSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div>
      <SkeletonBlock className="mb-2 h-2 w-24" />
      <SkeletonBlock
        tone="strong"
        className={tall ? "h-20 w-full" : "h-11 w-full"}
      />
    </div>
  )
}

function EnquiryRowSkeleton() {
  return (
    <div className="skeleton-action flex items-start gap-3 rounded-2xl p-4">
      <SkeletonBlock tone="strong" className="size-11 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <SkeletonBlock tone="strong" className="h-3 w-28" />
          <SkeletonBlock className="h-5 w-20 rounded-full" />
        </div>
        <SkeletonBlock className="mt-2 h-2 w-48 max-w-full" />
        <div className="mt-4 flex gap-3">
          <SkeletonBlock className="h-2 w-16" />
          <SkeletonBlock className="h-2 w-24" />
          <SkeletonBlock className="h-2 w-12" />
        </div>
      </div>
      <div className="hidden gap-2 sm:flex">
        <SkeletonBlock className="h-9 w-24" />
        <SkeletonBlock tone="strong" className="h-9 w-28" />
      </div>
    </div>
  )
}

export default function AdmissionEnquirySkeleton() {
  return (
    <div
      className="admission-enquiry-skeleton app-skeleton min-h-screen dashboard-bg pb-16"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading admission enquiries"
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

      <main className="mx-auto w-full min-w-0 max-w-none space-y-4 p-3 sm:space-y-5 sm:p-6 xl:p-8">
        <section className="admission-enquiry-skeleton-hero relative overflow-hidden rounded-3xl p-5 sm:p-7">
          <span className="absolute -right-16 -top-20 size-64 rounded-full border border-white/10 bg-white/5" />
          <span className="absolute -bottom-28 left-1/3 size-56 rounded-full border-[36px] border-white/5" />
          <div className="relative grid items-center gap-6 lg:grid-cols-[1fr_25rem]">
            <div>
              <SkeletonBlock
                tone="light"
                className="h-6 w-40 rounded-full opacity-75"
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
              <div className="flex justify-between">
                <SkeletonBlock tone="light" className="h-2.5 w-32 opacity-65" />
                <SkeletonBlock tone="light" className="h-3 w-12" />
              </div>
              <SkeletonBlock
                tone="light"
                className="mt-3 h-2.5 w-full rounded-full opacity-65"
              />
              <div className="mt-4 grid grid-cols-3 gap-2">
                {Array.from({ length: 3 }, (_, index) => (
                  <SkeletonBlock
                    key={index}
                    tone="light"
                    className="h-12 w-full opacity-65"
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <article
              key={index}
              className="skeleton-card rounded-2xl p-4 sm:p-5"
            >
              <div className="flex justify-between gap-3">
                <div className="space-y-2">
                  <SkeletonBlock className="h-2.5 w-24" />
                  <SkeletonBlock tone="strong" className="h-7 w-16" />
                </div>
                <SkeletonBlock tone="strong" className="size-10" />
              </div>
              <SkeletonBlock className="mt-4 h-2 w-28 max-w-full" />
            </article>
          ))}
        </section>

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(19rem,.8fr)_1.5fr]">
          <div className="space-y-5">
            <section className="skeleton-card overflow-hidden rounded-2xl">
              <div className="flex min-h-16 items-center gap-3 border-b border-slate-100 px-5">
                <SkeletonBlock tone="strong" className="size-10" />
                <div className="space-y-2">
                  <SkeletonBlock tone="strong" className="h-3 w-28" />
                  <SkeletonBlock className="h-2 w-48" />
                </div>
              </div>
              <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                {Array.from({ length: 4 }, (_, index) => (
                  <FieldSkeleton key={index} />
                ))}
                <FieldSkeleton tall />
                <FieldSkeleton tall />
              </div>
              <div className="flex justify-center border-t border-slate-100 p-5">
                <SkeletonBlock tone="strong" className="h-11 w-32" />
              </div>
            </section>
            <section className="skeleton-card rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <SkeletonBlock tone="strong" className="size-10" />
                <div className="space-y-2">
                  <SkeletonBlock tone="strong" className="h-3 w-40" />
                  <SkeletonBlock className="h-2 w-48" />
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <SkeletonBlock className="h-11 flex-1" />
                <SkeletonBlock tone="strong" className="h-11 w-24" />
              </div>
            </section>
          </div>

          <section className="skeleton-card overflow-hidden rounded-2xl">
            <div className="flex min-h-16 items-center gap-3 border-b border-slate-100 px-5">
              <SkeletonBlock tone="strong" className="size-10" />
              <div className="space-y-2">
                <SkeletonBlock tone="strong" className="h-3 w-28" />
                <SkeletonBlock className="h-2 w-52" />
              </div>
              <SkeletonBlock className="ml-auto h-7 w-20 rounded-full" />
            </div>
            <div className="border-b border-slate-100 p-4">
              <div className="grid gap-3 rounded-2xl border border-slate-100 p-4 sm:grid-cols-[1fr_12rem_6rem]">
                <SkeletonBlock tone="strong" className="h-11 w-full" />
                <SkeletonBlock className="h-11 w-full" />
                <SkeletonBlock className="h-11 w-full" />
              </div>
            </div>
            <div className="space-y-2 p-3">
              {Array.from({ length: 4 }, (_, index) => (
                <EnquiryRowSkeleton key={index} />
              ))}
            </div>
            <div className="flex justify-between border-t border-slate-100 p-5">
              <SkeletonBlock className="h-9 w-36" />
              <SkeletonBlock tone="strong" className="h-9 w-44" />
            </div>
          </section>
        </div>
      </main>
      <span className="sr-only">
        Loading enquiry records and admission pipeline
      </span>
    </div>
  )
}
