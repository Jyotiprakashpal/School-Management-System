import { useMemo, useRef, useState, type ReactNode } from "react";
import { Button, Dropdown, Input, PremiumPagination, useToast } from "../../components";
import Header from "../../ui/header";
import Popup from "../../ui/popup";

type Record_ = { absent: number; admissionNo: string; leave: number; name: string; present: number; rollNo: number; totalDays: number };
type Tone = "good" | "low" | "critical";

const classes = ["Nursery", "LKG", "UKG", "Class 1", "Class 2", "Class 3"];
const months = ["July 2026", "August 2026", "September 2026", "October 2026"];
const sessions = ["2026–27", "2027–28"];
const workingDays: Record<string, number> = { "July 2026": 22, "August 2026": 20, "September 2026": 21, "October 2026": 9 };
const firstNames = ["Rahul", "Ananya", "Mohit", "Priya", "Aarav", "Sneha", "Kabir", "Sara", "Vihaan", "Diya", "Arjun", "Meera"];
const lastNames = ["Kumar", "Sharma", "Verma", "Singh", "Gupta", "Yadav", "Patel", "Mehta"];

const buildRecords = (className: string, month: string, session: string): Record_[] => {
  const seed = classes.indexOf(className) * 7 + months.indexOf(month) * 3 + sessions.indexOf(session) * 5;
  const total = workingDays[month];
  return Array.from({ length: 10 + (seed % 3) }, (_, index) => {
    const mix = (index * 37 + seed * 11) % 100;
    const ratio = index === 1 || index === 6 ? 0.58 : index === 3 ? 0.36 : mix < 15 ? 0.45 : mix < 35 ? 0.28 : mix < 60 ? 0.12 : 0.05;
    const absent = Math.min(total, Math.round(ratio * total + (index === 1 || index === 3 || index === 6 ? 0 : (index + seed) % 2)));
    const leave = Math.min(total - absent, (index + seed) % 3 === 0 ? 1 : (index * 2 + seed) % 4 === 0 ? 2 : 0);
    return {
      rollNo: index + 1,
      admissionNo: `ADM-26-${1000 + classes.indexOf(className) * 20 + index + 1}`,
      name: `${firstNames[(index * 5 + seed) % firstNames.length]} ${lastNames[(index * 3 + seed) % lastNames.length]}`,
      present: total - absent - leave, absent, leave, totalDays: total,
    };
  });
};

const percentage = (record: Record_) => (record.totalDays ? Math.round((record.present / record.totalDays) * 1000) / 10 : 0);
const toneOf = (value: number): Tone => (value >= 75 ? "good" : value >= 50 ? "low" : "critical");
const toneMeta = {
  good: { label: "Good", badge: "status-success", bar: "bg-emerald-500", text: "text-emerald-600" },
  low: { label: "Low", badge: "status-warning", bar: "bg-amber-500", text: "text-amber-600" },
  critical: { label: "Critical", badge: "status-danger", bar: "bg-red-500", text: "text-red-500" },
};
const initials = (name: string) => name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
const csvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

type IconType = "chart" | "warning" | "calendar" | "users" | "check" | "download" | "print" | "reset" | "trend" | "eye";

function ReportIcon({ type, className = "size-5" }: { type: IconType; className?: string }) {
  const paths: Record<IconType, ReactNode> = {
    chart: <path d="M4 19V9M10 19V5M16 19v-7M22 19V3" />,
    warning: <><path d="m12 3 10 18H2L12 3Z" /><path d="M12 9v5M12 18h.01" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>,
    check: <path d="m5 12 5 5 9-10" />,
    download: <path d="M12 3v13M7 11l5 5 5-5M4 21h16" />,
    print: <><path d="M7 9V3h10v6" /><rect x="4" y="9" width="16" height="8" rx="2" /><path d="M7 14h10v7H7z" /></>,
    reset: <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />,
    trend: <path d="m3 17 6-6 4 4 8-9M15 6h6v6" />,
    eye: <><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  };
  return <svg className={className} aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{paths[type]}</svg>;
}

function PanelHead({ icon, title, subtitle, action }: { icon: IconType; title: string; subtitle: string; action?: ReactNode }) {
  return <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5 border-b border-slate-100 px-3.5 py-3 max-sm:[&>:nth-child(2)]:w-full max-sm:[&>:nth-child(2)]:justify-end sm:px-5 sm:py-3.5">
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-(--app-accent-soft) text-(--app-accent-dark) ring-1 ring-(--app-accent)/20"><ReportIcon type={icon} /></span>
      <div className="min-w-0"><h2 className="font-display truncate text-sm font-bold tracking-tight text-slate-900">{title}</h2><p className="truncate text-xs text-slate-500">{subtitle}</p></div>
    </div>
    {action}
  </div>;
}

export default function AttendanceReport() {
  const [className, setClassName] = useState("UKG");
  const [month, setMonth] = useState("September 2026");
  const [session, setSession] = useState("2027–28");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | Tone>("all");
  const [sort, setSort] = useState("roll");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [selected, setSelected] = useState<Record_ | null>(null);
  const registerRef = useRef<HTMLElement>(null);
  const { showToast } = useToast();

  const records = useMemo(() => buildRecords(className, month, session), [className, month, session]);
  const counts = useMemo(() => ({
    good: records.filter((r) => toneOf(percentage(r)) === "good").length,
    low: records.filter((r) => toneOf(percentage(r)) === "low").length,
    critical: records.filter((r) => toneOf(percentage(r)) === "critical").length,
  }), [records]);
  const average = records.length ? records.reduce((sum, r) => sum + percentage(r), 0) / records.length : 0;
  const below = counts.low + counts.critical;
  const best = [...records].sort((a, b) => percentage(b) - percentage(a))[0];
  const atRisk = [...records].filter((r) => percentage(r) < 75).sort((a, b) => percentage(a) - percentage(b)).slice(0, 4);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = records.filter((r) => (!term || `${r.name} ${r.admissionNo}`.toLowerCase().includes(term)) && (filter === "all" || toneOf(percentage(r)) === filter));
    return list.sort((a, b) => sort === "high" ? percentage(b) - percentage(a) : sort === "low" ? percentage(a) - percentage(b) : sort === "name" ? a.name.localeCompare(b.name) : a.rollNo - b.rollNo);
  }, [records, search, filter, sort]);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paged = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const goodDeg = records.length ? (counts.good / records.length) * 360 : 0;
  const lowDeg = records.length ? (counts.low / records.length) * 360 : 0;
  const ring = `conic-gradient(#10b981 0deg ${goodDeg}deg, #f59e0b ${goodDeg}deg ${goodDeg + lowDeg}deg, #ef4444 ${goodDeg + lowDeg}deg 360deg)`;

  const focusStep: "low" | "critical" | "all" = filter === "low" ? (counts.critical ? "critical" : "all") : filter === "critical" ? "all" : counts.low ? "low" : counts.critical ? "critical" : "all";
  const focusLabel = focusStep === "low" ? `Show Low (${counts.low})` : focusStep === "critical" ? `Show Critical (${counts.critical})` : "Show All Students";
  const toggleFocus = () => {
    setCurrentPage(1);
    if (focusStep === "all") { setFilter("all"); return; }
    setFilter(focusStep); setSearch(""); setSort("low");
    window.setTimeout(() => registerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    const n = counts[focusStep];
    showToast(`Showing ${n} ${focusStep} attendance student${n > 1 ? "s" : ""}, lowest first.`, { title: `${focusStep === "low" ? "Low" : "Critical"} attendance`, tone: "info" });
  };

  const resetFilters = () => { setSearch(""); setFilter("all"); setSort("roll"); setCurrentPage(1); };

  const exportCsv = () => {
    const header = ["Roll No.", "Admission No.", "Student", "Present", "Absent", "Leave", "Total Days", "Attendance %", "Status"];
    const lines = rows.map((r) => [r.rollNo, r.admissionNo, r.name, r.present, r.absent, r.leave, r.totalDays, percentage(r), toneMeta[toneOf(percentage(r))].label].map(csvCell).join(","));
    const url = URL.createObjectURL(new Blob([[header.map(csvCell).join(","), ...lines].join("\n")], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url; link.download = `attendance-${className}-${month.replace(" ", "-")}.csv`; link.click();
    URL.revokeObjectURL(url);
    showToast(`${rows.length} attendance rows exported.`, { title: "Report exported" });
  };

  const printReport = (list: Record_[], title: string) => {
    const frame = document.createElement("iframe");
    frame.style.cssText = "position:fixed;width:0;height:0;border:0";
    document.body.appendChild(frame);
    const th = "border:1px solid #ddd;padding:6px 8px;text-align:left;background:#f3f4f6";
    const td = "border:1px solid #ddd;padding:6px 8px";
    frame.contentDocument?.write(`<html><body style="font-family:sans-serif;padding:24px"><h2>${title}</h2><p>${className} · ${month} · ${session}</p><table style="border-collapse:collapse;width:100%;font-size:12px"><tr>${["Roll", "Admission No.", "Student", "Present", "Absent", "Leave", "Days", "%"].map((h) => `<th style="${th}">${h}</th>`).join("")}</tr>${list.map((r) => `<tr>${[r.rollNo, r.admissionNo, r.name, r.present, r.absent, r.leave, r.totalDays, `${percentage(r)}%`].map((v) => `<td style="${td}">${v}</td>`).join("")}</tr>`).join("")}</table></body></html>`);
    frame.contentDocument?.close();
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    window.setTimeout(() => frame.remove(), 1500);
  };

  const stats = [
    { label: "Total Students", value: String(records.length), tone: "teal", icon: "users" as IconType, copy: `${className} · ${session}` },
    { label: "75%+ Attendance", value: String(counts.good), tone: "green", icon: "check" as IconType, copy: "Good standing" },
    { label: "Below 75%", value: String(below), tone: "amber", icon: "warning" as IconType, copy: "Needs attention" },
    { label: "Class Average", value: `${average.toFixed(1)}%`, tone: "violet", icon: "trend" as IconType, copy: month },
  ];
  const chips: { key: "all" | Tone; label: string; count: number }[] = [{ key: "all", label: "All", count: records.length }, { key: "good", label: "Good", count: counts.good }, { key: "low", label: "Low", count: counts.low }, { key: "critical", label: "Critical", count: counts.critical }];

  return <div className="min-h-screen dashboard-bg pb-16">
    <Header title="Attendance Report" subtitle="Review monthly attendance, trends, and at-risk students" />
    <main className="space-y-4 p-4 sm:space-y-5 sm:p-6 xl:p-8">
      <section className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,var(--app-sidebar-start),var(--app-accent-dark)_60%,var(--app-accent))] p-5 text-white shadow-xl sm:p-7">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-white/10 blur-2xl" />
        <div className="relative grid items-center gap-5 sm:grid-cols-[1fr_auto]">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-white/75"><ReportIcon type="calendar" className="size-4" />{month} · {workingDays[month]} working days</div>
            <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">{className} Attendance Report</h2>
            <p className="mt-1 text-sm text-white/75">{best ? `Top attendance: ${best.name} (${percentage(best)}%)` : "No records"} · Session {session}</p>
          </div>
          <div className="flex items-end gap-6 sm:text-right"><div><div className="font-display text-4xl font-bold leading-none sm:text-5xl">{average.toFixed(1)}%</div><div className="mt-1 text-xs text-white/75">Class average</div></div></div>
        </div>
      </section>

      <section className="grid auto-rows-fr grid-cols-[repeat(2,minmax(0,1fr))] gap-2.5 sm:gap-3 xl:grid-cols-[repeat(4,minmax(0,1fr))] [&>article]:h-full">
        {stats.map((stat) => <article key={stat.label} className={`admission-summary-card admission-summary-${stat.tone} relative overflow-hidden rounded-2xl p-3 shadow-sm sm:p-5`}>
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="min-w-0"><div className="truncate text-[0.7rem] font-semibold text-slate-500 sm:text-xs">{stat.label}</div><div className="mt-1 truncate font-display text-xl font-bold text-slate-950 sm:text-2xl">{stat.value}</div></div>
            <span className="admission-summary-icon grid size-8 shrink-0 place-items-center rounded-xl sm:size-10"><ReportIcon type={stat.icon} className="size-4 sm:size-5" /></span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[0.7rem] font-medium text-slate-500 sm:mt-3 sm:text-xs"><span className="size-1.5 shrink-0 rounded-full bg-current opacity-50" /><span className="truncate">{stat.copy}</span></div>
        </article>)}
      </section>

      <section className="panel overflow-visible">
        <PanelHead icon="calendar" title="Report Filters" subtitle="The report updates instantly when you change a filter" />
        <div className="grid grid-cols-2 gap-2.5 bg-linear-to-b from-slate-50/80 to-transparent p-3 max-sm:[&>:first-child]:col-span-2 sm:grid-cols-3 sm:gap-3 sm:p-4">
          <Dropdown label="Class" value={className} onChange={(event) => { setClassName(event.target.value); setCurrentPage(1); }} options={classes.map((value) => ({ label: value, value }))} />
          <Dropdown label="Month" value={month} onChange={(event) => { setMonth(event.target.value); setCurrentPage(1); }} options={months.map((value) => ({ label: value, value }))} />
          <Dropdown label="Academic Session" value={session} onChange={(event) => { setSession(event.target.value); setCurrentPage(1); }} options={sessions.map((value) => ({ label: value, value }))} />
        </div>
      </section>

      {below > 0 && <section className="flex flex-col gap-3 rounded-2xl border border-red-100 bg-linear-to-r from-red-50 via-white to-orange-50 p-4 shadow-sm sm:flex-row sm:items-center sm:p-5">
        <div className="flex min-w-0 flex-1 items-start gap-3"><div className="grid size-11 shrink-0 place-items-center rounded-xl bg-red-100 text-red-600"><ReportIcon type="warning" /></div><div className="min-w-0"><h2 className="font-display text-sm font-bold text-red-700">{below} student{below > 1 ? "s" : ""} below the 75% standard</h2><p className="mt-1 text-xs leading-5 text-slate-600">Review absences and contact guardians when required.</p></div></div>
        <Button variant={focusStep === "all" ? "outline" : focusStep === "low" ? "warning" : "danger"} className="shrink-0 max-sm:w-full" onClick={toggleFocus} icon={<ReportIcon type={focusStep === "all" ? "reset" : "eye"} className="size-4" />}>{focusLabel}</Button>
      </section>}

      <div className="grid items-start gap-4 sm:gap-5 xl:grid-cols-[1.5fr_.5fr]">
        <section ref={registerRef} className="panel scroll-mt-4 overflow-visible">
          <PanelHead icon="chart" title={`${className} Attendance Register`} subtitle={`${rows.length} of ${records.length} students`} action={<div className="flex flex-wrap gap-2"><Button variant="outline" className="min-h-9 px-3 py-2" onClick={() => printReport(rows, "Attendance Register")} disabled={!rows.length} icon={<ReportIcon type="print" className="size-4" />}>Print</Button><Button variant="outline" className="min-h-9 px-3 py-2" onClick={exportCsv} disabled={!rows.length} icon={<ReportIcon type="download" className="size-4" />}>Export</Button></div>} />
          <div className="space-y-3 border-b border-slate-100 bg-linear-to-b from-slate-50/80 to-transparent p-3 sm:p-4">
            <div className="grid grid-cols-2 gap-2.5 max-sm:[&>:first-child]:col-span-2 sm:grid-cols-[1fr_11rem_auto] sm:gap-3">
              <Input value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }} placeholder="Search student or admission no..." aria-label="Search students" />
              <Dropdown value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort by" options={[{ label: "Roll number", value: "roll" }, { label: "Name (A–Z)", value: "name" }, { label: "Highest attendance", value: "high" }, { label: "Lowest attendance", value: "low" }]} />
              <Button variant="outline" className="border-rose-200! bg-linear-to-r! from-rose-50! to-orange-50! text-rose-600! shadow-sm hover:from-rose-100! hover:to-orange-100! active:scale-95" onClick={resetFilters} icon={<ReportIcon type="reset" className="size-3.5" />}>Reset</Button>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-0.5">{chips.map((chip) => <button key={chip.key} type="button" aria-pressed={filter === chip.key} onClick={() => { setFilter(chip.key); setCurrentPage(1); }} className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${filter === chip.key ? "border-transparent bg-[linear-gradient(135deg,var(--app-accent-dark),var(--app-accent))] text-white shadow-md" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>{chip.label}<span className={`rounded-full px-1.5 text-[0.65rem] ${filter === chip.key ? "bg-white/25" : "bg-slate-100 text-slate-500"}`}>{chip.count}</span></button>)}</div>
          </div>

          <ul className="space-y-2.5 p-3 sm:p-4">
            {paged.map((record) => {
              const value = percentage(record);
              const tone = toneOf(value);
              const meta = toneMeta[tone];
              return <li key={record.admissionNo} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md sm:p-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-(--app-accent-soft) text-xs font-bold text-(--app-accent-dark)">{initials(record.name)}</span>
                  <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-slate-900">{record.name}</div><div className="truncate text-xs text-slate-500">Roll {record.rollNo} · {record.admissionNo}</div></div>
                  <span className={`${meta.badge} shrink-0`}>{meta.label}</span>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${value}% attendance`}><div className={`h-full rounded-full ${meta.bar}`} style={{ width: `${value}%` }} /></div>
                  <span className={`w-12 text-right font-display text-sm font-bold ${meta.text}`}>{value}%</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><span><strong className="text-emerald-600">{record.present}</strong> Present</span><span><strong className="text-red-500">{record.absent}</strong> Absent</span><span><strong className="text-amber-500">{record.leave}</strong> Leave</span><span>of {record.totalDays} days</span></div>
                  <Button variant="outline" className="min-h-8 px-3 py-1.5" onClick={() => setSelected(record)} icon={<ReportIcon type="eye" className="size-3.5" />}>Details</Button>
                </div>
              </li>;
            })}
            {!paged.length && <li className="grid min-h-40 place-items-center rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-400">No students match the selected filters.</li>}
          </ul>
          <PremiumPagination currentPage={safePage} totalPages={totalPages} totalRecords={rows.length} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }} wideLayout />
        </section>

        <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 xl:grid-cols-1">
          <section className="panel p-5">
            <h2 className="font-display text-sm font-bold text-slate-900">Attendance Health</h2>
            <div className="mx-auto mt-5 grid size-40 place-items-center rounded-full" style={{ background: ring }}><div className="grid size-28 place-items-center rounded-full bg-white text-center shadow-inner"><div><div className="font-display text-2xl font-bold text-slate-950">{average.toFixed(1)}%</div><div className="mt-0.5 text-[0.6rem] uppercase tracking-wider text-slate-400">Class average</div></div></div></div>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center">{(["good", "low", "critical"] as Tone[]).map((tone) => <div key={tone} className="rounded-xl bg-slate-50 py-2"><div className={`text-sm font-bold ${toneMeta[tone].text}`}>{counts[tone]}</div><div className="text-[0.62rem] text-slate-500">{toneMeta[tone].label}</div></div>)}</div>
            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">{[["75–100%", "Good", "bg-emerald-500"], ["50–74%", "Low", "bg-amber-500"], ["Below 50%", "Critical", "bg-red-500"]].map(([range, label, color]) => <div key={range} className="flex items-center gap-2.5 text-xs"><span className={`size-2.5 rounded-full ${color}`} /><span className="flex-1 text-slate-500">{range}</span><strong className="text-slate-700">{label}</strong></div>)}</div>
          </section>

          <section className="panel p-5">
            <h2 className="font-display text-sm font-bold text-slate-900">Needs Attention</h2>
            {atRisk.length ? <ul className="mt-3 divide-y divide-slate-100">{atRisk.map((r) => <li key={r.admissionNo}><button type="button" onClick={() => setSelected(r)} className="flex w-full items-center justify-between gap-3 py-2.5 text-left transition hover:opacity-80"><span className="min-w-0"><span className="block truncate text-sm font-semibold text-slate-800">{r.name}</span><span className="block text-xs text-slate-500">{r.absent} absent</span></span><span className={`shrink-0 font-display text-sm font-bold ${toneMeta[toneOf(percentage(r))].text}`}>{percentage(r)}%</span></button></li>)}</ul> : <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700">Everyone is meeting the 75% standard.</p>}
          </section>
        </div>
      </div>
    </main>

    <Popup
      open={Boolean(selected)}
      onClose={() => setSelected(null)}
      title="Student Attendance Details"
      description={`${selected?.name ?? ""} · ${month}`}
      footer={<><Button variant="outline" onClick={() => setSelected(null)}>Close</Button><Button icon={<ReportIcon type="print" className="size-4" />} onClick={() => selected && printReport([selected], `${selected.name} – Attendance`)}>Print Student Report</Button></>}
    >
      {selected && (() => {
        const value = percentage(selected);
        const meta = toneMeta[toneOf(value)];
        return <div className="space-y-5">
          <div className="flex items-center gap-4 rounded-2xl bg-[linear-gradient(135deg,var(--app-sidebar-start),var(--app-accent-dark)_60%,var(--app-accent))] p-4 text-white"><div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/20 font-display text-lg font-bold">{initials(selected.name)}</div><div className="min-w-0"><h3 className="truncate font-display text-lg font-bold">{selected.name}</h3><p className="mt-1 truncate text-xs text-white/75">{selected.admissionNo} · {className}</p></div><div className="ml-auto text-right"><div className="font-display text-2xl font-bold">{value}%</div><div className="text-[0.62rem] text-white/75">{meta.label}</div></div></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Present", selected.present, "text-emerald-600 bg-emerald-50"], ["Absent", selected.absent, "text-red-500 bg-red-50"], ["Leave", selected.leave, "text-amber-600 bg-amber-50"], ["Total Days", selected.totalDays, "text-blue-600 bg-blue-50"]].map(([label, count, color]) => <div key={String(label)} className={`rounded-2xl p-4 text-center ${color}`}><div className="font-display text-xl font-bold">{count}</div><div className="mt-1 text-[0.6rem] font-bold uppercase tracking-wider">{label}</div></div>)}</div>
          {value < 75 && <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-xs leading-5 text-red-600">This student is below the minimum attendance standard. A guardian follow-up is recommended.</div>}
        </div>;
      })()}
    </Popup>
  </div>;
}
