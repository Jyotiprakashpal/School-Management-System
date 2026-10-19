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

function FinanceIcon({ type }: { type: "trend" | "income" | "expense" | "wallet" | "chart" }) {
  const paths = {
    trend: <><path d="M3 17 9 11l4 4 8-9" /><path d="M15 6h6v6" /></>,
    income: <><path d="M12 21V5M6 11l6-6 6 6" /><path d="M4 21h16" /></>,
    expense: <><path d="M12 3v16M6 13l6 6 6-6" /><path d="M4 3h16" /></>,
    wallet: <><path d="M4 6h14a2 2 0 0 1 2 2v11H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h13" /><path d="M16 11h6v5h-6a2.5 2.5 0 0 1 0-5Z" /></>,
    chart: <><path d="M4 19V9M10 19V5M16 19v-7M22 19V3" /><path d="M2 21h20" /></>,
  };
  return <svg className="size-5" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{paths[type]}</svg>;
}

function formatCurrency(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
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
    await new Promise((resolve) => window.setTimeout(resolve, 800));
    setExporting(false);
    showToast("Income vs Expense report is ready to download.", { title: "Report exported", tone: "info" });
  };

  const deleteTransaction = () => {
    if (!deletingCashflow) return;
    setCashflows((current) => current.filter((cashflow) => cashflow.id !== deletingCashflow.id));
    showToast(`${deletingCashflow.reference} was removed from the cash-flow ledger.`, { title: "Transaction deleted", tone: "info" });
    setDeletingCashflow(null);
  };

  return <div className="min-h-screen dashboard-bg pb-16">
    <Header title="Income vs Expense" subtitle="Monitor cash flow, spending patterns, and financial performance" />
    <main className="space-y-5 p-4 sm:p-6 xl:p-8">
      <section className="panel">
        <div className="panel-title flex-wrap gap-3"><div className="flex items-center gap-2 text-teal-600"><FinanceIcon type="chart" /><div>Financial Overview</div></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => openTransaction("Expense")}>Add Expense</Button><Button onClick={() => openTransaction("Income")}>Add Income</Button></div></div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto] xl:items-end">
          <Dropdown label="Academic Year" value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} options={["2026–27", "2027–28"].map((value) => ({ label: value, value }))} />
          <Dropdown label="Reporting Period" value={period} onChange={(event) => setPeriod(event.target.value)} options={["April–September", "September 2026", "Quarter 2", "Full Academic Year"].map((value) => ({ label: value, value }))} />
          <Dropdown label="Account" value={account} onChange={(event) => setAccount(event.target.value)} options={["All Accounts", "Cash Account", "Bank Account", "UPI Account"].map((value) => ({ label: value, value }))} />
          <Button onClick={refreshDashboard} isLoading={loading} loadingText="Refreshing...">Apply Filters</Button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "Total Income", value: formatCurrency(totalIncome), tone: "green", copy: "April–September" },
          { label: "Total Expense", value: formatCurrency(totalExpense), tone: "red", copy: "Operating expenditure" },
          { label: "Net Balance", value: formatCurrency(netBalance), tone: "teal", copy: "Positive cash flow" },
          { label: "Savings Rate", value: `${savingsRate}%`, tone: "amber", copy: "Of total income" },
        ].map((stat) => <article key={stat.label} className={`module-stat module-stat-${stat.tone}`}><div className="text-xs font-medium text-slate-500">{stat.label}</div><div className="mt-1 font-display text-xl font-bold text-slate-950 sm:text-2xl">{stat.value}</div><div className="mt-1 text-xs text-slate-400">{stat.copy}</div></article>)}
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[1fr_19rem]">
        <section className="panel">
          <div className="panel-title flex-wrap gap-3 py-3"><div className="flex items-center gap-2 text-violet-600"><FinanceIcon type="trend" /><div><div className="font-display font-bold text-slate-900">Cash Flow Trend</div><div className="mt-0.5 text-xs text-slate-400">Monthly income and expenditure</div></div></div><div className="flex items-center gap-4 text-xs"><span className="flex items-center gap-2 text-slate-500"><span className="size-2 rounded-full bg-emerald-500" />Income</span><span className="flex items-center gap-2 text-slate-500"><span className="size-2 rounded-full bg-rose-400" />Expense</span></div></div>
          <div className="p-5">
            <div className="flex h-72 items-end gap-3 border-b border-slate-200 sm:gap-6">{chartData.map((month) => <div key={month.month} className="flex h-full flex-1 flex-col justify-end">
              <div className="flex h-56 items-end justify-center gap-1 sm:gap-2">
                <div className={`${chartHeight(month.income, maxChartValue)} w-3 rounded-t-lg bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-lg shadow-emerald-100 sm:w-6`} title={`Income ${formatCurrency(month.income)}`} />
                <div className={`${chartHeight(month.expense, maxChartValue)} w-3 rounded-t-lg bg-gradient-to-t from-rose-500 to-orange-400 shadow-lg shadow-rose-100 sm:w-6`} title={`Expense ${formatCurrency(month.expense)}`} />
              </div>
              <div className="py-3 text-center text-xs font-semibold text-slate-500">{month.month}</div>
            </div>)}</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">{[
              ["Best Month", "July", "₹14,600 surplus"], ["Average Income", formatCurrency(Math.round(totalIncome / chartData.length)), "Per month"], ["Average Expense", formatCurrency(Math.round(totalExpense / chartData.length)), "Per month"],
            ].map(([label, value, copy]) => <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-3"><div className="text-xs text-slate-400">{label}</div><div className="mt-1 font-display text-sm font-bold text-slate-800">{value}</div><div className="mt-1 text-xs text-slate-400">{copy}</div></div>)}</div>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="panel p-5">
            <div className="flex items-center gap-2 text-rose-500"><FinanceIcon type="expense" /><div className="font-display text-sm font-bold text-slate-900">Expense Breakdown</div></div>
            <p className="mt-2 text-xs leading-5 text-slate-400">September spending by category.</p>
            <div className="mt-5 space-y-4">{expenseCategories.map(([categoryName, amount]) => <div key={categoryName}><div className="flex justify-between gap-3 text-xs"><span className="font-semibold text-slate-700">{categoryName}</span><span className="text-slate-500">{formatCurrency(amount)}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`${progressWidth(amount, expenseCategories[0]?.[1] ?? 1)} h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-400`} /></div></div>)}</div>
          </section>
          <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5"><div className="flex items-center gap-2 text-emerald-700"><FinanceIcon type="wallet" /><div className="font-display text-sm font-bold">Healthy Cash Flow</div></div><div className="mt-3 font-display text-2xl font-bold text-emerald-800">{savingsRate}%</div><p className="mt-2 text-xs leading-5 text-emerald-700">Income is comfortably above expenditure for the selected period.</p></section>
        </aside>
      </div>

      <section className="panel">
        <div className="panel-title flex-wrap gap-3 py-3">
          <div><div className="font-display font-bold text-slate-900">Recent Cash Flow</div><div className="mt-0.5 text-xs text-slate-400">{visibleCashflows.length} transactions</div></div>
          <div className="flex flex-wrap gap-2"><Input className="min-w-48" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search transactions..." aria-label="Search transactions" /><Dropdown className="min-w-40" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} aria-label="Filter transaction type" options={["All Transactions", "Income", "Expense"].map((value) => ({ label: value, value }))} /><Button variant="outline" onClick={exportReport} isLoading={exporting} loadingText="Exporting...">Export</Button></div>
        </div>
        <div className="overflow-x-auto"><table className="module-table"><thead><tr><th>Reference</th><th>Transaction</th><th>Category</th><th>Date</th><th>Payment Mode</th><th>Amount</th><th>Actions</th></tr></thead><tbody>{visibleCashflows.map((cashflow) => <tr key={cashflow.id}>
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
      footer={<><Button variant="outline" onClick={() => setEditorOpen(false)} disabled={saving}>Cancel</Button><Button onClick={saveTransaction} isLoading={saving} loadingText="Saving transaction...">Save Transaction</Button></>}
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
      footer={<><Button variant="outline" onClick={() => setDeletingCashflow(null)}>Cancel</Button><Button variant="danger" onClick={deleteTransaction}>Delete Transaction</Button></>}
    >
      {deletingCashflow && <div className="rounded-2xl border border-red-100 bg-red-50 p-4"><div className="font-display text-lg font-bold text-red-700">{deletingCashflow.reference}</div><div className="mt-1 text-xs text-red-600">{deletingCashflow.description} · {formatCurrency(deletingCashflow.amount)}</div></div>}
    </Popup>
  </div>;
}
