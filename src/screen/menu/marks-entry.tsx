import { useMemo, useState, type ReactNode } from "react";
import { Button, Dropdown, Input, useToast } from "../../components";
import Header from "../../ui/header";
import Popup from "../../ui/popup";

type MarkRecord = { admissionNo: string; marks: string; name: string; remarks: string; rollNo: number };
type Filter = "all" | "pending" | "pass" | "fail";

const classOptions = ["Class 8", "Class 9", "Class 10"];
const sectionOptions = ["A", "B", "C"];
const subjectOptions = ["English", "Mathematics", "Science", "Social Studies"];
const firstNames = ["Rahul", "Ravi", "Anaya", "Kabir", "Sara", "Vihaan", "Diya", "Arjun", "Meera", "Aarav", "Sneha", "Mohit"];
const lastNames = ["Kumar", "Patel", "Singh", "Mehta", "Sharma", "Verma", "Gupta", "Yadav"];
const remarkPool = ["Excellent work", "Good performance", "Can improve accuracy", "Needs revision", "Keep it up", "Satisfactory"];

const gradeScale: { grade: string; range: string; min: number; chip: string; bar: string }[] = [
  { grade: "A+", range: "90–100%", min: 90, chip: "bg-emerald-500", bar: "bg-emerald-500" },
  { grade: "A", range: "80–89%", min: 80, chip: "bg-teal-500", bar: "bg-teal-500" },
  { grade: "B+", range: "70–79%", min: 70, chip: "bg-blue-500", bar: "bg-blue-500" },
  { grade: "B", range: "60–69%", min: 60, chip: "bg-violet-500", bar: "bg-violet-500" },
  { grade: "C", range: "50–59%", min: 50, chip: "bg-amber-400", bar: "bg-amber-400" },
  { grade: "D", range: "35–49%", min: 35, chip: "bg-orange-500", bar: "bg-orange-500" },
  { grade: "F", range: "Below 35%", min: 0, chip: "bg-red-500", bar: "bg-red-500" },
];

const gradeFor = (marks: number, maximum: number) => {
  const score = maximum ? (marks / maximum) * 100 : 0;
  return (gradeScale.find((item) => score >= item.min) ?? gradeScale[gradeScale.length - 1]).grade;
};
const gradeChip = (grade: string) => gradeScale.find((item) => item.grade === grade)?.chip ?? "bg-slate-400";
const gradeTone = (grade: string) => (grade === "F" ? "status-danger" : grade === "D" || grade === "C" ? "status-warning" : "status-success");
const initials = (name: string) => name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
const csvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

const buildRoster = (className: string, section: string, subject: string): MarkRecord[] => {
  const seed = classOptions.indexOf(className) * 5 + sectionOptions.indexOf(section) * 3 + subjectOptions.indexOf(subject);
  return Array.from({ length: 9 + (seed % 3) }, (_, index) => {
    const pending = index === 4 || index === 8;
    const base = 38 + ((index * 17 + seed * 13) % 60);
    return {
      rollNo: index + 1,
      admissionNo: `ADM-26-${1001 + classOptions.indexOf(className) * 200 + sectionOptions.indexOf(section) * 60 + index * 7}`,
      name: `${firstNames[(index * 5 + seed) % firstNames.length]} ${lastNames[(index * 3 + seed) % lastNames.length]}`,
      marks: pending ? "" : String(base),
      remarks: pending ? "" : remarkPool[(index + seed) % remarkPool.length],
    };
  });
};

type IconType = "marks" | "users" | "average" | "trophy" | "check" | "search" | "save" | "download" | "print" | "reset" | "load" | "clear" | "eye";

function MarksIcon({ type, className = "size-5" }: { type: IconType; className?: string }) {
  const paths: Record<IconType, ReactNode> = {
    marks: <><path d="M5 3h14v18H5z" /><path d="M9 8h6M9 12h6M9 16h3" /><path d="m15 16 1.5 1.5L20 14" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>,
    average: <path d="M4 19V9M10 19V5M16 19v-7M22 19V3" />,
    trophy: <><path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" /><path d="M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 13v4M8 21h8M10 17h4" /></>,
    check: <path d="m5 12 5 5 9-10" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    save: <><path d="M5 3h11l3 3v15H5z" /><path d="M8 3v6h7V3M8 21v-7h8v7" /></>,
    download: <path d="M12 3v13M7 11l5 5 5-5M4 21h16" />,
    print: <><path d="M7 9V3h10v6" /><rect x="4" y="9" width="16" height="8" rx="2" /><path d="M7 14h10v7H7z" /></>,
    reset: <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />,
    load: <><path d="M12 3v12M7 10l5 5 5-5" /><path d="M4 19h16" /></>,
    clear: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />,
    eye: <><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  };
  return <svg className={className} aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{paths[type]}</svg>;
}

function PanelHead({ icon, title, subtitle, action }: { icon: IconType; title: string; subtitle: string; action?: ReactNode }) {
  return <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5 border-b border-slate-100 px-3.5 py-3 max-sm:[&>:nth-child(2)]:w-full sm:px-5 sm:py-3.5">
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-(--app-accent-soft) text-(--app-accent-dark) ring-1 ring-(--app-accent)/20"><MarksIcon type={icon} /></span>
      <div className="min-w-0"><h2 className="font-display truncate text-sm font-bold tracking-tight text-slate-900">{title}</h2><p className="truncate text-xs text-slate-500">{subtitle}</p></div>
    </div>
    {action}
  </div>;
}

const resetClass = "border-rose-200! bg-linear-to-r! from-rose-50! to-orange-50! text-rose-600! shadow-sm hover:from-rose-100! hover:to-orange-100! active:scale-95";

export default function MarksEntry() {
  const [exam, setExam] = useState("Half Yearly Examination");
  const [className, setClassName] = useState("Class 10");
  const [section, setSection] = useState("A");
  const [subject, setSubject] = useState("Mathematics");
  const [maximumMarks, setMaximumMarks] = useState("100");
  const [records, setRecords] = useState(() => buildRoster("Class 10", "A", "Mathematics"));
  const [loadedKey, setLoadedKey] = useState("Class 10-A-Mathematics");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const { showToast } = useToast();

  const selectionKey = `${className}-${section}-${subject}`;
  const stale = selectionKey !== loadedKey;
  const maximum = Number(maximumMarks) > 0 ? Number(maximumMarks) : 100;
  const passMark = Math.ceil(maximum * 0.35);

  const summary = useMemo(() => {
    const scores = records.filter((r) => r.marks !== "").map((r) => Number(r.marks));
    const average = scores.length ? scores.reduce((sum, v) => sum + v, 0) / scores.length : 0;
    const passed = scores.filter((v) => v >= passMark).length;
    const top = records.filter((r) => r.marks !== "").sort((a, b) => Number(b.marks) - Number(a.marks))[0];
    const distribution = gradeScale.map((item) => ({ ...item, count: scores.filter((v) => gradeFor(v, maximum) === item.grade).length }));
    return { entered: scores.length, pending: records.length - scores.length, average, passed, failed: scores.length - passed, highest: scores.length ? Math.max(...scores) : 0, top, distribution };
  }, [maximum, passMark, records]);

  const progress = records.length ? Math.round((summary.entered / records.length) * 100) : 0;
  const counts: Record<Filter, number> = { all: records.length, pending: summary.pending, pass: summary.passed, fail: summary.failed };

  const visible = records.filter((record) => {
    const term = search.trim().toLowerCase();
    if (term && !`${record.name} ${record.admissionNo} ${record.rollNo}`.toLowerCase().includes(term)) return false;
    if (filter === "all") return true;
    if (filter === "pending") return record.marks === "";
    if (record.marks === "") return false;
    return filter === "pass" ? Number(record.marks) >= passMark : Number(record.marks) < passMark;
  });

  const loadStudents = async () => {
    setLoading(true);
    await new Promise((resolve) => window.setTimeout(resolve, 650));
    const next = buildRoster(className, section, subject);
    setRecords(next);
    setLoadedKey(selectionKey);
    setDirty(false);
    setSaved(false);
    setSearch("");
    setFilter("all");
    setLoading(false);
    showToast(`${next.length} students loaded for ${subject}, ${className}-${section}.`, { title: "Marks register loaded", tone: "info" });
  };

  const updateRecord = (admissionNo: string, field: "marks" | "remarks", value: string) => {
    if (field === "marks" && value && (Number(value) < 0 || Number(value) > maximum)) {
      showToast(`Marks must be between 0 and ${maximum}.`, { title: "Invalid marks", tone: "error" });
      return;
    }
    setRecords((current) => current.map((record) => record.admissionNo === admissionNo ? { ...record, [field]: value } : record));
    setDirty(true);
    setSaved(false);
  };

  const focusNext = (index: number) => {
    const next = document.querySelector<HTMLInputElement>(`[data-mark-row="${index + 1}"]`);
    next?.focus();
    next?.select();
  };

  const saveMarks = async () => {
    if (stale) { showToast("Load the students for the selected class and subject first.", { title: "Register out of date", tone: "error" }); return; }
    if (summary.pending) {
      setFilter("pending");
      showToast(`${summary.pending} students still have no marks entered.`, { title: "Marks entry incomplete", tone: "error" });
      return;
    }
    setSaving(true);
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    setSaving(false);
    setDirty(false);
    setSaved(true);
    showToast(`${subject} marks were saved for ${className}-${section}.`, { title: "Marks saved successfully" });
  };

  const clearMarks = () => {
    setRecords((current) => current.map((record) => ({ ...record, marks: "", remarks: "" })));
    setDirty(true);
    setSaved(false);
    showToast("All marks and remarks were cleared.", { title: "Register cleared", tone: "info" });
  };

  const exportCsv = () => {
    const head = ["Roll", "Admission No", "Student", "Maximum", "Obtained", "Grade", "Remarks"].map(csvCell).join(",");
    const lines = records.map((r) => [r.rollNo, r.admissionNo, r.name, maximum, r.marks || "Pending", r.marks ? gradeFor(Number(r.marks), maximum) : "-", r.remarks].map(csvCell).join(","));
    const url = URL.createObjectURL(new Blob([[head, ...lines].join("\n")], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url; link.download = `marks-${className}-${section}-${subject}.csv`.replace(/\s+/g, "-"); link.click();
    URL.revokeObjectURL(url);
    showToast("Marks register exported to CSV.", { title: "Export ready" });
  };

  const printSummary = () => {
    const frame = document.createElement("iframe");
    frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
    document.body.appendChild(frame);
    const doc = frame.contentDocument;
    if (!doc || !frame.contentWindow) return;
    const rows = records.map((r) => `<tr><td>${r.rollNo}</td><td>${r.admissionNo}</td><td>${r.name}</td><td>${r.marks || "Pending"} / ${maximum}</td><td>${r.marks ? gradeFor(Number(r.marks), maximum) : "-"}</td></tr>`).join("");
    doc.open();
    doc.write(`<html><head><title>Marks Summary</title><style>body{font-family:sans-serif;padding:24px;color:#0f172a}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #cbd5e1;padding:8px;text-align:left;font-size:13px}th{background:#f1f5f9}</style></head><body><h2>${exam} - ${subject}</h2><p>${className}-${section} · Average ${summary.average.toFixed(1)} · Passed ${summary.passed}/${summary.entered}</p><table><thead><tr><th>Roll</th><th>Admission No.</th><th>Student</th><th>Marks</th><th>Grade</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
    doc.close();
    window.setTimeout(() => { frame.contentWindow?.print(); window.setTimeout(() => frame.remove(), 1000); }, 250);
  };

  const stats: { label: string; value: string; copy: string; tone: string; icon: IconType }[] = [
    { label: "Marks Entered", value: `${summary.entered}/${records.length}`, tone: "teal", copy: `${summary.pending} pending`, icon: "users" },
    { label: "Class Average", value: `${((summary.average / maximum) * 100).toFixed(1)}%`, tone: "green", copy: `${summary.average.toFixed(1)} of ${maximum} marks`, icon: "average" },
    { label: "Highest Marks", value: `${summary.highest}/${maximum}`, tone: "amber", copy: summary.top ? summary.top.name : "No marks yet", icon: "trophy" },
    { label: "Students Passed", value: String(summary.passed), tone: "violet", copy: `Pass mark ${passMark}`, icon: "check" },
  ];

  const maxCount = Math.max(1, ...summary.distribution.map((item) => item.count));

  return <div className="min-h-screen dashboard-bg pb-16">
    <Header title="Marks Entry" subtitle="Enter, validate, and review examination marks by subject" />
    <main className="space-y-4 p-3 sm:space-y-5 sm:p-6 xl:p-8">
      <section className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,var(--app-sidebar-start),var(--app-accent-dark)_58%,var(--app-accent))] p-3 shadow-xl shadow-slate-900/10 sm:p-5">
        <span className="pointer-events-none absolute -right-14 -top-20 size-64 rounded-full bg-white/10 blur-2xl" />
        <span className="pointer-events-none absolute -bottom-20 left-1/3 size-52 rounded-full bg-white/5 blur-2xl" />
        <div className="relative flex flex-wrap items-center gap-3 px-1 py-2 sm:gap-4 sm:px-2">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-sm sm:size-14"><MarksIcon type="marks" className="size-6" /></span>
          <div className="min-w-0 flex-1 basis-52">
            <div className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/65">Active marks workspace</div>
            <div className="font-display mt-1 truncate text-xl font-bold text-white sm:text-2xl">{subject}</div>
            <div className="mt-1 truncate text-xs text-white/75">{exam} · {className}-{section} · Maximum {maximum}</div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-3 py-2.5 text-white ring-1 ring-white/15 backdrop-blur-sm sm:px-4">
            <div className="relative grid size-11 place-items-center rounded-full bg-white/10">
              <svg className="absolute inset-0 size-11 -rotate-90" viewBox="0 0 44 44" aria-hidden="true">
                <circle cx="22" cy="22" r="18" fill="none" stroke="currentColor" strokeWidth="4" className="text-white/15" />
                <circle cx="22" cy="22" r="18" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" pathLength="100" strokeDasharray={`${progress} 100`} className="text-white" />
              </svg>
              <span className="text-[0.62rem] font-bold">{progress}%</span>
            </div>
            <div><div className="text-xs font-bold">{summary.entered} of {records.length}</div><div className="mt-0.5 text-[0.65rem] text-white/65">marks entered</div></div>
          </div>
          <span className={`shrink-0 ${stale ? "status-warning" : dirty ? "status-warning" : saved ? "status-success" : "status-info"}`}>{stale ? "Selection changed" : dirty ? "Unsaved changes" : saved ? "Saved" : "Up to date"}</span>
        </div>
        <div className="relative mt-3 grid grid-cols-2 items-end gap-x-3 gap-y-3.5 rounded-2xl border border-white/60 bg-white p-3.5 shadow-2xl shadow-slate-950/15 sm:gap-x-4 sm:gap-y-4 sm:p-5 md:grid-cols-4 xl:grid-cols-[1.3fr_1fr_.7fr_1fr_.7fr_auto] [&>:first-child]:col-span-2 xl:[&>:first-child]:col-span-1 md:[&>:nth-child(4)]:col-span-2 xl:[&>:nth-child(4)]:col-span-1 [&>:last-child]:col-span-2 md:[&>:last-child]:col-span-1 [&>:last-child]:self-end">
          <div className="sm:col-span-2 xl:col-span-1"><Dropdown label="Examination" value={exam} onChange={(event) => setExam(event.target.value)} options={["Half Yearly Examination", "Unit Test 2", "Annual Examination"].map((value) => ({ label: value, value }))} /></div>
          <Dropdown label="Class" value={className} onChange={(event) => setClassName(event.target.value)} options={classOptions.map((value) => ({ label: value, value }))} />
          <Dropdown label="Section" value={section} onChange={(event) => setSection(event.target.value)} options={sectionOptions.map((value) => ({ label: value, value }))} />
          <Dropdown label="Subject" value={subject} onChange={(event) => setSubject(event.target.value)} options={subjectOptions.map((value) => ({ label: value, value }))} />
          <Input label="Max Marks" type="number" min="1" value={maximumMarks} onChange={(event) => setMaximumMarks(event.target.value)} />
          <Button onClick={loadStudents} isLoading={loading} loadingText="Loading..." icon={<MarksIcon type="load" className="size-4" />} className="max-sm:col-span-2 sm:col-span-2 xl:col-span-1 xl:min-w-36">Load Students</Button>
        </div>
      </section>

      <section className="grid auto-rows-fr grid-cols-[repeat(2,minmax(0,1fr))] gap-2.5 sm:gap-3 xl:grid-cols-[repeat(4,minmax(0,1fr))] [&>article]:h-full">
        {stats.map((stat) => <article key={stat.label} className={`admission-summary-card admission-summary-${stat.tone} group relative overflow-hidden rounded-2xl border border-white p-3 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:p-5`}>
          <span className="absolute inset-x-4 top-0 h-1 rounded-b-full bg-current opacity-20" />
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="min-w-0"><div className="truncate text-[0.65rem] font-bold uppercase tracking-wider text-slate-400 sm:text-[0.7rem]">{stat.label}</div><div className="font-display mt-1.5 truncate text-xl font-extrabold text-slate-950 sm:text-2xl">{stat.value}</div></div>
            <span className="admission-summary-icon grid size-9 shrink-0 place-items-center rounded-xl transition duration-300 group-hover:scale-105 sm:size-11"><MarksIcon type={stat.icon} className="size-4 sm:size-5" /></span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[0.68rem] font-medium text-slate-500 sm:mt-3 sm:text-xs"><span className="size-1.5 shrink-0 rounded-full bg-current opacity-50" /><span className="truncate">{stat.copy}</span></div>
        </article>)}
      </section>

      <div className="grid items-start gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_17rem]">
        <section className="panel overflow-hidden ring-1 ring-slate-200/50">
          <PanelHead icon="marks" title={`${subject} Marks`} subtitle={`${exam} · ${className}-${section}`} action={
            <div className="flex flex-wrap gap-2 max-sm:grid max-sm:grid-cols-3 max-sm:[&>*]:min-w-0">
              <Button variant="outline" className="min-h-9 px-3 py-2" onClick={exportCsv} icon={<MarksIcon type="download" className="size-4" />}>Export</Button>
              <Button variant="outline" className="min-h-9 px-3 py-2" onClick={() => setSummaryOpen(true)} icon={<MarksIcon type="eye" className="size-4" />}>Summary</Button>
              <Button variant="outline" className={`min-h-9 px-3 py-2 ${resetClass}`} onClick={clearMarks} icon={<MarksIcon type="clear" className="size-4" />}>Clear</Button>
            </div>
          } />

          <div className="space-y-3 border-b border-slate-100 bg-[linear-gradient(135deg,var(--app-accent-faint),white_60%)] p-3.5 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white shadow-inner ring-1 ring-slate-200/70"><div className="h-full rounded-full bg-[linear-gradient(90deg,var(--app-accent),var(--app-accent-dark))] transition-all duration-500" style={{ width: `${progress}%` }} /></div>
              <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[0.68rem] font-bold text-slate-600 shadow-sm ring-1 ring-slate-200">{progress}% complete</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search student, roll or admission no..." aria-label="Search students" startIcon={<MarksIcon type="search" className="size-4" />} />
              <div className="flex gap-2 overflow-x-auto pb-0.5">
                {([["all", "All"], ["pending", "Pending"], ["pass", "Passed"], ["fail", "Failed"]] as [Filter, string][]).map(([value, label]) => {
                  const on = filter === value;
                  return <button key={value} type="button" onClick={() => setFilter(value)} className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition active:scale-95 ${on ? "border-transparent bg-(--app-accent-dark) text-white shadow-md" : "border-slate-200 bg-white text-slate-600 hover:border-(--app-accent)/40 hover:bg-(--app-accent-faint)"}`}>{label}<span className={`rounded-full px-1.5 py-0.5 text-[0.65rem] ${on ? "bg-white/25" : "bg-slate-100 text-slate-500"}`}>{counts[value]}</span></button>;
                })}
              </div>
            </div>
            {stale && <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">You changed the class, section or subject. Press <strong>Load Students</strong> to refresh this register.</p>}
          </div>

          {visible.length ? <ul className="space-y-2.5 bg-slate-50/70 p-2.5 sm:p-3">
            {visible.map((record) => {
              const index = records.indexOf(record);
              const has = record.marks !== "";
              const grade = has ? gradeFor(Number(record.marks), maximum) : "";
              const percent = has ? Math.min(100, Math.round((Number(record.marks) / maximum) * 100)) : 0;
              return <li key={record.admissionNo} className={`relative grid gap-3 overflow-hidden rounded-2xl border bg-white p-3.5 shadow-sm transition duration-200 hover:-translate-y-px hover:shadow-md sm:p-4 lg:grid-cols-[minmax(0,1.2fr)_auto_minmax(0,1fr)] lg:items-center lg:gap-5 ${has ? Number(record.marks) < passMark ? "border-red-100" : "border-slate-200/80" : "border-amber-200/80"}`}>
                <span className={`absolute inset-y-0 left-0 w-1 ${has ? Number(record.marks) < passMark ? "bg-red-400" : "bg-(--app-accent)" : "bg-amber-400"}`} />
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,var(--app-accent),var(--app-accent-dark))] text-xs font-bold text-white shadow-md shadow-slate-900/10 ring-2 ring-white">{initials(record.name)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><h3 className="font-display truncate text-sm font-bold text-slate-900">{record.name}</h3></div>
                    <p className="mt-0.5 truncate text-[0.7rem] text-slate-500"><span className="font-semibold text-slate-600">Roll {String(record.rollNo).padStart(2, "0")}</span> · {record.admissionNo}</p>
                  </div>
                  {has ? <span className={`${gradeTone(grade)} lg:hidden`}>{grade}</span> : <span className="status-neutral lg:hidden">Pending</span>}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <input data-mark-row={index} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); focusNext(index); } }} inputMode="decimal" aria-label={`Marks for ${record.name}`} className={`h-11 w-24 rounded-xl border bg-white px-3 text-center font-display text-base font-bold text-slate-900 shadow-inner outline-none transition focus:border-(--app-accent) focus:ring-4 focus:ring-(--app-accent)/15 ${has ? (Number(record.marks) < passMark ? "border-red-200 bg-red-50/50" : "border-slate-200") : "border-dashed border-amber-300 bg-amber-50/40"}`} type="number" min="0" max={maximum} value={record.marks} onChange={(event) => updateRecord(record.admissionNo, "marks", event.target.value)} placeholder="—" />
                    <span className="text-xs font-semibold text-slate-400">/ {maximum}</span>
                  </div>
                  <div className="hidden w-20 lg:block">
                    {has ? <><span className={`grid h-7 w-full place-items-center rounded-lg text-xs font-bold text-white ${gradeChip(grade)}`}>{grade}</span></> : <span className="status-neutral">Pending</span>}
                  </div>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 sm:w-24 sm:flex-none lg:hidden"><div className={`h-full rounded-full ${has ? gradeChip(grade) : ""}`} style={{ width: `${percent}%` }} /></div>
                </div>

                <input aria-label={`Remarks for ${record.name}`} className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-600 outline-none transition hover:bg-white focus:border-(--app-accent) focus:bg-white focus:ring-4 focus:ring-(--app-accent)/15" value={record.remarks} onChange={(event) => updateRecord(record.admissionNo, "remarks", event.target.value)} placeholder="Add remarks (optional)" />
              </li>;
            })}
          </ul> : <div className="grid min-h-48 place-items-center p-6 text-center"><div>
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-(--app-accent-soft) text-(--app-accent-dark)"><MarksIcon type="search" /></div>
            <h3 className="font-display mt-3 text-sm font-bold text-slate-700">No students match</h3>
            <p className="mt-1 text-xs text-slate-400">Try another search or filter.</p>
            <Button variant="outline" className={`mt-3 ${resetClass}`} onClick={() => { setSearch(""); setFilter("all"); }} icon={<MarksIcon type="reset" className="size-4" />}>Reset</Button>
          </div></div>}

          <footer className="flex flex-col gap-3 border-t border-slate-100 bg-white px-3.5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
            <div className="flex items-center gap-2 text-xs text-slate-500"><span className={`size-2 rounded-full ${dirty ? "animate-pulse bg-amber-400" : saved ? "bg-emerald-500" : "bg-slate-300"}`} /><span>{summary.entered} entered · {summary.pending} pending · Pass mark {passMark}</span></div>
            <Button onClick={saveMarks} disabled={!dirty && !stale} isLoading={saving} loadingText="Saving marks..." icon={<MarksIcon type="save" className="size-4" />} className="max-sm:w-full sm:min-w-36">Save Marks</Button>
          </footer>
        </section>

        <aside className="panel overflow-hidden xl:sticky xl:top-24">
          <PanelHead icon="average" title="Grade Distribution" subtitle="Live from entered marks" />
          <div className="border-b border-slate-100 bg-[linear-gradient(135deg,var(--app-accent-faint),white)] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div><div className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400">Pass rate</div><div className="font-display mt-1 text-3xl font-extrabold text-slate-950">{summary.entered ? Math.round((summary.passed / summary.entered) * 100) : 0}%</div></div>
              <span className="grid size-12 place-items-center rounded-2xl bg-white text-(--app-accent-dark) shadow-sm ring-1 ring-(--app-accent)/15"><MarksIcon type="trophy" className="size-5" /></span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white shadow-inner ring-1 ring-slate-200/70"><div className="h-full rounded-full bg-[linear-gradient(90deg,var(--app-accent),var(--app-accent-dark))]" style={{ width: `${summary.entered ? (summary.passed / summary.entered) * 100 : 0}%` }} /></div>
            <div className="mt-2 flex justify-between text-[0.65rem] font-medium text-slate-500"><span>{summary.passed} passed</span><span>{summary.failed} need support</span></div>
          </div>
          <div className="space-y-3 p-4 sm:p-5">
            {summary.distribution.map((item) => <div key={item.grade} className="flex items-center gap-3">
              <span className={`grid size-8 shrink-0 place-items-center rounded-lg text-xs font-bold text-white ${item.chip}`}>{item.grade}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between text-xs"><span className="text-slate-500">{item.range}</span><strong className="text-slate-800">{item.count}</strong></div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${item.bar} transition-all`} style={{ width: `${(item.count / maxCount) * 100}%` }} /></div>
              </div>
            </div>)}
          </div>
        </aside>
      </div>
    </main>

    <Popup
      open={summaryOpen}
      onClose={() => setSummaryOpen(false)}
      title="Marks Entry Summary"
      description={`${exam} · ${subject} · ${className}-${section}`}
      footer={<><Button variant="outline" onClick={() => setSummaryOpen(false)}>Close</Button><Button onClick={printSummary} icon={<MarksIcon type="print" className="size-4" />}>Print Summary</Button></>}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Entered", summary.entered, "text-teal-600 bg-teal-50"], ["Pending", summary.pending, "text-amber-600 bg-amber-50"], ["Average", `${((summary.average / maximum) * 100).toFixed(1)}%`, "text-blue-600 bg-blue-50"], ["Passed", summary.passed, "text-emerald-600 bg-emerald-50"]].map(([label, value, color]) => <div key={String(label)} className={`rounded-2xl p-4 text-center ${color}`}><div className="font-display text-xl font-bold">{value}</div><div className="mt-1 text-[0.6rem] font-bold uppercase tracking-wider">{label}</div></div>)}</div>
        <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-100">{records.map((record) => <div key={record.admissionNo} className="flex items-center justify-between gap-3 px-4 py-3 text-xs"><div className="min-w-0"><strong className="block truncate text-slate-800">{record.name}</strong><div className="mt-0.5 text-slate-400">{record.admissionNo}</div></div><div className="shrink-0 text-right"><strong className="font-display text-sm text-slate-900">{record.marks || "—"} / {maximum}</strong><div className="mt-0.5 text-slate-400">{record.marks ? gradeFor(Number(record.marks), maximum) : "Pending"}</div></div></div>)}</div>
      </div>
    </Popup>
  </div>;
}
