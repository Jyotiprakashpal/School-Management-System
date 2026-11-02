import { useMemo, useState } from "react";
import { Button, Dropdown, Input, useToast } from "../../components";
import Header from "../../ui/header";
import Popup from "../../ui/popup";

type ReportCategory = "Academic" | "Attendance" | "Finance" | "Students";

type ReportTemplate = {
  category: ReportCategory;
  description: string;
  format: string;
  id: number;
  title: string;
  type: "chart" | "fees" | "people" | "attendance";
};

type GeneratedReport = {
  created: string;
  format: string;
  id: number;
  period: string;
  size: string;
  status: "Ready" | "Scheduled";
  title: string;
};

const templates: ReportTemplate[] = [
  { id: 1, title: "Class-wise Fee Summary", description: "Collection, pending dues, and payment completion by class.", category: "Finance", format: "PDF / CSV", type: "fees" },
  { id: 2, title: "Income vs Expense", description: "Monthly financial performance with income and spending comparison.", category: "Finance", format: "PDF", type: "chart" },
  { id: 3, title: "Fee Defaulters", description: "Students with outstanding fee balances and contact details.", category: "Finance", format: "PDF / CSV", type: "fees" },
  { id: 4, title: "Expense Ledger", description: "Detailed school expenditure grouped by category and payment mode.", category: "Finance", format: "PDF / CSV", type: "chart" },
  { id: 5, title: "Student Attendance", description: "Monthly attendance percentage, absences, and late arrivals.", category: "Attendance", format: "PDF / CSV", type: "attendance" },
  { id: 6, title: "Session Student Register", description: "Student enrollment by class, section, gender, and status.", category: "Students", format: "CSV", type: "people" },
  { id: 7, title: "Class Result Analysis", description: "Subject performance, class averages, grades, and pass rates.", category: "Academic", format: "PDF", type: "chart" },
  { id: 8, title: "Exam Marks Register", description: "Complete marks register for a selected exam and class.", category: "Academic", format: "PDF / CSV", type: "chart" },
];

const initialGenerated: GeneratedReport[] = [
  { id: 101, title: "Class-wise Fee Summary", created: "Today, 10:42 AM", period: "September 2026", format: "PDF", size: "1.2 MB", status: "Ready" },
  { id: 102, title: "Student Attendance", created: "27 Sep 2026", period: "September 2026", format: "CSV", size: "840 KB", status: "Ready" },
  { id: 103, title: "Income vs Expense", created: "25 Sep 2026", period: "Academic Year 2026–27", format: "PDF", size: "2.4 MB", status: "Ready" },
  { id: 104, title: "Fee Defaulters", created: "Runs on 01 Oct 2026", period: "September 2026", format: "PDF", size: "—", status: "Scheduled" },
];

const blankConfiguration = {
  className: "All Classes",
  format: "PDF",
  fromDate: "2026-09-01",
  period: "Run Once",
  reportName: "",
  toDate: "2026-09-30",
};

function ReportIcon({ type }: { type: "chart" | "fees" | "people" | "attendance" | "search" | "download" }) {
  const paths = {
    chart: <><path d="M4 19V9M10 19V5M16 19v-7M22 19V3" /><path d="M2 21h20" /></>,
    fees: <><path d="M6 5h12M6 9h12" /><path d="M7 5c7 0 7 8 0 8l8 7" /></>,
    people: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9" /></>,
    attendance: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18m-13 5 2 2 5-5" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    download: <><path d="M12 3v13M7 11l5 5 5-5M4 21h16" /></>,
  };
  return <svg className="size-5" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{paths[type]}</svg>;
}

function iconTone(category: ReportCategory) {
  if (category === "Finance") return "bg-amber-50 text-amber-600";
  if (category === "Academic") return "bg-violet-50 text-violet-600";
  if (category === "Attendance") return "bg-emerald-50 text-emerald-600";
  return "bg-cyan-50 text-cyan-600";
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function reportFileName(report: GeneratedReport) {
  const title = report.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${title || "school-report"}-${report.id}`;
}

async function saveReportFile(report: GeneratedReport) {
  const fileName = reportFileName(report);

  if (report.format === "CSV") {
    const rows = [
      ["School Report"],
      [],
      ["Report Name", report.title],
      ["Reporting Period", report.period],
      ["Generated", report.created],
      ["Status", report.status],
      ["Format", report.format],
      ["Reference ID", String(report.id)],
    ];
    const content = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return;
  }

  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(15, 118, 110);
  doc.rect(0, 0, pageWidth, 42, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(report.title, 16, 20, { maxWidth: pageWidth - 32 });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("School Reports & Insights", 16, 32);

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Report details", 16, 58);

  const details = [
    ["Reporting period", report.period],
    ["Generated", report.created],
    ["Status", report.status],
    ["Format", report.format],
    ["Reference ID", String(report.id)],
  ];
  details.forEach(([label, value], index) => {
    const y = 72 + index * 18;
    doc.setFillColor(index % 2 ? 248 : 241, index % 2 ? 250 : 245, index % 2 ? 252 : 249);
    doc.roundedRect(16, y - 9, pageWidth - 32, 14, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(label, 21, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(value, 75, y, { maxWidth: pageWidth - 96 });
  });

  doc.setDrawColor(226, 232, 240);
  doc.line(16, 174, pageWidth - 16, 174);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Generated from the Reports workspace.", 16, 183);
  doc.save(`${fileName}.pdf`);
}

export default function Reports() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [configuration, setConfiguration] = useState(blankConfiguration);
  const [generatedReports, setGeneratedReports] = useState(initialGenerated);
  const [generating, setGenerating] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [deletingReport, setDeletingReport] = useState<GeneratedReport | null>(null);
  const [historyFilter, setHistoryFilter] = useState("All Reports");
  const { showToast } = useToast();

  const filteredTemplates = useMemo(() => templates.filter((report) => {
    const matchesSearch = `${report.title} ${report.description}`.toLowerCase().includes(query.toLowerCase());
    return matchesSearch && (category === "All Categories" || report.category === category);
  }), [category, query]);

  const filteredHistory = generatedReports.filter((report) => historyFilter === "All Reports" || report.status === historyFilter);
  const readyReports = generatedReports.filter((report) => report.status === "Ready").length;
  const scheduledReports = generatedReports.filter((report) => report.status === "Scheduled").length;

  const openConfiguration = (report: ReportTemplate) => {
    setSelectedTemplate(report);
    setConfiguration({ ...blankConfiguration, reportName: report.title, format: report.format.includes("PDF") ? "PDF" : "CSV" });
  };

  const generateReport = async () => {
    if (!selectedTemplate) return;
    if (!configuration.reportName.trim() || !configuration.fromDate || !configuration.toDate) {
      showToast("Report name and date range are required.", { title: "Complete report settings", tone: "error" });
      return;
    }
    if (configuration.toDate < configuration.fromDate) {
      showToast("The end date must be after the start date.", { title: "Invalid date range", tone: "error" });
      return;
    }
    setGenerating(true);
    await new Promise((resolve) => window.setTimeout(resolve, 1200));
    const scheduled = configuration.period !== "Run Once";
    const generated: GeneratedReport = {
      id: Date.now(),
      title: configuration.reportName,
      created: scheduled ? `Scheduled ${configuration.period.toLowerCase()}` : "Just now",
      period: `${configuration.fromDate} to ${configuration.toDate}`,
      format: configuration.format,
      size: scheduled ? "—" : configuration.format === "PDF" ? "1.4 MB" : "620 KB",
      status: scheduled ? "Scheduled" : "Ready",
    };
    setGeneratedReports((current) => [generated, ...current]);
    if (scheduled) {
      setGenerating(false);
      setSelectedTemplate(null);
      showToast(`${configuration.reportName} has been scheduled.`, { title: "Report scheduled" });
      return;
    }

    try {
      await saveReportFile(generated);
      showToast(`${configuration.reportName} was generated and downloaded.`, { title: "Report ready" });
    } catch {
      showToast("The report was generated, but the file could not be downloaded. Use Download in report history to try again.", { title: "Download failed", tone: "error" });
    } finally {
      setGenerating(false);
      setSelectedTemplate(null);
    }
  };

  const downloadReport = async (report: GeneratedReport) => {
    if (report.status === "Scheduled") {
      showToast("This report will be available after its scheduled run.", { title: "Report not ready", tone: "error" });
      return;
    }
    setDownloadingId(report.id);

    try {
      await saveReportFile(report);
      showToast(`${report.title}.${report.format.toLowerCase()} downloaded.`, { title: "Download complete" });
    } catch {
      showToast("The report could not be downloaded. Please try again.", { title: "Download failed", tone: "error" });
    } finally {
      setDownloadingId(null);
    }
  };

  const deleteGeneratedReport = () => {
    if (!deletingReport) return;
    setGeneratedReports((current) => current.filter((report) => report.id !== deletingReport.id));
    showToast(`${deletingReport.title} was removed from report history.`, { title: "Report removed", tone: "info" });
    setDeletingReport(null);
  };

  return <div className="min-h-screen dashboard-bg pb-16">
    <Header title="Reports" subtitle="Generate, schedule, and download financial and academic insights" />
    <main className="mx-auto max-w-7xl space-y-5 p-3 sm:p-6 xl:p-8">
      <section className="reports-studio-hero relative overflow-hidden rounded-3xl p-5 text-white sm:p-7">
        <span className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full border border-white/10 bg-white/10" />
        <span className="pointer-events-none absolute -bottom-28 left-1/3 size-60 rounded-full bg-white/5" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_21rem] lg:items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-white/80"><ReportIcon type="chart" />Insights studio</div>
            <div className="mt-4 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Turn school data into clear decisions.</div>
            <p className="mt-2 max-w-xl text-xs leading-5 text-white/70 sm:text-sm sm:leading-6">Build financial, academic, attendance, and student reports with flexible date ranges, formats, and recurring schedules.</p>
            <div className="mt-4 flex flex-wrap gap-2 text-[0.68rem] font-semibold text-white/75">
              <span className="rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/10">{templates.length} templates</span>
              <span className="rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/10">{readyReports} ready files</span>
              <span className="rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/10">{scheduledReports} scheduled</span>
            </div>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-xl sm:p-5">
            <div className="flex items-start justify-between gap-4"><div><div className="text-xs font-semibold text-white/65">Reporting activity</div><div className="mt-1 font-display text-3xl font-extrabold">12</div><div className="mt-0.5 text-xs text-white/60">Reports this month</div></div><span className="grid size-11 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/15"><ReportIcon type="download" /></span></div>
            <div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl bg-emerald-300/10 p-3 ring-1 ring-emerald-200/10"><div className="text-[0.6rem] font-bold uppercase tracking-wider text-emerald-100/70">Available</div><div className="mt-1 text-lg font-bold text-emerald-100">{readyReports}</div></div><div className="rounded-xl bg-amber-300/10 p-3 ring-1 ring-amber-200/10"><div className="text-[0.6rem] font-bold uppercase tracking-wider text-amber-100/70">Scheduled</div><div className="mt-1 text-lg font-bold text-amber-100">{scheduledReports}</div></div></div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "Report Templates", value: String(templates.length), tone: "teal", copy: "Across four categories", icon: "chart" as const, iconStyle: "metric-icon-teal" },
          { label: "Generated", value: String(readyReports), tone: "green", copy: "Ready to download", icon: "download" as const, iconStyle: "bg-emerald-100 text-emerald-600" },
          { label: "Scheduled", value: String(scheduledReports), tone: "amber", copy: "Automated reports", icon: "attendance" as const, iconStyle: "bg-amber-100 text-amber-600" },
          { label: "This Month", value: "12", tone: "teal", copy: "Reports generated", icon: "people" as const, iconStyle: "bg-violet-100 text-violet-600" },
        ].map((stat) => <article key={stat.label} className={`reports-stat-card module-stat-${stat.tone} relative overflow-hidden rounded-2xl border bg-white p-3.5 shadow-sm sm:p-5`}><span className="absolute -right-8 -top-9 size-24 rounded-full bg-slate-50" /><div className="relative flex items-start justify-between gap-2"><div><div className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-500 sm:text-xs sm:normal-case sm:tracking-normal">{stat.label}</div><div className="mt-1 font-display text-2xl font-extrabold text-slate-950">{stat.value}</div></div><span className={`grid size-9 shrink-0 place-items-center rounded-xl shadow-sm sm:size-10 ${stat.iconStyle}`}><ReportIcon type={stat.icon} /></span></div><div className="relative mt-2 text-[0.65rem] text-slate-400 sm:text-xs">{stat.copy}</div></article>)}
      </section>

      <section className="panel reports-library-filter">
        <div className="panel-title"><div className="flex items-center gap-3"><span className="settings-icon grid size-9 place-items-center rounded-xl"><ReportIcon type="search" /></span><div><div className="font-display text-sm font-bold text-slate-900">Report Library</div><div className="mt-0.5 text-xs text-slate-400">Find the right template for your analysis</div></div></div><span className="status-info">{filteredTemplates.length} available</span></div>
        <div className="grid gap-3 p-4 sm:grid-cols-[1fr_15rem] sm:p-5">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search report templates..." aria-label="Search report templates" startIcon={<ReportIcon type="search" />} />
          <Dropdown value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter report category" options={["All Categories", "Finance", "Academic", "Attendance", "Students"].map((value) => ({ label: value, value }))} />
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3"><div><div className="font-display text-lg font-bold text-slate-950">Choose a Report</div><p className="mt-1 text-xs text-slate-400">Select a template to configure its date range and output.</p></div></div>
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">{filteredTemplates.map((report) => <Button key={report.id} variant="outline" onClick={() => openConfiguration(report)} className={`report-template-card report-template-${report.category.toLowerCase()} group relative flex min-h-48 flex-col items-stretch justify-between overflow-hidden !rounded-2xl !p-4 text-left shadow-sm sm:min-h-52 sm:!p-5`}>
          <span className="absolute inset-x-0 top-0 h-1 report-template-accent" />
          <span>
            <span className="flex items-start justify-between gap-3"><span className={`grid size-11 place-items-center rounded-xl shadow-sm sm:size-12 ${iconTone(report.category)}`}><ReportIcon type={report.type} /></span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[0.6rem] font-bold text-slate-500">{report.format}</span></span>
            <span className="mt-4 block font-display text-sm font-bold text-slate-900 sm:mt-5">{report.title}</span>
            <span className="mt-2 block text-xs font-normal leading-5 text-slate-500">{report.description}</span>
          </span>
          <span className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 sm:mt-5 sm:pt-4"><span className="status-neutral">{report.category}</span><span className="report-template-action text-xs font-bold">Configure <span aria-hidden="true">→</span></span></span>
        </Button>)}</div>
        {!filteredTemplates.length && <div className="panel grid min-h-60 place-items-center text-center"><div><div className="mx-auto grid size-16 place-items-center rounded-2xl bg-slate-100 text-slate-400"><ReportIcon type="search" /></div><div className="mt-4 font-display text-sm font-bold text-slate-700">No report templates found</div><p className="mt-1 text-xs text-slate-400">Try a different search or category.</p><Button variant="outline" className="mt-4" onClick={() => { setQuery(""); setCategory("All Categories"); }}>Clear Filters</Button></div></div>}
      </section>

      <section className="panel overflow-hidden">
        <div className="panel-title !block !px-4 !py-4 sm:!flex sm:gap-3 sm:!px-5 sm:!py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="settings-icon grid size-10 shrink-0 place-items-center rounded-xl"><ReportIcon type="download" /></span>
            <div className="min-w-0 flex-1"><div className="truncate font-display text-base font-bold text-slate-900">Recent Reports</div><div className="mt-0.5 truncate text-xs text-slate-400">Generated files and recurring schedules</div></div>
            <span className="status-info sm:hidden">{filteredHistory.length}</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 sm:hidden">
            {["All Reports", "Ready", "Scheduled"].map((value) => <Button key={value} variant={historyFilter === value ? "primary" : "outline"} className={`!min-h-9 !rounded-lg !px-2 !py-1.5 !shadow-none ${historyFilter === value ? "" : "!border-transparent !bg-transparent"}`} onClick={() => setHistoryFilter(value)} aria-pressed={historyFilter === value}>{value === "All Reports" ? "All" : value}</Button>)}
          </div>
          <div className="hidden sm:block"><Dropdown className="min-w-40" value={historyFilter} onChange={(event) => setHistoryFilter(event.target.value)} aria-label="Filter report history" options={["All Reports", "Ready", "Scheduled"].map((value) => ({ label: value, value }))} /></div>
        </div>
        <div className="grid gap-3 p-3 lg:hidden">
          {filteredHistory.map((report) => <article key={report.id} className={`report-history-card relative overflow-hidden rounded-2xl border p-4 ${report.status === "Scheduled" ? "report-history-scheduled" : ""}`}>
            <div className="flex items-start gap-3">
              <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${report.status === "Ready" ? "report-history-ready-icon" : "bg-amber-100 text-amber-600"}`}><ReportIcon type={report.status === "Ready" ? "download" : "attendance"} /></span>
              <div className="min-w-0 flex-1"><div className="truncate font-display text-sm font-bold text-slate-900">{report.title}</div><div className="mt-0.5 truncate text-[0.65rem] text-slate-400">{report.created}</div><div className="mt-2 flex flex-wrap gap-1.5"><span className={report.status === "Ready" ? "status-success" : "status-warning"}>{report.status}</span><span className="status-neutral">{report.format}</span><span className="status-neutral">{report.size}</span></div></div>
            </div>
            <div className="report-history-period mt-4 rounded-xl p-3"><div className="text-[0.58rem] font-bold uppercase tracking-wider text-slate-400">Reporting period</div><div className="mt-1 text-xs font-semibold leading-5 text-slate-700">{report.period}</div></div>
            <div className="mt-3 grid grid-cols-2 gap-2"><Button className="min-w-0 !px-2" onClick={() => downloadReport(report)} isLoading={downloadingId === report.id} loadingText="Preparing..." disabled={report.status === "Scheduled"}>{report.status === "Ready" ? "Download" : "Not Ready"}</Button><Button variant="danger" className="min-w-0 !px-2 text-xs" onClick={() => setDeletingReport(report)}>Delete</Button></div>
          </article>)}
        </div>
        <div className="hidden overflow-x-auto lg:block">
          <table className="module-table">
            <thead><tr><th>Report</th><th>Period</th><th>Generated</th><th>Format</th><th>File Size</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{filteredHistory.map((report) => <tr key={report.id}>
              <td data-label="Report"><div className="flex items-center gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600"><ReportIcon type="chart" /></div><span className="font-semibold text-slate-900">{report.title}</span></div></td>
              <td data-label="Period">{report.period}</td><td data-label="Generated">{report.created}</td><td data-label="Format"><span className="status-neutral">{report.format}</span></td><td data-label="File Size">{report.size}</td>
              <td data-label="Status"><span className={report.status === "Ready" ? "status-success" : "status-warning"}>{report.status}</span></td>
              <td data-label="Actions"><div className="flex flex-wrap gap-2"><Button variant="outline" className="min-h-8 px-3 py-1.5" onClick={() => downloadReport(report)} isLoading={downloadingId === report.id} loadingText="Preparing...">Download</Button><Button variant="danger" className="min-h-8 px-3 py-1.5 text-xs" onClick={() => setDeletingReport(report)}>Delete</Button></div></td>
            </tr>)}</tbody>
          </table>
        </div>
      </section>
    </main>

    <Popup
      open={Boolean(selectedTemplate)}
      onClose={() => !generating && setSelectedTemplate(null)}
      title="Configure Report"
      description={selectedTemplate?.description}
      footerClassName="!grid grid-cols-2 items-stretch gap-2 [&>button]:w-full sm:!flex sm:[&>button]:w-auto"
      footer={<><Button variant="outline" className="!px-2 sm:!px-4" onClick={() => setSelectedTemplate(null)} disabled={generating}>Cancel</Button><Button className="!px-2 sm:!px-4" onClick={generateReport} isLoading={generating} loadingText="Generating...">{configuration.period === "Run Once" ? "Generate Report" : "Schedule Report"}</Button></>}
    >
      {selectedTemplate && <div className="space-y-5">
        <div className="flex items-center gap-4 rounded-2xl border border-violet-100 bg-violet-50 p-4"><div className="grid size-12 shrink-0 place-items-center rounded-xl bg-white text-violet-600 shadow-sm"><ReportIcon type={selectedTemplate.type} /></div><div><div className="font-display text-sm font-bold text-slate-900">{selectedTemplate.title}</div><div className="mt-1 text-xs text-slate-500">{selectedTemplate.category} · Supports {selectedTemplate.format}</div></div></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Input label="Report Name *" value={configuration.reportName} onChange={(event) => setConfiguration((current) => ({ ...current, reportName: event.target.value }))} /></div>
          <Input label="From Date *" type="date" value={configuration.fromDate} onChange={(event) => setConfiguration((current) => ({ ...current, fromDate: event.target.value }))} />
          <Input label="To Date *" type="date" value={configuration.toDate} onChange={(event) => setConfiguration((current) => ({ ...current, toDate: event.target.value }))} />
          <Dropdown label="Class Scope" value={configuration.className} onChange={(event) => setConfiguration((current) => ({ ...current, className: event.target.value }))} options={["All Classes", "UKG-A", "Class 8-A", "Class 9-A", "Class 10-A"].map((value) => ({ label: value, value }))} />
          <Dropdown label="Output Format" value={configuration.format} onChange={(event) => setConfiguration((current) => ({ ...current, format: event.target.value }))} options={[{ label: "PDF Document", value: "PDF" }, { label: "CSV Spreadsheet", value: "CSV" }]} />
          <div className="sm:col-span-2"><Dropdown label="Report Frequency" value={configuration.period} onChange={(event) => setConfiguration((current) => ({ ...current, period: event.target.value }))} options={["Run Once", "Every Week", "Every Month"].map((value) => ({ label: value, value }))} /></div>
        </div>
      </div>}
    </Popup>

    <Popup
      open={Boolean(deletingReport)}
      onClose={() => setDeletingReport(null)}
      title="Remove Report"
      description="This removes the generated file or schedule from report history."
      footerClassName="!grid grid-cols-2 items-stretch gap-2 [&>button]:w-full sm:!flex sm:[&>button]:w-auto"
      footer={<><Button variant="outline" className="!px-2 sm:!px-4" onClick={() => setDeletingReport(null)}>Cancel</Button><Button variant="danger" className="!px-2 sm:!px-4" onClick={deleteGeneratedReport}>Remove Report</Button></>}
    >
      {deletingReport && <div className="rounded-2xl border border-red-100 bg-red-50 p-4"><div className="font-display text-lg font-bold text-red-700">{deletingReport.title}</div><div className="mt-1 text-xs text-red-600">{deletingReport.period} · {deletingReport.status}</div></div>}
    </Popup>
  </div>;
}
