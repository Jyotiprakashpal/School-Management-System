import { useMemo, useState } from "react";
import { Button, Dropdown, Input, useToast } from "../../components";
import Header from "../../ui/header";
import Popup from "../../ui/popup";

type PayrollStatus = "Paid" | "Pending" | "Processed";

type Payroll = {
  allowances: number;
  basic: number;
  deductions: number;
  department: string;
  designation: string;
  employeeId: string;
  id: number;
  name: string;
  status: PayrollStatus;
};

const initialPayroll: Payroll[] = [
  { id: 1, employeeId: "EMP-26-1001", name: "Raj Kumar", designation: "Principal", department: "Administration", basic: 42000, allowances: 6000, deductions: 2800, status: "Paid" },
  { id: 2, employeeId: "EMP-26-1002", name: "Priya Sharma", designation: "English Teacher", department: "Academics", basic: 28500, allowances: 3200, deductions: 1600, status: "Processed" },
  { id: 3, employeeId: "EMP-26-1003", name: "Ravi Verma", designation: "Mathematics Teacher", department: "Academics", basic: 30000, allowances: 3500, deductions: 1750, status: "Pending" },
  { id: 4, employeeId: "EMP-26-1004", name: "Neha Singh", designation: "Science Teacher", department: "Academics", basic: 29500, allowances: 3200, deductions: 1700, status: "Pending" },
  { id: 5, employeeId: "EMP-26-1005", name: "Anjali Gupta", designation: "Accountant", department: "Finance", basic: 26500, allowances: 2800, deductions: 1450, status: "Processed" },
  { id: 6, employeeId: "EMP-26-1006", name: "Mohan Yadav", designation: "Transport Coordinator", department: "Transport", basic: 22000, allowances: 2500, deductions: 1200, status: "Pending" },
];

function PayrollIcon({ type }: { type: "wallet" | "people" | "salary" | "paid" | "calendar" }) {
  const paths = {
    wallet: <><path d="M4 6h14a2 2 0 0 1 2 2v11H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h13" /><path d="M16 11h6v5h-6a2.5 2.5 0 0 1 0-5Z" /></>,
    people: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9" /></>,
    salary: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" /></>,
    paid: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
  };
  return <svg className="size-5" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{paths[type]}</svg>;
}

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function netSalary(payroll: Payroll) {
  return payroll.basic + payroll.allowances - payroll.deductions;
}

function formatCurrency(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function progressWidth(value: number, max: number) {
  const ratio = max ? value / max : 0;
  if (ratio >= 0.85) return "w-full";
  if (ratio >= 0.65) return "w-3/4";
  if (ratio >= 0.4) return "w-1/2";
  if (ratio >= 0.2) return "w-1/3";
  return "w-1/4";
}

export default function SalaryManagement() {
  const [payroll, setPayroll] = useState(initialPayroll);
  const [month, setMonth] = useState("September 2026");
  const [department, setDepartment] = useState("All Departments");
  const [status, setStatus] = useState("All Status");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState<Payroll | null>(null);
  const [salaryForm, setSalaryForm] = useState({ basic: "", allowances: "", deductions: "" });
  const [saving, setSaving] = useState(false);
  const [payslip, setPayslip] = useState<Payroll | null>(null);
  const [paymentPayroll, setPaymentPayroll] = useState<Payroll | null>(null);
  const [paying, setPaying] = useState(false);
  const [bulkPaymentOpen, setBulkPaymentOpen] = useState(false);
  const { showToast } = useToast();

  const visiblePayroll = useMemo(() => payroll.filter((item) => {
    const matchesSearch = `${item.name} ${item.employeeId} ${item.designation}`.toLowerCase().includes(query.toLowerCase());
    const matchesDepartment = department === "All Departments" || item.department === department;
    const matchesStatus = status === "All Status" || item.status === status;
    return matchesSearch && matchesDepartment && matchesStatus;
  }), [department, payroll, query, status]);

  const grossPayroll = payroll.reduce((sum, item) => sum + item.basic + item.allowances, 0);
  const deductions = payroll.reduce((sum, item) => sum + item.deductions, 0);
  const netPayroll = payroll.reduce((sum, item) => sum + netSalary(item), 0);
  const paidPayroll = payroll.filter((item) => item.status === "Paid").reduce((sum, item) => sum + netSalary(item), 0);
  const departmentTotals = useMemo(() => Object.entries(payroll.reduce<Record<string, number>>((totals, item) => {
    totals[item.department] = (totals[item.department] ?? 0) + netSalary(item);
    return totals;
  }, {})).sort((first, second) => second[1] - first[1]), [payroll]);

  const loadPayroll = async () => {
    setLoading(true);
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    setLoading(false);
    showToast(`${month} payroll has been loaded.`, { title: "Payroll updated", tone: "info" });
  };

  const generatePayroll = async () => {
    setGenerating(true);
    await new Promise((resolve) => window.setTimeout(resolve, 1000));
    setPayroll((current) => current.map((item) => item.status === "Pending" ? { ...item, status: "Processed" } : item));
    setGenerating(false);
    showToast(`Salary calculations were generated for ${month}.`, { title: "Payroll generated" });
  };

  const openEdit = (item: Payroll) => {
    setEditingPayroll(item);
    setSalaryForm({ basic: String(item.basic), allowances: String(item.allowances), deductions: String(item.deductions) });
  };

  const saveSalary = async () => {
    if (!editingPayroll) return;
    const basic = Number(salaryForm.basic);
    const allowances = Number(salaryForm.allowances);
    const itemDeductions = Number(salaryForm.deductions);
    if (!basic || basic <= 0 || allowances < 0 || itemDeductions < 0 || itemDeductions > basic + allowances) {
      showToast("Enter valid salary amounts. Deductions cannot exceed gross earnings.", { title: "Invalid salary calculation", tone: "error" });
      return;
    }
    setSaving(true);
    await new Promise((resolve) => window.setTimeout(resolve, 800));
    setPayroll((current) => current.map((item) => item.id === editingPayroll.id ? { ...item, basic, allowances, deductions: itemDeductions, status: item.status === "Paid" ? "Paid" : "Processed" } : item));
    setSaving(false);
    setEditingPayroll(null);
    showToast(`${editingPayroll.name}'s salary calculation was updated.`, { title: "Payroll updated" });
  };

  const markPaid = async (item: Payroll) => {
    setPaying(true);
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    setPayroll((current) => current.map((payrollItem) => payrollItem.id === item.id ? { ...payrollItem, status: "Paid" } : payrollItem));
    setPaying(false);
    setPaymentPayroll(null);
    showToast(`${formatCurrency(netSalary(item))} was marked paid to ${item.name}.`, { title: "Salary paid" });
  };

  const payAllProcessed = async () => {
    setPaying(true);
    await new Promise((resolve) => window.setTimeout(resolve, 1100));
    const count = payroll.filter((item) => item.status === "Processed").length;
    setPayroll((current) => current.map((item) => item.status === "Processed" ? { ...item, status: "Paid" } : item));
    setPaying(false);
    setBulkPaymentOpen(false);
    showToast(`${count} processed salaries were marked as paid.`, { title: "Bulk payment completed" });
  };

  const exportPayroll = async () => {
    setExporting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 750));
    setExporting(false);
    showToast(`${month} payroll register is ready to download.`, { title: "Payroll exported", tone: "info" });
  };

  return <div className="min-h-screen dashboard-bg pb-16">
    <Header title="Salary Management" subtitle="Calculate payroll, review deductions, process salaries, and issue payslips" />
    <main className="space-y-5 p-4 sm:p-6 xl:p-8">
      <section className="panel">
        <div className="panel-title flex-wrap gap-3"><div className="flex items-center gap-2 text-teal-600"><PayrollIcon type="calendar" /><div>Payroll Period</div></div><span className="status-info">Academic Session 2026–27</span></div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto] xl:items-end">
          <Dropdown label="Salary Month" value={month} onChange={(event) => setMonth(event.target.value)} options={["September 2026", "August 2026", "July 2026"].map((value) => ({ label: value, value }))} />
          <Dropdown label="Department" value={department} onChange={(event) => setDepartment(event.target.value)} options={["All Departments", "Academics", "Administration", "Finance", "Transport"].map((value) => ({ label: value, value }))} />
          <Dropdown label="Payment Status" value={status} onChange={(event) => setStatus(event.target.value)} options={["All Status", "Pending", "Processed", "Paid"].map((value) => ({ label: value, value }))} />
          <Button onClick={loadPayroll} isLoading={loading} loadingText="Loading payroll...">View Payroll</Button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "Gross Payroll", value: formatCurrency(grossPayroll), tone: "teal", copy: `${payroll.length} employees` },
          { label: "Deductions", value: formatCurrency(deductions), tone: "amber", copy: "PF, tax, and adjustments" },
          { label: "Net Payable", value: formatCurrency(netPayroll), tone: "red", copy: "After all deductions" },
          { label: "Salary Paid", value: formatCurrency(paidPayroll), tone: "green", copy: `${payroll.filter((item) => item.status === "Paid").length} employees paid` },
        ].map((stat) => <article key={stat.label} className={`module-stat module-stat-${stat.tone}`}><div className="text-xs font-medium text-slate-500">{stat.label}</div><div className="mt-1 font-display text-xl font-bold text-slate-950 sm:text-2xl">{stat.value}</div><div className="mt-1 text-xs text-slate-400">{stat.copy}</div></article>)}
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[1fr_18rem]">
        <section className="panel">
          <div className="panel-title flex-wrap gap-3 py-3"><div className="flex items-center gap-2 text-violet-600"><PayrollIcon type="people" /><div><div className="font-display font-bold text-slate-900">{month} Payroll</div><div className="mt-0.5 text-xs text-slate-400">{visiblePayroll.length} employees in current view</div></div></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={exportPayroll} isLoading={exporting} loadingText="Exporting...">Export</Button><Button variant="outline" onClick={generatePayroll} isLoading={generating} loadingText="Calculating...">Generate Payroll</Button><Button onClick={() => setBulkPaymentOpen(true)} disabled={!payroll.some((item) => item.status === "Processed")}>Pay Processed</Button></div></div>
          <div className="border-b border-slate-100 p-4"><Input className="max-w-md" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search employee, ID, or designation..." aria-label="Search payroll employees" /></div>
          <div className="overflow-x-auto"><table className="module-table"><thead><tr><th>Employee</th><th>Basic Salary</th><th>Allowances</th><th>Deductions</th><th>Net Salary</th><th>Status</th><th>Actions</th></tr></thead><tbody>{visiblePayroll.map((item) => <tr key={item.id}>
            <td data-label="Employee"><div className="flex items-center gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 font-display text-xs font-bold text-white shadow-md shadow-violet-100">{initials(item.name)}</div><div><div className="font-semibold text-slate-900">{item.name}</div><div className="mt-1 text-xs text-slate-400">{item.employeeId} · {item.designation}</div></div></div></td>
            <td data-label="Basic Salary">{formatCurrency(item.basic)}</td><td data-label="Allowances"><span className="font-semibold text-emerald-600">+{formatCurrency(item.allowances)}</span></td><td data-label="Deductions"><span className="font-semibold text-rose-500">−{formatCurrency(item.deductions)}</span></td><td data-label="Net Salary"><span className="font-display font-bold text-slate-900">{formatCurrency(netSalary(item))}</span></td>
            <td data-label="Status"><span className={item.status === "Paid" ? "status-success" : item.status === "Processed" ? "status-info" : "status-warning"}>{item.status}</span></td>
            <td data-label="Actions"><div className="flex flex-wrap gap-2"><Button variant="outline" className="min-h-8 px-3 py-1.5" onClick={() => setPayslip(item)}>Payslip</Button><Button variant="outline" className="min-h-8 px-3 py-1.5" onClick={() => openEdit(item)}>Edit</Button>{item.status === "Processed" && <Button className="min-h-8 px-3 py-1.5" onClick={() => setPaymentPayroll(item)}>Pay</Button>}</div></td>
          </tr>)}</tbody></table></div>
          {!visiblePayroll.length && <div className="grid min-h-60 place-items-center text-center"><div><div className="mx-auto grid size-16 place-items-center rounded-2xl bg-slate-100 text-slate-400"><PayrollIcon type="salary" /></div><div className="mt-4 font-display text-sm font-bold text-slate-700">No payroll records found</div><p className="mt-1 text-xs text-slate-400">Adjust the search or payroll filters.</p></div></div>}
        </section>

        <aside className="space-y-5">
          <section className="panel p-5"><div className="flex items-center gap-2 text-teal-600"><PayrollIcon type="salary" /><div className="font-display text-sm font-bold text-slate-900">Payroll by Team</div></div><p className="mt-2 text-xs leading-5 text-slate-400">Net monthly payroll by department.</p><div className="mt-5 space-y-4">{departmentTotals.map(([departmentName, amount]) => <div key={departmentName}><div className="flex justify-between gap-3 text-xs"><span className="font-semibold text-slate-700">{departmentName}</span><span className="text-slate-500">{formatCurrency(amount)}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`${progressWidth(amount, departmentTotals[0]?.[1] ?? 1)} h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-400`} /></div></div>)}</div></section>
          <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5"><div className="flex items-center gap-2 text-emerald-700"><PayrollIcon type="paid" /><div className="font-display text-sm font-bold">Payment Progress</div></div><div className="mt-3 font-display text-2xl font-bold text-emerald-800">{Math.round(payroll.filter((item) => item.status === "Paid").length / payroll.length * 100)}%</div><div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-100"><div className={`${progressWidth(payroll.filter((item) => item.status === "Paid").length, payroll.length)} h-full rounded-full bg-emerald-500`} /></div><p className="mt-3 text-xs leading-5 text-emerald-700">{payroll.filter((item) => item.status === "Paid").length} of {payroll.length} salaries have been paid.</p></section>
        </aside>
      </div>
    </main>

    <Popup
      open={Boolean(editingPayroll)}
      onClose={() => !saving && setEditingPayroll(null)}
      title="Edit Salary Calculation"
      description={editingPayroll ? `${editingPayroll.name} · ${month}` : undefined}
      footer={<><Button variant="outline" onClick={() => setEditingPayroll(null)} disabled={saving}>Cancel</Button><Button onClick={saveSalary} isLoading={saving} loadingText="Updating salary...">Update Payroll</Button></>}
    >
      {editingPayroll && <div className="space-y-5"><div className="flex items-center gap-4 rounded-2xl border border-violet-100 bg-violet-50 p-4"><div className="grid size-12 place-items-center rounded-xl bg-white font-display font-bold text-violet-600 shadow-sm">{initials(editingPayroll.name)}</div><div><div className="font-display text-sm font-bold text-slate-900">{editingPayroll.name}</div><div className="mt-1 text-xs text-slate-500">{editingPayroll.employeeId} · {editingPayroll.department}</div></div></div><div className="grid gap-4 sm:grid-cols-3"><Input label="Basic Salary (₹)" type="number" min="1" value={salaryForm.basic} onChange={(event) => setSalaryForm((current) => ({ ...current, basic: event.target.value }))} /><Input label="Allowances (₹)" type="number" min="0" value={salaryForm.allowances} onChange={(event) => setSalaryForm((current) => ({ ...current, allowances: event.target.value }))} /><Input label="Deductions (₹)" type="number" min="0" value={salaryForm.deductions} onChange={(event) => setSalaryForm((current) => ({ ...current, deductions: event.target.value }))} /></div><div className="rounded-xl bg-slate-950 p-4 text-white"><div className="text-xs text-slate-400">Calculated net salary</div><div className="mt-1 font-display text-2xl font-bold">{formatCurrency(Math.max(0, Number(salaryForm.basic || 0) + Number(salaryForm.allowances || 0) - Number(salaryForm.deductions || 0)))}</div></div></div>}
    </Popup>

    <Popup
      open={Boolean(payslip)}
      onClose={() => setPayslip(null)}
      title="Salary Payslip"
      description={`${month} payroll statement`}
      footer={<><Button variant="outline" onClick={() => setPayslip(null)}>Close</Button><Button onClick={() => showToast(`${payslip?.employeeId} payslip is ready to print.`, { title: "Payslip prepared", tone: "info" })}>Print Payslip</Button></>}
    >
      {payslip && <div className="space-y-4"><div className="rounded-2xl bg-slate-950 p-5 text-white"><div className="flex items-start justify-between gap-4"><div><div className="text-xs text-slate-400">Net salary</div><div className="mt-1 font-display text-3xl font-bold">{formatCurrency(netSalary(payslip))}</div></div><span className={payslip.status === "Paid" ? "status-success" : payslip.status === "Processed" ? "status-info" : "status-warning"}>{payslip.status}</span></div><div className="mt-5 flex justify-between text-xs"><span className="text-slate-400">{payslip.name}</span><strong>{payslip.employeeId}</strong></div></div><dl className="grid grid-cols-2 gap-3">{[["Basic Salary", formatCurrency(payslip.basic)], ["Allowances", formatCurrency(payslip.allowances)], ["Gross Earnings", formatCurrency(payslip.basic + payslip.allowances)], ["Deductions", formatCurrency(payslip.deductions)], ["Department", payslip.department], ["Pay Period", month]].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-100 p-3"><dt className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{value}</dd></div>)}</dl></div>}
    </Popup>

    <Popup
      open={Boolean(paymentPayroll)}
      onClose={() => !paying && setPaymentPayroll(null)}
      title="Confirm Salary Payment"
      description="Mark this processed salary as paid."
      footer={<><Button variant="outline" onClick={() => setPaymentPayroll(null)} disabled={paying}>Cancel</Button><Button onClick={() => paymentPayroll && markPaid(paymentPayroll)} isLoading={paying} loadingText="Processing payment...">Confirm Payment</Button></>}
    >
      {paymentPayroll && <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5"><div className="font-display text-lg font-bold text-emerald-800">{paymentPayroll.name}</div><div className="mt-1 text-xs text-emerald-700">{paymentPayroll.employeeId} · {month}</div><div className="mt-4 font-display text-3xl font-bold text-emerald-800">{formatCurrency(netSalary(paymentPayroll))}</div></div>}
    </Popup>

    <Popup
      open={bulkPaymentOpen}
      onClose={() => !paying && setBulkPaymentOpen(false)}
      title="Pay Processed Salaries"
      description="Complete all payroll entries currently marked as processed."
      footer={<><Button variant="outline" onClick={() => setBulkPaymentOpen(false)} disabled={paying}>Cancel</Button><Button onClick={payAllProcessed} isLoading={paying} loadingText="Processing salaries...">Confirm Bulk Payment</Button></>}
    >
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5"><div className="text-xs font-semibold text-emerald-700">Payment summary</div><div className="mt-2 font-display text-3xl font-bold text-emerald-800">{formatCurrency(payroll.filter((item) => item.status === "Processed").reduce((sum, item) => sum + netSalary(item), 0))}</div><p className="mt-2 text-xs leading-5 text-emerald-700">{payroll.filter((item) => item.status === "Processed").length} employee salaries will be marked paid for {month}.</p></div>
    </Popup>
  </div>;
}
