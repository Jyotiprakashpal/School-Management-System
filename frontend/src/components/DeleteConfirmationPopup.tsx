import Popup from "../ui/popup"
import Button from "./Button"

export type DeleteConfirmationRecord = {
  context?: string
  name: string
  reference?: string
  status?: string
  statusTone?: "success" | "warning"
}

type DeleteConfirmationPopupProps = {
  confirmLabel?: string
  description?: string
  onCancel: () => void
  onConfirm: () => void
  open: boolean
  record: DeleteConfirmationRecord | null
  title?: string
  warning?: string
}

export function DeleteIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  )
}

export default function DeleteConfirmationPopup({
  confirmLabel = "Delete",
  description = "Review this record before permanently removing it.",
  onCancel,
  onConfirm,
  open,
  record,
  title = "Delete Record",
  warning = "This action cannot be undone. The selected record will be permanently removed.",
}: DeleteConfirmationPopupProps) {
  const initials =
    record?.name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("") ?? ""

  return (
    <Popup
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      panelClassName="sm:max-w-lg"
      icon={<DeleteIcon className="size-5" />}
      footerClassName="!grid grid-cols-2 sm:!flex"
      footer={
        <>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            className="w-full sm:w-auto"
            onClick={onConfirm}
            icon={<DeleteIcon />}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {record && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-4">
            <div className="flex items-start gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-rose-100 font-display text-sm font-bold text-rose-700">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="font-display text-base font-bold text-slate-900">
                  {record.name}
                </div>
                {(record.reference || record.context) && (
                  <div className="mt-1 text-xs text-slate-500">
                    {[record.reference, record.context]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                )}
                {record.status && (
                  <span
                    className={`mt-2 ${
                      record.statusTone === "success"
                        ? "status-success"
                        : "status-warning"
                    }`}
                  >
                    {record.status}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <svg
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-amber-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3 2 21h20L12 3Z" />
              <path d="M12 9v5M12 18h.01" />
            </svg>
            <p className="text-sm leading-6">{warning}</p>
          </div>
        </div>
      )}
    </Popup>
  )
}
