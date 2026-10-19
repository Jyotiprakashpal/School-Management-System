import { useMemo, useState, type ReactNode } from "react"
import { Button, Dropdown, Input, useToast } from "../../components"
import Header from "../../ui/header"
import Popup from "../../ui/popup"

type ExpenseStatus = "Approved" | "Pending"

type Expense = {
  amount: number
  category: string
  date: string
  description: string
  id: number
  mode: string
  payee: string
  reference: string
  status: ExpenseStatus
  voucher: string
}

const initialExpenses: Expense[] = [
  {
    id: 1,
    voucher: "EXP-2609-008",
    category: "Maintenance",
    description: "Classroom repair and paint",
    amount: 5000,
    date: "2026-09-21",
    mode: "Cash",
    payee: "Sharma Hardware",
    reference: "INV-451",
    status: "Approved",
  },
  {
    id: 2,
    voucher: "EXP-2609-007",
    category: "Utilities",
    description: "September electricity bill",
    amount: 4500,
    date: "2026-09-18",
    mode: "Bank Transfer",
    payee: "State Power Corp.",
    reference: "ELEC-9091",
    status: "Approved",
  },
  {
    id: 3,
    voucher: "EXP-2609-006",
    category: "Academic",
    description: "Science laboratory supplies",
    amount: 2800,
    date: "2026-09-14",
    mode: "UPI",
    payee: "Modern Lab Works",
    reference: "MLW-183",
    status: "Pending",
  },
  {
    id: 4,
    voucher: "EXP-2609-005",
    category: "Transport",
    description: "School bus fuel",
    amount: 3200,
    date: "2026-09-10",
    mode: "Card",
    payee: "City Fuel Station",
    reference: "CFS-882",
    status: "Approved",
  },
  {
    id: 5,
    voucher: "EXP-2609-004",
    category: "Office",
    description: "Printer paper and stationery",
    amount: 1750,
    date: "2026-09-06",
    mode: "Cash",
    payee: "National Stationers",
    reference: "NS-240",
    status: "Approved",
  },
  {
    id: 6,
    voucher: "EXP-2608-003",
    category: "Events",
    description: "Independence Day decorations",
    amount: 2400,
    date: "2026-08-12",
    mode: "UPI",
    payee: "Celebration House",
    reference: "CH-714",
    status: "Approved",
  },
]

const blankExpense = {
  amount: "",
  category: "",
  date: "2026-09-28",
  description: "",
  mode: "Bank Transfer",
  payee: "",
  reference: "",
  status: "Pending" as ExpenseStatus,
}

type ExpenseIconType = "wallet" | "chart" | "receipt" | "search" | "plus" | "refresh" | "export" | "view" | "edit" | "trash" | "check" | "clock"

function ExpenseIcon({
  type,
  className = "size-5",
}: {
  type: ExpenseIconType
  className?: string
}) {
  const paths: Record<ExpenseIconType, ReactNode> = {
    wallet: (
      <>
        <path d="M4 6h14a2 2 0 0 1 2 2v11H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h13" />
        <path d="M16 11h6v5h-6a2.5 2.5 0 0 1 0-5Z" />
      </>
    ),
    chart: (
      <>
        <path d="M4 19V9M10 19V5M16 19v-7M22 19V3" />
        <path d="M2 21h20" />
      </>
    ),
    receipt: (
      <>
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
        <path d="M9 8h6M9 12h6M9 16h3" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    refresh: (
      <>
        <path d="M20 7h-5V2" />
        <path d="M20 7a8 8 0 1 0 1 7" />
      </>
    ),
    export: (
      <>
        <path d="M12 3v13M7 11l5 5 5-5" />
        <path d="M4 21h16" />
      </>
    ),
    view: (
      <>
        <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    edit: (
      <>
        <path d="m4 20 4.5-1 10-10-3.5-3.5-10 10L4 20Z" />
        <path d="m13.5 6.5 3.5 3.5" />
      </>
    ),
    trash: (
      <>
        <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
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

function formatCurrency(value: number) {
  return `₹${value.toLocaleString("en-IN")}`
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function progressWidth(value: number, max: number) {
  const percentage = max ? value / max : 0
  if (percentage >= 0.85) return "w-full"
  if (percentage >= 0.65) return "w-3/4"
  if (percentage >= 0.4) return "w-1/2"
  if (percentage >= 0.2) return "w-1/3"
  return "w-1/4"
}

export default function Expenses() {
  const [expenses, setExpenses] = useState(initialExpenses)
  const [query, setQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All Categories")
  const [statusFilter, setStatusFilter] = useState("All Status")
  const [period, setPeriod] = useState("September 2026")
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(blankExpense)
  const [saving, setSaving] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [deleteExpense, setDeleteExpense] = useState<Expense | null>(null)
  const { showToast } = useToast()
  const monthlyBudget = 25000

  const visibleExpenses = useMemo(
    () =>
      expenses.filter((expense) => {
        const matchesQuery =
          `${expense.voucher} ${expense.description} ${expense.payee}`
            .toLowerCase()
            .includes(query.toLowerCase())
        const matchesCategory =
          categoryFilter === "All Categories" ||
          expense.category === categoryFilter
        const matchesStatus =
          statusFilter === "All Status" || expense.status === statusFilter
        const month =
          period === "September 2026"
            ? "2026-09"
            : period === "August 2026"
              ? "2026-08"
              : ""
        return (
          matchesQuery &&
          matchesCategory &&
          matchesStatus &&
          (!month || expense.date.startsWith(month))
        )
      }),
    [categoryFilter, expenses, period, query, statusFilter],
  )

  const septemberExpenses = expenses.filter((expense) =>
    expense.date.startsWith("2026-09"),
  )
  const monthlySpend = septemberExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  )
  const approvedSpend = septemberExpenses
    .filter((expense) => expense.status === "Approved")
    .reduce((sum, expense) => sum + expense.amount, 0)
  const pendingSpend = septemberExpenses
    .filter((expense) => expense.status === "Pending")
    .reduce((sum, expense) => sum + expense.amount, 0)
  const budgetUsed = Math.min(
    100,
    Math.round((monthlySpend / monthlyBudget) * 100),
  )
  const categoryTotals = useMemo(
    () =>
      Object.entries(
        septemberExpenses.reduce<Record<string, number>>((totals, expense) => {
          totals[expense.category] =
            (totals[expense.category] ?? 0) + expense.amount
          return totals
        }, {}),
      ).sort((first, second) => second[1] - first[1]),
    [expenses],
  )

  const refreshExpenses = async () => {
    setLoading(true)
    await new Promise((resolve) => window.setTimeout(resolve, 650))
    setLoading(false)
    showToast(
      `${visibleExpenses.length} expense records match the selected filters.`,
      { title: "Expenses updated", tone: "info" },
    )
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(blankExpense)
    setEditorOpen(true)
  }

  const openEdit = (expense: Expense) => {
    setEditingId(expense.id)
    setForm({
      amount: String(expense.amount),
      category: expense.category,
      date: expense.date,
      description: expense.description,
      mode: expense.mode,
      payee: expense.payee,
      reference: expense.reference,
      status: expense.status,
    })
    setEditorOpen(true)
  }

  const saveExpense = async () => {
    const amount = Number(form.amount)
    if (
      !form.category ||
      !form.description.trim() ||
      !form.payee.trim() ||
      !form.date ||
      !amount ||
      amount <= 0
    ) {
      showToast(
        "Category, description, payee, date, and a valid amount are required.",
        { title: "Complete required fields", tone: "error" },
      )
      return
    }
    setSaving(true)
    await new Promise((resolve) => window.setTimeout(resolve, 900))
    if (editingId) {
      setExpenses((current) =>
        current.map((expense) =>
          expense.id === editingId ? { ...expense, ...form, amount } : expense,
        ),
      )
    } else {
      const voucher = `EXP-2609-${String(expenses.length + 3).padStart(3, "0")}`
      setExpenses((current) => [
        { id: Date.now(), voucher, ...form, amount },
        ...current,
      ])
    }
    setSaving(false)
    setEditorOpen(false)
    showToast(
      `Expense was ${editingId ? "updated" : "recorded"} successfully.`,
      { title: editingId ? "Expense updated" : "Expense added" },
    )
  }

  const approveExpense = (expense: Expense) => {
    setExpenses((current) =>
      current.map((item) =>
        item.id === expense.id ? { ...item, status: "Approved" } : item,
      ),
    )
    setSelectedExpense((current) =>
      current?.id === expense.id ? { ...current, status: "Approved" } : current,
    )
    showToast(`${expense.voucher} is now approved.`, {
      title: "Expense approved",
    })
  }

  const confirmDelete = () => {
    if (!deleteExpense) return
    setExpenses((current) =>
      current.filter((expense) => expense.id !== deleteExpense.id),
    )
    showToast(`${deleteExpense.voucher} was deleted from the expense ledger.`, {
      title: "Expense deleted",
      tone: "info",
    })
    setDeleteExpense(null)
  }

  const exportReport = async () => {
    setExporting(true)
    await new Promise((resolve) => window.setTimeout(resolve, 800))
    setExporting(false)
    showToast("The filtered expense report is ready to download.", {
      title: "Report exported",
      tone: "info",
    })
  }

  return (
    <div className="min-h-screen dashboard-bg pb-16">
      <Header
        title="Expenses"
        subtitle="Track school spending, approvals, budgets, and payment records"
      />
      <main className="space-y-4 p-3 sm:space-y-5 sm:p-6 xl:p-8">
        <section className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,var(--app-sidebar-start),var(--app-accent-dark)_58%,var(--app-accent))] p-4 text-white shadow-xl shadow-slate-900/10 sm:p-6">
          <span className="pointer-events-none absolute -right-14 -top-20 size-64 rounded-full bg-white/10 blur-2xl" />
          <span className="pointer-events-none absolute -bottom-24 left-1/3 size-56 rounded-full bg-white/5 blur-2xl" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
                  <ExpenseIcon type="wallet" className="size-6" />
                </span>
                <div>
                  <div className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/65">
                    September operating spend
                  </div>
                  <div className="font-display mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
                    {formatCurrency(monthlySpend)}
                  </div>
                </div>
              </div>
              <p className="mt-3 max-w-xl text-xs leading-5 text-white/70">
                Monitor every school payment, keep approvals moving, and stay
                comfortably within the monthly operating budget.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
              <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15 backdrop-blur-sm">
                <div className="text-[0.62rem] font-bold uppercase tracking-wider text-white/60">
                  Approved
                </div>
                <div className="font-display mt-1 text-lg font-bold">
                  {formatCurrency(approvedSpend)}
                </div>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15 backdrop-blur-sm">
                <div className="text-[0.62rem] font-bold uppercase tracking-wider text-white/60">
                  Awaiting review
                </div>
                <div className="font-display mt-1 text-lg font-bold">
                  {formatCurrency(pendingSpend)}
                </div>
              </div>
              <Button
                onClick={openCreate}
                icon={<ExpenseIcon type="plus" className="size-4" />}
                className="col-span-2 border border-white/20! bg-white! text-(--app-accent-dark)! shadow-lg hover:bg-white/90! sm:min-h-12"
              >
                Add Expense
              </Button>
            </div>
          </div>
          <div className="relative mt-5 rounded-2xl bg-slate-950/15 p-3 ring-1 ring-white/15 backdrop-blur-sm sm:p-4">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-white/80">
                Monthly budget usage
              </span>
              <span className="font-bold">
                {budgetUsed}% · {formatCurrency(monthlyBudget - monthlySpend)}{" "}
                remaining
              </span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-white shadow-lg transition-all duration-500"
                style={{ width: `${budgetUsed}%` }}
              />
            </div>
          </div>
        </section>

        <section className="grid auto-rows-fr grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
          {[
            {
              label: "Expense Entries",
              value: String(septemberExpenses.length),
              tone: "violet",
              copy: "Recorded this month",
              icon: "receipt" as ExpenseIconType,
            },
            {
              label: "Approved Spend",
              value: formatCurrency(approvedSpend),
              tone: "green",
              copy: "Cleared expenditure",
              icon: "check" as ExpenseIconType,
            },
            {
              label: "Pending Approval",
              value: formatCurrency(pendingSpend),
              tone: "amber",
              copy: "Requires review",
              icon: "clock" as ExpenseIconType,
            },
            {
              label: "Budget Remaining",
              value: formatCurrency(monthlyBudget - monthlySpend),
              tone: "teal",
              copy: `From ${formatCurrency(monthlyBudget)}`,
              icon: "wallet" as ExpenseIconType,
            },
          ].map((stat) => (
            <article
              key={stat.label}
              className={`admission-summary-card admission-summary-${stat.tone} group relative overflow-hidden rounded-2xl border border-white p-3 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:p-5`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-[0.65rem] font-bold uppercase tracking-wider text-slate-400 sm:text-[0.7rem]">
                    {stat.label}
                  </div>
                  <div className="mt-1.5 truncate font-display text-xl font-extrabold text-slate-950 sm:text-2xl">
                    {stat.value}
                  </div>
                </div>
                <span className="admission-summary-icon grid size-9 shrink-0 place-items-center rounded-xl transition duration-300 group-hover:scale-105 sm:size-11">
                  <ExpenseIcon type={stat.icon} className="size-4 sm:size-5" />
                </span>
              </div>
              <div className="mt-2.5 flex items-center gap-1.5 text-[0.68rem] font-medium text-slate-500 sm:mt-3 sm:text-xs">
                <span className="size-1.5 shrink-0 rounded-full bg-current opacity-50" />
                <span className="truncate">{stat.copy}</span>
              </div>
            </article>
          ))}
        </section>

        <section className="panel overflow-hidden ring-1 ring-slate-200/50">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-[linear-gradient(135deg,var(--app-accent-faint),white_65%)] px-4 py-3.5 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-(--app-accent-dark) shadow-sm ring-1 ring-(--app-accent)/15">
                <ExpenseIcon type="search" />
              </span>
              <div>
                <div className="font-display text-sm font-bold text-slate-900">
                  Expense Explorer
                </div>
                <div className="mt-0.5 text-xs text-slate-500">
                  Find and refine payment records
                </div>
              </div>
            </div>
            <span className="status-info">
              {visibleExpenses.length} matches
            </span>
          </div>
          <div className="grid gap-3 bg-gradient-to-b from-white to-slate-50/60 p-3 sm:p-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1.85fr)_auto] lg:items-end">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-sm transition focus-within:border-(--app-accent)/40 focus-within:shadow-md">
              <Input
                className="border-0 bg-transparent shadow-none hover:border-0 focus:border-transparent! focus:ring-0!"
                label="Search Expenses"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Voucher, payee, or description..."
                startIcon={<ExpenseIcon type="search" className="size-4" />}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200/80 bg-slate-100/70 p-2 shadow-inner sm:grid-cols-3 max-sm:[&>:last-child]:col-span-2">
              <Dropdown
                className="h-10 border-white bg-white px-3 text-xs shadow-sm"
                label="Period"
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
                options={["September 2026", "August 2026", "All Periods"].map(
                  (value) => ({ label: value, value }),
                )}
              />
              <Dropdown
                className="h-10 border-white bg-white px-3 text-xs shadow-sm"
                label="Category"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                options={[
                  "All Categories",
                  "Maintenance",
                  "Utilities",
                  "Academic",
                  "Transport",
                  "Office",
                  "Events",
                ].map((value) => ({ label: value, value }))}
              />
              <Dropdown
                className="h-10 border-white bg-white px-3 text-xs shadow-sm"
                label="Status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                options={["All Status", "Approved", "Pending"].map((value) => ({
                  label: value,
                  value,
                }))}
              />
            </div>
            <Button
              onClick={refreshExpenses}
              isLoading={loading}
              loadingText="Applying..."
              icon={<ExpenseIcon type="refresh" className="size-4" />}
              className="min-h-12 w-full px-5 shadow-md lg:w-auto"
            >
              Apply Filters
            </Button>
          </div>
        </section>

        <div className="grid items-start gap-5 2xl:grid-cols-[minmax(0,1fr)_18rem]">
          <section className="panel overflow-hidden ring-1 ring-slate-200/50">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-100">
                  <ExpenseIcon type="receipt" />
                </span>
                <div>
                  <div className="font-display font-bold text-slate-900">
                    Expense Ledger
                  </div>
                  <div className="mt-0.5 text-xs text-slate-400">
                    {visibleExpenses.length} matching records ·{" "}
                    {formatCurrency(
                      visibleExpenses.reduce(
                        (sum, expense) => sum + expense.amount,
                        0,
                      ),
                    )}{" "}
                    total
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                className="min-h-9 px-3 py-2"
                onClick={exportReport}
                isLoading={exporting}
                loadingText="Exporting..."
                icon={<ExpenseIcon type="export" className="size-4" />}
              >
                Export Report
              </Button>
            </div>
            <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_8rem_9rem_auto] gap-4 border-b border-slate-100 bg-slate-50/80 px-5 py-2.5 text-[0.62rem] font-bold uppercase tracking-widest text-slate-400 xl:grid">
              <span>Expense</span>
              <span>Vendor & payment</span>
              <span>Amount</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>
            <div className="space-y-2.5 bg-slate-50/60 p-2.5 sm:p-3">
              {visibleExpenses.map((expense) => (
                <article
                  key={expense.id}
                  className={`relative overflow-hidden rounded-2xl border bg-white p-3.5 shadow-sm transition duration-200 hover:-translate-y-px hover:shadow-md sm:p-4 ${
                    expense.status === "Approved"
                      ? "border-slate-200/80"
                      : "border-amber-200"
                  }`}
                >
                  <span
                    className={`absolute inset-y-0 left-0 w-1 ${
                      expense.status === "Approved"
                        ? "bg-emerald-500"
                        : "bg-amber-400"
                    }`}
                  />
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_8rem_9rem_auto] xl:items-center">
                    <div className="flex min-w-0 items-center gap-3 sm:col-span-2 xl:col-span-1">
                      <span
                        className={`grid size-11 shrink-0 place-items-center rounded-2xl ${
                          expense.status === "Approved"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-amber-50 text-amber-600"
                        } ring-1 ring-current/10`}
                      >
                        <ExpenseIcon type="receipt" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="truncate font-display text-sm font-bold text-slate-900">
                            {expense.description}
                          </div>
                          <span
                            className={`${
                              expense.status === "Approved"
                                ? "status-success"
                                : "status-warning"
                            } shrink-0 xl:hidden`}
                          >
                            {expense.status}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.68rem]">
                          <span className="font-bold text-(--app-accent)">
                            {expense.voucher}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-500">
                            {expense.category}
                          </span>
                          <span className="text-slate-400">
                            {formatDate(expense.date)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-1 xl:block">
                      <div className="rounded-xl bg-slate-50 px-3 py-2 xl:bg-transparent xl:p-0">
                        <div className="text-[0.6rem] font-bold uppercase tracking-wider text-slate-400 xl:hidden">
                          Payee
                        </div>
                        <div className="mt-0.5 truncate text-xs font-semibold text-slate-700 xl:mt-0">
                          {expense.payee}
                        </div>
                      </div>
                      <div className="rounded-xl bg-slate-50 px-3 py-2 sm:mt-1 xl:bg-transparent xl:p-0">
                        <div className="text-[0.6rem] font-bold uppercase tracking-wider text-slate-400 xl:hidden">
                          Payment
                        </div>
                        <div className="mt-0.5 truncate text-[0.7rem] text-slate-500 xl:mt-0">
                          {expense.mode} · {expense.reference || "No reference"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-end justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 xl:block xl:bg-transparent xl:p-0">
                      <div className="text-[0.6rem] font-bold uppercase tracking-wider text-slate-400 xl:hidden">
                        Amount
                      </div>
                      <div className="font-display text-lg font-extrabold text-slate-950 xl:text-sm">
                        {formatCurrency(expense.amount)}
                      </div>
                    </div>
                    <div className="hidden xl:block">
                      <span
                        className={
                          expense.status === "Approved"
                            ? "status-success"
                            : "status-warning"
                        }
                      >
                        {expense.status}
                      </span>
                      <div className="mt-1 text-[0.65rem] text-slate-400">
                        {formatDate(expense.date)}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:col-span-2 xl:col-span-1 xl:flex xl:justify-end">
                      <Button
                        variant="outline"
                        className="min-h-9 px-2.5 py-2"
                        onClick={() => setSelectedExpense(expense)}
                        icon={<ExpenseIcon type="view" className="size-3.5" />}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        className="min-h-9 px-2.5 py-2"
                        onClick={() => openEdit(expense)}
                        icon={<ExpenseIcon type="edit" className="size-3.5" />}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        className="min-h-9 px-2.5 py-2 text-xs"
                        onClick={() => setDeleteExpense(expense)}
                        icon={<ExpenseIcon type="trash" className="size-3.5" />}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
              {!visibleExpenses.length && (
                <div className="grid min-h-60 place-items-center text-center">
                  <div>
                    <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                      <ExpenseIcon type="receipt" />
                    </div>
                    <div className="mt-4 font-display text-sm font-bold text-slate-700">
                      No expenses found
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      Adjust the filters or add a new expense entry.
                    </p>
                    <Button className="mt-4" onClick={openCreate}>
                      Add Expense
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <footer className="flex flex-col gap-2 border-t border-slate-100 bg-white px-4 py-3.5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <span>
                Showing {visibleExpenses.length} of {expenses.length} entries
              </span>
              <span>
                Filtered total:{" "}
                <strong className="font-display text-slate-900">
                  {formatCurrency(
                    visibleExpenses.reduce(
                      (sum, expense) => sum + expense.amount,
                      0,
                    ),
                  )}
                </strong>
              </span>
            </footer>
          </section>

          <aside className="space-y-4 sm:space-y-5 2xl:sticky 2xl:top-24">
            <section className="panel overflow-hidden">
              <div className="border-b border-slate-100 bg-[linear-gradient(135deg,var(--app-accent-faint),white)] p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-white text-(--app-accent-dark) shadow-sm ring-1 ring-(--app-accent)/15">
                    <ExpenseIcon type="chart" />
                  </span>
                  <div>
                    <div className="font-display text-sm font-bold text-slate-900">
                      Spend by Category
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">
                      September distribution
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4 p-4 sm:p-5">
                {categoryTotals.map(([category, amount], index) => (
                  <div key={category}>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="flex min-w-0 items-center gap-2 font-semibold text-slate-700">
                        <span
                          className={`size-2 shrink-0 rounded-full ${["bg-violet-500", "bg-amber-400", "bg-blue-500", "bg-emerald-500", "bg-rose-400", "bg-cyan-500"][index % 6]}`}
                        />
                        <span className="truncate">{category}</span>
                      </span>
                      <span className="shrink-0 text-slate-500">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`${progressWidth(amount, categoryTotals[0]?.[1] ?? 1)} h-full rounded-full bg-[linear-gradient(90deg,var(--app-accent),var(--app-accent-dark))]`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section className="relative overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-sm">
              <span className="absolute -right-8 -top-8 size-24 rounded-full bg-amber-200/30" />
              <div className="relative flex items-center gap-3 text-amber-700">
                <span className="grid size-10 place-items-center rounded-xl bg-white/80 shadow-sm ring-1 ring-amber-200">
                  <ExpenseIcon type="wallet" />
                </span>
                <div>
                  <div className="font-display text-sm font-bold">
                    Budget Health
                  </div>
                  <div className="mt-0.5 text-[0.65rem] text-amber-600">
                    Monthly operating limit
                  </div>
                </div>
              </div>
              <div className="relative mt-4 flex items-end justify-between gap-3">
                <div>
                  <div className="font-display text-2xl font-extrabold text-amber-900">
                    {budgetUsed}%
                  </div>
                  <div className="text-[0.65rem] text-amber-700">
                    budget utilized
                  </div>
                </div>
                <strong className="text-xs text-amber-800">
                  {formatCurrency(monthlyBudget)}
                </strong>
              </div>
              <div className="relative mt-3 h-2.5 overflow-hidden rounded-full bg-white/80 shadow-inner">
                <div
                  className={`${progressWidth(monthlySpend, monthlyBudget)} h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500`}
                />
              </div>
              <p className="relative mt-3 text-xs leading-5 text-amber-800">
                Spending remains within the monthly operating budget.
              </p>
            </section>
          </aside>
        </div>
      </main>

      <Popup
        open={editorOpen}
        onClose={() => !saving && setEditorOpen(false)}
        title={editingId ? "Edit Expense" : "Add New Expense"}
        description="Record payment information for an accurate school expense ledger."
        footerClassName="max-sm:!grid max-sm:grid-flow-col max-sm:auto-cols-fr max-sm:[&>button]:w-full"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setEditorOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={saveExpense}
              isLoading={saving}
              loadingText="Saving expense..."
            >
              {editingId ? "Update Expense" : "Save Expense"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Dropdown
            label="Expense Category *"
            value={form.category}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                category: event.target.value,
              }))
            }
            placeholder="Select category"
            options={[
              "Maintenance",
              "Utilities",
              "Academic",
              "Transport",
              "Office",
              "Events",
            ].map((value) => ({ label: value, value }))}
          />
          <Input
            label="Amount (₹) *"
            type="number"
            min="1"
            value={form.amount}
            onChange={(event) =>
              setForm((current) => ({ ...current, amount: event.target.value }))
            }
            placeholder="0"
          />
          <div className="sm:col-span-2">
            <Input
              label="Description *"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="What was this expense for?"
            />
          </div>
          <Input
            label="Payee / Vendor *"
            value={form.payee}
            onChange={(event) =>
              setForm((current) => ({ ...current, payee: event.target.value }))
            }
            placeholder="Vendor or recipient name"
          />
          <Input
            label="Expense Date *"
            type="date"
            value={form.date}
            onChange={(event) =>
              setForm((current) => ({ ...current, date: event.target.value }))
            }
          />
          <Dropdown
            label="Payment Mode"
            value={form.mode}
            onChange={(event) =>
              setForm((current) => ({ ...current, mode: event.target.value }))
            }
            options={["Cash", "UPI", "Card", "Bank Transfer", "Cheque"].map(
              (value) => ({ label: value, value }),
            )}
          />
          <Input
            label="Payment Reference"
            value={form.reference}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                reference: event.target.value,
              }))
            }
            placeholder="Invoice or transaction ID"
          />
          <Dropdown
            label="Approval Status"
            value={form.status}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                status: event.target.value as ExpenseStatus,
              }))
            }
            options={[
              { label: "Pending Approval", value: "Pending" },
              { label: "Approved", value: "Approved" },
            ]}
          />
        </div>
      </Popup>

      <Popup
        open={Boolean(selectedExpense)}
        onClose={() => setSelectedExpense(null)}
        title="Expense Voucher"
        description="Review the complete transaction and approval details."
        footerClassName="max-sm:!grid max-sm:grid-flow-col max-sm:auto-cols-fr max-sm:[&>button]:w-full"
        footer={
          <>
            <Button variant="outline" onClick={() => setSelectedExpense(null)}>
              Close
            </Button>
            {selectedExpense?.status === "Pending" && (
              <Button
                onClick={() =>
                  selectedExpense && approveExpense(selectedExpense)
                }
              >
                Approve Expense
              </Button>
            )}
          </>
        }
      >
        {selectedExpense && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-950 p-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs text-slate-400">Expense amount</div>
                  <div className="mt-1 font-display text-3xl font-bold">
                    {formatCurrency(selectedExpense.amount)}
                  </div>
                </div>
                <span
                  className={
                    selectedExpense.status === "Approved"
                      ? "status-success"
                      : "status-warning"
                  }
                >
                  {selectedExpense.status}
                </span>
              </div>
              <div className="mt-5 flex justify-between text-xs">
                <span className="text-slate-400">Voucher Number</span>
                <strong>{selectedExpense.voucher}</strong>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-3">
              {[
                ["Category", selectedExpense.category],
                ["Expense Date", formatDate(selectedExpense.date)],
                ["Payee", selectedExpense.payee],
                ["Payment Mode", selectedExpense.mode],
                ["Reference", selectedExpense.reference || "Not provided"],
                ["Recorded By", "Super Admin"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-100 p-3"
                >
                  <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {label}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-800">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="rounded-xl border border-slate-100 p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Description
              </div>
              <p className="mt-2 text-sm text-slate-700">
                {selectedExpense.description}
              </p>
            </div>
          </div>
        )}
      </Popup>

      <Popup
        open={Boolean(deleteExpense)}
        onClose={() => setDeleteExpense(null)}
        title="Delete Expense"
        description="Review the selected record before permanently removing it."
        icon={<ExpenseIcon type="trash" className="size-5" />}
        footerClassName="max-sm:!grid max-sm:grid-flow-col max-sm:auto-cols-fr max-sm:[&>button]:w-full"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteExpense(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              icon={<ExpenseIcon type="trash" className="size-4" />}
            >
              Delete Expense
            </Button>
          </>
        }
      >
        {deleteExpense && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-red-700">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white shadow-sm ring-1 ring-red-100">
                <ExpenseIcon type="trash" className="size-5" />
              </span>
              <div className="min-w-0">
                <div className="font-display text-sm font-bold">
                  This action cannot be undone
                </div>
                <p className="mt-1 text-xs leading-5 text-red-600">
                  The transaction will be removed from the expense ledger and
                  will no longer appear in reports.
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/80 p-4">
                <div className="min-w-0">
                  <div className="text-[0.62rem] font-bold uppercase tracking-wider text-slate-400">
                    Expense voucher
                  </div>
                  <div className="mt-1 font-display text-base font-bold text-slate-900">
                    {deleteExpense.voucher}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[0.62rem] font-bold uppercase tracking-wider text-slate-400">
                    Amount
                  </div>
                  <div className="mt-1 font-display text-lg font-extrabold text-red-600">
                    {formatCurrency(deleteExpense.amount)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 p-4 text-xs">
                <div>
                  <div className="font-bold uppercase tracking-wider text-slate-400">
                    Description
                  </div>
                  <div className="mt-1 font-semibold text-slate-700">
                    {deleteExpense.description}
                  </div>
                </div>
                <div>
                  <div className="font-bold uppercase tracking-wider text-slate-400">
                    Payee
                  </div>
                  <div className="mt-1 font-semibold text-slate-700">
                    {deleteExpense.payee}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Popup>
    </div>
  )
}
