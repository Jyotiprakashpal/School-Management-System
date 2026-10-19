import { useMemo, useState, type ReactNode } from "react";
import { AdmitCardPrint, Button, Dropdown, Input, useToast } from "../../components";
import Header from "../../ui/header";
import Popup from "../../ui/popup";

type Schedule = {
  className: string;
  date: string;
  endTime: string;
  exam: string;
  id: number;
  invigilator: string;
  maxMarks: string;
  room: string;
  startTime: string;
  subject: string;
};

const HY = "Half Yearly Examination";
const UT = "Unit Test 2";
const AN = "Annual Examination";
const exams = [HY, UT, AN];
const classOptions = ["Class 8-A", "Class 9-A", "Class 10-A", "Class 10-B"];
const subjects = ["English", "Mathematics", "Science", "Social Studies", "Hindi", "Computer"];
const rooms = ["Room 10", "Room 9", "Science Hall", "Main Hall"];
const invigilators = ["Priya Sharma", "Ravi Verma", "Neha Singh", "Anjali Gupta"];

const initialSchedules: Schedule[] = [
  { id: 1, exam: HY, date: "2026-10-14", subject: "English", className: "Class 10-A", startTime: "09:00", endTime: "12:00", room: "Room 10", invigilator: "Priya Sharma", maxMarks: "100" },
  { id: 2, exam: HY, date: "2026-10-16", subject: "Mathematics", className: "Class 10-A", startTime: "09:00", endTime: "12:00", room: "Room 10", invigilator: "Ravi Verma", maxMarks: "100" },
  { id: 3, exam: HY, date: "2026-10-18", subject: "Science", className: "Class 10-A", startTime: "09:00", endTime: "12:00", room: "Science Hall", invigilator: "Neha Singh", maxMarks: "100" },
  { id: 4, exam: HY, date: "2026-10-21", subject: "Social Studies", className: "Class 10-A", startTime: "09:00", endTime: "11:30", room: "Room 10", invigilator: "Anjali Gupta", maxMarks: "80" },
  { id: 5, exam: HY, date: "2026-10-14", subject: "Hindi", className: "Class 9-A", startTime: "09:00", endTime: "11:30", room: "Room 9", invigilator: "Anjali Gupta", maxMarks: "80" },
  { id: 6, exam: HY, date: "2026-10-16", subject: "Science", className: "Class 9-A", startTime: "09:00", endTime: "12:00", room: "Science Hall", invigilator: "Neha Singh", maxMarks: "100" },
  { id: 7, exam: UT, date: "2026-10-05", subject: "English", className: "Class 10-A", startTime: "10:00", endTime: "11:00", room: "Room 10", invigilator: "Priya Sharma", maxMarks: "25" },
  { id: 8, exam: UT, date: "2026-10-06", subject: "Mathematics", className: "Class 10-A", startTime: "10:00", endTime: "11:00", room: "Room 10", invigilator: "Ravi Verma", maxMarks: "25" },
  { id: 9, exam: UT, date: "2026-10-09", subject: "Science", className: "Class 10-A", startTime: "10:00", endTime: "11:00", room: "Science Hall", invigilator: "Neha Singh", maxMarks: "25" },
];

const blankSchedule = { date: "", subject: "", className: "Class 10-A", startTime: "09:00", endTime: "12:00", room: "", invigilator: "", maxMarks: "100" };
const csvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

type IconType = "calendar" | "card" | "clock" | "room" | "plus" | "edit" | "trash" | "copy" | "download" | "print" | "search" | "reset" | "user" | "check" | "alert";

function ScheduleIcon({ type, className = "size-5" }: { type: IconType; className?: string }) {
  const paths: Record<IconType, ReactNode> = {
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
    card: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8" cy="10" r="2" /><path d="M5 16c.8-2.2 5.2-2.2 6 0M14 9h4M14 13h4" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    room: <path d="M4 21V4h12v17M16 9h4v12M8 8h4M8 12h4M8 16h4M2 21h20" />,
    plus: <path d="M12 5v14M5 12h14" />,
    edit: <path d="M4 20h4L19 9l-4-4L4 16v4ZM13 7l4 4" />,
    trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" />,
    copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></>,
    download: <path d="M12 3v13M7 11l5 5 5-5M4 21h16" />,
    print: <path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    reset: <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    check: <path d="m5 12 5 5 9-10" />,
    alert: <><path d="M12 3 2 20h20L12 3Z" /><path d="M12 10v4M12 17h.01" /></>,
  };
  return <svg className={className} aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{paths[type]}</svg>;
}

function PanelHead({ icon, title, subtitle, action }: { icon: IconType; title: string; subtitle: string; action?: ReactNode }) {
  return <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5 border-b border-slate-100 px-3.5 py-3 max-sm:[&>:nth-child(2)]:w-full sm:px-5 sm:py-3.5">
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-(--app-accent-soft) text-(--app-accent-dark) ring-1 ring-(--app-accent)/20"><ScheduleIcon type={icon} /></span>
      <div className="min-w-0"><h2 className="font-display truncate text-sm font-bold tracking-tight text-slate-900">{title}</h2><p className="truncate text-xs text-slate-500">{subtitle}</p></div>
    </div>
    {action}
  </div>;
}

const resetClass = "border-rose-200! bg-linear-to-r! from-rose-50! to-orange-50! text-rose-600! shadow-sm hover:from-rose-100! hover:to-orange-100! active:scale-95";
const footerGrid = "!grid grid-cols-2 items-stretch gap-2.5 sm:!flex [&>button]:h-11 [&>button]:w-full sm:[&>button]:w-auto";

const parse = (value: string) => new Date(`${value}T00:00:00`);
const todayIso = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`; };
const daysFromToday = (value: string) => Math.round((parse(value).getTime() - parse(todayIso()).getTime()) / 86400000);
const readableDate = (value: string) => parse(value).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
const minutes = (time: string) => Number(time.split(":")[0]) * 60 + Number(time.split(":")[1]);
const durationLabel = (schedule: Schedule) => { const total = minutes(schedule.endTime) - minutes(schedule.startTime); return `${Math.floor(total / 60)}h${total % 60 ? ` ${total % 60}m` : ""}`; };
const clock = (time: string) => { const [h, m] = time.split(":").map(Number); return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`; };
const dayLabel = (value: string) => { const diff = daysFromToday(value); return diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : diff > 1 ? `In ${diff} days` : diff === -1 ? "Yesterday" : `${-diff} days ago`; };
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);

type When = "All" | "Upcoming" | "Today" | "Completed";
const whenOf = (schedule: Schedule): Exclude<When, "All"> => { const diff = daysFromToday(schedule.date); return diff === 0 ? "Today" : diff > 0 ? "Upcoming" : "Completed"; };
const whenStyle: Record<Exclude<When, "All">, { badge: string; strip: string; tile: string }> = {
  Upcoming: { badge: "status-info", strip: "max-sm:bg-linear-to-r max-sm:from-sky-600 max-sm:to-indigo-500", tile: "bg-sky-50 text-sky-700 ring-sky-100" },
  Today: { badge: "status-warning", strip: "max-sm:bg-linear-to-r max-sm:from-amber-500 max-sm:to-orange-500", tile: "bg-amber-50 text-amber-700 ring-amber-100" },
  Completed: { badge: "status-success", strip: "max-sm:bg-linear-to-r max-sm:from-emerald-600 max-sm:to-teal-500", tile: "bg-emerald-50 text-emerald-700 ring-emerald-100" },
};

export default function ExamSchedule() {
  const [exam, setExam] = useState(HY);
  const [classFilter, setClassFilter] = useState("Class 10-A");
  const [schedules, setSchedules] = useState(initialSchedules);
  const [query, setQuery] = useState("");
  const [when, setWhen] = useState<When>("All");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(blankSchedule);
  const [saving, setSaving] = useState(false);
  const [deleteSchedule, setDeleteSchedule] = useState<Schedule | null>(null);
  const [admitCardOpen, setAdmitCardOpen] = useState(false);
  const { showToast } = useToast();

  const scoped = useMemo(() => schedules.filter((schedule) => schedule.exam === exam && schedule.className === classFilter).sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)), [schedules, exam, classFilter]);
  const visible = scoped.filter((schedule) => {
    const term = query.trim().toLowerCase();
    return (!term || `${schedule.subject} ${schedule.room} ${schedule.invigilator}`.toLowerCase().includes(term)) && (when === "All" || whenOf(schedule) === when);
  });
  const groups = useMemo(() => {
    const map = new Map<string, Schedule[]>();
    visible.forEach((schedule) => map.set(schedule.date, [...(map.get(schedule.date) ?? []), schedule]));
    return [...map.entries()];
  }, [visible]);

  const examDays = new Set(scoped.map((schedule) => schedule.date)).size;
  const roomCount = new Set(scoped.map((schedule) => schedule.room)).size;
  const staffCount = new Set(scoped.map((schedule) => schedule.invigilator)).size;
  const totalMarks = scoped.reduce((sum, schedule) => sum + Number(schedule.maxMarks || 0), 0);
  const next = scoped.find((schedule) => daysFromToday(schedule.date) >= 0);
  const completed = scoped.filter((schedule) => whenOf(schedule) === "Completed").length;
  const progress = scoped.length ? Math.round((completed / scoped.length) * 100) : 0;
  const filtersActive = Boolean(query) || when !== "All";
  const roomUsage = rooms.map((room) => [room, scoped.filter((schedule) => schedule.room === room).length] as const).filter(([, count]) => count);
  const chips: { id: When; count: number }[] = [
    { id: "All", count: scoped.length },
    { id: "Upcoming", count: scoped.filter((schedule) => whenOf(schedule) === "Upcoming").length },
    { id: "Today", count: scoped.filter((schedule) => whenOf(schedule) === "Today").length },
    { id: "Completed", count: completed },
  ];

  const stats = [
    { label: "Exam Papers", value: scoped.length, tone: "teal", copy: `${totalMarks} total marks`, icon: "card" as IconType },
    { label: "Exam Days", value: examDays, tone: "green", copy: "Unique schedule dates", icon: "calendar" as IconType },
    { label: "Rooms Used", value: roomCount, tone: "amber", copy: "Across this exam", icon: "room" as IconType },
    { label: "Invigilators", value: staffCount, tone: "violet", copy: "Assigned staff", icon: "user" as IconType },
  ];

  const openCreate = () => { setEditingId(null); setForm({ ...blankSchedule, className: classFilter }); setEditorOpen(true); };
  const openEdit = (schedule: Schedule) => {
    setEditingId(schedule.id);
    setForm({ date: schedule.date, subject: schedule.subject, className: schedule.className, startTime: schedule.startTime, endTime: schedule.endTime, room: schedule.room, invigilator: schedule.invigilator, maxMarks: schedule.maxMarks });
    setEditorOpen(true);
  };
  const duplicate = (schedule: Schedule) => {
    const nextDate = new Date(parse(schedule.date).getTime() + 86400000);
    const iso = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}-${String(nextDate.getDate()).padStart(2, "0")}`;
    setEditingId(null);
    setForm({ date: iso, subject: "", className: schedule.className, startTime: schedule.startTime, endTime: schedule.endTime, room: schedule.room, invigilator: schedule.invigilator, maxMarks: schedule.maxMarks });
    setEditorOpen(true);
    showToast("Timings, room and invigilator were copied. Choose the next subject.", { title: "Paper duplicated", tone: "info" });
  };

  const saveSchedule = async () => {
    if (!form.date || !form.subject || !form.room || !form.invigilator) {
      showToast("Date, Subject, Room, and Invigilator are required.", { title: "Complete required fields", tone: "error" });
      return;
    }
    if (form.endTime <= form.startTime) {
      showToast("End Time must be after Start Time.", { title: "Invalid exam time", tone: "error" });
      return;
    }
    if (Number(form.maxMarks) < 1) {
      showToast("Maximum marks must be at least 1.", { title: "Invalid marks", tone: "error" });
      return;
    }
    const overlaps = (other: Schedule) => other.id !== editingId && other.date === form.date && other.startTime < form.endTime && form.startTime < other.endTime;
    if (schedules.some((other) => overlaps(other) && other.room === form.room)) {
      showToast(`${form.room} is already occupied during the selected time.`, { title: "Room conflict detected", tone: "error" });
      return;
    }
    if (schedules.some((other) => overlaps(other) && other.invigilator === form.invigilator)) {
      showToast(`${form.invigilator} is already invigilating another paper at this time.`, { title: "Invigilator conflict detected", tone: "error" });
      return;
    }
    if (schedules.some((other) => other.id !== editingId && other.exam === exam && other.className === form.className && other.subject === form.subject)) {
      showToast(`${form.subject} is already scheduled for ${form.className} in this examination.`, { title: "Duplicate paper", tone: "error" });
      return;
    }
    setSaving(true);
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    if (editingId) setSchedules((current) => current.map((schedule) => schedule.id === editingId ? { ...schedule, ...form } : schedule));
    else setSchedules((current) => [...current, { id: Date.now(), exam, ...form }]);
    setSaving(false);
    setEditorOpen(false);
    if (form.className !== classFilter) setClassFilter(form.className);
    showToast(`${form.subject} schedule was ${editingId ? "updated" : "added"} successfully.`, { title: editingId ? "Schedule updated" : "Exam scheduled" });
  };

  const confirmDelete = () => {
    if (!deleteSchedule) return;
    setSchedules((current) => current.filter((schedule) => schedule.id !== deleteSchedule.id));
    showToast(`${deleteSchedule.subject} was removed from the exam schedule.`, { title: "Schedule removed", tone: "info" });
    setDeleteSchedule(null);
  };

  const exportCsv = () => {
    const rows = [["Exam", "Class", "Date", "Subject", "Start", "End", "Duration", "Room", "Invigilator", "Max Marks"], ...scoped.map((schedule) => [schedule.exam, schedule.className, schedule.date, schedule.subject, schedule.startTime, schedule.endTime, durationLabel(schedule), schedule.room, schedule.invigilator, schedule.maxMarks])];
    const url = URL.createObjectURL(new Blob([rows.map((row) => row.map(csvCell).join(",")).join("\n")], { type: "text/csv" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `exam-schedule-${classFilter}.csv`.replace(/\s+/g, "-").toLowerCase();
    anchor.click();
    URL.revokeObjectURL(url);
    showToast("Exam schedule exported as CSV.", { title: "Export ready" });
  };

  const printSchedule = () => {
    if (!scoped.length) { showToast("There are no papers to print for this class.", { title: "Nothing to print", tone: "error" }); return; }
    const frame = document.createElement("iframe");
    frame.style.cssText = "position:fixed;width:0;height:0;border:0;right:0;bottom:0";
    document.body.appendChild(frame);
    const doc = frame.contentDocument;
    if (!doc) { frame.remove(); return; }
    doc.open();
    doc.write(`<html><head><title>Exam Schedule</title><style>body{font-family:Arial,sans-serif;padding:32px;color:#0f172a}h1{margin:0;font-size:22px}p{margin:4px 0 20px;color:#64748b;font-size:13px}table{width:100%;border-collapse:collapse;font-size:13px}th,td{border:1px solid #cbd5e1;padding:8px 10px;text-align:left}th{background:#f1f5f9;font-size:11px;text-transform:uppercase;letter-spacing:.05em}</style></head><body><h1>${escapeHtml(exam)}</h1><p>${escapeHtml(classFilter)} · Session 2027–28 · ${scoped.length} papers</p><table><thead><tr><th>Date</th><th>Subject</th><th>Time</th><th>Duration</th><th>Room</th><th>Invigilator</th><th>Marks</th></tr></thead><tbody>${scoped.map((schedule) => `<tr><td>${escapeHtml(readableDate(schedule.date))}</td><td>${escapeHtml(schedule.subject)}</td><td>${clock(schedule.startTime)} – ${clock(schedule.endTime)}</td><td>${durationLabel(schedule)}</td><td>${escapeHtml(schedule.room)}</td><td>${escapeHtml(schedule.invigilator)}</td><td>${escapeHtml(schedule.maxMarks)}</td></tr>`).join("")}</tbody></table></body></html>`);
    doc.close();
    frame.contentWindow?.focus();
    window.setTimeout(() => { frame.contentWindow?.print(); window.setTimeout(() => frame.remove(), 1000); }, 250);
  };

  if (admitCardOpen) return <AdmitCardPrint examName={exam} className={classFilter} schedules={scoped} onBack={() => setAdmitCardOpen(false)} />;

  const setField = (field: keyof typeof blankSchedule, value: string) => setForm((current) => ({ ...current, [field]: value }));

  return <div className="min-h-screen dashboard-bg pb-16">
    <Header title="Exam Schedule" subtitle="Plan examination dates, rooms, timings, and invigilation duties" />
    <main className="space-y-4 p-3 sm:space-y-5 sm:p-6 xl:p-8">
      <section className="panel overflow-hidden">
        <PanelHead icon="calendar" title="Schedule Filters" subtitle="Choose an examination and class" action={<span className="status-info">Session 2027–28</span>} />
        <div className="grid grid-cols-2 items-end gap-x-3 gap-y-3.5 p-3.5 sm:gap-x-4 sm:p-5 [&>:first-child]:col-span-2 sm:[&>:first-child]:col-span-1">
          <Dropdown label="Examination" value={exam} onChange={(event) => { setExam(event.target.value); setWhen("All"); }} options={exams.map((value) => ({ label: value, value }))} />
          <Dropdown label="Class & Section" value={classFilter} onChange={(event) => { setClassFilter(event.target.value); setWhen("All"); }} options={classOptions.map((value) => ({ label: value, value }))} />
        </div>
      </section>

      <section className="grid auto-rows-fr grid-cols-[repeat(2,minmax(0,1fr))] gap-2.5 sm:gap-3 xl:grid-cols-[repeat(4,minmax(0,1fr))] [&>article]:h-full">
        {stats.map((stat) => <article key={stat.label} className={`admission-summary-card admission-summary-${stat.tone} relative overflow-hidden rounded-2xl p-3 shadow-sm sm:p-5`}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0"><div className="truncate text-[0.7rem] font-medium text-slate-500 sm:text-xs">{stat.label}</div><div className="mt-1 font-display text-2xl font-bold text-slate-950 sm:text-3xl">{stat.value}</div></div>
            <span className="admission-summary-icon grid size-8 shrink-0 place-items-center rounded-xl sm:size-10"><ScheduleIcon type={stat.icon} className="size-4 sm:size-5" /></span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[0.62rem] text-slate-500 sm:mt-3 sm:text-xs"><span className="size-1.5 shrink-0 rounded-full bg-current opacity-60" /><span className="truncate">{stat.copy}</span></div>
        </article>)}
      </section>

      {next && <section className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,var(--app-sidebar-start),var(--app-accent-dark)_60%,var(--app-accent))] p-4 text-white shadow-lg sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 size-44 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-wrap items-center gap-x-5 gap-y-4">
          <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-white/15 text-center ring-1 ring-white/25 backdrop-blur-sm"><div><div className="font-display text-2xl font-bold leading-none">{parse(next.date).getDate()}</div><div className="mt-1 text-[0.62rem] font-bold uppercase tracking-wider text-white/80">{parse(next.date).toLocaleDateString("en-IN", { month: "short" })}</div></div></div>
          <div className="min-w-0 flex-1 basis-56">
            <div className="text-[0.65rem] font-bold uppercase tracking-widest text-white/70">Next paper · {dayLabel(next.date)}</div>
            <h2 className="font-display mt-1 truncate text-xl font-bold sm:text-2xl">{next.subject}</h2>
            <p className="mt-1 text-xs text-white/80">{clock(next.startTime)} – {clock(next.endTime)} · {next.room} · {next.invigilator}</p>
          </div>
          <div className="w-full sm:w-52">
            <div className="flex justify-between text-[0.65rem] font-semibold text-white/80"><span>Exam progress</span><span>{completed}/{scoped.length} done</span></div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${progress}%` }} /></div>
          </div>
        </div>
      </section>}

      <div className="grid items-start gap-4 sm:gap-5 xl:grid-cols-[1fr_20rem]">
        <section className="panel overflow-hidden">
          <PanelHead icon="calendar" title={exam} subtitle={`${classFilter} · ${scoped.length} papers · ${examDays} days`} action={<Button onClick={openCreate} icon={<ScheduleIcon type="plus" className="size-4" />} className="max-sm:w-full">Add Schedule</Button>} />
          <div className="space-y-3 border-b border-slate-100 p-3.5 sm:p-5">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-stretch gap-2.5 sm:gap-3">
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search subject, room or invigilator" startIcon={<ScheduleIcon type="search" className="size-4" />} aria-label="Search schedule" />
              <Button variant="outline" disabled={!filtersActive} onClick={() => { setQuery(""); setWhen("All"); }} icon={<ScheduleIcon type="reset" className="size-4" />} className={`${resetClass} min-w-28`}>Reset</Button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5">
              <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none]">
                {chips.map((chip) => <button key={chip.id} type="button" onClick={() => setWhen(chip.id)} className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${when === chip.id ? "border-(--app-accent) bg-(--app-accent) text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>{chip.id}<span className={`rounded-full px-1.5 text-[0.65rem] ${when === chip.id ? "bg-white/25" : "bg-slate-100 text-slate-500"}`}>{chip.count}</span></button>)}
              </div>
              <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto [&>button]:min-h-9 [&>button]:px-3 [&>button]:py-2">
                <Button variant="outline" onClick={printSchedule} icon={<ScheduleIcon type="print" className="size-4" />}>Print</Button>
                <Button variant="outline" onClick={exportCsv} icon={<ScheduleIcon type="download" className="size-4" />}>CSV</Button>
                <Button variant="outline" onClick={() => setAdmitCardOpen(true)} icon={<ScheduleIcon type="card" className="size-4" />}>Admit</Button>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-3.5 sm:p-5">
            {groups.map(([date, items]) => {
              const state = whenStyle[whenOf(items[0])];
              return <div key={date} className="flex flex-col max-sm:overflow-hidden max-sm:rounded-2xl max-sm:border max-sm:border-slate-200 max-sm:bg-white max-sm:shadow-lg max-sm:shadow-slate-900/5 sm:flex-row sm:gap-4">
                <div className={`grid h-16 w-14 shrink-0 place-items-center rounded-2xl text-center ring-1 relative max-sm:flex max-sm:h-auto max-sm:w-full max-sm:items-center max-sm:justify-between max-sm:overflow-hidden max-sm:rounded-none max-sm:px-4 max-sm:py-2.5 max-sm:text-white max-sm:ring-0 sm:w-16 max-sm:bg-[linear-gradient(90deg,var(--app-sidebar-start),var(--app-accent-dark)_55%,var(--app-accent))] ${state.tile}`}><span aria-hidden="true" className="pointer-events-none absolute -right-6 -top-8 size-24 rounded-full bg-white/15 sm:hidden" /><div className="relative max-sm:flex max-sm:items-baseline max-sm:gap-2"><div className="text-[0.6rem] font-bold uppercase tracking-wider opacity-80">{parse(date).toLocaleDateString("en-IN", { weekday: "short" })}</div><div className="font-display text-xl font-bold leading-tight">{parse(date).getDate()}</div><div className="text-[0.6rem] font-bold uppercase tracking-wider opacity-80">{parse(date).toLocaleDateString("en-IN", { month: "short" })}</div></div><span className="relative inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider ring-1 ring-white/30 backdrop-blur-sm sm:hidden">{whenOf(items[0]) === "Today" && <span className="size-1.5 animate-pulse rounded-full bg-white" />}{items.length} {items.length === 1 ? "paper" : "papers"}</span></div>
                <ul className="min-w-0 flex-1 space-y-2.5 max-sm:bg-slate-50/70 max-sm:p-2.5">
                  {items.map((schedule) => <li key={schedule.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0"><h3 className="font-display truncate text-sm font-bold text-slate-900">{schedule.subject}</h3><p className="mt-0.5 text-xs text-slate-500">{clock(schedule.startTime)} – {clock(schedule.endTime)} · {durationLabel(schedule)}</p></div>
                      <span className={`${whenStyle[whenOf(schedule)].badge} shrink-0`}>{whenOf(schedule) === "Upcoming" ? dayLabel(schedule.date) : whenOf(schedule)}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      {[["Room", schedule.room], ["Invigilator", schedule.invigilator], ["Max marks", schedule.maxMarks]].map(([label, value]) => <div key={label} className="min-w-0 rounded-xl bg-slate-50 px-2.5 py-2"><div className="text-[0.6rem] font-bold uppercase tracking-wider text-slate-400">{label}</div><div className="mt-0.5 truncate font-semibold text-slate-700">{value}</div></div>)}
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 [&>button]:h-9 [&>button]:w-full [&>button]:px-2 [&>button]:text-xs">
                      <Button variant="outline" onClick={() => openEdit(schedule)} icon={<ScheduleIcon type="edit" className="size-3.5" />}>Edit</Button>
                      <Button variant="outline" onClick={() => duplicate(schedule)} icon={<ScheduleIcon type="copy" className="size-3.5" />}>Copy</Button>
                      <Button variant="danger" onClick={() => setDeleteSchedule(schedule)} icon={<ScheduleIcon type="trash" className="size-3.5" />}>Delete</Button>
                    </div>
                  </li>)}
                </ul>
              </div>;
            })}
            {!groups.length && <div className="grid min-h-52 place-items-center text-center"><div><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-400"><ScheduleIcon type="calendar" /></div><h3 className="mt-4 font-display text-sm font-bold text-slate-700">{scoped.length ? "No papers match" : "No papers scheduled"}</h3><p className="mt-1 text-xs text-slate-400">{scoped.length ? "Try a different search or filter." : "Add a subject to start building the schedule."}</p></div></div>}
          </div>
        </section>

        <aside className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-1">
          <section className="panel overflow-hidden">
            <PanelHead icon="clock" title="Schedule Timeline" subtitle={`${scoped.length} papers in order`} />
            <div className="p-4 sm:p-5">
              {scoped.length ? <ol>{scoped.map((schedule, index) => {
                const done = whenOf(schedule) === "Completed";
                return <li key={schedule.id} className="relative flex gap-3">
                  <div className="flex flex-col items-center"><span className={`grid size-5 shrink-0 place-items-center rounded-full ring-4 ${done ? "bg-emerald-500 text-white ring-emerald-50" : "bg-(--app-accent) ring-(--app-accent-soft)"}`}>{done && <ScheduleIcon type="check" className="size-3" />}</span>{index < scoped.length - 1 && <span className="my-1 w-px flex-1 bg-slate-200" />}</div>
                  <div className="pb-4"><div className="text-xs font-bold text-slate-800">{schedule.subject}</div><div className="mt-0.5 text-xs text-slate-500">{readableDate(schedule.date)}</div><div className="mt-0.5 text-[0.7rem] text-slate-400">{clock(schedule.startTime)} · {schedule.room}</div></div>
                </li>;
              })}</ol> : <p className="text-xs text-slate-400">The timeline appears once papers are scheduled.</p>}
            </div>
          </section>

          <div className="space-y-4 sm:space-y-5">
            <section className="panel overflow-hidden">
              <PanelHead icon="room" title="Room Usage" subtitle="Papers per room" />
              <div className="space-y-3 p-4 sm:p-5">
                {roomUsage.map(([room, count]) => <div key={room}><div className="flex justify-between text-xs"><span className="font-semibold text-slate-700">{room}</span><span className="font-bold text-slate-500">{count}</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-(--app-accent) transition-all duration-500" style={{ width: `${(count / Math.max(...roomUsage.map(([, value]) => value))) * 100}%` }} /></div></div>)}
                {!roomUsage.length && <p className="text-xs text-slate-400">No rooms booked yet.</p>}
              </div>
            </section>
            <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:p-5"><div className="flex items-center gap-2 text-blue-600"><ScheduleIcon type="alert" className="size-5" /><h2 className="font-display text-sm font-bold text-blue-800">Conflict protection</h2></div><p className="mt-2 text-xs leading-5 text-blue-700">Room, invigilator and duplicate-subject clashes are checked before each paper is saved.</p></section>
          </div>
        </aside>
      </div>
    </main>

    <Popup
      open={editorOpen}
      onClose={() => !saving && setEditorOpen(false)}
      title={editingId ? "Edit Exam Schedule" : "Add Exam Schedule"}
      description={`${exam} · assign the paper date, time, room, and invigilator.`}
      footerClassName={footerGrid}
      footer={<><Button variant="outline" onClick={() => setEditorOpen(false)} disabled={saving}>Cancel</Button><Button onClick={saveSchedule} isLoading={saving} loadingText="Saving...">{editingId ? "Update" : "Add Schedule"}</Button></>}
    >
      <div className="grid grid-cols-2 items-start gap-x-3 gap-y-3.5 sm:gap-x-4 sm:gap-y-4 [&>*]:min-w-0 max-sm:[&>:nth-child(-n+4)]:col-span-2 max-sm:[&>:nth-child(7)]:col-span-2 max-sm:[&>:nth-child(8)]:col-span-2">
        <Input label="Exam Date *" type="date" value={form.date} onChange={(event) => setField("date", event.target.value)} />
        <Dropdown label="Subject *" value={form.subject} onChange={(event) => setField("subject", event.target.value)} placeholder="Select subject" options={subjects.map((value) => ({ label: value, value }))} />
        <Dropdown label="Class & Section" value={form.className} onChange={(event) => setField("className", event.target.value)} options={classOptions.map((value) => ({ label: value, value }))} />
        <Input label="Maximum Marks" type="number" min="1" value={form.maxMarks} onChange={(event) => setField("maxMarks", event.target.value)} />
        <Input label="Start Time" type="time" value={form.startTime} onChange={(event) => setField("startTime", event.target.value)} />
        <Input label="End Time" type="time" value={form.endTime} onChange={(event) => setField("endTime", event.target.value)} />
        <Dropdown label="Exam Room *" value={form.room} onChange={(event) => setField("room", event.target.value)} placeholder="Select room" options={rooms.map((value) => ({ label: value, value }))} />
        <Dropdown label="Invigilator *" value={form.invigilator} onChange={(event) => setField("invigilator", event.target.value)} placeholder="Select teacher" options={invigilators.map((value) => ({ label: value, value }))} />
      </div>
    </Popup>

    <Popup
      open={Boolean(deleteSchedule)}
      onClose={() => setDeleteSchedule(null)}
      title="Delete Scheduled Paper"
      description="This paper will be removed from the examination timetable."
      footerClassName={footerGrid}
      footer={<><Button variant="outline" onClick={() => setDeleteSchedule(null)}>Cancel</Button><Button variant="danger" onClick={confirmDelete} icon={<ScheduleIcon type="trash" className="size-4" />}>Delete</Button></>}
    >
      {deleteSchedule && <div className="rounded-2xl border border-red-100 bg-red-50 p-4"><div className="font-display text-lg font-bold text-red-700">{deleteSchedule.subject}</div><div className="mt-1 text-xs text-red-600">{readableDate(deleteSchedule.date)} · {clock(deleteSchedule.startTime)} · {deleteSchedule.room}</div></div>}
    </Popup>
  </div>;
}
