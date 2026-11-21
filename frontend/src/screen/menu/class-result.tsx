import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button, ClassResultSkeleton, Dropdown, Input, PremiumPagination, useToast } from "../../components";
import Header from "../../ui/header";
import Popup from "../../ui/popup";
import { API_BASE, API_ENDPOINTS } from "../../api/endpoints";
import { get, post } from "../../api/methods";
import { getAuthUser } from "../../auth/session";
import { onClassResultChanged } from "../../api/socket";

type Subject = { name: string; score: number; total: number };
type ResultRecord = { admissionNo: string; name: string; subjects: Subject[] };
type Ranked = ResultRecord & { rank: number; obtained: number; maximum: number; percentage: number; grade: string; passed: boolean };
type Filter = "all" | "pass" | "fail";

const gradeScale = [
  { grade: "A+", min: 90, bar: "bg-emerald-500" },
  { grade: "A", min: 80, bar: "bg-teal-500" },
  { grade: "B+", min: 70, bar: "bg-blue-500" },
  { grade: "B", min: 60, bar: "bg-violet-500" },
  { grade: "C", min: 50, bar: "bg-amber-400" },
  { grade: "D", min: 35, bar: "bg-orange-500" },
  { grade: "F", min: 0, bar: "bg-red-500" },
];
const gradeFor = (percentage: number) => (gradeScale.find((item) => percentage >= item.min) ?? gradeScale[gradeScale.length - 1]).grade;
const gradeBar = (grade: string) => gradeScale.find((item) => item.grade === grade)?.bar ?? "bg-slate-400";
const initials = (name: string) => name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
const csvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
const escapeReportText = (value: string | number) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
const reportRemark = (record: Ranked) => record.percentage >= 90 ? "Outstanding academic performance. Keep pursuing excellence with the same dedication." : record.percentage >= 75 ? "Very good performance with consistent achievement across the curriculum." : record.percentage >= 60 ? "Good progress. Continued practice will help strengthen overall achievement." : record.passed ? "Satisfactory progress. Focused support in lower-scoring subjects is recommended." : "Additional academic support and focused revision are recommended before the next assessment.";

type IconType = "trophy" | "chart" | "publish" | "users" | "check" | "close" | "search" | "download" | "print" | "reset" | "eye" | "load";

function ResultIcon({ type, className = "size-5" }: { type: IconType; className?: string }) {
  const paths: Record<IconType, ReactNode> = {
    trophy: <><path d="M8 4h8v5a4 4 0 0 1-8 0V4ZM10 16h4M12 13v3M8 20h8" /><path d="M8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4" /></>,
    chart: <path d="M4 19V9M10 19V5M16 19v-7M22 19V3" />,
    publish: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M5 14v6h14v-6" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>,
    check: <path d="m5 12 5 5 9-10" />,
    close: <path d="M6 6l12 12M18 6 6 18" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    download: <path d="M12 3v13M7 11l5 5 5-5M4 21h16" />,
    print: <><path d="M7 9V3h10v6" /><rect x="4" y="9" width="16" height="8" rx="2" /><path d="M7 14h10v7H7z" /></>,
    reset: <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />,
    eye: <><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    load: <><path d="M12 3v12M7 10l5 5 5-5" /><path d="M4 19h16" /></>,
  };
  return <svg className={className} aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{paths[type]}</svg>;
}

function PanelHead({ icon, title, subtitle, action }: { icon: IconType; title: string; subtitle: string; action?: ReactNode }) {
  return <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5 border-b border-slate-100 px-3.5 py-3 max-sm:[&>:nth-child(2)]:w-full sm:px-5 sm:py-3.5">
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-(--app-accent-soft) text-(--app-accent-dark) ring-1 ring-(--app-accent)/20"><ResultIcon type={icon} /></span>
      <div className="min-w-0"><h2 className="font-display truncate text-sm font-bold tracking-tight text-slate-900">{title}</h2><p className="truncate text-xs text-slate-500">{subtitle}</p></div>
    </div>
    {action}
  </div>;
}

const resetClass = "border-rose-200! bg-linear-to-r! from-rose-50! to-orange-50! text-rose-600! shadow-sm hover:from-rose-100! hover:to-orange-100! active:scale-95";
const medal = ["from-amber-300 to-amber-500", "from-slate-300 to-slate-400", "from-orange-300 to-orange-500"];

export default function ClassResult() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [exams, setExams] = useState<{ id: number; name: string; session: string }[]>([]);
  const [classOptions, setClassOptions] = useState<string[]>([]);
  const [classSections, setClassSections] = useState<Record<string, string[]>>({});
  const [sectionOptions, setSectionOptions] = useState<string[]>([]);
  const [examId, setExamId] = useState<number | null>(null);
  const [exam, setExam] = useState("");
  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [loaded, setLoaded] = useState({ exam: "", className: "", section: "", examId: 0, session: "" });
  const [loading, setLoading] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Ranked | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [results, setResults] = useState<Ranked[]>([]);
  const { showToast } = useToast();

  const mapResults = (items: Array<{ admissionNo: string; studentName: string; subjects: Array<{ subject: string; maximumMarks: number; marksObtained: number | null }>; totalObtained: number; totalMaximum: number; overallPercentage: number; overallGrade: string; rank: number; passed: boolean }>): Ranked[] => items.map((item) => ({ admissionNo: item.admissionNo, name: item.studentName, subjects: item.subjects.map((subject) => ({ name: subject.subject, total: subject.maximumMarks, score: subject.marksObtained ?? 0 })), obtained: item.totalObtained, maximum: item.totalMaximum, percentage: Number(item.overallPercentage), grade: item.overallGrade, rank: item.rank, passed: item.passed }));
  const loadMetadata = async () => {
    const [examResponse, classResponse] = await Promise.all([
      get<{ data: { id: number; name: string; session: string }[] }>(`${API_BASE}${API_ENDPOINTS.EXAMS}?page=1&limit=100`, { cache: "no-store" }),
      get<{ name: string; sections?: string[] }[]>(`${API_BASE}${API_ENDPOINTS.CLASSES}`, { cache: "no-store" }),
    ]);
    const nextExams = examResponse.data ?? [];
    const nextClasses = classResponse ?? [];
    const firstExam = nextExams[0]; const firstClass = nextClasses[0];
    setExams(nextExams); setClassOptions(nextClasses.map((item) => item.name)); setClassSections(Object.fromEntries(nextClasses.map((item) => [item.name, item.sections ?? []]))); setSectionOptions(firstClass?.sections ?? []);
    setExamId(firstExam?.id ?? null); setExam(firstExam?.name ?? ""); setClassName(firstClass?.name ?? ""); setSection(firstClass?.sections?.[0] ?? "");
  };
  useEffect(() => { let active = true; void loadMetadata().catch((error) => showToast(error instanceof Error ? error.message : "Unable to load result filters.", { title: "Results unavailable", tone: "error" })).finally(() => { if (active) setInitialLoading(false); }); return () => { active = false; }; }, []);

  const stale = exam !== loaded.exam || className !== loaded.className || section !== loaded.section;

  const summary = useMemo(() => {
    const passed = results.filter((r) => r.passed).length;
    const average = results.reduce((sum, r) => sum + r.percentage, 0) / (results.length || 1);
    const distribution = gradeScale.map((item) => ({ ...item, count: results.filter((r) => r.grade === item.grade).length }));
    const subjectNames = [...new Set(results.flatMap((result) => result.subjects.map((subject) => subject.name)))];
    const subjectAverages = subjectNames.map((name) => ({ name, average: results.reduce((sum, r) => { const subject = r.subjects.find((s) => s.name === name); return sum + (subject ? (subject.score / subject.total) * 100 : 0); }, 0) / (results.length || 1) }));
    return { passed, failed: results.length - passed, average, distribution, subjectAverages, passRate: Math.round((passed / (results.length || 1)) * 100) };
  }, [results]);

  const topper: Ranked = results[0] ?? { admissionNo: "", name: "No result available", subjects: [], rank: 0, obtained: 0, maximum: 0, percentage: 0, grade: "-", passed: false };
  const maxCount = Math.max(1, ...summary.distribution.map((item) => item.count));
  const counts: Record<Filter, number> = { all: results.length, pass: summary.passed, fail: summary.failed };

  const rows = results.filter((r) => {
    const term = search.trim().toLowerCase();
    if (term && !`${r.name} ${r.admissionNo}`.toLowerCase().includes(term)) return false;
    return filter === "all" || (filter === "pass" ? r.passed : !r.passed);
  });
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paged = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const changeSelection = (setter: (value: string) => void) => (event: { target: { value: string } }) => setter(event.target.value);

  const loadResult = async () => {
    if (!examId || !className || !section) return;
    setLoading(true);
    try {
      let response = await get<Array<{ admissionNo: string; studentName: string; subjects: Array<{ subject: string; maximumMarks: number; marksObtained: number | null }>; totalObtained: number; totalMaximum: number; overallPercentage: number; overallGrade: string; rank: number; passed: boolean; published?: boolean }>>(`${API_BASE}${API_ENDPOINTS.CLASS_RESULTS}/exam/${examId}/class/${encodeURIComponent(className)}/section/${encodeURIComponent(section)}`, { cache: "no-store" });
      if (!response.length) {
        response = await post<typeof response>(`${API_BASE}${API_ENDPOINTS.CLASS_RESULTS}/generate`, { examId, className, section });
      }
      setLoaded({ exam, className, section, examId, session: exams.find((item) => item.id === examId)?.session ?? "" }); setResults(mapResults(response)); setPublished(response.length > 0 && response.every((item) => item.published)); setSearch(""); setFilter("all"); setCurrentPage(1);
      showToast(`${className}-${section} result loaded for ${exam}.`, { title: "Class result updated", tone: "info" });
    } catch (error) { setResults([]); showToast(error instanceof Error ? error.message : "Unable to load or generate result.", { title: "Result unavailable", tone: "error" }); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (examId && className && section) void loadResult(); }, [examId, className, section]);
  useEffect(() => onClassResultChanged(() => { if (examId && className && section) void loadResult(); }), [examId, className, section]);

  if (initialLoading) return <ClassResultSkeleton />;

  const publishResult = async () => {
    if (!loaded.examId) return;
    setPublishing(true);
    try { await post(`${API_BASE}${API_ENDPOINTS.CLASS_RESULTS}/publish`, { examId: loaded.examId, className: loaded.className, section: loaded.section, publishedBy: getAuthUser()?.username || "Administrator" }); setPublished(true); setPublishOpen(false); showToast(`${loaded.className}-${loaded.section} result is now visible to students and guardians.`, { title: "Result published successfully" }); }
    catch (error) { showToast(error instanceof Error ? error.message : "Unable to publish result.", { title: "Publish failed", tone: "error" }); }
    finally { setPublishing(false); }
  };

  const exportCsv = () => {
    const subjectNames = [...new Set(results.flatMap((result) => result.subjects.map((subject) => subject.name)))];
    const head = ["Rank", "Admission No", "Student", ...subjectNames, "Total", "Percentage", "Grade", "Result"].map(csvCell).join(",");
    const lines = results.map((r) => [r.rank, r.admissionNo, r.name, ...r.subjects.map((s) => s.score), `${r.obtained}/${r.maximum}`, `${r.percentage}%`, r.grade, r.passed ? "Passed" : "Failed"].map(csvCell).join(","));
    const url = URL.createObjectURL(new Blob([[head, ...lines].join("\n")], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url; link.download = `class-result-${loaded.className}-${loaded.section}.csv`.replace(/\s+/g, "-"); link.click();
    URL.revokeObjectURL(url);
    showToast("Class result exported to CSV.", { title: "Export ready" });
  };

  const printHtml = (title: string, body: string) => {
    const frame = document.createElement("iframe");
    frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
    document.body.appendChild(frame);
    const doc = frame.contentDocument;
    if (!doc || !frame.contentWindow) return;
    doc.open();
    doc.write(`<html><head><title>${title}</title><style>@page{size:A4;margin:12mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;margin:0;padding:24px;color:#0f172a;background:#fff}h1,h2,p{margin:0}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #cbd5e1;padding:8px;text-align:left;font-size:12px}th{background:#f1f5f9;font-size:10px;text-transform:uppercase;letter-spacing:.06em}.report-sheet{min-height:250mm;border:1px solid #cbd5e1;padding:18px;position:relative}.school-head{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #0f766e;padding-bottom:14px}.brand{display:flex;align-items:center;gap:12px}.brand-mark{display:grid;place-items:center;width:48px;height:48px;border-radius:12px;background:#0f766e;color:#fff;font-size:19px;font-weight:800}.school-name{font-size:23px;font-weight:800;color:#0f172a}.school-copy{margin-top:3px;font-size:10px;color:#64748b}.document-title{text-align:right}.document-title strong{display:block;font-size:15px;text-transform:uppercase;letter-spacing:.12em;color:#0f766e}.document-title span{display:block;margin-top:5px;font-size:10px;color:#64748b}.student-banner{display:flex;align-items:center;gap:14px;margin-top:16px;padding:14px;background:#f0fdfa;border:1px solid #99f6e4;border-radius:12px}.student-avatar{display:grid;place-items:center;width:48px;height:48px;border-radius:12px;background:#0f766e;color:#fff;font-weight:800}.student-name{font-size:17px;font-weight:800}.student-id{margin-top:4px;font-size:10px;color:#64748b}.result-stamp{margin-left:auto;border:2px solid #059669;border-radius:8px;padding:6px 10px;color:#047857;font-size:11px;font-weight:800;text-transform:uppercase;transform:rotate(-2deg)}.result-stamp.fail{border-color:#e11d48;color:#be123c}.meta-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px}.meta-item{border:1px solid #e2e8f0;border-radius:8px;padding:9px}.meta-item span{display:block;font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8}.meta-item strong{display:block;margin-top:4px;font-size:10px}.marks-table th{text-align:center;background:#0f766e;color:#fff;border-color:#0f766e}.marks-table td{text-align:center}.marks-table td:first-child{text-align:left;font-weight:700}.summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px}.summary-item{text-align:center;border:1px solid #cbd5e1;border-radius:9px;padding:10px;background:#f8fafc}.summary-item strong{display:block;font-size:16px}.summary-item span{display:block;margin-top:4px;font-size:8px;text-transform:uppercase;letter-spacing:.08em;color:#64748b}.remarks{margin-top:12px;border-left:4px solid #0f766e;background:#f8fafc;padding:10px 12px;font-size:10px;line-height:1.5}.signatures{display:grid;grid-template-columns:repeat(3,1fr);gap:32px;margin-top:54px;text-align:center}.signature{border-top:1px solid #64748b;padding-top:6px;font-size:9px;font-weight:700}.document-foot{position:absolute;right:18px;bottom:12px;left:18px;border-top:1px solid #e2e8f0;padding-top:7px;text-align:center;font-size:8px;color:#94a3b8}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.report-sheet{border:0}}</style></head><body>${body}</body></html>`);
    doc.close();
    window.setTimeout(() => { frame.contentWindow?.print(); window.setTimeout(() => frame.remove(), 1000); }, 250);
  };

  const printResult = () => printHtml("Class Result", `<h2>${loaded.exam} - Class Result</h2><p>${loaded.className}-${loaded.section} · Average ${summary.average.toFixed(1)}% · Pass rate ${summary.passRate}%</p><table><thead><tr><th>Rank</th><th>Admission No.</th><th>Student</th><th>Total</th><th>%</th><th>Grade</th><th>Result</th></tr></thead><tbody>${results.map((r) => `<tr><td>${r.rank}</td><td>${r.admissionNo}</td><td>${r.name}</td><td>${r.obtained}/${r.maximum}</td><td>${r.percentage}%</td><td>${r.grade}</td><td>${r.passed ? "Passed" : "Failed"}</td></tr>`).join("")}</tbody></table>`);
  const printReportCard = (record: Ranked) => {
    const remarks = reportRemark(record);
    printHtml("Student Report Card", `<article class="report-sheet"><header class="school-head"><div class="brand"><div class="brand-mark">PI</div><div><div class="school-name">PAL IT HUB</div><div class="school-copy">12 Knowledge Park, Lucknow, Uttar Pradesh · www.pal.education</div></div></div><div class="document-title"><strong>Academic Report Card</strong><span>Session ${escapeReportText(loaded.session)}</span></div></header><section class="student-banner"><div class="student-avatar">${escapeReportText(initials(record.name))}</div><div><div class="student-name">${escapeReportText(record.name)}</div><div class="student-id">${escapeReportText(record.admissionNo)}</div></div><div class="result-stamp ${record.passed ? "" : "fail"}">${record.passed ? "Promoted" : "Needs Improvement"}</div></section><section class="meta-grid"><div class="meta-item"><span>Examination</span><strong>${escapeReportText(loaded.exam)}</strong></div><div class="meta-item"><span>Class & Section</span><strong>${escapeReportText(`${loaded.className}-${loaded.section}`)}</strong></div><div class="meta-item"><span>Academic Session</span><strong>${escapeReportText(loaded.session)}</strong></div><div class="meta-item"><span>Admission Number</span><strong>${escapeReportText(record.admissionNo)}</strong></div></section><table class="marks-table"><thead><tr><th>Subject</th><th>Maximum</th><th>Obtained</th><th>Percentage</th><th>Grade</th><th>Status</th></tr></thead><tbody>${record.subjects.map((subject) => { const percentage = (subject.score / subject.total) * 100; const pass = percentage >= 35; return `<tr><td>${escapeReportText(subject.name)}</td><td>${subject.total}</td><td><strong>${subject.score}</strong></td><td>${percentage.toFixed(0)}%</td><td><strong>${gradeFor(percentage)}</strong></td><td>${pass ? "Pass" : "Fail"}</td></tr>`; }).join("")}</tbody></table><section class="summary-grid"><div class="summary-item"><strong>${record.obtained}/${record.maximum}</strong><span>Total Marks</span></div><div class="summary-item"><strong>${record.percentage}%</strong><span>Percentage</span></div><div class="summary-item"><strong>${record.grade}</strong><span>Overall Grade</span></div><div class="summary-item"><strong>#${record.rank}</strong><span>Class Rank</span></div></section><div class="remarks"><strong>Class Teacher's Remarks:</strong> ${escapeReportText(remarks)}</div><section class="signatures"><div class="signature">Class Teacher</div><div class="signature">Parent / Guardian</div><div class="signature">Principal</div></section><footer class="document-foot">Computer-generated academic report · PAL IT HUB School Management System</footer></article>`);
  };

  const stats: { label: string; value: string; copy: string; tone: string; icon: IconType }[] = [
    { label: "Total Students", value: String(results.length), tone: "teal", copy: `${loaded.className}-${loaded.section}`, icon: "users" },
    { label: "Class Average", value: `${summary.average.toFixed(1)}%`, tone: "green", copy: "Overall performance", icon: "chart" },
    { label: "Passed / Failed", value: `${summary.passed} / ${summary.failed}`, tone: "amber", copy: `${summary.passRate}% pass rate`, icon: "check" },
    { label: "Highest Score", value: `${topper.percentage}%`, tone: "violet", copy: topper.name, icon: "trophy" },
  ];

  return <div className="class-result-screen min-h-screen dashboard-bg pb-16">
    <Header title="Class Result" subtitle="Analyze performance, review rankings, and publish examination results" />
    <main className="mx-auto w-full min-w-0 max-w-none space-y-4 p-3 sm:space-y-5 sm:p-6 xl:p-8">
      <section className="class-result-command-hero relative overflow-hidden rounded-3xl p-5 text-white sm:p-7">
        <span className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full border border-white/10 bg-white/10" />
        <span className="pointer-events-none absolute -bottom-28 left-1/3 size-60 rounded-full bg-white/5" />
        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-white/80"><ResultIcon type="chart" className="size-4" />Performance command center</div>
            <div className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/60">{loaded.className}-{loaded.section} · {published ? "Published result" : "Draft result"}</div>
            <h1 className="mt-1 max-w-2xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{loaded.exam}</h1>
            <p className="mt-2 max-w-xl text-xs leading-5 text-white/70 sm:text-sm sm:leading-6">Review rankings, subject performance, grade distribution, and publication readiness from one clear results workspace.</p>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:flex">
              <Button variant="outline" onClick={exportCsv} icon={<ResultIcon type="download" className="size-4" />} className="w-full !min-h-11 !border-white/15 !bg-white/10 text-white !shadow-none hover:!bg-white/20 sm:w-auto">Export CSV</Button>
              <Button onClick={() => setPublishOpen(true)} disabled={published || stale} icon={<ResultIcon type="publish" className="size-4" />} className="w-full !min-h-11 !bg-white !text-(--app-accent-dark) shadow-xl hover:!bg-white/90 disabled:!bg-white/40 sm:w-auto">{published ? "Published" : "Publish Result"}</Button>
            </div>
          </div>
          <div className="class-result-topper-card rounded-2xl border border-white/15 bg-white/10 p-4 shadow-xl backdrop-blur-sm sm:p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-linear-to-br from-amber-300 to-amber-500 text-slate-900 shadow-lg"><ResultIcon type="trophy" /></span>
              <div className="min-w-0 flex-1"><div className="text-[0.62rem] font-bold uppercase tracking-widest text-white/60">Class topper</div><div className="mt-1 truncate font-display text-lg font-bold">{topper.name}</div><div className="truncate text-xs text-white/65">{topper.admissionNo}</div></div>
              <div className="text-right"><div className="font-display text-3xl font-extrabold">#1</div><div className="text-[0.58rem] uppercase tracking-wider text-white/55">Rank</div></div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">{[["Marks", `${topper.obtained}/${topper.maximum}`], ["Score", `${topper.percentage}%`], ["Grade", topper.grade]].map(([label, value]) => <div key={label} className="rounded-xl bg-white/8 p-2.5 text-center ring-1 ring-white/10"><div className="font-display text-sm font-bold">{value}</div><div className="mt-1 text-[0.55rem] font-bold uppercase tracking-wider text-white/55">{label}</div></div>)}</div>
            {results.length > 2 && <div className="mt-3 grid grid-cols-2 gap-2">{results.slice(1, 3).map((record, index) => <button key={record.admissionNo} type="button" onClick={() => setSelectedRecord(record)} className="flex min-w-0 items-center gap-2 rounded-xl bg-white/8 p-2 text-left ring-1 ring-white/10 transition hover:bg-white/15"><span className={`grid size-7 shrink-0 place-items-center rounded-lg bg-linear-to-br text-[0.65rem] font-bold text-slate-900 ${medal[index + 1]}`}>#{record.rank}</span><span className="min-w-0"><span className="block truncate text-xs font-bold">{record.name}</span><span className="text-[0.62rem] text-white/60">{record.percentage}%</span></span></button>)}</div>}
          </div>
        </div>
      </section>

      <section className="class-result-filter-panel panel overflow-hidden">
        <PanelHead icon="chart" title="Result Filters" subtitle="Pick the exam and class to analyse" action={<span className={stale ? "status-warning" : published ? "status-success" : "status-warning"}>{stale ? "Selection changed" : published ? "Published" : "Draft Result"}</span>} />
        <div className="grid grid-cols-2 items-end gap-x-3 gap-y-3.5 p-3.5 sm:gap-x-4 sm:p-5 md:grid-cols-4 xl:grid-cols-[1.3fr_1fr_.7fr_auto] [&>:first-child]:col-span-2 xl:[&>:first-child]:col-span-1 md:[&>:first-child]:col-span-2 [&>:last-child]:col-span-2 md:[&>:last-child]:col-span-4 xl:[&>:last-child]:col-span-1">
          <Dropdown label="Examination" value={String(examId ?? "")} onChange={(event) => { const selected = exams.find((item) => item.id === Number(event.target.value)); setExamId(selected?.id ?? null); setExam(selected?.name ?? ""); }} options={exams.map((value) => ({ label: `${value.name} (${value.session})`, value: String(value.id) }))} />
          <Dropdown label="Class" value={className} onChange={(event) => { const selected = event.target.value; setClassName(selected); const nextSections = classSections[selected] ?? []; setSectionOptions(nextSections); setSection(nextSections[0] ?? ""); }} options={classOptions.map((value) => ({ label: value, value }))} />
          <Dropdown label="Section" value={section} onChange={changeSelection(setSection)} options={sectionOptions.map((value) => ({ label: value, value }))} />
          <Button onClick={loadResult} isLoading={loading} loadingText="Loading result..." icon={<ResultIcon type="load" className="size-4" />}>View Result</Button>
        </div>
      </section>

      <section className="grid auto-rows-fr grid-cols-[repeat(2,minmax(0,1fr))] gap-2.5 sm:gap-3 xl:grid-cols-[repeat(4,minmax(0,1fr))] [&>article]:h-full">
        {stats.map((stat) => <article key={stat.label} className={`admission-summary-card admission-summary-${stat.tone} relative overflow-hidden rounded-2xl p-3 shadow-sm sm:p-5`}>
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="min-w-0"><div className="truncate text-[0.7rem] font-semibold text-slate-500 sm:text-xs">{stat.label}</div><div className="font-display mt-1 truncate text-xl font-bold text-slate-950 sm:text-2xl">{stat.value}</div></div>
            <span className="admission-summary-icon grid size-8 shrink-0 place-items-center rounded-xl sm:size-10"><ResultIcon type={stat.icon} className="size-4 sm:size-5" /></span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[0.7rem] font-medium text-slate-500 sm:mt-3 sm:text-xs"><span className="size-1.5 shrink-0 rounded-full bg-current opacity-50" /><span className="truncate">{stat.copy}</span></div>
        </article>)}
      </section>

      <div className="grid items-start gap-4 sm:gap-5 xl:grid-cols-[1fr_1.15fr]">
        <section className="class-result-analysis-panel panel overflow-hidden">
          <PanelHead icon="chart" title="Subject Performance" subtitle="Class average per subject" />
          <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
              {summary.subjectAverages.map((item) => <div key={item.name} className="class-result-analysis-item rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <div className="mb-1.5 flex items-center justify-between text-xs"><span className="font-semibold text-slate-600">{item.name}</span><strong className="text-slate-800">{item.average.toFixed(1)}%</strong></div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${gradeBar(gradeFor(item.average))} transition-all`} style={{ width: `${item.average}%` }} /></div>
              </div>)}
          </div>
        </section>

        <section className="class-result-analysis-panel panel overflow-hidden">
          <PanelHead icon="chart" title="Grade Distribution" subtitle="Students grouped by final grade" />
          <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
            {summary.distribution.map((item) => <div key={item.grade} className="class-result-analysis-item flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
              <span className={`grid size-8 shrink-0 place-items-center rounded-lg text-xs font-bold text-white ${item.bar}`}>{item.grade}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between text-xs"><span className="text-slate-500">{item.min}%+</span><strong className="text-slate-800">{item.count} student{item.count === 1 ? "" : "s"}</strong></div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${item.bar} transition-all`} style={{ width: `${(item.count / maxCount) * 100}%` }} /></div>
              </div>
            </div>)}
          </div>
        </section>
      </div>

      <section className="class-result-students-panel panel overflow-hidden">
        <PanelHead icon="users" title="Student Results" subtitle={`${loaded.exam} · ${loaded.className}-${loaded.section}`} action={
          <div className="flex flex-wrap gap-2 max-sm:grid max-sm:grid-cols-2 max-sm:[&>*]:min-w-0 max-sm:[&>:last-child]:col-span-2">
            <Button variant="outline" className="min-h-9 px-3 py-2" onClick={printResult} icon={<ResultIcon type="print" className="size-4" />}>Print</Button>
            <Button variant="outline" className="min-h-9 px-3 py-2" onClick={exportCsv} icon={<ResultIcon type="download" className="size-4" />}>Export</Button>
            <Button onClick={() => setPublishOpen(true)} disabled={published || stale} icon={<ResultIcon type="publish" className="size-4" />}>{published ? "Published" : "Publish Result"}</Button>
          </div>
        } />

        <div className="space-y-3 border-b border-slate-100 p-3.5 sm:p-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2.5 sm:gap-3">
            <Input value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }} placeholder="Search student or admission no..." aria-label="Search students" startIcon={<ResultIcon type="search" className="size-4" />} />
            <Button variant="outline" onClick={() => { setSearch(""); setFilter("all"); setCurrentPage(1); }} disabled={!search && filter === "all"} icon={<ResultIcon type="reset" className="size-4" />} className={`class-result-reset ${resetClass}`}>Reset</Button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {([["all", "All"], ["pass", "Passed"], ["fail", "Failed"]] as [Filter, string][]).map(([value, label]) => {
              const on = filter === value;
              return <button key={value} type="button" onClick={() => { setFilter(value); setCurrentPage(1); }} className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition active:scale-95 ${on ? "border-transparent bg-(--app-accent-dark) text-white shadow-md" : "border-slate-200 bg-white text-slate-600 hover:border-(--app-accent)/40 hover:bg-(--app-accent-faint)"}`}>{label}<span className={`rounded-full px-1.5 py-0.5 text-[0.65rem] ${on ? "bg-white/25" : "bg-slate-100 text-slate-500"}`}>{counts[value]}</span></button>;
            })}
          </div>
        </div>

        {paged.length ? <ul className="divide-y divide-slate-100">
          {paged.map((r) => <li key={r.admissionNo} className="class-result-row class-result-premium-row grid gap-3 p-3.5 transition hover:bg-slate-50/60 sm:p-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto] lg:items-center lg:gap-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className={`grid size-10 shrink-0 place-items-center rounded-xl font-display text-xs font-bold ${r.rank <= 3 ? `bg-linear-to-br text-slate-900 shadow-sm ${medal[r.rank - 1]}` : "bg-slate-100 text-slate-500"}`}>#{r.rank}</span>
              <div className="min-w-0 flex-1"><h3 className="font-display truncate text-sm font-bold text-slate-900">{r.name}</h3><p className="truncate text-xs text-slate-500">{r.admissionNo}</p></div>
              <span className={`${r.passed ? "status-success" : "status-danger"} lg:hidden`}>{r.passed ? "Passed" : "Failed"}</span>
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs"><span className="font-semibold text-slate-700">{r.obtained} / {r.maximum}</span><strong className="font-display text-slate-900">{r.percentage}%</strong></div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${gradeBar(r.grade)}`} style={{ width: `${r.percentage}%` }} /></div>
            </div>
            <div className="flex items-center gap-2.5 max-lg:justify-between">
              <div className="flex items-center gap-2"><span className={`grid size-8 place-items-center rounded-lg text-xs font-bold text-white ${gradeBar(r.grade)}`}>{r.grade}</span><span className={`${r.passed ? "status-success" : "status-danger"} max-lg:hidden`}>{r.passed ? "Passed" : "Failed"}</span></div>
              <Button variant="outline" className="min-h-8 px-3 py-1.5 text-xs" onClick={() => setSelectedRecord(r)} icon={<ResultIcon type="eye" className="size-3.5" />}>Report Card</Button>
            </div>
          </li>)}
        </ul> : <div className="grid min-h-48 place-items-center p-6 text-center"><div><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-(--app-accent-soft) text-(--app-accent-dark)"><ResultIcon type="search" /></div><h3 className="font-display mt-3 text-sm font-bold text-slate-700">No students match</h3><p className="mt-1 text-xs text-slate-400">Try another search or filter.</p></div></div>}

        <div className="class-result-footer border-t border-slate-100 bg-slate-50/60 px-3.5 py-3 sm:px-5">
          <PremiumPagination currentPage={safePage} totalPages={totalPages} totalRecords={rows.length} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={(size: number) => { setPageSize(size); setCurrentPage(1); }} wideLayout />
          <p className="mt-2 text-center text-[0.7rem] text-slate-400 sm:text-left">Pass requirement: 35% in every subject</p>
        </div>
      </section>
    </main>

    <Popup
      open={publishOpen}
      onClose={() => !publishing && setPublishOpen(false)}
      title="Publish Class Result"
      description="Make this result visible to students and guardians."
      footer={<><Button variant="outline" onClick={() => setPublishOpen(false)} disabled={publishing}>Cancel</Button><Button onClick={publishResult} isLoading={publishing} loadingText="Publishing result..." icon={<ResultIcon type="publish" className="size-4" />}>Confirm & Publish</Button></>}
    >
      <div className="space-y-4">
        <div className="class-result-publish-summary rounded-2xl border border-violet-100 bg-violet-50 p-4"><div className="font-display text-lg font-bold text-violet-800">{loaded.exam}</div><div className="mt-1 text-xs text-violet-600">{loaded.className}-{loaded.section} · {results.length} student results · {summary.passRate}% pass rate</div></div>
        <p className="text-xs leading-5 text-slate-500">Once published, students and guardians can view report cards. You can update marks and republish later if corrections are required.</p>
      </div>
    </Popup>

    <Popup
      open={Boolean(selectedRecord)}
      onClose={() => setSelectedRecord(null)}
      title="Student Report Card"
      description={`${selectedRecord?.name ?? ""} · ${loaded.exam}`}
      panelClassName="sm:max-w-4xl"
      bodyClassName="report-card-modal-body sm:!px-7 sm:!py-6"
      footer={<><Button variant="outline" onClick={() => setSelectedRecord(null)}>Close</Button>{selectedRecord && <Button onClick={() => printReportCard(selectedRecord)} icon={<ResultIcon type="print" className="size-4" />}>Print Report Card</Button>}</>}
    >
      {selectedRecord && <article className="professional-report-card overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <header className="report-card-school-head flex flex-col gap-4 border-b-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-center gap-3">
            <span className="font-display grid size-12 shrink-0 place-items-center rounded-2xl bg-(--app-accent-dark) text-base font-extrabold text-white shadow-lg">PI</span>
            <div><div className="font-display text-xl font-extrabold tracking-tight text-slate-950">PAL IT HUB</div><div className="mt-0.5 text-[0.65rem] text-slate-500">12 Knowledge Park, Lucknow · www.pal.education</div></div>
          </div>
          <div className="sm:text-right"><div className="font-display text-sm font-extrabold uppercase tracking-[0.15em] text-(--app-accent-dark)">Academic Report Card</div><div className="mt-1 text-[0.65rem] font-semibold text-slate-400">Academic Session {loaded.session}</div></div>
        </header>

        <div className="p-4 sm:p-5">
          <section className="report-card-student flex items-center gap-3 rounded-2xl border p-3 sm:gap-4 sm:p-4">
            <div className="font-display grid size-12 shrink-0 place-items-center rounded-2xl bg-(--app-accent-dark) text-base font-bold text-white sm:size-14 sm:text-lg">{initials(selectedRecord.name)}</div>
            <div className="min-w-0 flex-1"><h3 className="font-display truncate text-base font-extrabold text-slate-950 sm:text-lg">{selectedRecord.name}</h3><p className="mt-0.5 truncate text-xs text-slate-500">{selectedRecord.admissionNo}</p></div>
            <span className={`report-card-result-stamp shrink-0 rounded-lg border-2 px-2.5 py-1.5 text-[0.6rem] font-extrabold uppercase tracking-wider sm:px-3 sm:text-xs ${selectedRecord.passed ? "border-emerald-500 text-emerald-700" : "border-rose-500 text-rose-700"}`}>{selectedRecord.passed ? "Promoted" : "Needs Improvement"}</span>
          </section>

          <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{[["Examination", loaded.exam], ["Class & Section", `${loaded.className}-${loaded.section}`], ["Academic Session", loaded.session], ["Admission Number", selectedRecord.admissionNo]].map(([label, value]) => <div key={label} className="report-card-meta rounded-xl border border-slate-100 p-2.5 sm:p-3"><dt className="text-[0.55rem] font-bold uppercase tracking-wider text-slate-400">{label}</dt><dd className="mt-1 truncate text-xs font-bold text-slate-800" title={value}>{value}</dd></div>)}</dl>

          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="report-card-marks w-full min-w-[38rem] text-xs">
              <thead><tr><th>Subject</th><th>Maximum</th><th>Obtained</th><th>Percentage</th><th>Grade</th><th>Status</th></tr></thead>
              <tbody>{selectedRecord.subjects.map((subject) => {
                const percentage = (subject.score / subject.total) * 100;
                const pass = percentage >= 35;
                return <tr key={subject.name}><td>{subject.name}</td><td>{subject.total}</td><td className="font-bold">{subject.score}</td><td>{percentage.toFixed(0)}%</td><td><span className={`inline-grid size-7 place-items-center rounded-lg text-[0.65rem] font-bold text-white ${gradeBar(gradeFor(percentage))}`}>{gradeFor(percentage)}</span></td><td><span className={pass ? "status-success" : "status-danger"}>{pass ? "Pass" : "Fail"}</span></td></tr>;
              })}</tbody>
            </table>
          </div>

          <section className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{[["Total Marks", `${selectedRecord.obtained}/${selectedRecord.maximum}`], ["Percentage", `${selectedRecord.percentage}%`], ["Overall Grade", selectedRecord.grade], ["Class Rank", `#${selectedRecord.rank}`]].map(([label, value]) => <div key={label} className="report-card-summary rounded-xl border border-slate-100 p-3 text-center"><div className="font-display text-base font-extrabold text-slate-950">{value}</div><div className="mt-1 text-[0.55rem] font-bold uppercase tracking-wider text-slate-400">{label}</div></div>)}</section>

          <div className="report-card-remarks mt-4 rounded-r-xl border-l-4 p-3 text-xs leading-5 text-slate-600"><strong className="text-slate-800">Class Teacher’s Remarks:</strong> {reportRemark(selectedRecord)}</div>

          <section className="mt-10 grid grid-cols-3 gap-5 text-center sm:mt-12 sm:gap-10">{["Class Teacher", "Parent / Guardian", "Principal"].map((label) => <div key={label} className="border-t border-slate-400 pt-2 text-[0.6rem] font-bold text-slate-500 sm:text-xs">{label}</div>)}</section>
        </div>
        <footer className="border-t border-slate-100 px-4 py-2.5 text-center text-[0.58rem] text-slate-400">Computer-generated academic report · PAL IT HUB School Management System</footer>
      </article>}
    </Popup>
  </div>;
}
