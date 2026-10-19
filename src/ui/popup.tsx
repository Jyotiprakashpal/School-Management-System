import { useEffect, type ReactNode } from "react"

type PopupProps = {
  children: ReactNode
  description?: string
  footer?: ReactNode
  footerClassName?: string
  icon?: ReactNode
  onClose: () => void
  open: boolean
  title: string
}

export default function Popup({
  children,
  description,
  footer,
  footerClassName = "",
  icon,
  onClose,
  open,
  title,
}: PopupProps) {
  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", closeOnEscape)
    }
  }, [onClose, open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[90] grid items-end sm:place-items-center sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <section className="premium-modal relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white sm:max-w-2xl sm:rounded-3xl">
        <header className="popup-header flex shrink-0 items-start gap-3 px-4 py-4 text-white sm:gap-4 sm:py-5 sm:px-6">
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/15 text-white ring-1 ring-white/20 backdrop-blur-sm">
            {icon ?? (
              <svg
                className="size-5"
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="9" cy="7" r="4" />
                <path d="M2 21a7 7 0 0 1 14 0M19 8v6M16 11h6" />
              </svg>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id="modal-title"
              className="font-display text-lg font-bold leading-snug tracking-tight text-white wrap-break-word sm:text-xl"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-xs leading-5 text-white/80 wrap-break-word">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center rounded-xl text-white/75 transition hover:bg-white/15 hover:text-white"
            aria-label="Close"
          >
            <svg
              className="size-5"
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          {children}
        </div>
        {footer && (
          <footer
            className={`flex ${
              title === "Add New Student" ||
              title === "Edit Student Record" ||
              title === "Create Notice" ||
              title === "Edit Notice" ||
              title === "Notice Preview"
                ? "flex-row [&>*]:min-w-0 [&>*]:flex-1 sm:[&>*]:flex-none"
                : "flex-col-reverse sm:flex-row"
            } gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:justify-end sm:px-6 ${footerClassName}`}
          >
            {footer}
          </footer>
        )}
      </section>
    </div>
  )
}
