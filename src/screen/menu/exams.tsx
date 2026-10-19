import { useMemo, useState, type ReactNode } from "react";
import { Button, Dropdown, Input, useToast } from "../../components";
import Header from "../../ui/header";
import Popup from "../../ui/popup";

type ExamStatus = "Upcoming" | "Active" | "Completed";
type Exam = {
  classes: string;
  endDate: string;
  id: number;
  name: string;
  session: string;
  startDate: string;
  status: ExamStatus;
  term: string;
};

const initialExams: Exam[] = [
  { id: 1, name: "Half Yearly Examination", term: "Term 1", session: "2027–28", classes: "Class 1–10", startDate: "2026-10-14", endDate: "2026-10-26", status: "Upcoming" },
  { id: 2, name: "Unit Test 2", term: "Term 1", session: "2027–28", classes: "Class 6–10", startDate: "2026-10-05", endDate: "2026-10-12", status: "Active" },
  { id: 3, name: "Unit Test 1", term: "Term 1", session: "2027–28", classes: "Class 1–10", startDate: "2026-07-12", endDate: "2026-07-16", status: "Completed" },
  { id: 4, name: "Annual Examination", term: "Term 2", session: "2026–27", classes: "Class 1–10", startDate: "2026-03-02", endDate: "2026-03-18", status: "Completed" },
];

const blankExam = { name: "", term: "Term 1", session: "2027–28", classes: "Class 1–10", startDate: "", endDate: "", status: "Upcoming" as ExamStatus };
const statuses: ExamStatus[] = ["Upcoming", "Active", "Completed"];
const statusMeta: Record<ExamStatus, { badge: string; bar: string; strip: string; tile: string }> = {
  Upcoming: { badge: "status-warning", bar: "bg-amber-500", strip: "from-amber-400 to-orange-400", tile: "bg-amber-50 text-amber-600 ring-amber-100" },
  Active: { badge: "status-info", bar: "bg-sky-500", strip: "from-sky-400 to-(--app-accent)", tile: "bg-sky-50 text-sky-600 ring-sky-100" },
  Completed: { badge: "status-success", bar: "bg-emerald-500", strip: "from-emerald-400 to-teal-400", tile: "bg-emerald-50 text-emerald-600 ring-emerald-100" },
};

type IconType = "exam" | "calendar" | "result" | "plus" | "edit" | "trash" | "copy" | "download" | "clock" | "check" | "eye" | "users" | "reset" | "play";

function ExamIcon({ type, className = "size-5" }: { type: IconType; className?: string }) {
  const paths: Record<IconType, ReactNode> = {
    exam: <><path d="M5 3h14v18H5z" /><path d="M9 8h6M9 12h6M9 16h4" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
    result: <path d="M4 19V9M10 19V5M16 19v-7M22 19V3" />,
    plus: <path d="M12 5v14M5 12h14" />,
    edit: <path d="M4 20h4L19 9l-4-4L4 16v4ZM13 7l4 4" />,
    trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" />,
    copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></>,
    download: <path d="M12 3v13M7 11l5 5 5-5M4 21h16" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    check: <path d="m5 12 5 5 9-10" />,
    eye: <><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>,
    reset: <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />,
    play: <path d="M7 4v16l13-8L7 4Z" />,
  };
  return <svg className={className} aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{paths[type]}</svg>;
}

const readableDate = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const shortDate = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
const dayDiff = (from: string, to: string) => Math.round((new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) / 86400000);
const todayIso = () => new Date().toISOString().slice(0, 10);
const csvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

function progressOf(exam: Exam) {
  const today = todayIso();
  const duration = dayDiff(exam.startDate, exam.endDate) + 1;
  if (exam.status === "Completed") return { percent: 100, label: "Results ready", duration };
  if (exam.status === "Upcoming") {
    const wait = dayDiff(today, exam.startDate);
    return { percent: 0, label: wait > 0 ? `Starts in ${wait} day${wait === 1 ? "" : "s"}` : wait === 0 ? "Starts today" : "Awaiting start", duration };
  }
  const day = Math.min(duration, Math.max(1, dayDiff(exam.startDate, today) + 1));
  return { percent: Math.max(8, Math.round((day / duration) * 100)), label: `Day ${day} of ${duration}`, duration };
}

function PanelHead({ icon, title, subtitle, action }: { icon: IconType; title: string; subtitle: string; action?: ReactNode }) {
  return <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5 border-b border-slate-100 px-3.5 py-3 max-sm:[&>:nth-child(2)]:w-full sm:px-5 sm:py-3.5">
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-(--app-accent-soft) text-(--app-accent-dark) ring-1 ring-(--app-accent)/20"><ExamIcon type={icon} /></span>
      <div className="min-w-0"><h2 className="font-display truncate text-sm font-bold tracking-tight text-slate-900">{title}</h2><p className="truncate text-xs text-slate-500">{subtitle}</p></div>
    </div>
    {action}
  </div>;
}

export default function Exams() {
  const [exams, setExams] = useState(initialExams);
  const [search, setSearch] = useState("");
  const [sessionFilter, setSessionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | ExamStatus>("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(blankExam);
  const [saving, setSaving] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Exam | null>(null);
  const { showToast } = useToast();

  const counts = useMemo(() => ({
    all: exams.length,
    Upcoming: exams.filter((e) => e.status === "Upcoming").length,
    Active: exams.filter((e) => e.status === "Active").length,
    Completed: exams.filter((e) => e.status === "Completed").length,
  }), [exams]);

  const filteredExams = useMemo(() => {
    const term = search.trim().toLowerCase();
    return exams
      .filter((exam) => (!term || `${exam.name} ${exam.term} ${exam.classes}`.toLowerCase().includes(term)) && (!sessionFilter || exam.session === sessionFilter) && (!statusFilter || exam.status === statusFilter))
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [exams, search, sessionFilter, statusFilter]);

  const spotlight = exams.find((e) => e.status === "Active") ?? [...exams].filter((e) => e.status === "Upcoming").sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
  const hasFilters = Boolean(search || sessionFilter || statusFilter);
  const resetFilters = () => { setSearch(""); setSessionFilter(""); setStatusFilter(""); };

  const setField = (key: keyof typeof blankExam, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const openCreate = () => { setEditingId(null); setForm(blankExam); setEditorOpen(true); };
  const openEdit = (exam: Exam) => {
    setEditingId(exam.id);
    setForm({ name: exam.name, term: exam.term, session: exam.session, classes: exam.classes, startDate: exam.startDate, endDate: exam.endDate, status: exam.status });
    setSelectedExam(null);
    setEditorOpen(true);
  };

  const saveExam = async () => {
    if (!form.name.trim() || !form.startDate || !form.endDate) {
      showToast("Exam Name, Start Date, and End Date are required.", { title: "Complete required fields", tone: "error" });
      return;
    }
    if (form.endDate < form.startDate) {
      showToast("End Date must be after the Start Date.", { title: "Invalid exam dates", tone: "error" });
      return;
    }
    setSaving(true);
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    if (editingId) setExams((current) => current.map((exam) => exam.id === editingId ? { ...exam, ...form } : exam));
    else setExams((current) => [{ id: Date.now(), ...form }, ...current]);
    setSaving(false);
    setEditorOpen(false);
    showToast(`${form.name} was ${editingId ? "updated" : "created"} successfully.`, { title: editingId ? "Exam updated" : "Exam created" });
  };

  const changeStatus = (exam: Exam, status: ExamStatus) => {
    setExams((current) => current.map((item) => item.id === exam.id ? { ...item, status } : item));
    setSelectedExam((current) => current && current.id === exam.id ? { ...current, status } : current);
    showToast(`${exam.name} is now marked ${status.toLowerCase()}.`, { title: "Exam status updated" });
  };

  const duplicateExam = (exam: Exam) => {
    setExams((current) => [{ ...exam, id: Date.now(), name: `${exam.name} (Copy)`, status: "Upcoming" }, ...current]);
    showToast(`A copy of ${exam.name} was added as upcoming.`, { title: "Exam duplicated" });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setExams((current) => current.filter((exam) => exam.id !== deleteTarget.id));
    showToast(`${deleteTarget.name} was removed.`, { title: "Exam deleted", tone: "info" });
    setDeleteTarget(null);
    setSelectedExam(null);
  };

  const exportCsv = () => {
    if (!filteredExams.length) { showToast("There are no examinations to export.", { title: "Nothing to export", tone: "error" }); return; }
    const head = ["Exam", "Term", "Classes", "Academic Year", "Start Date", "End Date", "Status"].map(csvCell).join(",");
    const lines = filteredExams.map((e) => [e.name, e.term, e.classes, e.session, e.startDate, e.endDate, e.status].map(csvCell).join(","));
    const url = URL.createObjectURL(new Blob([[head, ...lines].join("\n")], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url; link.download = "examinations.csv"; link.click();
    URL.revokeObjectURL(url);
    showToast(`${filteredExams.length} examinations exported to CSV.`, { title: "Export ready" });
  };

  const stats: { label: string; value: number; copy: string; tone: string; icon: IconType }[] = [
    { label: "Total Exams", value: counts.all, copy: "Across all sessions", tone: "teal", icon: "exam" },
    { label: "Upcoming", value: counts.Upcoming, copy: "Scheduled exams", tone: "amber", icon: "calendar" },
    { label: "Active", value: counts.Active, copy: "Currently running", tone: "green", icon: "clock" },
    { label: "Completed", value: counts.Completed, copy: "Results ready", tone: "violet", icon: "check" },
  ];

  return <div className="min-h-screen dashboard-bg pb-16">
    <Header title="Examinations" subtitle="Create exams, manage schedules, and track examination status" />
    <main className="space-y-4 p-3 sm:space-y-5 sm:p-6 xl:p-8">
      <section className="grid auto-rows-fr grid-cols-[repeat(2,minmax(0,1fr))] gap-2.5 sm:gap-3 xl:grid-cols-[repeat(4,minmax(0,1fr))] [&>article]:h-full">
        {stats.map((stat) => <article key={stat.label} className={`admission-summary-card admission-summary-${stat.tone} relative overflow-hidden rounded-2xl p-3 shadow-sm sm:p-5`}>
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="min-w-0"><div className="truncate text-[0.7rem] font-semibold text-slate-500 sm:text-xs">{stat.label}</div><div className="mt-1 truncate font-display text-xl font-bold text-slate-950 sm:text-2xl">{stat.value}</div></div>
            <span className="admission-summary-icon grid size-8 shrink-0 place-items-center rounded-xl sm:size-10"><ExamIcon type={stat.icon} className="size-4 sm:size-5" /></span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[0.7rem] font-medium text-slate-500 sm:mt-3 sm:text-xs"><span className="size-1.5 shrink-0 rounded-full bg-current opacity-50" /><span className="truncate">{stat.copy}</span></div>
        </article>)}
      </section>

      {spotlight && (() => {
        const progress = progressOf(spotlight);
        return <section className="relative overflow-hidden rounded-2xl bg-[linear-gradient(135deg,var(--app-sidebar-start),var(--app-accent-dark)_60%,var(--app-accent))] p-4 text-white shadow-lg sm:p-5">
          <div className="pointer-events-none absolute -right-10 -top-12 size-44 rounded-full bg-white/10" aria-hidden="true" />
          <div className="relative flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/15 ring-1 ring-white/25"><ExamIcon type={spotlight.status === "Active" ? "clock" : "calendar"} /></span>
              <div className="min-w-0">
                <p className="text-[0.65rem] font-bold uppercase tracking-widest text-white/70">{spotlight.status === "Active" ? "Happening now" : "Next up"}</p>
                <h2 className="font-display truncate text-base font-bold sm:text-lg">{spotlight.name}</h2>
                <p className="text-xs text-white/80">{shortDate(spotlight.startDate)} – {shortDate(spotlight.endDate)} · {spotlight.classes} · {progress.label}</p>
              </div>
            </div>
            <Button variant="outline" className="max-sm:w-full! border-white/40! bg-white/15! text-white! hover:bg-white/25!" onClick={() => setSelectedExam(spotlight)} icon={<ExamIcon type="eye" className="size-4" />}>View Details</Button>
          </div>
          <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-white transition-all" style={{ width: `${progress.percent}%` }} /></div>
        </section>;
      })()}

      <section className="panel overflow-hidden">
        <PanelHead icon="exam" title="Exam Directory" subtitle={`${filteredExams.length} of ${exams.length} examination records`} action={
          <div className="flex gap-2 max-sm:w-full max-sm:[&>*]:flex-1">
            <Button variant="outline" onClick={exportCsv} icon={<ExamIcon type="download" className="size-4" />}>Export</Button>
            <Button onClick={openCreate} icon={<ExamIcon type="plus" className="size-4" />}>Create Exam</Button>
          </div>
        } />

        <div className="space-y-3 border-b border-slate-100 p-3.5 sm:p-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-stretch gap-2.5 max-sm:[&>:first-child]:col-span-2 max-sm:[&>button]:min-w-28 sm:grid-cols-[1fr_12rem_auto] sm:gap-3">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search exam, term or classes..." aria-label="Search exams" />
            <Dropdown value={sessionFilter} onChange={(event) => setSessionFilter(event.target.value)} placeholder="All Sessions" aria-label="Session filter" options={["2026–27", "2027–28"].map((value) => ({ label: value, value }))} />
            <Button variant="outline" onClick={resetFilters} disabled={!hasFilters} icon={<ExamIcon type="reset" className="size-4" />} className="border-rose-200! bg-linear-to-r! from-rose-50! to-orange-50! text-rose-600! shadow-sm hover:from-rose-100! hover:to-orange-100! active:scale-95">Reset</Button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {([["", "All", counts.all], ...statuses.map((s) => [s, s, counts[s]])] as [string, string, number][]).map(([value, label, count]) => {
              const on = statusFilter === value;
              return <button key={label} type="button" onClick={() => setStatusFilter(value as "" | ExamStatus)} className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition active:scale-95 ${on ? "border-transparent bg-(--app-accent-dark) text-white shadow-md" : "border-slate-200 bg-white text-slate-600 hover:border-(--app-accent)/40 hover:bg-(--app-accent-faint)"}`}>
                {label}<span className={`rounded-full px-1.5 py-0.5 text-[0.65rem] ${on ? "bg-white/25" : "bg-slate-100 text-slate-500"}`}>{count}</span>
              </button>;
            })}
          </div>
        </div>

        {filteredExams.length ? <div className="grid gap-3 p-3.5 sm:grid-cols-2 sm:gap-4 sm:p-4 2xl:grid-cols-3">
          {filteredExams.map((exam) => {
            const meta = statusMeta[exam.status];
            const progress = progressOf(exam);
            return <article key={exam.id} className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className={`h-1.5 bg-linear-to-r ${meta.strip}`} />
              <div className="flex flex-1 flex-col gap-3.5 p-4">
                <div className="flex items-start gap-3">
                  <span className={`grid size-11 shrink-0 place-items-center rounded-xl ring-1 ${meta.tile}`}><ExamIcon type="exam" /></span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display truncate text-sm font-bold text-slate-900">{exam.name}</h3>
                    <p className="truncate text-xs text-slate-500">{exam.term} · {exam.session}</p>
                  </div>
                  <span className={meta.badge}>{exam.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-slate-50 p-2.5"><div className="flex items-center gap-1.5 text-[0.62rem] font-bold uppercase tracking-wider text-slate-400"><ExamIcon type="calendar" className="size-3" />Dates</div><div className="mt-1 font-semibold text-slate-800">{shortDate(exam.startDate)} – {shortDate(exam.endDate)}</div></div>
                  <div className="rounded-xl bg-slate-50 p-2.5"><div className="flex items-center gap-1.5 text-[0.62rem] font-bold uppercase tracking-wider text-slate-400"><ExamIcon type="users" className="size-3" />Classes</div><div className="mt-1 truncate font-semibold text-slate-800">{exam.classes}</div></div>
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-[0.7rem]"><span className="font-semibold text-slate-600">{progress.label}</span><span className="text-slate-400">{progress.duration} day{progress.duration === 1 ? "" : "s"}</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${meta.bar}`} style={{ width: `${progress.percent}%` }} /></div>
                </div>
                <div className="mt-auto flex items-center gap-2 border-t border-slate-100 pt-3">
                  <Button variant="outline" className="min-h-8 flex-1 px-3 py-1.5 text-xs" onClick={() => setSelectedExam(exam)} icon={<ExamIcon type="eye" className="size-3.5" />}>View</Button>
                  <Button variant="secondary" className="min-h-8 flex-1 px-3 py-1.5 text-xs" onClick={() => openEdit(exam)} icon={<ExamIcon type="edit" className="size-3.5" />}>Edit</Button>
                  <button type="button" onClick={() => duplicateExam(exam)} aria-label={`Duplicate ${exam.name}`} title="Duplicate" className="grid size-8 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-(--app-accent-dark) active:scale-95"><ExamIcon type="copy" className="size-4" /></button>
                  <button type="button" onClick={() => setDeleteTarget(exam)} aria-label={`Delete ${exam.name}`} title="Delete" className="grid size-8 shrink-0 place-items-center rounded-lg border border-rose-200 text-rose-500 transition hover:bg-rose-50 active:scale-95"><ExamIcon type="trash" className="size-4" /></button>
                </div>
              </div>
            </article>;
          })}
        </div> : <div className="grid min-h-60 place-items-center p-6 text-center"><div>
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-(--app-accent-soft) text-(--app-accent-dark)"><ExamIcon type="exam" /></div>
          <h3 className="font-display mt-4 text-sm font-bold text-slate-700">No examinations found</h3>
          <p className="mt-1 text-xs text-slate-400">{hasFilters ? "Try changing or clearing the filters." : "Create your first exam to get started."}</p>
          <div className="mt-4 flex justify-center gap-2">{hasFilters && <Button variant="outline" onClick={resetFilters}>Clear Filters</Button>}<Button onClick={openCreate} icon={<ExamIcon type="plus" className="size-4" />}>Create Exam</Button></div>
        </div></div>}
      </section>
    </main>

    <Popup
      open={editorOpen}
      onClose={() => !saving && setEditorOpen(false)}
      title={editingId ? "Edit Examination" : "Create Examination"}
      description="Define the exam period, participating classes, and initial status."
      footer={<><Button variant="outline" onClick={() => setEditorOpen(false)} disabled={saving}>Cancel</Button><Button onClick={saveExam} isLoading={saving} loadingText={editingId ? "Updating exam..." : "Creating exam..."}>{editingId ? "Update Exam" : "Create Exam"}</Button></>}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Input label="Exam Name *" value={form.name} onChange={(event) => setField("name", event.target.value)} placeholder="e.g. Half Yearly Examination" /></div>
        <Dropdown label="Term" value={form.term} onChange={(event) => setField("term", event.target.value)} options={["Term 1", "Term 2", "Annual"].map((value) => ({ label: value, value }))} />
        <Dropdown label="Academic Year" value={form.session} onChange={(event) => setField("session", event.target.value)} options={["2026–27", "2027–28"].map((value) => ({ label: value, value }))} />
        <Dropdown label="Participating Classes" value={form.classes} onChange={(event) => setField("classes", event.target.value)} options={["All Classes", "Class 1–5", "Class 6–10", "Class 1–10"].map((value) => ({ label: value, value }))} />
        <Dropdown label="Status" value={form.status} onChange={(event) => setField("status", event.target.value)} options={statuses.map((value) => ({ label: value, value }))} />
        <Input label="Start Date *" type="date" value={form.startDate} onChange={(event) => setField("startDate", event.target.value)} />
        <Input label="End Date *" type="date" value={form.endDate} onChange={(event) => setField("endDate", event.target.value)} />
        {form.startDate && form.endDate && form.endDate >= form.startDate && <p className="rounded-xl bg-(--app-accent-faint) px-3 py-2 text-xs font-medium text-(--app-accent-dark) sm:col-span-2">Exam runs for {dayDiff(form.startDate, form.endDate) + 1} day{dayDiff(form.startDate, form.endDate) ? "s" : ""}.</p>}
      </div>
    </Popup>

    <Popup
      open={Boolean(selectedExam)}
      onClose={() => setSelectedExam(null)}
      title="Examination Details"
      description={selectedExam?.name}
      footer={selectedExam && <>
        <Button variant="outline" onClick={() => setSelectedExam(null)}>Close</Button>
        <Button variant="secondary" onClick={() => openEdit(selectedExam)} icon={<ExamIcon type="edit" className="size-4" />}>Edit</Button>
        {selectedExam.status === "Upcoming" && <Button variant="success" onClick={() => changeStatus(selectedExam, "Active")} icon={<ExamIcon type="play" className="size-4" />}>Start Exam</Button>}
        {selectedExam.status === "Active" && <Button onClick={() => changeStatus(selectedExam, "Completed")} icon={<ExamIcon type="check" className="size-4" />}>Mark Completed</Button>}
      </>}
    >
      {selectedExam && (() => {
        const progress = progressOf(selectedExam);
        const meta = statusMeta[selectedExam.status];
        return <div className="space-y-5">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3"><span className={meta.badge}>{selectedExam.status}</span><span className="text-xs font-semibold text-slate-600">{progress.label}</span></div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><div className={`h-full rounded-full ${meta.bar}`} style={{ width: `${progress.percent}%` }} /></div>
            <div className="mt-2 flex justify-between text-[0.7rem] text-slate-500"><span>{readableDate(selectedExam.startDate)}</span><span>{readableDate(selectedExam.endDate)}</span></div>
          </div>
          <dl className="grid grid-cols-2 gap-3">{[["Term", selectedExam.term], ["Academic Year", selectedExam.session], ["Classes", selectedExam.classes], ["Duration", `${progress.duration} day${progress.duration === 1 ? "" : "s"}`]].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-100 p-3"><dt className="text-[0.62rem] font-bold uppercase tracking-wider text-slate-400">{label}</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{value}</dd></div>)}</dl>
          <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
            <Button variant="outline" onClick={() => showToast("Exam schedule is ready to manage.", { title: "Schedule opened", tone: "info" })} icon={<ExamIcon type="calendar" className="size-4" />}>Exam Schedule</Button>
            <Button variant="outline" onClick={() => showToast("Marks entry is ready for this examination.", { title: "Marks entry opened", tone: "info" })} icon={<ExamIcon type="result" className="size-4" />}>Marks Entry</Button>
          </div>
        </div>;
      })()}
    </Popup>

    <Popup
      open={Boolean(deleteTarget)}
      onClose={() => setDeleteTarget(null)}
      title="Delete Examination"
      description="This removes the exam from the directory."
      footer={<><Button variant="outline" onClick={() => setDeleteTarget(null)}>Keep Exam</Button><Button variant="danger" onClick={confirmDelete} icon={<ExamIcon type="trash" className="size-4" />}>Delete Exam</Button></>}
    >
      {deleteTarget && <div className="flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-rose-500 ring-1 ring-rose-100"><ExamIcon type="trash" /></span>
        <p className="text-sm text-slate-700">Are you sure you want to delete <strong>{deleteTarget.name}</strong> ({deleteTarget.term}, {deleteTarget.session})? This cannot be undone.</p>
      </div>}
    </Popup>
  </div>;
}
