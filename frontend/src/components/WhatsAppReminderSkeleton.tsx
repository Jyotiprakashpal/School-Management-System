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

function RecipientSkeleton() {
  return (
    <div className="skeleton-action rounded-2xl p-3 sm:p-4">
      <div className="flex items-center gap-3">
        <SkeletonBlock className="size-4 shrink-0 rounded-md" />
        <SkeletonBlock tone="strong" className="size-10 shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonBlock tone="strong" className="h-3 w-36 max-w-[70%]" />
          <SkeletonBlock className="h-2 w-44 max-w-[80%]" />
        </div>
        <div className="space-y-2">
          <SkeletonBlock tone="strong" className="ml-auto h-4 w-16" />
          <SkeletonBlock className="ml-auto h-2 w-10" />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-2 w-24" />
          <SkeletonBlock className="h-2 w-36 max-w-[70%]" />
        </div>
        <SkeletonBlock tone="strong" className="h-8 w-20" />
      </div>
    </div>
  )
}

function PanelHeaderSkeleton({ action = false }: { action?: boolean }) {
  return (
    <div className="flex min-h-16 items-center justify-between gap-3 border-b border-slate-100 px-4 sm:px-5">
      <div className="flex items-center gap-3">
        <SkeletonBlock tone="strong" className="size-10" />
        <div className="space-y-2">
          <SkeletonBlock tone="strong" className="h-3 w-36" />
          <SkeletonBlock className="h-2 w-40 max-w-[38vw]" />
        </div>
      </div>
      {action && <SkeletonBlock tone="strong" className="h-9 w-24" />}
    </div>
  )
}

export default function WhatsAppReminderSkeleton() {
  return (
    <div
      className="whatsapp-reminder-skeleton app-skeleton min-h-screen w-full overflow-x-hidden dashboard-bg pb-16"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading WhatsApp fee reminders"
    >
      <header className="skeleton-header flex min-h-20 items-center border-b px-4 sm:px-6 lg:px-7">
        <div className="ml-12 space-y-2 lg:ml-0">
          <SkeletonBlock tone="strong" className="h-5 w-52" />
          <SkeletonBlock className="h-2.5 w-96 max-w-[55vw]" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <SkeletonBlock className="hidden h-10 w-32 sm:block" />
          <SkeletonBlock tone="strong" className="size-11 rounded-2xl" />
          <SkeletonBlock className="hidden h-11 w-28 sm:block" />
        </div>
      </header>

      <main className="mx-auto max-w-[100rem] space-y-4 p-4 sm:space-y-5 sm:p-6 xl:p-8">
        <section className="whatsapp-reminder-skeleton-hero relative overflow-hidden rounded-3xl p-5 sm:p-7">
          <span className="absolute -right-16 -top-20 size-64 rounded-full border border-white/10 bg-white/5" />
          <span className="absolute -bottom-28 left-1/3 size-56 rounded-full border-[36px] border-white/5" />
          <div className="relative grid items-center gap-6 lg:grid-cols-[1fr_23rem]">
            <div>
              <SkeletonBlock
                tone="light"
                className="h-7 w-48 rounded-full opacity-75"
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <SkeletonBlock tone="light" className="h-2 w-24 opacity-65" />
                  <SkeletonBlock tone="light" className="h-8 w-16" />
                </div>
                <div className="space-y-2 border-l border-white/10 pl-3">
                  <SkeletonBlock tone="light" className="h-2 w-20 opacity-65" />
                  <SkeletonBlock tone="light" className="h-8 w-24" />
                </div>
              </div>
              <SkeletonBlock tone="light" className="mt-4 h-10 w-full" />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <article
              key={index}
              className="skeleton-card rounded-2xl p-3 sm:p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-2">
                  <SkeletonBlock className="h-2.5 w-24 max-w-full" />
                  <SkeletonBlock tone="strong" className="h-7 w-16" />
                </div>
                <SkeletonBlock tone="strong" className="size-9 sm:size-10" />
              </div>
              <SkeletonBlock className="mt-3 h-2 w-28 max-w-full" />
            </article>
          ))}
        </section>

        <div className="grid items-start gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,.8fr)]">
          <section className="skeleton-card min-w-0 overflow-hidden rounded-2xl">
            <PanelHeaderSkeleton action />
            <div className="grid grid-cols-2 gap-3 border-b border-slate-100 p-3 sm:grid-cols-[1fr_9rem_9rem_auto] sm:p-4">
              <SkeletonBlock
                tone="strong"
                className="col-span-2 h-11 w-full sm:col-span-1"
              />
              <SkeletonBlock tone="strong" className="h-11 w-full" />
              <SkeletonBlock tone="strong" className="h-11 w-full" />
              <SkeletonBlock
                tone="strong"
                className="col-span-2 h-11 w-full sm:col-span-1 sm:w-20"
              />
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
              <SkeletonBlock className="h-3 w-36" />
              <SkeletonBlock className="h-3 w-24" />
            </div>
            <div className="space-y-2.5 p-3 sm:p-4">
              {Array.from({ length: 5 }, (_, index) => (
                <RecipientSkeleton key={index} />
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 p-4">
              <SkeletonBlock className="h-2.5 w-36" />
              <div className="flex gap-2">
                <SkeletonBlock className="size-9" />
                <SkeletonBlock tone="strong" className="size-9" />
                <SkeletonBlock className="size-9" />
              </div>
            </div>
          </section>

          <aside className="min-w-0 space-y-4 sm:space-y-5">
            <section className="skeleton-card overflow-hidden rounded-2xl">
              <PanelHeaderSkeleton />
              <div className="space-y-4 p-4 sm:p-5">
                <div>
                  <SkeletonBlock className="mb-2 h-2 w-16" />
                  <SkeletonBlock tone="strong" className="h-11 w-full" />
                </div>
                <div>
                  <SkeletonBlock className="mb-2 h-2 w-16" />
                  <SkeletonBlock tone="strong" className="h-36 w-full" />
                  <div className="mt-2 flex gap-2">
                    {Array.from({ length: 4 }, (_, index) => (
                      <SkeletonBlock
                        key={index}
                        className="h-6 w-20 rounded-full"
                      />
                    ))}
                  </div>
                </div>
                <SkeletonBlock className="h-10 w-full" />
              </div>
            </section>

            <section className="whatsapp-reminder-preview-skeleton overflow-hidden rounded-2xl border">
              <div className="flex items-center gap-2 px-4 py-3">
                <SkeletonBlock tone="light" className="size-5" />
                <SkeletonBlock tone="light" className="h-3 w-32" />
              </div>
              <div className="p-4">
                <div className="ml-auto w-[92%] rounded-2xl p-3">
                  <SkeletonBlock className="h-2.5 w-full" />
                  <SkeletonBlock className="mt-2 h-2.5 w-full" />
                  <SkeletonBlock className="mt-2 h-2.5 w-3/4" />
                  <SkeletonBlock className="ml-auto mt-3 h-2 w-14" />
                </div>
              </div>
            </section>

            <section className="skeleton-card overflow-hidden rounded-2xl">
              <PanelHeaderSkeleton />
              <div className="divide-y divide-slate-100">
                {Array.from({ length: 3 }, (_, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5"
                  >
                    <div className="flex-1 space-y-2">
                      <SkeletonBlock tone="strong" className="h-2.5 w-36" />
                      <SkeletonBlock className="h-2 w-24" />
                    </div>
                    <SkeletonBlock className="h-6 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </main>
      <span className="sr-only">
        Loading recipients, message templates, and reminder activity
      </span>
    </div>
  )
}
