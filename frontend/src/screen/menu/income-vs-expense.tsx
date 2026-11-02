import { useMemo, useState } from "react";
import { Button, Dropdown, Input, useToast } from "../../components";
import Header from "../../ui/header";
import Popup from "../../ui/popup";

type CashflowType = "Expense" | "Income";

type Cashflow = {
  amount: number;
  category: string;
  date: string;
  description: string;
  id: number;
  mode: string;
  reference: string;
  type: CashflowType;
};

type MonthlySummary = {
  expense: number;
  income: number;
  month: string;
};

const monthlyData: MonthlySummary[] = [
  { month: "Apr", income: 18200, expense: 7250 },
  { month: "May", income: 21500, expense: 8100 },
  { month: "Jun", income: 19800, expense: 9650 },
  { month: "Jul", income: 23400, expense: 8800 },
  { month: "Aug", income: 22100, expense: 10250 },
  { month: "Sep", income: 24850, expense: 17250 },
];

const initialCashflows: Cashflow[] = [
  { id: 1, type: "Income", category: "Tuition Fees", description: "September fee collection", amount: 16800, date: "2026-09-26", mode: "Bank Transfer", reference: "INC-2609-018" },
  { id: 2, type: "Expense", category: "Maintenance", description: "Classroom repairs", amount: 5000, date: "2026-09-21", mode: "Cash", reference: "EXP-2609-008" },
  { id: 3, type: "Expense", category: "Utilities", description: "Electricity bill", amount: 4500, date: "2026-09-18", mode: "Bank Transfer", reference: "EXP-2609-007" },
  { id: 4, type: "Income", category: "Transport Fees", description: "Monthly transport collection", amount: 5050, date: "2026-09-16", mode: "UPI", reference: "INC-2609-017" },
  { id: 5, type: "Expense", category: "Transport", description: "School bus fuel", amount: 3200, date: "2026-09-10", mode: "Card", reference: "EXP-2609-005" },
  { id: 6, type: "Income", category: "Examination Fees", description: "Half yearly examination fees", amount: 3000, date: "2026-09-08", mode: "Cash", reference: "INC-2609-016" },
  { id: 7, type: "Expense", category: "Office", description: "Stationery and printer supplies", amount: 1750, date: "2026-09-06", mode: "Cash", reference: "EXP-2609-004" },
  { id: 8, type: "Expense", category: "Academic", description: "Laboratory supplies", amount: 2800, date: "2026-09-03", mode: "UPI", reference: "EXP-2609-003" },
];

const blankCashflow = {
  amount: "",
  category: "",
  date: "2026-09-28",
  description: "",
  mode: "Bank Transfer",
  reference: "",
  type: "Income" as CashflowType,
};

function FinanceIcon({ type }: { type: "trend" | "income" | "expense" | "wallet" | "chart" | "search" | "download" }) {
  const paths = {
    trend: <><path d="M3 17 9 11l4 4 8-9" /><path d="M15 6h6v6" /></>,
    income: <><path d="M12 21V5M6 11l6-6 6 6" /><path d="M4 21h16" /></>,
    expense: <><path d="M12 3v16M6 13l6 6 6-6" /><path d="M4 3h16" /></>,
    wallet: <><path d="M4 6h14a2 2 0 0 1 2 2v11H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h13" /><path d="M16 11h6v5h-6a2.5 2.5 0 0 1 0-5Z" /></>,
    chart: <><path d="M4 19V9M10 19V5M16 19v-7M22 19V3" /><path d="M2 21h20" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    download: <><path d="M12 3v13M7 11l5 5 5-5M4 21h16" /></>,
  };
  return <svg className="size-5" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{paths[type]}</svg>;
}

function formatCurrency(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function csvCell(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function chartHeight(value: number, max: number) {
  const ratio = max ? value / max : 0;
  if (ratio >= 0.9) return "h-full";
  if (ratio >= 0.75) return "h-5/6";
  if (ratio >= 0.6) return "h-2/3";
  if (ratio >= 0.45) return "h-1/2";
  return "h-1/3";
}

function progressWidth(value: number, max: number) {
  const ratio = max ? value / max : 0;
  if (ratio >= 0.85) return "w-full";
  if (ratio >= 0.65) return "w-3/4";
  if (ratio >= 0.45) return "w-1/2";
  if (ratio >= 0.25) return "w-1/3";
  return "w-1/4";
}

export default function IncomeVsExpense() {
  const [cashflows, setCashflows] = useState(initialCashflows);
  const [academicYear, setAcademicYear] = useState("2026–27");
  const [period, setPeriod] = useState("April–September");
  const [account, setAccount] = useState("All Accounts");
  const [typeFilter, setTypeFilter] = useState("All Transactions");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState(blankCashflow);
  const [saving, setSaving] = useState(false);
  const [selectedCashflow, setSelectedCashflow] = useState<Cashflow | null>(null);
  const [deletingCashflow, setDeletingCashflow] = useState<Cashflow | null>(null);
  const { showToast } = useToast();

  const chartData = useMemo(() => monthlyData.map((month) => month.month === "Sep" ? {
    ...month,
    income: cashflows.filter((cashflow) => cashflow.type === "Income").reduce((sum, cashflow) => sum + cashflow.amount, 0),
    expense: cashflows.filter((cashflow) => cashflow.type === "Expense").reduce((sum, cashflow) => sum + cashflow.amount, 0),
  } : month), [cashflows]);
  const totalIncome = chartData.reduce((sum, month) => sum + month.income, 0);
  const totalExpense = chartData.reduce((sum, month) => sum + month.expense, 0);
  const netBalance = totalIncome - totalExpense;
  const savingsRate = Math.round(netBalance / totalIncome * 100);
  const maxChartValue = Math.max(...chartData.flatMap((month) => [month.income, month.expense]));

  const visibleCashflows = useMemo(() => cashflows.filter((cashflow) => {
    const matchesType = typeFilter === "All Transactions" || cashflow.type === typeFilter;
    const matchesQuery = `${cashflow.description} ${cashflow.category} ${cashflow.reference}`.toLowerCase().includes(query.toLowerCase());
    return matchesType && matchesQuery;
  }), [cashflows, query, typeFilter]);

  const expenseCategories = useMemo(() => Object.entries(cashflows.filter((cashflow) => cashflow.type === "Expense").reduce<Record<string, number>>((totals, cashflow) => {
    totals[cashflow.category] = (totals[cashflow.category] ?? 0) + cashflow.amount;
    return totals;
  }, {})).sort((first, second) => second[1] - first[1]), [cashflows]);

  const refreshDashboard = async () => {
    setLoading(true);
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    setLoading(false);
    showToast(`${period} financial performance has been refreshed.`, { title: "Dashboard updated", tone: "info" });
  };

  const openTransaction = (type: CashflowType) => {
    setForm({ ...blankCashflow, type });
    setEditorOpen(true);
  };

  const saveTransaction = async () => {
    const amount = Number(form.amount);
    if (!form.category || !form.description.trim() || !form.date || !amount || amount <= 0) {
      showToast("Type, category, description, date, and a valid amount are required.", { title: "Complete required fields", tone: "error" });
      return;
    }
    setSaving(true);
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    const prefix = form.type === "Income" ? "INC" : "EXP";
    const transaction = { id: Date.now(), ...form, amount, reference: form.reference || `${prefix}-2609-${String(cashflows.length + 20).padStart(3, "0")}` };
    setCashflows((current) => [transaction, ...current]);
    setSaving(false);
    setEditorOpen(false);
    showToast(`${form.type} of ${formatCurrency(amount)} was recorded.`, { title: `${form.type} added` });
  };

  const exportReport = async () => {
    setExporting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    const rows: Array<Array<string | number>> = [
      ["PAL IT HUB — Income vs Expense Report"],
      ["Academic Year", academicYear],
      ["Reporting Period", period],
      ["Account Filter", account],
      ["Transaction Type Filter", typeFilter],
      [],
      ["Summary"],
      ["Total Income", totalIncome],
      ["Total Expense", totalExpense],
      ["Net Balance", netBalance],
      ["Savings Rate", `${savingsRate}%`],
      [],
      ["Monthly Cash Flow"],
      ["Month", "Income", "Expense", "Surplus"],
      ...chartData.map((item) => [item.month, item.income, item.expense, item.income - item.expense]),
      [],
      ["Transaction Ledger"],
      ["Reference", "Type", "Category", "Description", "Date", "Payment Mode", "Amount"],
      ...visibleCashflows.map((item) => [item.reference, item.type, item.category, item.description, item.date, item.mode, item.amount]),
    ];
    const content = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `income-vs-expense-${academicYear}-${period}`.replace(/\s+/g, "-").replace(/[–—]/g, "-").toLowerCase() + ".csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setExporting(false);
    showToast(`${visibleCashflows.length} transactions were exported.`, { title: "Report downloaded" });
  };

  const deleteTransaction = () => {
    if (!deletingCashflow) return;
    setCashflows((current) => current.filter((cashflow) => cashflow.id !== deletingCashflow.id));
    showToast(`${deletingCashflow.reference} was removed from the cash-flow ledger.`, { title: "Transaction deleted", tone: "info" });
    setDeletingCashflow(null);
  };

  return <div className="min-h-screen dashboard-bg pb-16">
    <Header title="Income vs Expense" subtitle="Monitor cash flow, spending patterns, and financial performance" />
    <main className="mx-auto max-w-7xl space-y-5 p-3 sm:p-6 xl:p-8">
      <section className="finance-command-hero relative overflow-hidden rounded-3xl p-5 text-white sm:p-7">
        <span className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full border border-white/10 bg-white/10" />
        <span className="pointer-events-none absolute -bottom-28 left-1/3 size-60 rounded-full bg-white/5" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_21rem] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-white/80"><FinanceIcon type="trend" />Financial command center</div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-white/60">{period} · {academicYear}</p>
            <div className="mt-1 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{formatCurrency(netBalance)}</div>
            <p className="mt-1 text-xs font-semibold text-emerald-200">Positive net cash flow</p>
            <p className="mt-3 max-w-xl text-xs leading-5 text-white/70 sm:text-sm sm:leading-6">Track every inflow and expense, understand spending patterns, and maintain a healthy operating balance.</p>
            <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/5 p-1.5 sm:flex sm:border-0 sm:bg-transparent sm:p-0">
              <Button className="w-full !min-h-10 !bg-white !px-2 text-[0.68rem] !text-(--app-accent-dark) shadow-xl hover:!bg-white/90 sm:w-auto sm:!px-4 sm:text-xs" onClick={() => openTransaction("Income")} icon={<FinanceIcon type="income" />}>Add Income</Button>
              <Button variant="outline" className="w-full !min-h-10 !border-white/15 !bg-white/10 !px-2 text-[0.68rem] text-white !shadow-none hover:!bg-white/20 sm:w-auto sm:!px-4 sm:text-xs" onClick={() => openTransaction("Expense")} icon={<FinanceIcon type="expense" />}>Add Expense</Button>
            </div>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-xl sm:p-5">
            <div className="flex items-start justify-between gap-4"><div><div className="text-xs font-semibold text-white/65">Savings rate</div><div className="mt-1 font-display text-3xl font-extrabold">{savingsRate}%</div></div><span className="grid size-11 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/15"><FinanceIcon type="wallet" /></span></div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full w-1/2 rounded-full bg-white shadow-sm" /></div>
            <div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl bg-emerald-300/10 p-3 ring-1 ring-emerald-200/10"><div className="text-[0.6rem] font-bold uppercase tracking-wider text-emerald-100/70">Income</div><div className="mt-1 text-sm font-bold text-emerald-100">{formatCurrency(totalIncome)}</div></div><div className="rounded-xl bg-rose-300/10 p-3 ring-1 ring-rose-200/10"><div className="text-[0.6rem] font-bold uppercase tracking-wider text-rose-100/70">Expense</div><div className="mt-1 text-sm font-bold text-rose-100">{formatCurrency(totalExpense)}</div></div></div>
          </div>
        </div>
      </section>

      <section className="panel finance-overview-filters">
        <div className="panel-title flex-wrap gap-3"><div className="flex items-center gap-3"><span className="settings-icon grid size-9 place-items-center rounded-xl"><FinanceIcon type="chart" /></span><div><div className="font-display text-sm font-bold text-slate-900">Financial Overview</div><div className="mt-0.5 text-xs text-slate-400">Refine the reporting period and account view</div></div></div><span className="status-success">Healthy balance</span></div>
        <div className="grid gap-3 p-4 sm:grid-cols-[repeat(3,minmax(0,1fr))_auto] sm:items-end sm:p-5 xl:grid-cols-[1fr_1fr_1fr_auto]">
          <Dropdown label="Academic Year" value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} options={["2026–27", "2027–28"].map((value) => ({ label: value, value }))} />
          <Dropdown label="Reporting Period" value={period} onChange={(event) => setPeriod(event.target.value)} options={["April–September", "September 2026", "Quarter 2", "Full Academic Year"].map((value) => ({ label: value, value }))} />
          <Dropdown label="Account" value={account} onChange={(event) => setAccount(event.target.value)} options={["All Accounts", "Cash Account", "Bank Account", "UPI Account"].map((value) => ({ label: value, value }))} />
          <Button className="w-full whitespace-nowrap sm:w-auto sm:px-3 lg:px-4" onClick={refreshDashboard} isLoading={loading} loadingText="Refreshing...">Apply Filters</Button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "Total Income", value: formatCurrency(totalIncome), tone: "green", copy: "April–September", icon: "income" as const, iconStyle: "bg-emerald-100 text-emerald-600" },
          { label: "Total Expense", value: formatCurrency(totalExpense), tone: "red", copy: "Operating expenditure", icon: "expense" as const, iconStyle: "bg-rose-100 text-rose-600" },
          { label: "Net Balance", value: formatCurrency(netBalance), tone: "teal", copy: "Positive cash flow", icon: "wallet" as const, iconStyle: "metric-icon-teal" },
          { label: "Savings Rate", value: `${savingsRate}%`, tone: "amber", copy: "Of total income", icon: "trend" as const, iconStyle: "bg-amber-100 text-amber-600" },
        ].map((stat) => <article key={stat.label} className={`finance-stat-card module-stat-${stat.tone} relative overflow-hidden rounded-2xl border bg-white p-3.5 shadow-sm sm:p-5`}><span className="absolute -right-8 -top-9 size-24 rounded-full bg-slate-50" /><div className="relative flex items-start justify-between gap-2"><div><div className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-500 sm:text-xs sm:normal-case sm:tracking-normal">{stat.label}</div><div className="mt-1 font-display text-lg font-extrabold text-slate-950 sm:text-2xl">{stat.value}</div></div><span className={`grid size-9 shrink-0 place-items-center rounded-xl shadow-sm sm:size-10 ${stat.iconStyle}`}><FinanceIcon type={stat.icon} /></span></div><div className="relative mt-2 text-[0.65rem] text-slate-400 sm:text-xs">{stat.copy}</div></article>)}
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[1fr_19rem]">
        <section className="panel finance-trend-panel">
          <div className="panel-title flex-wrap gap-3 py-3"><div className="flex items-center gap-2 text-violet-600"><FinanceIcon type="trend" /><div><div className="font-display font-bold text-slate-900">Cash Flow Trend</div><div className="mt-0.5 text-xs text-slate-400">Monthly income and expenditure</div></div></div><div className="flex items-center gap-4 text-xs"><span className="flex items-center gap-2 text-slate-500"><span className="size-2 rounded-full bg-emerald-500" />Income</span><span className="flex items-center gap-2 text-slate-500"><span className="size-2 rounded-full bg-rose-400" />Expense</span></div></div>
          <div className="p-3.5 sm:p-5">
            <div className="finance-chart-surface relative overflow-hidden rounded-2xl border p-3 pt-5 sm:p-5 sm:pt-6">
              <div className="pointer-events-none absolute inset-x-0 top-1/4 border-t border-dashed border-slate-200" /><div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-slate-200" /><div className="pointer-events-none absolute inset-x-0 top-3/4 border-t border-dashed border-slate-200" />
              <div className="relative flex h-64 items-end gap-2 border-b border-slate-200 sm:gap-5">{chartData.map((month) => <div key={month.month} className="finance-chart-group flex h-full flex-1 flex-col justify-end">
              <div className="flex h-56 items-end justify-center gap-1 sm:gap-2">
                <div className={`${chartHeight(month.income, maxChartValue)} finance-chart-bar w-3 rounded-t-lg bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-lg shadow-emerald-100 sm:w-6`} title={`Income ${formatCurrency(month.income)}`} />
                <div className={`${chartHeight(month.expense, maxChartValue)} finance-chart-bar w-3 rounded-t-lg bg-gradient-to-t from-rose-500 to-orange-400 shadow-lg shadow-rose-100 sm:w-6`} title={`Expense ${formatCurrency(month.expense)}`} />
              </div>
              <div className="py-3 text-center text-[0.65rem] font-bold uppercase tracking-wide text-slate-500 sm:text-xs">{month.month}</div>
            </div>)}</div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">{[
              ["Best Month", "July", "₹14,600 surplus"], ["Average Income", formatCurrency(Math.round(totalIncome / chartData.length)), "Per month"], ["Average Expense", formatCurrency(Math.round(totalExpense / chartData.length)), "Per month"],
            ].map(([label, value, copy]) => <div key={label} className="finance-insight-card rounded-xl border p-2.5 sm:p-3"><div className="text-[0.58rem] font-bold uppercase tracking-wide text-slate-400 sm:text-xs sm:normal-case sm:tracking-normal">{label}</div><div className="mt-1 truncate font-display text-xs font-bold text-slate-800 sm:text-sm">{value}</div><div className="mt-1 hidden text-xs text-slate-400 sm:block">{copy}</div></div>)}</div>
          </div>
        </section>

        <aside className="space-y-5 xl:sticky xl:top-28">
          <section className="panel finance-expense-panel overflow-hidden">
            <div className="finance-expense-header p-5"><div className="flex items-center gap-2"><span className="grid size-9 place-items-center rounded-xl bg-rose-100 text-rose-600"><FinanceIcon type="expense" /></span><div className="font-display text-sm font-bold text-slate-900">Expense Breakdown</div></div><p className="mt-2 text-xs leading-5 text-slate-400">September spending by category.</p></div>
            <div className="space-y-4 p-5 pt-1">{expenseCategories.map(([categoryName, amount]) => <div key={categoryName}><div className="flex justify-between gap-3 text-xs"><span className="font-semibold text-slate-700">{categoryName}</span><span className="text-slate-500">{formatCurrency(amount)}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`${progressWidth(amount, expenseCategories[0]?.[1] ?? 1)} h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-400`} /></div></div>)}</div>
          </section>
          <section className="finance-health-card rounded-2xl border p-5"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><FinanceIcon type="wallet" /><div className="font-display text-sm font-bold">Healthy Cash Flow</div></div><span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-bold">Positive</span></div><div className="mt-4 font-display text-3xl font-extrabold">{savingsRate}%</div><p className="mt-2 text-xs leading-5">Income is comfortably above expenditure for the selected period.</p></section>
        </aside>
      </div>

      <section className="panel finance-cashflow-panel overflow-hidden">
        <div className="panel-title !grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-3">
          <div className="flex min-w-0 items-center gap-3"><span className="settings-icon grid size-9 shrink-0 place-items-center rounded-xl"><FinanceIcon type="wallet" /></span><div className="min-w-0"><div className="truncate font-display text-sm font-bold text-slate-900 sm:text-base">Recent Cash Flow</div><div className="mt-0.5 text-[0.68rem] text-slate-400 sm:text-xs">{visibleCashflows.length} transactions</div></div></div>
          <Button className="!min-h-9 !gap-1.5 !px-3 text-[0.68rem] sm:text-xs" onClick={exportReport} isLoading={exporting} loadingText="Exporting..." icon={<FinanceIcon type="download" />}>Export</Button>
        </div>
        <div className="finance-cashflow-toolbar grid grid-cols-2 gap-2.5 border-b border-slate-100 bg-slate-50/60 p-3 sm:grid-cols-[1fr_11rem] sm:gap-3 sm:p-4"><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search transactions..." aria-label="Search transactions" startIcon={<FinanceIcon type="search" />} /><Dropdown value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} aria-label="Filter transaction type" options={["All Transactions", "Income", "Expense"].map((value) => ({ label: value, value }))} /></div>
        <div className="grid gap-3 p-3 lg:hidden">{visibleCashflows.map((cashflow) => <article key={cashflow.id} className={`finance-transaction-card relative overflow-hidden rounded-2xl border p-4 ${cashflow.type === "Income" ? "finance-transaction-income" : "finance-transaction-expense"}`}>
          <div className="flex items-start gap-3"><span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${cashflow.type === "Income" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}><FinanceIcon type={cashflow.type === "Income" ? "income" : "expense"} /></span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="truncate font-display text-sm font-bold text-slate-900">{cashflow.description}</div><div className="mt-0.5 text-[0.65rem] font-semibold text-slate-400">{cashflow.reference}</div></div><div className={`shrink-0 font-display text-sm font-extrabold ${cashflow.type === "Income" ? "text-emerald-600" : "text-rose-500"}`}>{cashflow.type === "Income" ? "+" : "−"}{formatCurrency(cashflow.amount)}</div></div><div className="mt-2 flex flex-wrap gap-2"><span className="status-neutral">{cashflow.category}</span><span className={cashflow.type === "Income" ? "status-success" : "status-danger"}>{cashflow.type}</span></div></div></div>
          <div className="mt-4 grid grid-cols-2 gap-2"><div className="finance-transaction-meta"><span>Date</span><strong>{formatDate(cashflow.date)}</strong></div><div className="finance-transaction-meta"><span>Payment mode</span><strong>{cashflow.mode}</strong></div></div>
          <div className="mt-3 grid grid-cols-2 gap-2"><Button variant="outline" onClick={() => setSelectedCashflow(cashflow)}>View Details</Button><Button variant="danger" className="text-xs" onClick={() => setDeletingCashflow(cashflow)}>Delete</Button></div>
        </article>)}</div>
        <div className="hidden overflow-x-auto lg:block"><table className="module-table"><thead><tr><th>Reference</th><th>Transaction</th><th>Category</th><th>Date</th><th>Payment Mode</th><th>Amount</th><th>Actions</th></tr></thead><tbody>{visibleCashflows.map((cashflow) => <tr key={cashflow.id}>
          <td data-label="Reference"><span className="font-semibold text-cyan-600">{cashflow.reference}</span></td>
          <td data-label="Transaction"><div className="flex items-center gap-3"><div className={`grid size-9 shrink-0 place-items-center rounded-xl ${cashflow.type === "Income" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"}`}><FinanceIcon type={cashflow.type === "Income" ? "income" : "expense"} /></div><div><div className="font-semibold text-slate-900">{cashflow.description}</div><div className="mt-1 text-xs text-slate-400">{cashflow.type}</div></div></div></td>
          <td data-label="Category"><span className="status-neutral">{cashflow.category}</span></td><td data-label="Date">{formatDate(cashflow.date)}</td><td data-label="Payment Mode">{cashflow.mode}</td>
          <td data-label="Amount"><span className={`font-display font-bold ${cashflow.type === "Income" ? "text-emerald-600" : "text-rose-500"}`}>{cashflow.type === "Income" ? "+" : "−"}{formatCurrency(cashflow.amount)}</span></td>
          <td data-label="Actions"><div className="flex gap-2"><Button variant="outline" className="min-h-8 px-3 py-1.5" onClick={() => setSelectedCashflow(cashflow)}>View</Button><Button variant="danger" className="min-h-8 px-3 py-1.5 text-xs" onClick={() => setDeletingCashflow(cashflow)}>Delete</Button></div></td>
        </tr>)}</tbody></table></div>
      </section>
    </main>

    <Popup
      open={editorOpen}
      onClose={() => !saving && setEditorOpen(false)}
      title={`Add ${form.type}`}
      description="Record a transaction in the school cash-flow ledger."
      footerClassName="!grid grid-cols-2 items-stretch gap-2 [&>button]:w-full sm:!flex sm:[&>button]:w-auto"
      footer={<><Button variant="outline" className="!px-2 sm:!px-4" onClick={() => setEditorOpen(false)} disabled={saving}>Cancel</Button><Button className="!px-2 sm:!px-4" onClick={saveTransaction} isLoading={saving} loadingText="Saving...">Save Transaction</Button></>}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Dropdown label="Transaction Type" value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as CashflowType, category: "" }))} options={[{ label: "Income", value: "Income" }, { label: "Expense", value: "Expense" }]} />
        <Input label="Amount (₹) *" type="number" min="1" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} placeholder="0" />
        <Dropdown label="Category *" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} placeholder="Select category" options={(form.type === "Income" ? ["Tuition Fees", "Transport Fees", "Examination Fees", "Admission Fees", "Other Income"] : ["Maintenance", "Utilities", "Academic", "Transport", "Office", "Events"]).map((value) => ({ label: value, value }))} />
        <Input label="Transaction Date *" type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} />
        <div className="sm:col-span-2"><Input label="Description *" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Describe this transaction" /></div>
        <Dropdown label="Payment Mode" value={form.mode} onChange={(event) => setForm((current) => ({ ...current, mode: event.target.value }))} options={["Cash", "UPI", "Card", "Bank Transfer", "Cheque"].map((value) => ({ label: value, value }))} />
        <Input label="Reference Number" value={form.reference} onChange={(event) => setForm((current) => ({ ...current, reference: event.target.value }))} placeholder="Generated automatically if blank" />
      </div>
    </Popup>

    <Popup
      open={Boolean(selectedCashflow)}
      onClose={() => setSelectedCashflow(null)}
      title="Transaction Details"
      description="Review the complete cash-flow entry."
      footer={<Button variant="outline" onClick={() => setSelectedCashflow(null)}>Close</Button>}
    >
      {selectedCashflow && <div className="space-y-4"><div className={`rounded-2xl p-5 ${selectedCashflow.type === "Income" ? "bg-emerald-600" : "bg-slate-950"} text-white`}><div className="text-xs text-white/70">{selectedCashflow.type}</div><div className="mt-1 font-display text-3xl font-bold">{formatCurrency(selectedCashflow.amount)}</div><div className="mt-4 flex justify-between text-xs"><span className="text-white/70">Reference</span><strong>{selectedCashflow.reference}</strong></div></div><dl className="grid grid-cols-2 gap-3">{[["Category", selectedCashflow.category], ["Date", formatDate(selectedCashflow.date)], ["Payment Mode", selectedCashflow.mode], ["Recorded By", "Super Admin"]].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-100 p-3"><dt className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{value}</dd></div>)}</dl><div className="rounded-xl border border-slate-100 p-4 text-sm text-slate-700">{selectedCashflow.description}</div></div>}
    </Popup>

    <Popup
      open={Boolean(deletingCashflow)}
      onClose={() => setDeletingCashflow(null)}
      title="Delete Transaction"
      description="This removes the transaction from the cash-flow ledger."
      footerClassName="!grid grid-cols-2 items-stretch gap-2 [&>button]:w-full sm:!flex sm:[&>button]:w-auto"
      footer={<><Button variant="outline" className="!px-2 sm:!px-4" onClick={() => setDeletingCashflow(null)}>Cancel</Button><Button variant="danger" className="!px-2 sm:!px-4" onClick={deleteTransaction}>Delete Transaction</Button></>}
    >
      {deletingCashflow && <div className="rounded-2xl border border-red-100 bg-red-50 p-4"><div className="font-display text-lg font-bold text-red-700">{deletingCashflow.reference}</div><div className="mt-1 text-xs text-red-600">{deletingCashflow.description} · {formatCurrency(deletingCashflow.amount)}</div></div>}
    </Popup>
  </div>;
}
