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
    setGenerating(false);
    setSelectedTemplate(null);
    showToast(scheduled ? `${configuration.reportName} has been scheduled.` : `${configuration.reportName} is ready to download.`, { title: scheduled ? "Report scheduled" : "Report generated" });
  };

  const downloadReport = async (report: GeneratedReport) => {
    if (report.status === "Scheduled") {
      showToast("This report will be available after its scheduled run.", { title: "Report not ready", tone: "error" });
      return;
    }
    setDownloadingId(report.id);
    await new Promise((resolve) => window.setTimeout(resolve, 750));
    setDownloadingId(null);
    showToast(`${report.title}.${report.format.toLowerCase()} is ready.`, { title: "Download prepared", tone: "info" });
  };

  const deleteGeneratedReport = () => {
    if (!deletingReport) return;
    setGeneratedReports((current) => current.filter((report) => report.id !== deletingReport.id));
    showToast(`${deletingReport.title} was removed from report history.`, { title: "Report removed", tone: "info" });
    setDeletingReport(null);
  };

  return <div className="min-h-screen dashboard-bg pb-16">
    <Header title="Reports" subtitle="Generate, schedule, and download financial and academic insights" />
    <main className="space-y-5 p-4 sm:p-6 xl:p-8">
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "Report Templates", value: String(templates.length), tone: "teal", copy: "Across four categories" },
          { label: "Generated", value: String(readyReports), tone: "green", copy: "Ready to download" },
          { label: "Scheduled", value: String(scheduledReports), tone: "amber", copy: "Automated reports" },
          { label: "This Month", value: "12", tone: "teal", copy: "Reports generated" },
        ].map((stat) => <article key={stat.label} className={`module-stat module-stat-${stat.tone}`}><div className="text-xs font-medium text-slate-500">{stat.label}</div><div className="mt-1 font-display text-2xl font-bold text-slate-950">{stat.value}</div><div className="mt-1 text-xs text-slate-400">{stat.copy}</div></article>)}
      </section>

      <section className="panel">
        <div className="panel-title"><div className="flex items-center gap-2 text-teal-600"><ReportIcon type="search" /><div>Report Library</div></div><span className="status-info">{filteredTemplates.length} available</span></div>
        <div className="grid gap-4 p-5 sm:grid-cols-[1fr_15rem]">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search report templates..." aria-label="Search report templates" startIcon={<ReportIcon type="search" />} />
          <Dropdown value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter report category" options={["All Categories", "Finance", "Academic", "Attendance", "Students"].map((value) => ({ label: value, value }))} />
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3"><div><div className="font-display text-lg font-bold text-slate-950">Choose a Report</div><p className="mt-1 text-xs text-slate-400">Select a template to configure its date range and output.</p></div></div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{filteredTemplates.map((report) => <Button key={report.id} variant="outline" onClick={() => openConfiguration(report)} className="group flex min-h-52 flex-col items-stretch justify-between rounded-2xl border-white p-5 text-left shadow-lg shadow-slate-900/5 hover:-translate-y-1 hover:border-teal-200 hover:bg-white hover:shadow-xl">
          <span>
            <span className={`grid size-12 place-items-center rounded-xl ${iconTone(report.category)}`}><ReportIcon type={report.type} /></span>
            <span className="mt-5 block font-display text-sm font-bold text-slate-900">{report.title}</span>
            <span className="mt-2 block text-xs font-normal leading-5 text-slate-500">{report.description}</span>
          </span>
          <span className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"><span className="status-neutral">{report.category}</span><span className="text-xs font-semibold text-teal-600">{report.format}</span></span>
        </Button>)}</div>
        {!filteredTemplates.length && <div className="panel grid min-h-60 place-items-center text-center"><div><div className="mx-auto grid size-16 place-items-center rounded-2xl bg-slate-100 text-slate-400"><ReportIcon type="search" /></div><div className="mt-4 font-display text-sm font-bold text-slate-700">No report templates found</div><p className="mt-1 text-xs text-slate-400">Try a different search or category.</p><Button variant="outline" className="mt-4" onClick={() => { setQuery(""); setCategory("All Categories"); }}>Clear Filters</Button></div></div>}
      </section>

      <section className="panel">
        <div className="panel-title flex-wrap gap-3 py-3">
          <div className="flex items-center gap-2 text-violet-600"><ReportIcon type="download" /><div><div className="font-display font-bold text-slate-900">Recent Reports</div><div className="mt-0.5 text-xs text-slate-400">Generated files and recurring schedules</div></div></div>
          <Dropdown className="min-w-40" value={historyFilter} onChange={(event) => setHistoryFilter(event.target.value)} aria-label="Filter report history" options={["All Reports", "Ready", "Scheduled"].map((value) => ({ label: value, value }))} />
        </div>
        <div className="overflow-x-auto">
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
      footer={<><Button variant="outline" onClick={() => setSelectedTemplate(null)} disabled={generating}>Cancel</Button><Button onClick={generateReport} isLoading={generating} loadingText="Generating report...">{configuration.period === "Run Once" ? "Generate Report" : "Schedule Report"}</Button></>}
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
      footer={<><Button variant="outline" onClick={() => setDeletingReport(null)}>Cancel</Button><Button variant="danger" onClick={deleteGeneratedReport}>Remove Report</Button></>}
    >
      {deletingReport && <div className="rounded-2xl border border-red-100 bg-red-50 p-4"><div className="font-display text-lg font-bold text-red-700">{deletingReport.title}</div><div className="mt-1 text-xs text-red-600">{deletingReport.period} · {deletingReport.status}</div></div>}
    </Popup>
  </div>;
}
