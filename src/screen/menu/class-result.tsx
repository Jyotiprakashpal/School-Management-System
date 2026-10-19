import { useMemo, useState, type ReactNode } from "react";
import { Button, Dropdown, Input, PremiumPagination, useToast } from "../../components";
import Header from "../../ui/header";
import Popup from "../../ui/popup";

type Subject = { name: string; score: number; total: number };
type ResultRecord = { admissionNo: string; name: string; subjects: Subject[] };
type Ranked = ResultRecord & { rank: number; obtained: number; maximum: number; percentage: number; grade: string; passed: boolean };
type Filter = "all" | "pass" | "fail";

const examOptions = ["Half Yearly Examination", "Unit Test 2", "Annual Examination"];
const classOptions = ["Class 8", "Class 9", "Class 10"];
const sectionOptions = ["A", "B", "C"];
const subjectNames = ["English", "Mathematics", "Science", "Social Studies", "Hindi", "Computer"];
const firstNames = ["Anaya", "Rahul", "Ravi", "Sara", "Kabir", "Vihaan", "Diya", "Arjun", "Meera", "Aarav", "Sneha", "Mohit"];
const lastNames = ["Patel", "Kumar", "Singh", "Mehta", "Sharma", "Verma", "Gupta", "Yadav"];

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

const buildResults = (exam: string, className: string, section: string): Ranked[] => {
  const seed = classOptions.indexOf(className) * 7 + sectionOptions.indexOf(section) * 3 + examOptions.indexOf(exam) * 5;
  const records: ResultRecord[] = Array.from({ length: 9 + (seed % 3) }, (_, index) => {
    const base = 94 - index * 6 - ((index * seed) % 4);
    const weak = index === 7;
    return {
      admissionNo: `ADM-26-${1001 + classOptions.indexOf(className) * 200 + sectionOptions.indexOf(section) * 60 + index * 7}`,
      name: `${firstNames[(index * 5 + seed) % firstNames.length]} ${lastNames[(index * 3 + seed) % lastNames.length]}`,
      subjects: subjectNames.map((name, s) => ({ name, total: 100, score: Math.max(12, Math.min(99, (weak && s === 1 ? 28 : base) + ((s * 3 + index + seed) % 7) - 3)) })),
    };
  });
  return records
    .map((record) => {
      const obtained = record.subjects.reduce((sum, s) => sum + s.score, 0);
      const maximum = record.subjects.reduce((sum, s) => sum + s.total, 0);
      const percentage = Number(((obtained / maximum) * 100).toFixed(1));
      return { ...record, rank: 0, obtained, maximum, percentage, grade: gradeFor(percentage), passed: record.subjects.every((s) => s.score >= s.total * 0.35) };
    })
    .sort((a, b) => b.percentage - a.percentage)
    .map((record, index) => ({ ...record, rank: index + 1 }));
};

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
  const [exam, setExam] = useState("Half Yearly Examination");
  const [className, setClassName] = useState("Class 10");
  const [section, setSection] = useState("A");
  const [loaded, setLoaded] = useState({ exam: "Half Yearly Examination", className: "Class 10", section: "A" });
  const [loading, setLoading] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Ranked | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const { showToast } = useToast();

  const stale = exam !== loaded.exam || className !== loaded.className || section !== loaded.section;
  const results = useMemo(() => buildResults(loaded.exam, loaded.className, loaded.section), [loaded]);

  const summary = useMemo(() => {
    const passed = results.filter((r) => r.passed).length;
    const average = results.reduce((sum, r) => sum + r.percentage, 0) / (results.length || 1);
    const distribution = gradeScale.map((item) => ({ ...item, count: results.filter((r) => r.grade === item.grade).length }));
    const subjectAverages = subjectNames.map((name) => ({ name, average: results.reduce((sum, r) => sum + (r.subjects.find((s) => s.name === name)?.score ?? 0), 0) / (results.length || 1) }));
    return { passed, failed: results.length - passed, average, distribution, subjectAverages, passRate: Math.round((passed / (results.length || 1)) * 100) };
  }, [results]);

  const topper = results[0];
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
    setLoading(true);
    await new Promise((resolve) => window.setTimeout(resolve, 650));
    setLoaded({ exam, className, section });
    setPublished(false);
    setSearch("");
    setFilter("all");
    setCurrentPage(1);
    setLoading(false);
    showToast(`${className}-${section} result loaded for ${exam}.`, { title: "Class result updated", tone: "info" });
  };

  const publishResult = async () => {
    setPublishing(true);
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    setPublishing(false);
    setPublishOpen(false);
    setPublished(true);
    showToast(`${loaded.className}-${loaded.section} result is now visible to students and guardians.`, { title: "Result published successfully" });
  };

  const exportCsv = () => {
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
    doc.write(`<html><head><title>${title}</title><style>body{font-family:sans-serif;padding:24px;color:#0f172a}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #cbd5e1;padding:8px;text-align:left;font-size:13px}th{background:#f1f5f9}</style></head><body>${body}</body></html>`);
    doc.close();
    window.setTimeout(() => { frame.contentWindow?.print(); window.setTimeout(() => frame.remove(), 1000); }, 250);
  };

  const printResult = () => printHtml("Class Result", `<h2>${loaded.exam} - Class Result</h2><p>${loaded.className}-${loaded.section} · Average ${summary.average.toFixed(1)}% · Pass rate ${summary.passRate}%</p><table><thead><tr><th>Rank</th><th>Admission No.</th><th>Student</th><th>Total</th><th>%</th><th>Grade</th><th>Result</th></tr></thead><tbody>${results.map((r) => `<tr><td>${r.rank}</td><td>${r.admissionNo}</td><td>${r.name}</td><td>${r.obtained}/${r.maximum}</td><td>${r.percentage}%</td><td>${r.grade}</td><td>${r.passed ? "Passed" : "Failed"}</td></tr>`).join("")}</tbody></table>`);
  const printReportCard = (r: Ranked) => printHtml("Report Card", `<h2>${r.name} - Report Card</h2><p>${r.admissionNo} · ${loaded.className}-${loaded.section} · ${loaded.exam}</p><table><thead><tr><th>Subject</th><th>Marks</th><th>Result</th></tr></thead><tbody>${r.subjects.map((s) => `<tr><td>${s.name}</td><td>${s.score}/${s.total}</td><td>${s.score >= s.total * 0.35 ? "Pass" : "Fail"}</td></tr>`).join("")}</tbody></table><p><strong>Total ${r.obtained}/${r.maximum} · ${r.percentage}% · Grade ${r.grade} · Rank #${r.rank} · ${r.passed ? "Passed" : "Failed"}</strong></p>`);

  const stats: { label: string; value: string; copy: string; tone: string; icon: IconType }[] = [
    { label: "Total Students", value: String(results.length), tone: "teal", copy: `${loaded.className}-${loaded.section}`, icon: "users" },
    { label: "Class Average", value: `${summary.average.toFixed(1)}%`, tone: "green", copy: "Overall performance", icon: "chart" },
    { label: "Passed / Failed", value: `${summary.passed} / ${summary.failed}`, tone: "amber", copy: `${summary.passRate}% pass rate`, icon: "check" },
    { label: "Highest Score", value: `${topper.percentage}%`, tone: "violet", copy: topper.name, icon: "trophy" },
  ];

  return <div className="min-h-screen dashboard-bg pb-16">
    <Header title="Class Result" subtitle="Analyze performance, review rankings, and publish examination results" />
    <main className="space-y-4 p-3 sm:space-y-5 sm:p-6 xl:p-8">
      <section className="panel overflow-hidden">
        <PanelHead icon="chart" title="Result Filters" subtitle="Pick the exam and class to analyse" action={<span className={stale ? "status-warning" : published ? "status-success" : "status-warning"}>{stale ? "Selection changed" : published ? "Published" : "Draft Result"}</span>} />
        <div className="grid grid-cols-2 items-end gap-x-3 gap-y-3.5 p-3.5 sm:gap-x-4 sm:p-5 md:grid-cols-4 xl:grid-cols-[1.3fr_1fr_.7fr_auto] [&>:first-child]:col-span-2 xl:[&>:first-child]:col-span-1 md:[&>:first-child]:col-span-2 [&>:last-child]:col-span-2 md:[&>:last-child]:col-span-4 xl:[&>:last-child]:col-span-1">
          <Dropdown label="Examination" value={exam} onChange={changeSelection(setExam)} options={examOptions.map((value) => ({ label: value, value }))} />
          <Dropdown label="Class" value={className} onChange={changeSelection(setClassName)} options={classOptions.map((value) => ({ label: value, value }))} />
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

      <div className="grid items-start gap-4 sm:gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <div className="space-y-4 sm:space-y-5">
          <section className="relative overflow-hidden rounded-2xl bg-[linear-gradient(135deg,var(--app-sidebar-start),var(--app-accent-dark)_60%,var(--app-accent))] p-4 text-white shadow-lg sm:p-5">
            <div className="pointer-events-none absolute -right-10 -top-12 size-44 rounded-full bg-white/10" aria-hidden="true" />
            <div className="relative flex items-center gap-3 sm:gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25 sm:size-14"><ResultIcon type="trophy" className="size-6" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-[0.65rem] font-bold uppercase tracking-widest text-white/70">Class topper</p>
                <h2 className="font-display truncate text-lg font-bold sm:text-xl">{topper.name}</h2>
                <p className="truncate text-xs text-white/80">{topper.admissionNo} · {topper.percentage}% · Grade {topper.grade}</p>
              </div>
              <div className="shrink-0 text-right"><div className="font-display text-3xl font-bold">#1</div><div className="text-[0.62rem] text-white/70">Class Rank</div></div>
            </div>
            <div className="relative mt-4 grid grid-cols-3 gap-2 sm:gap-3">
              {[["Marks", `${topper.obtained}/${topper.maximum}`], ["Percentage", `${topper.percentage}%`], ["Grade", topper.grade]].map(([label, value]) => <div key={label} className="rounded-xl bg-white/12 p-2.5 text-center ring-1 ring-white/15 sm:p-3"><div className="font-display text-sm font-bold sm:text-lg">{value}</div><div className="mt-0.5 text-[0.6rem] uppercase tracking-wider text-white/70">{label}</div></div>)}
            </div>
            {results.length > 2 && <div className="relative mt-3 grid grid-cols-2 gap-2 sm:gap-3">{results.slice(1, 3).map((r, i) => <button key={r.admissionNo} type="button" onClick={() => setSelectedRecord(r)} className="flex min-w-0 items-center gap-2.5 rounded-xl bg-white/10 p-2.5 text-left ring-1 ring-white/15 transition hover:bg-white/20 active:scale-[.98]"><span className={`grid size-8 shrink-0 place-items-center rounded-lg bg-linear-to-br text-xs font-bold text-slate-900 ${medal[i + 1]}`}>#{r.rank}</span><span className="min-w-0"><span className="block truncate text-xs font-bold">{r.name}</span><span className="block text-[0.65rem] text-white/70">{r.percentage}%</span></span></button>)}</div>}
          </section>

          <section className="panel overflow-hidden">
            <PanelHead icon="chart" title="Subject Performance" subtitle="Class average per subject" />
            <div className="grid gap-3.5 p-4 sm:grid-cols-2 sm:gap-x-6 sm:p-5">
              {summary.subjectAverages.map((item) => <div key={item.name}>
                <div className="mb-1.5 flex items-center justify-between text-xs"><span className="font-semibold text-slate-600">{item.name}</span><strong className="text-slate-800">{item.average.toFixed(1)}%</strong></div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${gradeBar(gradeFor(item.average))} transition-all`} style={{ width: `${item.average}%` }} /></div>
              </div>)}
            </div>
          </section>
        </div>

        <section className="panel overflow-hidden">
          <PanelHead icon="chart" title="Grade Distribution" subtitle="Students grouped by final grade" />
          <div className="space-y-3 p-4 sm:p-5">
            {summary.distribution.map((item) => <div key={item.grade} className="flex items-center gap-3">
              <span className={`grid size-8 shrink-0 place-items-center rounded-lg text-xs font-bold text-white ${item.bar}`}>{item.grade}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between text-xs"><span className="text-slate-500">{item.min}%+</span><strong className="text-slate-800">{item.count} student{item.count === 1 ? "" : "s"}</strong></div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${item.bar} transition-all`} style={{ width: `${(item.count / maxCount) * 100}%` }} /></div>
              </div>
            </div>)}
          </div>
        </section>
      </div>

      <section className="panel overflow-hidden">
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
            <Button variant="outline" onClick={() => { setSearch(""); setFilter("all"); setCurrentPage(1); }} disabled={!search && filter === "all"} icon={<ResultIcon type="reset" className="size-4" />} className={resetClass}>Reset</Button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {([["all", "All"], ["pass", "Passed"], ["fail", "Failed"]] as [Filter, string][]).map(([value, label]) => {
              const on = filter === value;
              return <button key={value} type="button" onClick={() => { setFilter(value); setCurrentPage(1); }} className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition active:scale-95 ${on ? "border-transparent bg-(--app-accent-dark) text-white shadow-md" : "border-slate-200 bg-white text-slate-600 hover:border-(--app-accent)/40 hover:bg-(--app-accent-faint)"}`}>{label}<span className={`rounded-full px-1.5 py-0.5 text-[0.65rem] ${on ? "bg-white/25" : "bg-slate-100 text-slate-500"}`}>{counts[value]}</span></button>;
            })}
          </div>
        </div>

        {paged.length ? <ul className="divide-y divide-slate-100">
          {paged.map((r) => <li key={r.admissionNo} className="grid gap-3 p-3.5 transition hover:bg-slate-50/60 sm:p-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto] lg:items-center lg:gap-5">
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

        <div className="border-t border-slate-100 bg-slate-50/60 px-3.5 py-3 sm:px-5">
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
        <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4"><div className="font-display text-lg font-bold text-violet-800">{loaded.exam}</div><div className="mt-1 text-xs text-violet-600">{loaded.className}-{loaded.section} · {results.length} student results · {summary.passRate}% pass rate</div></div>
        <p className="text-xs leading-5 text-slate-500">Once published, students and guardians can view report cards. You can update marks and republish later if corrections are required.</p>
      </div>
    </Popup>

    <Popup
      open={Boolean(selectedRecord)}
      onClose={() => setSelectedRecord(null)}
      title="Student Report Card"
      description={`${selectedRecord?.name ?? ""} · ${loaded.exam}`}
      footer={<><Button variant="outline" onClick={() => setSelectedRecord(null)}>Close</Button>{selectedRecord && <Button onClick={() => printReportCard(selectedRecord)} icon={<ResultIcon type="print" className="size-4" />}>Print Report Card</Button>}</>}
    >
      {selectedRecord && <div className="space-y-5">
        <div className="flex items-center gap-3 rounded-2xl bg-[linear-gradient(135deg,var(--app-sidebar-start),var(--app-accent-dark))] p-4 text-white sm:gap-4 sm:p-5">
          <div className="font-display grid size-12 shrink-0 place-items-center rounded-2xl bg-white/15 text-base font-bold sm:size-14 sm:text-lg">{initials(selectedRecord.name)}</div>
          <div className="min-w-0 flex-1"><h3 className="font-display truncate text-base font-bold sm:text-lg">{selectedRecord.name}</h3><p className="truncate text-xs text-white/75">{selectedRecord.admissionNo} · {loaded.className}-{loaded.section}</p></div>
          <div className="shrink-0 text-right"><div className="font-display text-2xl font-bold">{selectedRecord.percentage}%</div><div className="text-[0.62rem] text-white/70">Grade {selectedRecord.grade}</div></div>
        </div>
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-100">{selectedRecord.subjects.map((subject) => {
          const pass = subject.score >= subject.total * 0.35;
          return <div key={subject.name} className="px-4 py-3 text-xs">
            <div className="flex items-center justify-between gap-3"><span className="font-semibold text-slate-700">{subject.name}</span><div className="flex items-center gap-3"><span className="text-slate-500">{subject.score} / {subject.total}</span><span className={pass ? "status-success" : "status-danger"}>{pass ? "Pass" : "Fail"}</span></div></div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${gradeBar(gradeFor((subject.score / subject.total) * 100))}`} style={{ width: `${(subject.score / subject.total) * 100}%` }} /></div>
          </div>;
        })}</div>
        <div className="grid grid-cols-3 gap-3 text-center">{[["Total", `${selectedRecord.obtained}/${selectedRecord.maximum}`], ["Rank", `#${selectedRecord.rank}`], ["Result", selectedRecord.passed ? "Passed" : "Failed"]].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><div className="font-display text-sm font-bold text-slate-900">{value}</div><div className="mt-1 text-[0.6rem] uppercase tracking-wider text-slate-400">{label}</div></div>)}</div>
      </div>}
    </Popup>
  </div>;
}
