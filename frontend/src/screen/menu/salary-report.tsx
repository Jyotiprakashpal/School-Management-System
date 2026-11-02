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

function csvCell(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
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
  const pendingPayroll = totalNet - totalPaid;
  const paymentCompletion = Math.round(totalPaid / totalNet * 100);
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
    await new Promise((resolve) => window.setTimeout(resolve, 300));

    try {
      const fileBase = `salary-report-${academicYear}-${period}`.replace(/\s+/g, "-").replace(/[–—]/g, "-").toLowerCase();

      if (format === "CSV") {
        const rows: Array<Array<string | number>> = [
          ["PAL IT HUB — Salary Report"],
          ["Academic Year", academicYear],
          ["Report Period", period],
          ["Department Filter", department],
          ["Payment Status Filter", paymentStatus],
          [],
          ["Payroll Summary"],
          ["Gross Earnings", totalGross],
          ["Total Deductions", totalDeductions],
          ["Net Payroll", totalNet],
          ["Amount Paid", totalPaid],
          ["Pending Amount", pendingPayroll],
          ["Payment Completion", `${paymentCompletion}%`],
          [],
          ["Monthly Payroll Register"],
          ["Month", "Employees", "Gross Earnings", "Deductions", "Net Payroll", "Amount Paid", "Pending Amount", "Status"],
          ...monthlyPayroll.map((item) => [item.month, item.employees, item.gross, item.deductions, item.net, item.paid, item.net - item.paid, item.status]),
          [],
          ["Employee Salary Ledger"],
          ["Employee ID", "Employee", "Department", "Gross Salary", "Net Salary", "Payment Status"],
          ...visibleEmployees.map((employee) => [employee.employeeId, employee.name, employee.department, employee.gross, employee.net, employee.status]),
        ];
        const content = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
        const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = `${fileBase}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      } else {
        const { jsPDF } = await import("jspdf");
        const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
        const pageWidth = doc.internal.pageSize.getWidth();
        const money = (value: number) => `INR ${value.toLocaleString("en-IN")}`;
        const drawHeader = (subtitle: string) => {
          doc.setFillColor(15, 118, 110);
          doc.rect(0, 0, pageWidth, 30, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(18);
          doc.text("PAL IT HUB — Salary Report", 14, 13);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.text(`${subtitle}  |  ${academicYear}  |  ${period}`, 14, 21);
        };
        const drawTableHeader = (labels: string[], widths: number[], y: number) => {
          let x = 14;
          doc.setFillColor(226, 232, 240);
          doc.setTextColor(51, 65, 85);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(7.5);
          labels.forEach((label, index) => {
            doc.rect(x, y, widths[index], 8, "F");
            doc.text(label, x + 2, y + 5.2);
            x += widths[index];
          });
        };

        drawHeader("Consolidated payroll analytics");
        const summaries = [
          ["Gross Earnings", money(totalGross)],
          ["Deductions", money(totalDeductions)],
          ["Net Payroll", money(totalNet)],
          ["Amount Paid", money(totalPaid)],
          ["Pending", money(pendingPayroll)],
          ["Completion", `${paymentCompletion}%`],
        ];
        summaries.forEach(([label, value], index) => {
          const width = 42;
          const x = 14 + index * 45;
          doc.setFillColor(248, 250, 252);
          doc.roundedRect(x, 37, width, 19, 2, 2, "F");
          doc.setTextColor(100, 116, 139);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          doc.text(label, x + 3, 43);
          doc.setTextColor(15, 23, 42);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.text(value, x + 3, 51);
        });

        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Monthly Payroll Register", 14, 66);
        const monthlyWidths = [38, 20, 35, 32, 35, 35, 30, 24];
        drawTableHeader(["Month", "Employees", "Gross", "Deductions", "Net", "Paid", "Pending", "Status"], monthlyWidths, 71);
        monthlyPayroll.forEach((item, rowIndex) => {
          const y = 79 + rowIndex * 9;
          let x = 14;
          if (rowIndex % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(14, y, monthlyWidths.reduce((sum, width) => sum + width, 0), 9, "F");
          }
          doc.setTextColor(51, 65, 85);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          [item.month, String(item.employees), money(item.gross), money(item.deductions), money(item.net), money(item.paid), money(item.net - item.paid), item.status].forEach((value, index) => {
            doc.text(value, x + 2, y + 5.8);
            x += monthlyWidths[index];
          });
        });

        doc.addPage("a4", "landscape");
        drawHeader("Filtered employee salary ledger");
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Employee Salary Ledger", 14, 42);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`${visibleEmployees.length} employees  |  ${department}  |  ${paymentStatus}`, 14, 49);
        const employeeWidths = [38, 52, 42, 42, 42, 34];
        drawTableHeader(["Employee ID", "Employee", "Department", "Gross Salary", "Net Salary", "Status"], employeeWidths, 55);
        visibleEmployees.forEach((employee, rowIndex) => {
          const y = 63 + rowIndex * 10;
          let x = 14;
          if (rowIndex % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(14, y, employeeWidths.reduce((sum, width) => sum + width, 0), 10, "F");
          }
          doc.setTextColor(51, 65, 85);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          [employee.employeeId, employee.name, employee.department, money(employee.gross), money(employee.net), employee.status].forEach((value, index) => {
            doc.text(value, x + 2, y + 6.3);
            x += employeeWidths[index];
          });
        });
        doc.save(`${fileBase}.pdf`);
      }

      showToast(`Salary report ${format} has been downloaded.`, { title: "Export complete" });
    } catch {
      showToast(`The ${format} export could not be created. Please try again.`, { title: "Export failed", tone: "error" });
    } finally {
      setExporting(null);
    }
  };

  const printReport = async () => {
    setPrinting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    setPrinting(false);
    showToast(`${selectedMonth?.month} payroll summary is ready to print.`, { title: "Print prepared", tone: "info" });
  };

  return <div className="min-h-screen dashboard-bg pb-16">
    <Header title="Salary Report" subtitle="Analyze payroll costs, deductions, payments, and department trends" />
    <main className="salary-report-main mx-auto max-w-7xl space-y-5 p-3 sm:p-6 xl:p-8">
      <section className="salary-report-hero relative overflow-hidden rounded-3xl p-5 text-white sm:p-7">
        <span className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full border border-white/10 bg-white/10" />
        <span className="pointer-events-none absolute -bottom-24 left-1/3 size-56 rounded-full bg-white/5" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_21rem] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-white/80"><SalaryReportIcon type="trend" />Payroll intelligence · {academicYear}</div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-white/60">Net payroll liability</p>
            <div className="mt-1 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{formatCurrency(totalNet)}</div>
            <p className="mt-2 max-w-xl text-xs leading-5 text-white/70 sm:text-sm sm:leading-6">A consolidated view of earnings, deductions, disbursements, and outstanding salary obligations for {period}.</p>
            <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/5 p-1.5 sm:flex sm:border-0 sm:bg-transparent sm:p-0">
              <Button className="w-full min-w-0 !min-h-10 !gap-1.5 !bg-white !px-2 text-[0.68rem] !text-(--app-accent-dark) shadow-lg hover:!bg-white/90 sm:w-auto sm:!gap-2 sm:!px-4 sm:text-xs" onClick={() => exportReport("PDF")} isLoading={exporting === "PDF"} loadingText="Exporting..." icon={<SalaryReportIcon type="download" />}><span className="sm:hidden">PDF Report</span><span className="hidden sm:inline">Export PDF Report</span></Button>
              <Button variant="outline" className="w-full min-w-0 !min-h-10 !gap-1.5 !border-white/15 !bg-white/10 !px-2 text-[0.68rem] text-white !shadow-none hover:!bg-white/20 sm:w-auto sm:!gap-2 sm:!px-4 sm:text-xs" onClick={() => exportReport("CSV")} isLoading={exporting === "CSV"} loadingText="Exporting..." icon={<SalaryReportIcon type="download" />}><span className="sm:hidden">CSV File</span><span className="hidden sm:inline">Download CSV</span></Button>
            </div>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div><div className="text-xs font-semibold text-white/65">Payment completion</div><div className="mt-1 font-display text-3xl font-extrabold">{paymentCompletion}%</div></div>
              <span className="grid size-11 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/15"><SalaryReportIcon type="salary" /></span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full w-4/5 rounded-full bg-white shadow-sm" /></div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-white/10 p-3"><div className="text-[0.6rem] font-bold uppercase tracking-wider text-white/55">Paid</div><div className="mt-1 text-sm font-bold">{compactCurrency(totalPaid)}</div></div>
              <div className="rounded-xl bg-amber-300/15 p-3 ring-1 ring-amber-200/15"><div className="text-[0.6rem] font-bold uppercase tracking-wider text-amber-100/70">Pending</div><div className="mt-1 text-sm font-bold text-amber-100">{formatCurrency(pendingPayroll)}</div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="panel salary-report-filters">
        <div className="panel-title flex-wrap gap-3"><div className="flex items-center gap-3"><span className="settings-icon grid size-9 place-items-center rounded-xl"><SalaryReportIcon type="report" /></span><div><div className="font-display text-sm font-bold text-slate-900">Report Parameters</div><div className="mt-0.5 text-xs text-slate-400">Refine payroll data and employee records</div></div></div><span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 sm:inline-flex">{visibleEmployees.length} employees matched</span></div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:gap-4 sm:p-5 xl:grid-cols-[1fr_1fr_1fr_1fr_auto] xl:items-end">
          <Dropdown label="Academic Year" value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} options={["2026–27", "2027–28"].map((value) => ({ label: value, value }))} />
          <Dropdown label="Report Period" value={period} onChange={(event) => setPeriod(event.target.value)} options={["April–September", "September 2026", "Quarter 2", "Full Academic Year"].map((value) => ({ label: value, value }))} />
          <Dropdown label="Department" value={department} onChange={(event) => setDepartment(event.target.value)} options={["All Departments", "Academics", "Administration", "Finance", "Transport"].map((value) => ({ label: value, value }))} />
          <Dropdown label="Payment Status" value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)} options={["All Status", "Paid", "Pending"].map((value) => ({ label: value, value }))} />
          <Button className="w-full sm:col-span-2 xl:col-span-1 xl:w-auto" onClick={loadReport} isLoading={loading} loadingText="Loading report...">Apply Filters</Button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "Gross Earnings", value: compactCurrency(totalGross), tone: "teal", copy: "April–September", icon: "salary" as const, iconStyle: "metric-icon-teal" },
          { label: "Total Deductions", value: formatCurrency(totalDeductions), tone: "amber", copy: "Tax, PF, and adjustments", icon: "report" as const, iconStyle: "bg-amber-100 text-amber-600" },
          { label: "Net Payroll", value: compactCurrency(totalNet), tone: "red", copy: "Salary liability", icon: "trend" as const, iconStyle: "bg-rose-100 text-rose-600" },
          { label: "Total Paid", value: compactCurrency(totalPaid), tone: "green", copy: `${paymentCompletion}% disbursed`, icon: "people" as const, iconStyle: "bg-emerald-100 text-emerald-600" },
        ].map((stat) => <article key={stat.label} className={`salary-report-stat module-stat-${stat.tone} relative overflow-hidden rounded-2xl border bg-white p-3.5 shadow-sm sm:p-5`}><span className="absolute -right-8 -top-9 size-24 rounded-full bg-slate-50" /><div className="relative flex items-start justify-between gap-2"><div><div className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-500 sm:text-xs sm:normal-case sm:tracking-normal">{stat.label}</div><div className="mt-1 font-display text-xl font-extrabold text-slate-950 sm:text-2xl">{stat.value}</div></div><span className={`grid size-9 shrink-0 place-items-center rounded-xl shadow-sm sm:size-10 ${stat.iconStyle}`}><SalaryReportIcon type={stat.icon} /></span></div><div className="relative mt-2 text-[0.65rem] text-slate-400 sm:text-xs">{stat.copy}</div></article>)}
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[1fr_18rem]">
        <section className="panel salary-trend-panel">
          <div className="panel-title flex-wrap gap-3 py-3"><div className="flex items-center gap-2 text-violet-600"><SalaryReportIcon type="trend" /><div><div className="font-display font-bold text-slate-900">Payroll Trend</div><div className="mt-0.5 text-xs text-slate-400">Gross, net, and paid salary by month</div></div></div><div className="flex flex-wrap gap-4 text-xs text-slate-500"><span className="flex items-center gap-2"><span className="size-2 rounded-full bg-violet-500" />Gross</span><span className="flex items-center gap-2"><span className="size-2 rounded-full bg-cyan-500" />Net</span><span className="flex items-center gap-2"><span className="size-2 rounded-full bg-emerald-500" />Paid</span></div></div>
          <div className="p-3.5 sm:p-5">
            <div className="salary-chart-surface relative overflow-hidden rounded-2xl border p-3 pt-5 sm:p-5 sm:pt-6">
              <div className="pointer-events-none absolute inset-x-0 top-1/4 border-t border-dashed border-slate-200" />
              <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-slate-200" />
              <div className="pointer-events-none absolute inset-x-0 top-3/4 border-t border-dashed border-slate-200" />
              <div className="relative flex h-64 items-end gap-2 border-b border-slate-200 sm:gap-5">{monthlyPayroll.map((item) => <div key={item.id} className="salary-chart-group flex h-full flex-1 flex-col justify-end"><div className="flex h-52 items-end justify-center gap-1"><div className={`${chartHeight(item.gross, maxPayroll)} salary-chart-bar w-2 rounded-t-md bg-gradient-to-t from-violet-600 to-violet-400 sm:w-4`} title={`Gross ${formatCurrency(item.gross)}`} /><div className={`${chartHeight(item.net, maxPayroll)} salary-chart-bar w-2 rounded-t-md bg-gradient-to-t from-cyan-600 to-cyan-400 sm:w-4`} title={`Net ${formatCurrency(item.net)}`} /><div className={`${chartHeight(item.paid, maxPayroll)} salary-chart-bar w-2 rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 sm:w-4`} title={`Paid ${formatCurrency(item.paid)}`} /></div><div className="py-3 text-center text-[0.65rem] font-bold uppercase tracking-wide text-slate-500 sm:text-xs">{item.month.slice(0, 3)}</div></div>)}</div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">{[["Highest Payroll", "September", formatCurrency(monthlyPayroll[5].net)], ["Average Net", formatCurrency(Math.round(totalNet / monthlyPayroll.length)), "Per month"], ["Completion", `${paymentCompletion}%`, "Year to date"]].map(([label, value, copy]) => <div key={label} className="salary-insight-card rounded-xl border p-2.5 sm:p-3"><div className="text-[0.58rem] font-bold uppercase tracking-wide text-slate-400 sm:text-xs sm:normal-case sm:tracking-normal">{label}</div><div className="mt-1 truncate font-display text-xs font-bold text-slate-800 sm:text-sm">{value}</div><div className="mt-1 hidden text-xs text-slate-400 sm:block">{copy}</div></div>)}</div>
          </div>
        </section>

        <aside className="space-y-5 xl:sticky xl:top-28">
          <section className="salary-team-panel panel overflow-hidden"><div className="salary-team-header p-5"><div className="flex items-center gap-2"><span className="settings-icon grid size-9 place-items-center rounded-xl"><SalaryReportIcon type="people" /></span><div className="font-display text-sm font-bold text-slate-900">Payroll by Team</div></div><p className="mt-2 text-xs leading-5 text-slate-400">September net payroll distribution.</p></div><div className="space-y-4 p-5 pt-1">{departmentTotals.map(([departmentName, amount]) => <div key={departmentName}><div className="flex justify-between gap-3 text-xs"><span className="font-semibold text-slate-700">{departmentName}</span><span className="font-medium text-slate-500">{formatCurrency(amount)}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`${progressWidth(amount, departmentTotals[0]?.[1] ?? 1)} salary-team-progress h-full rounded-full`} /></div></div>)}</div></section>
          <section className="salary-pending-card rounded-2xl border border-amber-100 bg-amber-50 p-5"><div className="flex items-center gap-2 text-amber-700"><SalaryReportIcon type="salary" /><div className="font-display text-sm font-bold">September Pending</div></div><div className="mt-3 font-display text-2xl font-bold text-amber-800">{formatCurrency(monthlyPayroll[5].net - monthlyPayroll[5].paid)}</div><p className="mt-2 text-xs leading-5 text-amber-700">Five salaries remain pending in the current payroll cycle.</p></section>
        </aside>
      </div>

      <section className="panel">
        <div className="salary-data-header panel-title relative overflow-hidden py-3"><div className="flex min-w-0 items-center gap-3"><span className="settings-icon grid size-9 shrink-0 place-items-center rounded-xl"><SalaryReportIcon type="report" /></span><div className="min-w-0"><div className="truncate font-display text-sm font-bold text-slate-900 sm:text-base">Monthly Payroll Register</div><div className="mt-0.5 hidden text-xs text-slate-400 sm:block">{monthlyPayroll.length} reporting periods</div></div></div><span className="salary-data-count shrink-0 rounded-full px-2.5 py-1 text-[0.62rem] font-bold sm:hidden">{monthlyPayroll.length} periods</span></div>
        <div className="grid gap-3 p-3 sm:hidden">
          {monthlyPayroll.map((item) => <article key={item.id} className={`salary-report-mobile-card relative overflow-hidden rounded-2xl border p-4 ${item.status === "Partial" ? "salary-report-mobile-card-warning" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3"><span className="salary-report-card-icon grid size-10 shrink-0 place-items-center rounded-xl"><SalaryReportIcon type="report" /></span><div className="min-w-0"><div className="font-display text-sm font-bold text-slate-900">{item.month}</div><div className="mt-0.5 text-[0.65rem] text-slate-400">{item.employees} employees · Payroll cycle</div></div></div>
              <span className={item.status === "Complete" ? "status-success" : "status-warning"}>{item.status}</span>
            </div>
            <div className="salary-report-net mt-4 flex items-center justify-between gap-3 rounded-xl p-3">
              <div><div className="text-[0.6rem] font-bold uppercase tracking-wider text-slate-400">Net payroll</div><div className="mt-0.5 font-display text-xl font-extrabold text-slate-900">{formatCurrency(item.net)}</div></div>
              <div className="text-right"><div className="text-[0.6rem] font-bold uppercase tracking-wider text-slate-400">Paid</div><div className="mt-0.5 text-sm font-bold text-emerald-600">{formatCurrency(item.paid)}</div></div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="salary-report-card-metric"><span>Gross earnings</span><strong>{formatCurrency(item.gross)}</strong></div>
              <div className="salary-report-card-metric"><span>Deductions</span><strong className="!text-rose-500">−{formatCurrency(item.deductions)}</strong></div>
            </div>
            <div className="mt-3"><div className="flex items-center justify-between text-[0.65rem] font-semibold text-slate-500"><span>Payment completion</span><span>{Math.round(item.paid / item.net * 100)}%</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`${progressWidth(item.paid, item.net)} salary-report-card-progress h-full rounded-full`} /></div></div>
            <Button fullWidth className="mt-3" onClick={() => setSelectedMonth(item)}>View Payroll Report</Button>
          </article>)}
        </div>
        <div className="hidden overflow-x-auto sm:block"><table className="module-table"><thead><tr><th>Month</th><th>Employees</th><th>Gross Earnings</th><th>Deductions</th><th>Net Payroll</th><th>Amount Paid</th><th>Status</th><th>Action</th></tr></thead><tbody>{monthlyPayroll.map((item) => <tr key={item.id}><td data-label="Month"><span className="font-semibold text-slate-900">{item.month}</span></td><td data-label="Employees">{item.employees}</td><td data-label="Gross Earnings">{formatCurrency(item.gross)}</td><td data-label="Deductions"><span className="font-semibold text-rose-500">−{formatCurrency(item.deductions)}</span></td><td data-label="Net Payroll"><span className="font-display font-bold text-slate-900">{formatCurrency(item.net)}</span></td><td data-label="Amount Paid"><span className="font-semibold text-emerald-600">{formatCurrency(item.paid)}</span></td><td data-label="Status"><span className={item.status === "Complete" ? "status-success" : "status-warning"}>{item.status}</span></td><td data-label="Action"><Button variant="outline" className="min-h-8 px-3 py-1.5" onClick={() => setSelectedMonth(item)}>View Report</Button></td></tr>)}</tbody></table></div>
      </section>

      <section className="panel">
        <div className="salary-data-header panel-title relative overflow-hidden py-3"><div className="flex min-w-0 items-center gap-3"><span className="settings-icon grid size-9 shrink-0 place-items-center rounded-xl"><SalaryReportIcon type="people" /></span><div className="min-w-0"><div className="truncate font-display text-sm font-bold text-slate-900 sm:text-base">September Employee Ledger</div><div className="mt-0.5 hidden text-xs text-slate-400 sm:block">{visibleEmployees.length} employees match the report filters</div></div></div><span className="salary-data-count shrink-0 rounded-full px-2.5 py-1 text-[0.62rem] font-bold sm:hidden">{visibleEmployees.length} matched</span></div>
        <div className="grid gap-3 p-3 sm:hidden">
          {visibleEmployees.map((employee) => <article key={employee.id} className="salary-report-mobile-card relative overflow-hidden rounded-2xl border p-4">
            <div className="flex items-start gap-3">
              <span className="salary-report-employee-avatar grid size-11 shrink-0 place-items-center rounded-2xl font-display text-xs font-extrabold text-white">{initials(employee.name)}</span>
              <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="truncate font-display text-sm font-bold text-slate-900">{employee.name}</div><div className="mt-0.5 text-[0.65rem] font-semibold text-(--app-accent)">{employee.employeeId}</div></div><span className={employee.status === "Paid" ? "status-success" : "status-warning"}>{employee.status}</span></div><div className="mt-1.5"><span className="status-neutral">{employee.department}</span></div></div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="salary-report-card-metric"><span>Gross salary</span><strong>{formatCurrency(employee.gross)}</strong></div>
              <div className="salary-report-card-metric salary-report-net"><span>Net salary</span><strong>{formatCurrency(employee.net)}</strong></div>
            </div>
          </article>)}
        </div>
        <div className="hidden overflow-x-auto sm:block"><table className="module-table"><thead><tr><th>Employee ID</th><th>Employee</th><th>Department</th><th>Gross Salary</th><th>Net Salary</th><th>Payment Status</th></tr></thead><tbody>{visibleEmployees.map((employee) => <tr key={employee.id}><td data-label="Employee ID"><span className="font-semibold text-cyan-600">{employee.employeeId}</span></td><td data-label="Employee"><span className="font-semibold text-slate-900">{employee.name}</span></td><td data-label="Department"><span className="status-neutral">{employee.department}</span></td><td data-label="Gross Salary">{formatCurrency(employee.gross)}</td><td data-label="Net Salary"><span className="font-display font-bold text-slate-900">{formatCurrency(employee.net)}</span></td><td data-label="Payment Status"><span className={employee.status === "Paid" ? "status-success" : "status-warning"}>{employee.status}</span></td></tr>)}</tbody></table></div>
        {!visibleEmployees.length && <div className="grid min-h-48 place-items-center text-center"><div><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-400"><SalaryReportIcon type="people" /></div><div className="mt-4 font-display text-sm font-bold text-slate-700">No payroll records found</div><p className="mt-1 text-xs text-slate-400">Adjust the department or payment-status filter.</p></div></div>}
      </section>
    </main>

    <Popup
      open={Boolean(selectedMonth)}
      onClose={() => !printing && setSelectedMonth(null)}
      title="Monthly Payroll Summary"
      description={selectedMonth ? `${selectedMonth.month} consolidated salary report` : undefined}
      footerClassName="!grid grid-cols-2 items-stretch gap-2 [&>button]:w-full sm:!flex sm:[&>button]:w-auto"
      footer={<><Button variant="outline" className="!px-2 sm:!px-4" onClick={() => setSelectedMonth(null)} disabled={printing}>Close</Button><Button className="!px-2 sm:!px-4" onClick={printReport} isLoading={printing} loadingText="Preparing...">Print Summary</Button></>}
    >
      {selectedMonth && <div className="space-y-4"><div className="rounded-2xl bg-slate-950 p-5 text-white"><div className="flex items-start justify-between gap-4"><div><div className="text-xs text-slate-400">Net payroll</div><div className="mt-1 font-display text-3xl font-bold">{formatCurrency(selectedMonth.net)}</div></div><span className={selectedMonth.status === "Complete" ? "status-success" : "status-warning"}>{selectedMonth.status}</span></div><div className="mt-5 flex justify-between text-xs"><span className="text-slate-400">Reporting period</span><strong>{selectedMonth.month}</strong></div></div><dl className="salary-summary-details grid grid-cols-2 gap-3">{[["Employees", String(selectedMonth.employees)], ["Gross Earnings", formatCurrency(selectedMonth.gross)], ["Deductions", formatCurrency(selectedMonth.deductions)], ["Amount Paid", formatCurrency(selectedMonth.paid)], ["Pending Amount", formatCurrency(selectedMonth.net - selectedMonth.paid)], ["Academic Year", academicYear]].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-100 p-3"><dt className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{value}</dd></div>)}</dl></div>}
    </Popup>
  </div>;
}
