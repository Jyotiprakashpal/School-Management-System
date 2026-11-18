import { useEffect, useMemo, useState } from "react"
import {
  Button,
  DatePicker,
  Dropdown,
  FeeCollectionSkeleton,
  Input,
  PremiumPagination,
  useToast,
} from "../../components"
import Header from "../../ui/header"
import Popup from "../../ui/popup"
import { API_BASE, API_ENDPOINTS } from "../../api/endpoints"
import { get, post } from "../../api/methods"
import { getAuthUser } from "../../auth/session"
import { onFeeCollectionChanged, onFeeStructureChanged } from "../../api/socket"
import {
  feeBalance,
  nextReceiptNumber,
  studentPending,
  useStudents,
  useTransactions,
  type FeeHead,
  type Transaction,
} from "../../data/feeStore"

const today = () => new Date().toISOString().slice(0, 10)
const money = (value: number) => `₹${value.toLocaleString("en-IN")}`
const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
const csvCell = (value: string | number) =>
  `"${String(value).replace(/"/g, '""')}"`
const paymentModes = ["Cash", "UPI", "Card", "Bank Transfer", "Cheque"]
const modeOptions = paymentModes.map((value) => ({ label: value, value }))

type IconType = "search" | "fees" | "payment" | "history" | "download" | "reset" | "print" | "check"

function CollectionIcon({
  type,
  className = "size-5",
}: {
  type: IconType
  className?: string
}) {
  const paths = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    fees: (
      <>
        <path d="M6 5h12M6 9h12" />
        <path d="M7 5c7 0 7 8 0 8l8 7" />
      </>
    ),
    payment: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18M7 15h3" />
      </>
    ),
    history: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5M12 7v5l3 2" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12m0 0-4-4m4 4 4-4" />
        <path d="M5 21h14" />
      </>
    ),
    reset: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5" />
      </>
    ),
    print: (
      <>
        <path d="M7 9V3h10v6" />
        <rect x="4" y="9" width="16" height="8" rx="2" />
        <path d="M7 14h10v7H7z" />
      </>
    ),
    check: <path d="m5 12 5 5 9-10" />,
  }
  return (
    <svg
      className={className}
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[type]}
    </svg>
  )
}

function PanelHead({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: IconType
  title: string
  subtitle: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-(--app-accent-soft) text-(--app-accent-dark) ring-1 ring-(--app-accent)/20">
          <CollectionIcon type={icon} />
        </span>
        <div className="min-w-0">
          <h2 className="font-display truncate text-sm font-bold tracking-tight text-slate-900">
            {title}
          </h2>
          <p className="truncate text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>
      {action}
    </div>
  )
}

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
const balanceOf = feeBalance

export default function FeeCollection() {
  const [students, setStudents] = useStudents()
  const [activeId, setActiveId] = useState<number | null>(null)
  const [transactions, setTransactions] = useTransactions()
  const [academicYear, setAcademicYear] = useState("")
  const [studentSearch, setStudentSearch] = useState("")
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMode, setPaymentMode] = useState("Cash")
  const [paymentDate, setPaymentDate] = useState(today())
  const [reference, setReference] = useState("")
  const [remarks, setRemarks] = useState("")
  const [collecting, setCollecting] = useState(false)
  const [receipt, setReceipt] = useState<Transaction | null>(null)
  const [historyScope, setHistoryScope] = useState<"student" | "all">("all")
  const [historySearch, setHistorySearch] = useState("")
  const [historyMode, setHistoryMode] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const { showToast } = useToast()

  useEffect(() => {
    const refresh = () => setRefreshKey((value) => value + 1)
    const unsubscribePayments = onFeeCollectionChanged(refresh)
    const unsubscribeStructure = onFeeStructureChanged(refresh)
    return () => {
      unsubscribePayments()
      unsubscribeStructure()
    }
  }, [])

  useEffect(() => {
    let active = true
    type Admission = { id: number; admissionNo: string; fullName: string; fatherName: string | null; className: string | null; section: string | null; mobile: string | null; academicYear: string | null; status: string | null }
    type Fee = { id: number; className: string; name: string; amount: number | string; year: string }
    type Assignment = { className: string; year: string }
    type Payment = { id: number; studentId: string; admissionNo: string; studentName: string; feeHeadId: number; feeHeadName: string; amount: number | string; paidAmount: number | string; paymentMode: string; transactionId: string | null; receiptNumber: string; paymentDate: string; notes: string | null }
    void Promise.all([
      get<{ data: Admission[] }>(`${API_BASE}${API_ENDPOINTS.ADMISSIONS}?page=1&limit=100`, { cache: "no-store" }),
      get<{ data: Fee[] }>(`${API_BASE}${API_ENDPOINTS.FEES}?page=1&limit=100`, { cache: "no-store" }),
      get<{ data: Assignment[] }>(`${API_BASE}${API_ENDPOINTS.FEES}/assignments?page=1&limit=100`, { cache: "no-store" }),
      get<{ data: Payment[] }>(`${API_BASE}${API_ENDPOINTS.FEE_COLLECTIONS}?page=1&limit=100`, { cache: "no-store" }),
    ]).then(([admissionResponse, feeResponse, assignmentResponse, paymentResponse]) => {
      if (!active) return
      const assignments = assignmentResponse.data
      const years = [...new Set(assignments.map((entry) => entry.year))]
      const selectedYear = years[0] ?? feeResponse.data[0]?.year ?? ""
      const payments = paymentResponse.data
      const realStudents = admissionResponse.data
        .filter((admission) => admission.status !== "Inactive" && admission.className && assignments.some((entry) => entry.className === admission.className && (!admission.academicYear || entry.year === admission.academicYear)))
        .map((admission) => {
          const assignment = assignments.find((entry) => entry.className === admission.className && (entry.year === admission.academicYear || !admission.academicYear))
          const year = assignment?.year ?? selectedYear
          const heads = feeResponse.data.filter((fee) => fee.className === admission.className && fee.year === year)
          const fees = heads.map((fee) => {
            const paid = payments.filter((payment) => payment.studentId === String(admission.id) && payment.feeHeadId === fee.id).reduce((sum, payment) => sum + Number(payment.paidAmount), 0)
            return { id: fee.id, name: fee.name, amount: Number(fee.amount), paid, selected: false }
          })
          return { id: admission.id, name: admission.fullName, adm: admission.admissionNo, className: `${admission.className}${admission.section ? `-${admission.section}` : ""}`, father: admission.fatherName ?? "", phone: admission.mobile ?? "", fees }
        })
        .filter((student) => student.fees.length > 0)
      setAcademicYear(selectedYear)
      setStudents(realStudents)
      setTransactions(payments.map((payment) => ({ receipt: payment.receiptNumber, studentId: Number(payment.studentId), heads: payment.feeHeadName, amount: Number(payment.paidAmount), date: payment.paymentDate.slice(0, 10), mode: payment.paymentMode, reference: payment.transactionId ?? "", remarks: payment.notes ?? "" })))
      setActiveId((current) => current ?? realStudents[0]?.id ?? null)
    }).catch((error) => {
      if (active) showToast(error instanceof Error ? error.message : "Unable to load fee collection data.", { title: "Fee collection unavailable", tone: "error" })
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [setStudents, setTransactions, showToast, refreshKey])

  const student = students.find((item) => item.id === activeId) ?? null
  const selectedFees = student?.fees.filter((fee) => fee.selected) ?? []
  const selectedBalance = selectedFees.reduce(
    (sum, fee) => sum + balanceOf(fee),
    0,
  )
  const total = student?.fees.reduce((sum, fee) => sum + fee.amount, 0) ?? 0
  const paid = student?.fees.reduce((sum, fee) => sum + fee.paid, 0) ?? 0
  const pending = total - paid
  const paidPercent = total ? Math.round((paid / total) * 100) : 0
  const needsReference = paymentMode !== "Cash"
  const amountValue = Number(paymentAmount)
  const nextReceipt = nextReceiptNumber(transactions.length)

  const todayIso = today()
  const collectedToday = transactions
    .filter((item) => item.date === todayIso)
    .reduce((sum, item) => sum + item.amount, 0)
  const collectedMonth = transactions
    .filter((item) => item.date.slice(0, 7) === todayIso.slice(0, 7))
    .reduce((sum, item) => sum + item.amount, 0)
  const totalPending = students.reduce(
    (sum, item) => sum + studentPending(item),
    0,
  )
  const duesCount = students.filter((item) => studentPending(item) > 0).length

  const stats = [
    {
      label: "Collected Today",
      value: money(collectedToday),
      tone: "green",
      icon: "payment" as IconType,
      copy: `${transactions.filter((item) => item.date === todayIso).length} transactions`,
    },
    {
      label: "This Month",
      value: money(collectedMonth),
      tone: "teal",
      icon: "history" as IconType,
      copy: new Date().toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      }),
    },
    {
      label: "Total Pending",
      value: money(totalPending),
      tone: "amber",
      icon: "fees" as IconType,
      copy: `${duesCount} students with dues`,
    },
    {
      label: "Transactions",
      value: String(transactions.length),
      tone: "violet",
      icon: "check" as IconType,
      copy: "All receipts issued",
    },
  ]

  const matches = useMemo(() => {
    const term = studentSearch.trim().toLowerCase()
    if (!term) return students
    return students.filter((item) =>
      [item.name, item.adm, item.phone, item.className, item.father].some(
        (value) => value.toLowerCase().includes(term),
      ),
    )
  }, [studentSearch, students])

  const resetPayment = () => {
    setPaymentAmount("")
    setReference("")
    setRemarks("")
    setPaymentMode("Cash")
    setPaymentDate(today())
  }

  const selectStudent = (id: number) => {
    setActiveId(id)
    setStudents((current) =>
      current.map((item) => ({
        ...item,
        fees: item.fees.map((fee) => ({ ...fee, selected: false })),
      })),
    )
    resetPayment()
    setCurrentPage(1)
  }

  const searchStudent = () => {
    if (!studentSearch.trim()) {
      showToast("Enter a name, admission number or mobile number to search.", {
        title: "Search is empty",
        tone: "error",
      })
      return
    }
    if (!matches.length) {
      showToast(
        "No student matches that search. Try a different name or number.",
        { title: "Student not found", tone: "error" },
      )
      return
    }
    selectStudent(matches[0].id)
    showToast(`${matches[0].name}'s fee account has been loaded.`, {
      title: "Student found",
      tone: "info",
    })
  }

  const updateSelection = (nextFees: FeeHead[]) => {
    if (!student) return
    setStudents((current) =>
      current.map((item) =>
        item.id === student.id ? { ...item, fees: nextFees } : item,
      ),
    )
    const balance = nextFees
      .filter((fee) => fee.selected)
      .reduce((sum, fee) => sum + balanceOf(fee), 0)
    setPaymentAmount(balance ? String(balance) : "")
  }

  const toggleFee = (id: number) =>
    student &&
    updateSelection(
      student.fees.map((fee) =>
        fee.id === id && balanceOf(fee) > 0
          ? { ...fee, selected: !fee.selected }
          : fee,
      ),
    )

  const payableFees = student?.fees.filter((fee) => balanceOf(fee) > 0) ?? []
  const allSelected =
    payableFees.length > 0 && payableFees.every((fee) => fee.selected)
  const toggleAll = () =>
    student &&
    updateSelection(
      student.fees.map((fee) =>
        balanceOf(fee) > 0 ? { ...fee, selected: !allSelected } : fee,
      ),
    )

  const collectFee = async () => {
    if (!student) return
    if (!selectedFees.length) {
      showToast("Tick at least one pending fee head to collect against.", {
        title: "Select a fee head",
        tone: "error",
      })
      return
    }
    if (!amountValue || amountValue <= 0) {
      showToast("Enter a payment amount greater than zero.", {
        title: "Amount required",
        tone: "error",
      })
      return
    }
    if (amountValue > selectedBalance) {
      showToast(
        `Payment cannot exceed the selected balance of ${money(selectedBalance)}.`,
        { title: "Amount exceeds balance", tone: "error" },
      )
      return
    }
    if (paymentDate > today()) {
      showToast("Payment date cannot be in the future.", {
        title: "Invalid date",
        tone: "error",
      })
      return
    }
    if (needsReference && !reference.trim()) {
      showToast(`Enter the ${paymentMode.toLowerCase()} reference number.`, {
        title: "Reference required",
        tone: "error",
      })
      return
    }

    setCollecting(true)
    let remaining = amountValue
    const applied: string[] = []
    const allocations = new Map<number, number>()
    const classSeparator = student.className.lastIndexOf("-")
    const className = classSeparator > 0 ? student.className.slice(0, classSeparator) : student.className
    const section = classSeparator > 0 ? student.className.slice(classSeparator + 1) : "A"
    const nextFees = student.fees.map((fee) => {
      if (!fee.selected || remaining <= 0) return { ...fee, selected: false }
      const part = Math.min(balanceOf(fee), remaining)
      remaining -= part
      allocations.set(fee.id, part)
      applied.push(fee.name)
      return { ...fee, paid: fee.paid + part, selected: false }
    })
    try {
      const paymentRecords = await Promise.all(selectedFees.filter((fee) => (allocations.get(fee.id) ?? 0) > 0).map((fee) => {
        const paidAmount = allocations.get(fee.id) ?? 0
        return post<{ receiptNumber: string; paymentDate: string; paidAmount: number | string }>(`${API_BASE}${API_ENDPOINTS.FEE_COLLECTIONS}`, {
          studentId: String(student.id),
          admissionNo: student.adm,
          studentName: student.name,
          className,
          section,
          feeHeadId: fee.id,
          feeHeadName: fee.name,
          amount: fee.amount,
          paidAmount,
          paymentMode,
          transactionId: reference.trim() || undefined,
          paymentDate,
          academicYear,
          collectedBy: getAuthUser()?.username || "System",
          createdBy: getAuthUser()?.username || "System",
          notes: remarks.trim() || undefined,
        })
      }))
      const transaction: Transaction = {
        receipt: paymentRecords[0]?.receiptNumber ?? nextReceipt,
        studentId: student.id,
        heads: applied.join(", "),
        amount: amountValue,
        date: paymentDate,
        mode: paymentMode,
        reference: reference.trim(),
        remarks: remarks.trim(),
      }
    setStudents((current) =>
      current.map((item) =>
        item.id === student.id ? { ...item, fees: nextFees } : item,
      ),
    )
    setTransactions((current) => [transaction, ...current])
    setReceipt(transaction)
    resetPayment()
    setHistoryScope("student")
    setCurrentPage(1)
    setCollecting(false)
    showToast(`${money(amountValue)} was collected from ${student.name}.`, {
      title: "Fee collected successfully",
    })
    } catch (error) {
      setCollecting(false)
      showToast(error instanceof Error ? error.message : "Unable to save fee payment.", { title: "Payment failed", tone: "error" })
    }
  }

  const historyRows = useMemo(() => {
    const term = historySearch.trim().toLowerCase()
    return transactions.filter((item) => {
      if (historyScope === "student" && item.studentId !== activeId)
        return false
      if (historyMode && item.mode !== historyMode) return false
      if (!term) return true
      const owner = students.find((entry) => entry.id === item.studentId)
      return [item.receipt, item.heads, owner?.name ?? "", item.reference].some(
        (value) => value.toLowerCase().includes(term),
      )
    })
  }, [
    transactions,
    historyScope,
    historyMode,
    historySearch,
    activeId,
    students,
  ])

  const totalPages = Math.max(1, Math.ceil(historyRows.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const pagedRows = historyRows.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  )
  const ownerOf = (item: Transaction) =>
    students.find((entry) => entry.id === item.studentId)

  const exportHistory = () => {
    const header = [
      "Receipt",
      "Student",
      "Admission No",
      "Fee Heads",
      "Amount",
      "Date",
      "Mode",
      "Reference",
      "Remarks",
    ]
    const lines = historyRows.map((item) => {
      const owner = ownerOf(item)
      return [
        item.receipt,
        owner?.name ?? "",
        owner?.adm ?? "",
        item.heads,
        item.amount,
        item.date,
        item.mode,
        item.reference,
        item.remarks,
      ]
        .map(csvCell)
        .join(",")
    })
    const url = URL.createObjectURL(
      new Blob([[header.map(csvCell).join(","), ...lines].join("\n")], {
        type: "text/csv;charset=utf-8",
      }),
    )
    const link = document.createElement("a")
    link.href = url
    link.download = "fee-transactions.csv"
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    showToast(`${historyRows.length} transactions exported.`, {
      title: "Transactions exported",
    })
  }

  const printReceipt = (item: Transaction) => {
    const owner = ownerOf(item)
    const frame = document.createElement("iframe")
    frame.style.cssText = "position:fixed;width:0;height:0;border:0;opacity:0"
    document.body.appendChild(frame)
    const doc = frame.contentDocument
    if (!doc || !frame.contentWindow) {
      frame.remove()
      showToast("Printing is not available in this browser.", {
        title: "Could not print",
        tone: "error",
      })
      return
    }
    const rows = [
      ["Student", owner?.name ?? ""],
      ["Admission No.", owner?.adm ?? ""],
      ["Class", owner?.className ?? ""],
      ["Fee Heads", item.heads],
      ["Payment Date", formatDate(item.date)],
      ["Payment Mode", item.mode],
      ["Reference", item.reference || "-"],
    ]
    doc.open()
    doc.write(
      `<html><head><title>${item.receipt}</title><style>body{font-family:system-ui,sans-serif;padding:32px;color:#0f172a}h1{font-size:20px;margin:0}table{width:100%;border-collapse:collapse;margin-top:16px}td{padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:14px}td:first-child{color:#64748b;width:40%}.amt{font-size:32px;font-weight:700;margin:16px 0}</style></head><body><h1>PAL IT HUB - Fee Receipt</h1><p style="color:#64748b;font-size:13px">${item.receipt}</p><div class="amt">${money(item.amount)}</div><table>${rows.map(([label, value]) => `<tr><td>${label}</td><td>${String(value).replace(/</g, "&lt;")}</td></tr>`).join("")}</table><p style="margin-top:32px;font-size:12px;color:#64748b">Received by Super Admin. Thank you.</p></body></html>`,
    )
    doc.close()
    window.setTimeout(() => {
      frame.contentWindow?.focus()
      frame.contentWindow?.print()
      window.setTimeout(() => frame.remove(), 1000)
    }, 150)
  }

  const quickFill = (value: number) =>
    setPaymentAmount(String(Math.max(1, Math.min(value, selectedBalance))))

  if (loading) return <FeeCollectionSkeleton />

  return (
    <div className="fee-collection-screen min-h-screen dashboard-bg pb-16">
      <Header
        title="Fee Collection"
        subtitle="Search students, collect payments, and generate receipts"
      />
      <main className="mx-auto max-w-[100rem] space-y-4 p-4 sm:space-y-5 sm:p-6 xl:p-8">
        <section className="fee-collection-hero relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,var(--app-sidebar-start),var(--app-accent-dark)_58%,var(--app-accent))] p-5 text-white shadow-xl shadow-slate-900/10 sm:p-7">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-white/10 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 left-1/3 size-64 rounded-full border-[40px] border-white/5"
          />
          <div className="relative grid items-center gap-6 lg:grid-cols-[1fr_24rem]">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 backdrop-blur-sm">
                <CollectionIcon type="payment" className="size-4" />
                Revenue operations desk
              </div>
              <h2 className="mt-3 font-display text-2xl font-bold sm:text-3xl">
                Collect, reconcile, and receipt with confidence
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
                A focused payment workspace with live student balances, fee-head
                allocation, and complete receipt history.
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white/60">
                    Collected today
                  </div>
                  <div className="mt-1 truncate font-display text-2xl font-bold">
                    {money(collectedToday)}
                  </div>
                  <div className="mt-1 text-xs text-white/65">
                    {
                      transactions.filter((item) => item.date === todayIso)
                        .length
                    }{" "}
                    transactions
                  </div>
                </div>
                <div className="border-l border-white/10 pl-3">
                  <div className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white/60">
                    This month
                  </div>
                  <div className="mt-1 truncate font-display text-2xl font-bold">
                    {money(collectedMonth)}
                  </div>
                  <div className="mt-1 text-xs text-white/65">reconciled</div>
                </div>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-white/90"
                  style={{
                    width: `${Math.min(100, students.length ? ((students.length - duesCount) / students.length) * 100 : 0)}%`,
                  }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[0.65rem] text-white/65">
                <span>{students.length - duesCount} accounts cleared</span>
                <span>{money(totalPending)} pending</span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid auto-rows-fr grid-cols-[repeat(2,minmax(0,1fr))] gap-2.5 sm:gap-3 xl:grid-cols-[repeat(4,minmax(0,1fr))] [&>article]:h-full">
          {stats.map((stat) => (
            <article
              key={stat.label}
              className={`admission-summary-card admission-summary-${stat.tone} relative overflow-hidden rounded-2xl p-3 shadow-sm sm:p-5`}
            >
              <div className="flex items-start justify-between gap-2 sm:gap-3">
                <div className="min-w-0">
                  <div className="truncate text-[0.7rem] font-semibold text-slate-500 sm:text-xs">
                    {stat.label}
                  </div>
                  <div className="mt-1 truncate font-display text-xl font-bold text-slate-950 sm:text-2xl">
                    {stat.value}
                  </div>
                </div>
                <span className="admission-summary-icon grid size-8 shrink-0 place-items-center rounded-xl sm:size-10">
                  <CollectionIcon
                    type={stat.icon}
                    className="size-4 sm:size-5"
                  />
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[0.7rem] font-medium text-slate-500 sm:mt-3 sm:text-xs">
                <span className="size-1.5 shrink-0 rounded-full bg-current opacity-50" />
                <span className="truncate">{stat.copy}</span>
              </div>
            </article>
          ))}
        </section>

        <section className="panel overflow-visible">
          <PanelHead
            icon="search"
            title="Find Student"
            subtitle="Search by name, admission no., class or mobile"
            action={
              <span className="status-info hidden shrink-0 sm:inline-flex">
                {matches.length} of {students.length} students
              </span>
            }
          />
          <div className="space-y-4 p-4 sm:p-5">
            <form
              className="flex flex-col gap-2.5 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault()
                searchStudent()
              }}
            >
              <div className="flex-1">
                <Input
                  value={studentSearch}
                  onChange={(event) => setStudentSearch(event.target.value)}
                  placeholder="Name, admission no. or mobile number..."
                  aria-label="Search student"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <Button
                  type="submit"
                  icon={<CollectionIcon type="search" className="size-4" />}
                >
                  Search
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setStudentSearch("")}
                  disabled={!studentSearch}
                >
                  Clear
                </Button>
              </div>
            </form>
            {matches.length === 0 ? (
              <div className="grid place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center text-sm text-slate-500">
                No student matches "{studentSearch}".
              </div>
            ) : (
              <div className="-mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3 xl:grid-cols-6">
                {matches.map((item) => {
                  const due = studentPending(item)
                  const active = item.id === activeId
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectStudent(item.id)}
                      aria-pressed={active}
                      className={`fee-collection-student-card group min-w-56 snap-start rounded-2xl border p-3 text-left transition sm:min-w-0 xl:p-3 ${
                        active
                          ? "fee-collection-student-active border-(--app-accent) bg-(--app-accent-faint) shadow-md ring-2 ring-(--app-accent)/20"
                          : "border-slate-200 bg-white shadow-sm hover:border-(--app-accent)/50 hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`grid size-9 shrink-0 place-items-center rounded-xl text-xs font-bold ${
                            active
                              ? "bg-(--app-accent) text-white"
                              : "bg-(--app-accent-soft) text-(--app-accent-dark)"
                          }`}
                        >
                          {initials(item.name)}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-900">
                            {item.name}
                          </div>
                          <div className="truncate text-[0.7rem] text-slate-500">
                            {item.className} · {item.adm.slice(-4)}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2.5 flex items-center justify-between text-[0.7rem]">
                        <span className="text-slate-400">Pending</span>
                        <span
                          className={due ? "status-warning" : "status-success"}
                        >
                          {due ? money(due) : "Cleared"}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {student ? (
          <>
            <section className="grid items-start gap-4 sm:gap-5 xl:grid-cols-[1.1fr_.9fr]">
              <div className="space-y-4 sm:space-y-5">
                <section className="relative overflow-hidden rounded-2xl bg-[linear-gradient(135deg,var(--app-sidebar-start),var(--app-accent-dark)_60%,var(--app-accent))] p-4 text-white shadow-lg shadow-black/10 sm:p-6">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-white/10"
                  />
                  <div className="relative flex items-center gap-3 sm:gap-5">
                    <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/15 font-display text-xl font-bold ring-1 ring-white/30 sm:size-20 sm:rounded-3xl sm:text-3xl">
                      {initials(student.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display truncate text-lg font-bold sm:text-xl">
                          {student.name}
                        </h2>
                        <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[0.7rem] font-semibold ring-1 ring-white/25">
                          {pending ? "Dues pending" : "All paid"}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[0.7rem] text-white/75 sm:text-xs">
                        <span className="truncate">
                          Adm:{" "}
                          <strong className="text-white">{student.adm}</strong>
                        </span>
                        <span className="truncate">
                          Class:{" "}
                          <strong className="text-white">
                            {student.className}
                          </strong>
                        </span>
                        <span className="truncate">
                          Father:{" "}
                          <strong className="text-white">
                            {student.father}
                          </strong>
                        </span>
                        <span className="truncate">
                          Phone:{" "}
                          <strong className="text-white">
                            {student.phone}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="relative mt-4 sm:mt-5">
                    <div className="flex items-center justify-between text-[0.7rem] text-white/80 sm:text-xs">
                      <span>Fee paid</span>
                      <strong className="text-white">{paidPercent}%</strong>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/20">
                      <div
                        className="h-full rounded-full bg-white transition-all duration-500"
                        style={{ width: `${paidPercent}%` }}
                      />
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      {[
                        ["Total", total],
                        ["Paid", paid],
                        ["Pending", pending],
                      ].map(([label, value]) => (
                        <div
                          key={label as string}
                          className="rounded-xl bg-white/10 px-2 py-2 ring-1 ring-white/15"
                        >
                          <div className="font-display text-sm font-bold sm:text-base">
                            {money(value as number)}
                          </div>
                          <div className="text-[0.6rem] font-semibold uppercase tracking-wider text-white/65">
                            {label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="panel overflow-visible">
                  <PanelHead
                    icon="fees"
                    title="Fee Heads"
                    subtitle={`${selectedFees.length} of ${payableFees.length} pending selected`}
                    action={
                      payableFees.length > 0 ? (
                        <Button
                          variant="outline"
                          className="shrink-0 px-3"
                          onClick={toggleAll}
                        >
                          {allSelected ? "Clear all" : "Select all"}
                        </Button>
                      ) : (
                        <span className="status-success shrink-0">
                          All cleared
                        </span>
                      )
                    }
                  />
                  <ul className="fee-collection-head-list space-y-2.5 bg-linear-to-b from-slate-50/60 to-transparent p-3 sm:p-4">
                    {student.fees.map((fee) => {
                      const balance = balanceOf(fee)
                      const percent = fee.amount
                        ? Math.round((fee.paid / fee.amount) * 100)
                        : 0
                      const cleared = balance === 0
                      return (
                        <li key={fee.id}>
                          <label
                            className={`fee-collection-head-card relative flex items-center gap-3 rounded-2xl border p-3 transition sm:gap-4 sm:p-4 ${
                              cleared
                                ? "fee-collection-head-cleared cursor-not-allowed border-slate-200 bg-slate-50/70"
                                : fee.selected
                                  ? "fee-collection-head-selected cursor-pointer border-(--app-accent) bg-(--app-accent-faint) shadow-md ring-2 ring-(--app-accent)/20"
                                  : "cursor-pointer border-slate-200 bg-white shadow-sm hover:border-(--app-accent)/50 hover:shadow-md"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="peer sr-only"
                              aria-label={`Select ${fee.name}`}
                              checked={fee.selected}
                              disabled={cleared}
                              onChange={() => toggleFee(fee.id)}
                            />
                            <span
                              aria-hidden="true"
                              className={`fee-collection-checkbox grid size-6 shrink-0 place-items-center rounded-lg border-2 transition peer-focus-visible:ring-4 peer-focus-visible:ring-(--app-accent)/25 ${
                                cleared
                                  ? "fee-collection-checkbox-cleared border-emerald-200 bg-emerald-100 text-emerald-600"
                                  : fee.selected
                                    ? "fee-collection-checkbox-selected border-(--app-accent) bg-(--app-accent) text-white"
                                    : "border-slate-300 bg-white text-transparent"
                              }`}
                            >
                              <CollectionIcon
                                type="check"
                                className="size-3.5"
                              />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="truncate text-sm font-semibold text-slate-900">
                                  {fee.name}
                                </span>
                                <span
                                  className={`shrink-0 ${
                                    cleared
                                      ? "status-success"
                                      : fee.paid
                                        ? "status-info"
                                        : "status-warning"
                                  }`}
                                >
                                  {cleared
                                    ? "Paid"
                                    : fee.paid
                                      ? "Partial"
                                      : "Pending"}
                                </span>
                              </div>
                              <div className="fee-collection-progress mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    cleared
                                      ? "bg-emerald-500"
                                      : "bg-(--app-accent)"
                                  }`}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                              <div className="mt-2 grid grid-cols-3 gap-2 text-[0.7rem] sm:text-xs">
                                <span className="text-slate-500">
                                  Total{" "}
                                  <strong className="block text-slate-800 sm:inline">
                                    {money(fee.amount)}
                                  </strong>
                                </span>
                                <span className="text-slate-500">
                                  Paid{" "}
                                  <strong className="block text-emerald-600 sm:inline">
                                    {money(fee.paid)}
                                  </strong>
                                </span>
                                <span className="text-right text-slate-500">
                                  Due{" "}
                                  <strong
                                    className={`block sm:inline ${
                                      balance
                                        ? "text-red-500"
                                        : "text-slate-400"
                                    }`}
                                  >
                                    {money(balance)}
                                  </strong>
                                </span>
                              </div>
                            </div>
                          </label>
                        </li>
                      )
                    })}
                  </ul>
                  <div className="fee-collection-head-footer flex items-center justify-between gap-3 border-t border-slate-100 bg-white px-4 py-3 text-xs sm:px-5">
                    <span className="text-slate-500">
                      {selectedFees.length
                        ? `${selectedFees.length} selected`
                        : "Tap a fee head to select it"}
                    </span>
                    <span className="text-slate-500">
                      Selected due{" "}
                      <strong className="font-display text-sm text-(--app-accent-dark)">
                        {money(selectedBalance)}
                      </strong>
                    </span>
                  </div>
                </section>
              </div>

              <section className="panel relative flex flex-col overflow-visible">
                <span
                  aria-hidden="true"
                  className="absolute inset-x-6 top-0 h-0.5 rounded-b-full bg-[linear-gradient(90deg,transparent,var(--app-accent),transparent)]"
                />
                <PanelHead
                  icon="payment"
                  title="Payment Details"
                  subtitle={
                    selectedFees.length
                      ? `${selectedFees.length} fee head${
                          selectedFees.length > 1 ? "s" : ""
                        } · ${money(selectedBalance)} due`
                      : "Select fee heads to begin"
                  }
                  action={
                    <span className="status-info shrink-0">{nextReceipt}</span>
                  }
                />
                <form
                  noValidate
                  onSubmit={(event) => {
                    event.preventDefault()
                    void collectFee()
                  }}
                >
                  <div className="fee-collection-payment-form grid grid-cols-2 gap-x-3 gap-y-4 bg-linear-to-b from-slate-50/60 to-transparent p-4 sm:gap-x-4 sm:p-6 [&>*]:min-w-0 [&_select]:truncate max-sm:[&>:first-child]:col-span-2">
                    <div className="col-span-2">
                      <Input
                        label="Payment Amount (₹) *"
                        type="number"
                        min="1"
                        value={paymentAmount}
                        onChange={(event) =>
                          setPaymentAmount(event.target.value)
                        }
                        placeholder="0"
                        hint={
                          selectedFees.length
                            ? `Selected balance: ${money(selectedBalance)}`
                            : "Select a pending fee head first"
                        }
                        disabled={!selectedFees.length}
                      />
                      {selectedFees.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {[
                            ["Full", selectedBalance],
                            ["Half", Math.ceil(selectedBalance / 2)],
                            ["₹100", 100],
                          ]
                            .filter(
                              ([, value]) => Number(value) <= selectedBalance,
                            )
                            .map(([label, value]) => (
                              <button
                                key={label as string}
                                type="button"
                                onClick={() => quickFill(value as number)}
                                className="fee-collection-shortcut rounded-full border border-(--app-accent)/30 bg-(--app-accent-faint) px-3 py-1 text-xs font-semibold text-(--app-accent-dark) transition hover:bg-(--app-accent-soft)"
                              >
                                {label === "Full"
                                  ? `Full ${money(value as number)}`
                                  : label === "Half"
                                    ? `Half ${money(value as number)}`
                                    : label}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                    <Dropdown
                      label="Payment Mode"
                      value={paymentMode}
                      onChange={(event) => setPaymentMode(event.target.value)}
                      options={modeOptions}
                      placeholder="Select mode"
                    />
                    <DatePicker label="Payment Date" value={paymentDate} onChange={setPaymentDate} />
                    {needsReference && (
                      <div className="col-span-2">
                        <Input
                          label={`${paymentMode} Reference No. *`}
                          value={reference}
                          onChange={(event) => setReference(event.target.value)}
                          placeholder="Transaction / cheque number"
                        />
                      </div>
                    )}
                    <div className="col-span-2">
                      <Input
                        label="Remarks"
                        value={remarks}
                        onChange={(event) => setRemarks(event.target.value)}
                        placeholder="Optional payment notes"
                      />
                    </div>
                  </div>
                  <div className="fee-collection-summary-wrap bg-slate-50/60 px-4 pb-4 sm:px-6 sm:pb-6">
                    <div className="fee-collection-summary rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Paying now</span>
                        <strong className="font-display text-base text-(--app-accent-dark)">
                          {money(amountValue > 0 ? amountValue : 0)}
                        </strong>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                        <span>Balance after payment</span>
                        <strong className="text-slate-800">
                          {money(
                            Math.max(
                              0,
                              pending -
                                (amountValue > 0 &&
                                amountValue <= selectedBalance
                                  ? amountValue
                                  : 0),
                            ),
                          )}
                        </strong>
                      </div>
                    </div>
                  </div>
                  <div className="fee-collection-actions grid grid-cols-2 gap-2 border-t border-slate-100 bg-white p-4 sm:flex sm:justify-end sm:p-5">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const last = transactions.find(
                          (item) => item.studentId === student.id,
                        )
                        last
                          ? setReceipt(last)
                          : showToast(
                              "Complete a payment before printing a receipt.",
                              { title: "No receipt available", tone: "error" },
                            )
                      }}
                      icon={<CollectionIcon type="print" className="size-4" />}
                    >
                      Last Receipt
                    </Button>
                    <Button
                      type="submit"
                      icon={<CollectionIcon type="check" className="size-4" />}
                      isLoading={collecting}
                      loadingText="Collecting..."
                      disabled={!selectedFees.length}
                    >
                      Collect Fee
                    </Button>
                  </div>
                </form>
              </section>
            </section>
          </>
        ) : (
          <section className="panel">
            <div className="grid place-items-center px-4 py-14 text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-(--app-accent-soft) text-(--app-accent-dark)">
                <CollectionIcon type="search" className="size-6" />
              </span>
              <h2 className="mt-4 font-display text-base font-bold text-slate-900">
                Select a student to start
              </h2>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                Search above or pick a student card to load their fee account
                and collect a payment.
              </p>
            </div>
          </section>
        )}

        <section className="panel overflow-visible">
          <PanelHead
            icon="history"
            title="Transactions"
            subtitle={`${historyRows.length} receipts`}
            action={
              <Button
                variant="outline"
                className="shrink-0 px-3"
                onClick={exportHistory}
                disabled={!historyRows.length}
                icon={<CollectionIcon type="download" className="size-4" />}
              >
                Export
              </Button>
            }
          />
          <div className="fee-collection-history-filters grid grid-cols-2 gap-2.5 border-b border-slate-100 bg-linear-to-b from-slate-50/80 to-transparent p-3 max-sm:[&>:first-child]:col-span-2 max-sm:[&>:last-child]:col-span-2 sm:grid-cols-[1fr_10rem_10rem_auto] sm:gap-3 sm:p-4 xl:grid-cols-[1fr_12rem_12rem_auto]">
            <Input
              value={historySearch}
              onChange={(event) => {
                setHistorySearch(event.target.value)
                setCurrentPage(1)
              }}
              placeholder="Search receipt, student or fee head..."
              aria-label="Search transactions"
            />
            <Dropdown
              value={historyScope}
              onChange={(event) => {
                setHistoryScope(event.target.value as "student" | "all")
                setCurrentPage(1)
              }}
              aria-label="Scope"
              placeholder="Scope"
              options={[
                { label: "All students", value: "all" },
                {
                  label: student ? `${student.name} only` : "Selected student",
                  value: "student",
                },
              ]}
            />
            <Dropdown
              value={historyMode}
              onChange={(event) => {
                setHistoryMode(event.target.value)
                setCurrentPage(1)
              }}
              aria-label="Mode filter"
              placeholder="All Modes"
              options={modeOptions}
            />
            <Button
              variant="outline"
              className="fee-collection-reset border-rose-200! bg-linear-to-r! from-rose-50! to-orange-50! text-rose-600! shadow-sm hover:from-rose-100! hover:to-orange-100! hover:border-rose-300! active:scale-95"
              onClick={() => {
                setHistorySearch("")
                setHistoryMode("")
                setHistoryScope("all")
                setCurrentPage(1)
              }}
              icon={<CollectionIcon type="reset" className="size-3.5" />}
            >
              Reset
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="module-table student-directory-table student-premium-cards">
              <thead>
                <tr>
                  <th>Receipt</th>
                  <th>Student</th>
                  <th>Fee Heads</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Mode</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((item) => (
                  <tr key={item.receipt}>
                    <td data-label="Receipt">
                      <span className="font-semibold text-(--app-accent-dark)">
                        {item.receipt}
                      </span>
                    </td>
                    <td data-label="Student">{ownerOf(item)?.name}</td>
                    <td data-label="Fee Heads">{item.heads}</td>
                    <td data-label="Amount">
                      <span className="font-bold text-emerald-600">
                        {money(item.amount)}
                      </span>
                    </td>
                    <td data-label="Date">{formatDate(item.date)}</td>
                    <td data-label="Mode">
                      <span className="status-neutral">{item.mode}</span>
                    </td>
                    <td data-label="Action">
                      <Button
                        variant="outline"
                        className="min-h-8 px-3 py-1.5"
                        onClick={() => setReceipt(item)}
                      >
                        Receipt
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!pagedRows.length && (
              <div className="fee-collection-empty grid min-h-40 place-items-center p-6 text-center text-sm text-slate-400">
                No transactions match these filters.
              </div>
            )}
          </div>
          <PremiumPagination
            currentPage={safePage}
            totalPages={totalPages}
            totalRecords={historyRows.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setCurrentPage(1)
            }}
            wideLayout
          />
        </section>
      </main>

      <Popup
        open={Boolean(receipt)}
        onClose={() => setReceipt(null)}
        title="Payment Receipt"
        description="Review the payment summary before printing."
        footer={
          <>
            <Button variant="outline" onClick={() => setReceipt(null)}>
              Close
            </Button>
            <Button
              icon={<CollectionIcon type="print" className="size-4" />}
              onClick={() => receipt && printReceipt(receipt)}
            >
              Print Receipt
            </Button>
          </>
        }
      >
        {receipt && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-[linear-gradient(135deg,var(--app-sidebar-start),var(--app-accent-dark)_60%,var(--app-accent))] p-5 text-white">
              <div className="text-xs text-white/70">Amount received</div>
              <div className="mt-1 font-display text-3xl font-bold">
                {money(receipt.amount)}
              </div>
              <div className="mt-4 flex justify-between text-xs">
                <span className="text-white/70">Receipt No.</span>
                <strong>{receipt.receipt}</strong>
              </div>
            </div>
            <dl className="fee-collection-receipt-details grid grid-cols-2 gap-3">
              {[
                ["Student", ownerOf(receipt)?.name ?? ""],
                ["Admission No.", ownerOf(receipt)?.adm ?? ""],
                ["Payment Date", formatDate(receipt.date)],
                ["Payment Mode", receipt.mode],
                ["Fee Heads", receipt.heads],
                ["Reference", receipt.reference || "—"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="min-w-0 rounded-xl border border-slate-100 p-3"
                >
                  <dt className="text-[0.62rem] font-bold uppercase tracking-wider text-slate-400">
                    {label}
                  </dt>
                  <dd className="mt-1 break-words text-sm font-semibold text-slate-800">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            {receipt.remarks && (
              <p className="fee-collection-receipt-remarks rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                Remarks: {receipt.remarks}
              </p>
            )}
          </div>
        )}
      </Popup>
    </div>
  )
}
