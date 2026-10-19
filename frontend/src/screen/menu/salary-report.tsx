import { useMemo, useState } from "react";
import { Button, Dropdown, useToast } from "../../components";
import Header from "../../ui/header";
import Popup from "../../ui/popup";

type MonthlyPayroll = {
  deductions: number;
  employees: number;
  gross: number;
  id: number;
  month: string;
  net: number;
  paid: number;
  status: "Complete" | "Partial";
};

type EmployeeSalary = {
  department: string;
  employeeId: string;
  gross: number;
  id: number;
  name: string;
  net: number;
  status: "Paid" | "Pending";
};

const monthlyPayroll: MonthlyPayroll[] = [
  { id: 1, month: "April 2026", employees: 6, gross: 202000, deductions: 10800, net: 191200, paid: 191200, status: "Complete" },
  { id: 2, month: "May 2026", employees: 6, gross: 202000, deductions: 10800, net: 191200, paid: 191200, status: "Complete" },
  { id: 3, month: "June 2026", employees: 6, gross: 204500, deductions: 11100, net: 193400, paid: 193400, status: "Complete" },
  { id: 4, month: "July 2026", employees: 6, gross: 204500, deductions: 11100, net: 193400, paid: 193400, status: "Complete" },
  { id: 5, month: "August 2026", employees: 6, gross: 208200, deductions: 11800, net: 196400, paid: 196400, status: "Complete" },
  { id: 6, month: "September 2026", employees: 6, gross: 214700, deductions: 10500, net: 204200, paid: 45200, status: "Partial" },
];

const employeeSalaries: EmployeeSalary[] = [
  { id: 1, employeeId: "EMP-26-1001", name: "Raj Kumar", department: "Administration", gross: 48000, net: 45200, status: "Paid" },
  { id: 2, employeeId: "EMP-26-1002", name: "Priya Sharma", department: "Academics", gross: 31700, net: 30100, status: "Pending" },
  { id: 3, employeeId: "EMP-26-1003", name: "Ravi Verma", department: "Academics", gross: 33500, net: 31750, status: "Pending" },
  { id: 4, employeeId: "EMP-26-1004", name: "Neha Singh", department: "Academics", gross: 32700, net: 31000, status: "Pending" },
  { id: 5, employeeId: "EMP-26-1005", name: "Anjali Gupta", department: "Finance", gross: 29300, net: 27850, status: "Pending" },
  { id: 6, employeeId: "EMP-26-1006", name: "Mohan Yadav", department: "Transport", gross: 24500, net: 23300, status: "Pending" },
];

function SalaryReportIcon({ type }: { type: "report" | "trend" | "salary" | "people" | "download" }) {
  const paths = {
    report: <><path d="M5 3h14v18H5z" /><path d="M9 8h6M9 12h6M9 16h4" /></>,
    trend: <><path d="M3 17 9 11l4 4 8-9" /><path d="M15 6h6v6" /></>,
    salary: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" /></>,
    people: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9" /></>,
    download: <><path d="M12 3v13M7 11l5 5 5-5M4 21h16" /></>,
  };
  return <svg className="size-5" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{paths[type]}</svg>;
}

function formatCurrency(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function compactCurrency(value: number) {
  return `₹${(value / 100000).toFixed(2)}L`;
}

function chartHeight(value: number, max: number) {
  const ratio = max ? value / max : 0;
  if (ratio >= 0.95) return "h-full";
  if (ratio >= 0.85) return "h-5/6";
  if (ratio >= 0.7) return "h-3/4";
  if (ratio >= 0.55) return "h-2/3";
  return "h-1/2";
}

function progressWidth(value: number, max: number) {
  const ratio = max ? value / max : 0;
  if (ratio >= 0.85) return "w-full";
  if (ratio >= 0.65) return "w-3/4";
  if (ratio >= 0.4) return "w-1/2";
  if (ratio >= 0.2) return "w-1/3";
  return "w-1/4";
}

export default function SalaryReport() {
  const [academicYear, setAcademicYear] = useState("2026–27");
  const [period, setPeriod] = useState("April–September");
  const [department, setDepartment] = useState("All Departments");
  const [paymentStatus, setPaymentStatus] = useState("All Status");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<"CSV" | "PDF" | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<MonthlyPayroll | null>(null);
  const [printing, setPrinting] = useState(false);
  const { showToast } = useToast();

  const visibleEmployees = useMemo(() => employeeSalaries.filter((employee) => {
    const matchesDepartment = department === "All Departments" || employee.department === department;
    const matchesStatus = paymentStatus === "All Status" || employee.status === paymentStatus;
    return matchesDepartment && matchesStatus;
  }), [department, paymentStatus]);

  const totalGross = monthlyPayroll.reduce((sum, item) => sum + item.gross, 0);
  const totalDeductions = monthlyPayroll.reduce((sum, item) => sum + item.deductions, 0);
  const totalNet = monthlyPayroll.reduce((sum, item) => sum + item.net, 0);
  const totalPaid = monthlyPayroll.reduce((sum, item) => sum + item.paid, 0);
  const maxPayroll = Math.max(...monthlyPayroll.map((item) => item.gross));
  const departmentTotals = useMemo(() => Object.entries(employeeSalaries.reduce<Record<string, number>>((totals, employee) => {
    totals[employee.department] = (totals[employee.department] ?? 0) + employee.net;
    return totals;
  }, {})).sort((first, second) => second[1] - first[1]), []);

  const loadReport = async () => {
    setLoading(true);
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    setLoading(false);
    showToast(`${period} salary analytics have been refreshed.`, { title: "Report updated", tone: "info" });
  };

  const exportReport = async (format: "CSV" | "PDF") => {
    setExporting(format);
    await new Promise((resolve) => window.setTimeout(resolve, 850));
    setExporting(null);
    showToast(`Salary report ${format} is ready to download.`, { title: "Report exported", tone: "info" });
  };

  const printReport = async () => {
    setPrinting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    setPrinting(false);
    showToast(`${selectedMonth?.month} payroll summary is ready to print.`, { title: "Print prepared", tone: "info" });
  };

  return <div className="min-h-screen dashboard-bg pb-16">
    <Header title="Salary Report" subtitle="Analyze payroll costs, deductions, payments, and department trends" />
    <main className="space-y-5 p-4 sm:p-6 xl:p-8">
      <section className="panel">
        <div className="panel-title flex-wrap gap-3"><div className="flex items-center gap-2 text-teal-600"><SalaryReportIcon type="report" /><div>Report Parameters</div></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => exportReport("CSV")} isLoading={exporting === "CSV"} loadingText="Exporting CSV...">Export CSV</Button><Button variant="outline" onClick={() => exportReport("PDF")} isLoading={exporting === "PDF"} loadingText="Exporting PDF...">Export PDF</Button></div></div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto] xl:items-end">
          <Dropdown label="Academic Year" value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} options={["2026–27", "2027–28"].map((value) => ({ label: value, value }))} />
          <Dropdown label="Report Period" value={period} onChange={(event) => setPeriod(event.target.value)} options={["April–September", "September 2026", "Quarter 2", "Full Academic Year"].map((value) => ({ label: value, value }))} />
          <Dropdown label="Department" value={department} onChange={(event) => setDepartment(event.target.value)} options={["All Departments", "Academics", "Administration", "Finance", "Transport"].map((value) => ({ label: value, value }))} />
          <Dropdown label="Payment Status" value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)} options={["All Status", "Paid", "Pending"].map((value) => ({ label: value, value }))} />
          <Button onClick={loadReport} isLoading={loading} loadingText="Loading report...">Apply Filters</Button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "Gross Earnings", value: compactCurrency(totalGross), tone: "teal", copy: "April–September" },
          { label: "Total Deductions", value: formatCurrency(totalDeductions), tone: "amber", copy: "Tax, PF, and adjustments" },
          { label: "Net Payroll", value: compactCurrency(totalNet), tone: "red", copy: "Salary liability" },
          { label: "Total Paid", value: compactCurrency(totalPaid), tone: "green", copy: `${Math.round(totalPaid / totalNet * 100)}% disbursed` },
        ].map((stat) => <article key={stat.label} className={`module-stat module-stat-${stat.tone}`}><div className="text-xs font-medium text-slate-500">{stat.label}</div><div className="mt-1 font-display text-xl font-bold text-slate-950 sm:text-2xl">{stat.value}</div><div className="mt-1 text-xs text-slate-400">{stat.copy}</div></article>)}
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[1fr_18rem]">
        <section className="panel">
          <div className="panel-title flex-wrap gap-3 py-3"><div className="flex items-center gap-2 text-violet-600"><SalaryReportIcon type="trend" /><div><div className="font-display font-bold text-slate-900">Payroll Trend</div><div className="mt-0.5 text-xs text-slate-400">Gross, net, and paid salary by month</div></div></div><div className="flex flex-wrap gap-4 text-xs text-slate-500"><span className="flex items-center gap-2"><span className="size-2 rounded-full bg-violet-500" />Gross</span><span className="flex items-center gap-2"><span className="size-2 rounded-full bg-cyan-500" />Net</span><span className="flex items-center gap-2"><span className="size-2 rounded-full bg-emerald-500" />Paid</span></div></div>
          <div className="p-5">
            <div className="flex h-72 items-end gap-3 border-b border-slate-200 sm:gap-6">{monthlyPayroll.map((item) => <div key={item.id} className="flex h-full flex-1 flex-col justify-end"><div className="flex h-56 items-end justify-center gap-1"><div className={`${chartHeight(item.gross, maxPayroll)} w-2 rounded-t bg-violet-500 sm:w-4`} title={`Gross ${formatCurrency(item.gross)}`} /><div className={`${chartHeight(item.net, maxPayroll)} w-2 rounded-t bg-cyan-500 sm:w-4`} title={`Net ${formatCurrency(item.net)}`} /><div className={`${chartHeight(item.paid, maxPayroll)} w-2 rounded-t bg-emerald-500 sm:w-4`} title={`Paid ${formatCurrency(item.paid)}`} /></div><div className="py-3 text-center text-xs font-semibold text-slate-500">{item.month.slice(0, 3)}</div></div>)}</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">{[["Highest Payroll", "September", formatCurrency(monthlyPayroll[5].net)], ["Average Net", formatCurrency(Math.round(totalNet / monthlyPayroll.length)), "Per month"], ["Payment Completion", `${Math.round(totalPaid / totalNet * 100)}%`, "Year to date"]].map(([label, value, copy]) => <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-3"><div className="text-xs text-slate-400">{label}</div><div className="mt-1 font-display text-sm font-bold text-slate-800">{value}</div><div className="mt-1 text-xs text-slate-400">{copy}</div></div>)}</div>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="panel p-5"><div className="flex items-center gap-2 text-teal-600"><SalaryReportIcon type="people" /><div className="font-display text-sm font-bold text-slate-900">Payroll by Team</div></div><p className="mt-2 text-xs leading-5 text-slate-400">September net payroll distribution.</p><div className="mt-5 space-y-4">{departmentTotals.map(([departmentName, amount]) => <div key={departmentName}><div className="flex justify-between gap-3 text-xs"><span className="font-semibold text-slate-700">{departmentName}</span><span className="text-slate-500">{formatCurrency(amount)}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`${progressWidth(amount, departmentTotals[0]?.[1] ?? 1)} h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-400`} /></div></div>)}</div></section>
          <section className="rounded-2xl border border-amber-100 bg-amber-50 p-5"><div className="flex items-center gap-2 text-amber-700"><SalaryReportIcon type="salary" /><div className="font-display text-sm font-bold">September Pending</div></div><div className="mt-3 font-display text-2xl font-bold text-amber-800">{formatCurrency(monthlyPayroll[5].net - monthlyPayroll[5].paid)}</div><p className="mt-2 text-xs leading-5 text-amber-700">Five salaries remain pending in the current payroll cycle.</p></section>
        </aside>
      </div>

      <section className="panel">
        <div className="panel-title py-3"><div className="flex items-center gap-2 text-cyan-600"><SalaryReportIcon type="report" /><div><div className="font-display font-bold text-slate-900">Monthly Payroll Register</div><div className="mt-0.5 text-xs text-slate-400">{monthlyPayroll.length} reporting periods</div></div></div></div>
        <div className="overflow-x-auto"><table className="module-table"><thead><tr><th>Month</th><th>Employees</th><th>Gross Earnings</th><th>Deductions</th><th>Net Payroll</th><th>Amount Paid</th><th>Status</th><th>Action</th></tr></thead><tbody>{monthlyPayroll.map((item) => <tr key={item.id}><td data-label="Month"><span className="font-semibold text-slate-900">{item.month}</span></td><td data-label="Employees">{item.employees}</td><td data-label="Gross Earnings">{formatCurrency(item.gross)}</td><td data-label="Deductions"><span className="font-semibold text-rose-500">−{formatCurrency(item.deductions)}</span></td><td data-label="Net Payroll"><span className="font-display font-bold text-slate-900">{formatCurrency(item.net)}</span></td><td data-label="Amount Paid"><span className="font-semibold text-emerald-600">{formatCurrency(item.paid)}</span></td><td data-label="Status"><span className={item.status === "Complete" ? "status-success" : "status-warning"}>{item.status}</span></td><td data-label="Action"><Button variant="outline" className="min-h-8 px-3 py-1.5" onClick={() => setSelectedMonth(item)}>View Report</Button></td></tr>)}</tbody></table></div>
      </section>

      <section className="panel">
        <div className="panel-title py-3"><div className="flex items-center gap-2 text-violet-600"><SalaryReportIcon type="people" /><div><div className="font-display font-bold text-slate-900">September Employee Ledger</div><div className="mt-0.5 text-xs text-slate-400">{visibleEmployees.length} employees match the report filters</div></div></div></div>
        <div className="overflow-x-auto"><table className="module-table"><thead><tr><th>Employee ID</th><th>Employee</th><th>Department</th><th>Gross Salary</th><th>Net Salary</th><th>Payment Status</th></tr></thead><tbody>{visibleEmployees.map((employee) => <tr key={employee.id}><td data-label="Employee ID"><span className="font-semibold text-cyan-600">{employee.employeeId}</span></td><td data-label="Employee"><span className="font-semibold text-slate-900">{employee.name}</span></td><td data-label="Department"><span className="status-neutral">{employee.department}</span></td><td data-label="Gross Salary">{formatCurrency(employee.gross)}</td><td data-label="Net Salary"><span className="font-display font-bold text-slate-900">{formatCurrency(employee.net)}</span></td><td data-label="Payment Status"><span className={employee.status === "Paid" ? "status-success" : "status-warning"}>{employee.status}</span></td></tr>)}</tbody></table></div>
        {!visibleEmployees.length && <div className="grid min-h-48 place-items-center text-center"><div><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-400"><SalaryReportIcon type="people" /></div><div className="mt-4 font-display text-sm font-bold text-slate-700">No payroll records found</div><p className="mt-1 text-xs text-slate-400">Adjust the department or payment-status filter.</p></div></div>}
      </section>
    </main>

    <Popup
      open={Boolean(selectedMonth)}
      onClose={() => !printing && setSelectedMonth(null)}
      title="Monthly Payroll Summary"
      description={selectedMonth ? `${selectedMonth.month} consolidated salary report` : undefined}
      footer={<><Button variant="outline" onClick={() => setSelectedMonth(null)} disabled={printing}>Close</Button><Button onClick={printReport} isLoading={printing} loadingText="Preparing print...">Print Summary</Button></>}
    >
      {selectedMonth && <div className="space-y-4"><div className="rounded-2xl bg-slate-950 p-5 text-white"><div className="flex items-start justify-between gap-4"><div><div className="text-xs text-slate-400">Net payroll</div><div className="mt-1 font-display text-3xl font-bold">{formatCurrency(selectedMonth.net)}</div></div><span className={selectedMonth.status === "Complete" ? "status-success" : "status-warning"}>{selectedMonth.status}</span></div><div className="mt-5 flex justify-between text-xs"><span className="text-slate-400">Reporting period</span><strong>{selectedMonth.month}</strong></div></div><dl className="grid grid-cols-2 gap-3">{[["Employees", String(selectedMonth.employees)], ["Gross Earnings", formatCurrency(selectedMonth.gross)], ["Deductions", formatCurrency(selectedMonth.deductions)], ["Amount Paid", formatCurrency(selectedMonth.paid)], ["Pending Amount", formatCurrency(selectedMonth.net - selectedMonth.paid)], ["Academic Year", academicYear]].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-100 p-3"><dt className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{value}</dd></div>)}</dl></div>}
    </Popup>
  </div>;
}
