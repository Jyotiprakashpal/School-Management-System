import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button, Dropdown, Input, useToast } from "../../components";
import Header from "../../ui/header";
import Popup from "../../ui/popup";

type Status = "present" | "absent" | "leave" | "";
type Learner = { admissionNo: string; name: string; rollNo: number };
type Marks = Record<string, Status>;

const classes = ["Nursery", "LKG", "UKG", "Class 1", "Class 2", "Class 3"];
const sections = ["A", "B", "C"];
const firstNames = ["Rahul", "Ananya", "Mohit", "Priya", "Aarav", "Sneha", "Kabir", "Sara", "Vihaan", "Diya", "Arjun", "Meera"];
const lastNames = ["Kumar", "Sharma", "Verma", "Singh", "Gupta", "Yadav", "Patel", "Mehta"];

const rosterFor = (className: string, section: string): Learner[] => {
  const seed = classes.indexOf(className) * 3 + sections.indexOf(section);
  return Array.from({ length: 9 + (seed % 3) }, (_, index) => ({
    rollNo: index + 1,
    admissionNo: `ADM-26-${1000 + seed * 20 + index + 1}`,
    name: `${firstNames[(index * 5 + seed * 2) % firstNames.length]} ${lastNames[(index * 3 + seed) % lastNames.length]}`,
  }));
};

const todayIso = () => new Date().toISOString().slice(0, 10);
const longDate = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
const initials = (name: string) => name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
const csvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

type IconType = "calendar" | "users" | "check" | "close" | "leave" | "clock" | "search" | "save" | "download" | "report" | "reset";

function AttendanceIcon({ type, className = "size-5" }: { type: IconType; className?: string }) {
  const paths: Record<IconType, ReactNode> = {
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>,
    check: <path d="m5 12 5 5 9-10" />,
    close: <path d="M6 6l12 12M18 6 6 18" />,
    leave: <><path d="M5 4h14v16H5z" /><path d="M9 9h6M9 13h4" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    save: <><path d="M5 3h11l3 3v15H5z" /><path d="M8 3v6h7V3M8 21v-7h8v7" /></>,
    download: <path d="M12 3v13M7 11l5 5 5-5M4 21h16" />,
    report: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
    reset: <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />,
  };
  return <svg className={className} aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{paths[type]}</svg>;
}

function PanelHead({ icon, title, subtitle, action }: { icon: IconType; title: string; subtitle: string; action?: ReactNode }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-(--app-accent-soft) text-(--app-accent-dark) ring-1 ring-(--app-accent)/20"><AttendanceIcon type={icon} /></span>
      <div className="min-w-0"><h2 className="font-display truncate text-sm font-bold tracking-tight text-slate-900">{title}</h2><p className="truncate text-xs text-slate-500">{subtitle}</p></div>
    </div>
    {action}
  </div>;
}

const statusMeta: { key: Exclude<Status, "">; label: string; short: string; icon: IconType; on: string; off: string }[] = [
  { key: "present", label: "Present", short: "P", icon: "check", on: "bg-emerald-500 text-white shadow-md shadow-emerald-500/30", off: "text-emerald-600 hover:bg-emerald-50" },
  { key: "absent", label: "Absent", short: "A", icon: "close", on: "bg-red-500 text-white shadow-md shadow-red-500/30", off: "text-red-500 hover:bg-red-50" },
  { key: "leave", label: "Leave", short: "L", icon: "leave", on: "bg-amber-500 text-white shadow-md shadow-amber-500/30", off: "text-amber-600 hover:bg-amber-50" },
];

export default function Attendance() {
  const [className, setClassName] = useState("UKG");
  const [section, setSection] = useState("A");
  const [date, setDate] = useState(todayIso());
  const [saved, setSaved] = useState<Record<string, Marks>>({});
  const [marks, setMarks] = useState<Marks>({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | Status | "pending">("all");
  const [reportOpen, setReportOpen] = useState(false);
  const { showToast } = useToast();

  const key = `${className}-${section}-${date}`;
  const roster = useMemo(() => rosterFor(className, section), [className, section]);

  useEffect(() => { setMarks(saved[key] ?? {}); setDirty(false); setEditing(false); setSearch(""); setFilter("all"); }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const statusOf = (learner: Learner): Status => marks[learner.admissionNo] ?? "";
  const totals = {
    present: roster.filter((l) => statusOf(l) === "present").length,
    absent: roster.filter((l) => statusOf(l) === "absent").length,
    leave: roster.filter((l) => statusOf(l) === "leave").length,
    pending: roster.filter((l) => !statusOf(l)).length,
  };
  const marked = roster.length - totals.pending;
  const percent = roster.length ? Math.round((totals.present / roster.length) * 100) : 0;
  const isSaved = Boolean(saved[key]);
  const locked = isSaved && !editing;

  const visible = roster.filter((learner) => {
    const term = search.trim().toLowerCase();
    if (term && !`${learner.name} ${learner.admissionNo} ${learner.rollNo}`.toLowerCase().includes(term)) return false;
    if (filter === "all") return true;
    return filter === "pending" ? !statusOf(learner) : statusOf(learner) === filter;
  });

  const setStatus = (admissionNo: string, status: Status) => {
    if (locked) return;
    setMarks((current) => ({ ...current, [admissionNo]: current[admissionNo] === status ? "" : status }));
    setDirty(true);
  };
  const setAll = (status: Status) => {
    if (locked) return;
    setMarks(Object.fromEntries(roster.map((learner) => [learner.admissionNo, status])));
    setDirty(true);
  };
  const markRemaining = () => {
    setMarks((current) => ({ ...Object.fromEntries(roster.map((l) => [l.admissionNo, "present" as Status])), ...Object.fromEntries(Object.entries(current).filter(([, value]) => value)) }));
    setDirty(true);
  };

  const saveAttendance = async () => {
    if (totals.pending) { showToast(`${totals.pending} students still need an attendance status.`, { title: "Attendance incomplete", tone: "error" }); return; }
    setSaving(true);
    await new Promise((resolve) => window.setTimeout(resolve, 800));
    setSaved((current) => ({ ...current, [key]: marks }));
    setSaving(false);
    setDirty(false);
    setEditing(false);
    showToast(`${className}-${section} attendance ${isSaved ? "updated" : "saved"} for ${longDate(date)}.`, { title: isSaved ? "Attendance updated" : "Attendance saved" });
  };

  const cancelEdit = () => { setMarks(saved[key] ?? {}); setDirty(false); setEditing(false); };

  const exportCsv = () => {
    const lines = roster.map((l) => [l.rollNo, l.admissionNo, l.name, statusOf(l) || "pending"].map(csvCell).join(","));
    const url = URL.createObjectURL(new Blob([[["Roll No.", "Admission No.", "Student", "Status"].map(csvCell).join(","), ...lines].join("\n")], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url; link.download = `attendance-${key}.csv`; link.click();
    URL.revokeObjectURL(url);
    showToast(`${roster.length} attendance rows exported.`, { title: "Report exported" });
  };

  const stats = [
    { label: "Present", value: totals.present, tone: "green", icon: "check" as IconType, copy: `${percent}% attendance` },
    { label: "Absent", value: totals.absent, tone: "amber", icon: "close" as IconType, copy: "Marked absent" },
    { label: "On Leave", value: totals.leave, tone: "violet", icon: "leave" as IconType, copy: "Approved leave" },
    { label: "Pending", value: totals.pending, tone: "teal", icon: "clock" as IconType, copy: "Not marked yet" },
  ];
  const filters: { key: typeof filter; label: string; count: number }[] = [
    { key: "all", label: "All", count: roster.length }, { key: "pending", label: "Pending", count: totals.pending },
    { key: "present", label: "Present", count: totals.present }, { key: "absent", label: "Absent", count: totals.absent }, { key: "leave", label: "Leave", count: totals.leave },
  ];
  const pct = (n: number) => (roster.length ? (n / roster.length) * 100 : 0);

  return <div className="min-h-screen dashboard-bg pb-28 sm:pb-16">
    <Header title="Daily Attendance" subtitle="Mark and manage class attendance for the selected date" />
    <main className="space-y-4 p-4 sm:space-y-5 sm:p-6 xl:p-8">
      <section className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,var(--app-sidebar-start),var(--app-accent-dark)_60%,var(--app-accent))] p-5 text-white shadow-xl sm:p-7">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/75"><AttendanceIcon type="calendar" className="size-4" />{longDate(date)}<span className={`rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold ${dirty ? "bg-amber-400/90 text-amber-950" : isSaved ? "bg-emerald-400/90 text-emerald-950" : "bg-white/20 text-white"}`}>{dirty ? "Unsaved changes" : editing ? "Editing" : isSaved ? "Saved" : "Not saved yet"}</span></div>
            <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">{className}-{section} Attendance</h2>
            <p className="mt-1 text-sm text-white/75">{marked} of {roster.length} students marked</p>
          </div>
          <div className="w-full lg:max-w-md">
            <div className="flex items-end justify-between"><span className="text-xs font-medium text-white/75">Attendance rate</span><span className="font-display text-4xl font-bold leading-none">{percent}%</span></div>
            <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-white/20" role="img" aria-label={`${totals.present} present, ${totals.absent} absent, ${totals.leave} on leave, ${totals.pending} pending`}>
              <span className="bg-emerald-300 transition-all" style={{ width: `${pct(totals.present)}%` }} /><span className="bg-red-300 transition-all" style={{ width: `${pct(totals.absent)}%` }} /><span className="bg-amber-300 transition-all" style={{ width: `${pct(totals.leave)}%` }} />
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.7rem] text-white/80"><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-emerald-300" />Present</span><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-red-300" />Absent</span><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-amber-300" />Leave</span></div>
          </div>
        </div>
      </section>

      <section className="grid auto-rows-fr grid-cols-[repeat(2,minmax(0,1fr))] gap-2.5 sm:gap-3 xl:grid-cols-[repeat(4,minmax(0,1fr))] [&>article]:h-full">
        {stats.map((stat) => <article key={stat.label} className={`admission-summary-card admission-summary-${stat.tone} relative overflow-hidden rounded-2xl p-3 shadow-sm sm:p-5`}>
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="min-w-0"><div className="truncate text-[0.7rem] font-semibold text-slate-500 sm:text-xs">{stat.label}</div><div className="mt-1 truncate font-display text-xl font-bold text-slate-950 sm:text-2xl">{stat.value}</div></div>
            <span className="admission-summary-icon grid size-8 shrink-0 place-items-center rounded-xl sm:size-10"><AttendanceIcon type={stat.icon} className="size-4 sm:size-5" /></span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[0.7rem] font-medium text-slate-500 sm:mt-3 sm:text-xs"><span className="size-1.5 shrink-0 rounded-full bg-current opacity-50" /><span className="truncate">{stat.copy}</span></div>
        </article>)}
      </section>

      <section className="panel overflow-visible">
        <PanelHead icon="users" title="Select Class" subtitle="Roster loads automatically for the chosen class and date" action={<Button variant="outline" className="shrink-0 px-3" onClick={() => setReportOpen(true)} icon={<AttendanceIcon type="report" className="size-4" />}>Summary</Button>} />
        <div className="grid grid-cols-2 gap-2.5 bg-linear-to-b from-slate-50/80 to-transparent p-3 max-sm:[&>:last-child]:col-span-2 sm:grid-cols-3 sm:gap-3 sm:p-4">
          <Dropdown label="Class" value={className} onChange={(event) => setClassName(event.target.value)} options={classes.map((value) => ({ label: value, value }))} />
          <Dropdown label="Section" value={section} onChange={(event) => setSection(event.target.value)} options={sections.map((value) => ({ label: `Section ${value}`, value }))} />
          <Input label="Attendance Date" type="date" value={date} max={todayIso()} onChange={(event) => event.target.value && setDate(event.target.value)} />
        </div>
      </section>

      <section className="panel overflow-visible">
        <PanelHead icon="check" title="Mark Attendance" subtitle={locked ? "Attendance saved · tap Update Attendance to make changes" : `${visible.length} of ${roster.length} students shown`} action={<div className="flex flex-wrap gap-2"><Button variant="success" className="min-h-9 px-3 py-2" onClick={() => setAll("present")} disabled={locked}>All Present</Button><Button variant="outline" className="min-h-9 px-3 py-2" onClick={markRemaining} disabled={locked || !totals.pending}>Rest Present</Button><Button variant="outline" className="border-rose-200! bg-linear-to-r! from-rose-50! to-orange-50! text-rose-600! shadow-sm hover:from-rose-100! hover:to-orange-100! active:scale-95 min-h-9 px-3 py-2" onClick={() => setAll("")} disabled={locked} icon={<AttendanceIcon type="reset" className="size-3.5" />}>Clear</Button></div>} />
        <div className="space-y-3 border-b border-slate-100 bg-linear-to-b from-slate-50/80 to-transparent p-3 sm:p-4">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, roll no. or admission no..." aria-label="Search students" />
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">{filters.map((item) => <button key={item.key} type="button" onClick={() => setFilter(item.key)} aria-pressed={filter === item.key} className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${filter === item.key ? "border-transparent bg-[linear-gradient(135deg,var(--app-accent-dark),var(--app-accent))] text-white shadow-md" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>{item.label}<span className={`rounded-full px-1.5 text-[0.65rem] ${filter === item.key ? "bg-white/25" : "bg-slate-100 text-slate-500"}`}>{item.count}</span></button>)}</div>
        </div>

        <ul className="space-y-2.5 p-3 sm:p-4">
          {visible.map((learner) => {
            const status = statusOf(learner);
            const edge = status === "present" ? "border-l-emerald-500" : status === "absent" ? "border-l-red-500" : status === "leave" ? "border-l-amber-500" : "border-l-slate-200";
            return <li key={learner.admissionNo} className={`flex flex-col gap-3 rounded-2xl border border-l-4 border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:p-4 ${edge}`}>
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-(--app-accent-soft) text-xs font-bold text-(--app-accent-dark)">{initials(learner.name)}</span>
                <div className="min-w-0"><div className="truncate text-sm font-semibold text-slate-900">{learner.name}</div><div className="truncate text-xs text-slate-500">Roll {learner.rollNo} · {learner.admissionNo}</div></div>
                <span className={`ml-auto shrink-0 sm:hidden ${status === "present" ? "status-success" : status === "absent" ? "status-danger" : status === "leave" ? "status-warning" : "status-neutral"}`}>{status ? status[0].toUpperCase() + status.slice(1) : "Pending"}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`hidden sm:inline-flex ${status === "present" ? "status-success" : status === "absent" ? "status-danger" : status === "leave" ? "status-warning" : "status-neutral"}`}>{status ? status[0].toUpperCase() + status.slice(1) : "Pending"}</span>
                <div className="grid flex-1 grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 sm:flex-none" role="group" aria-label={`Attendance for ${learner.name}`}>
                  {statusMeta.map((meta) => <button key={meta.key} type="button" aria-pressed={status === meta.key} disabled={locked} onClick={() => setStatus(learner.admissionNo, meta.key)} className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-bold transition active:scale-95 disabled:cursor-not-allowed ${locked && status !== meta.key ? "opacity-40" : ""} ${status === meta.key ? meta.on : meta.off}`}><AttendanceIcon type={meta.icon} className="size-3.5" /><span>{meta.label}</span></button>)}
                </div>
              </div>
            </li>;
          })}
          {!visible.length && <li className="grid min-h-40 place-items-center rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-400">No students match your search or filter.</li>}
        </ul>
      </section>
    </main>

    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur sm:static sm:z-auto sm:mx-6 sm:mt-0 sm:rounded-2xl sm:border sm:shadow-sm xl:mx-8">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-3">
        <div className="min-w-0 text-xs text-slate-500"><strong className="text-slate-900">{marked}/{roster.length}</strong> marked{totals.pending > 0 && <span className="hidden sm:inline"> · {totals.pending} pending</span>}</div>
        <div className="flex shrink-0 gap-2"><Button variant="outline" onClick={exportCsv} icon={<AttendanceIcon type="download" className="size-4" />}><span className="max-sm:hidden">Export</span></Button>{editing && <Button variant="outline" onClick={cancelEdit} disabled={saving}>Cancel</Button>}{locked ? <Button onClick={() => setEditing(true)} icon={<AttendanceIcon type="reset" className="size-4" />}>Update Attendance</Button> : <Button onClick={saveAttendance} isLoading={saving} loadingText="Saving..." disabled={!dirty} icon={<AttendanceIcon type="save" className="size-4" />}>{isSaved ? "Save Changes" : "Save Attendance"}</Button>}</div>
      </div>
    </div>

    <Popup
      open={reportOpen}
      onClose={() => setReportOpen(false)}
      title="Attendance Summary"
      description={`${className}-${section} · ${longDate(date)}`}
      footer={<><Button variant="outline" onClick={() => setReportOpen(false)}>Close</Button><Button onClick={exportCsv} icon={<AttendanceIcon type="download" className="size-4" />}>Export CSV</Button></>}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Present", totals.present, "text-emerald-600 bg-emerald-50"], ["Absent", totals.absent, "text-red-500 bg-red-50"], ["Leave", totals.leave, "text-amber-600 bg-amber-50"], ["Pending", totals.pending, "text-slate-600 bg-slate-100"]].map(([label, value, color]) => <div key={String(label)} className={`rounded-2xl p-4 text-center ${color}`}><div className="font-display text-2xl font-bold">{value}</div><div className="mt-1 text-[0.62rem] font-bold uppercase tracking-wider">{label}</div></div>)}</div>
        <div className="rounded-2xl border border-slate-100 p-4"><div className="flex items-center justify-between text-sm"><span className="font-semibold text-slate-700">Attendance percentage</span><strong className="font-display text-lg text-emerald-600">{percent}%</strong></div><div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${percent}%` }} /></div></div>
        {totals.absent > 0 && <div><div className="form-label">Absent students</div><div className="divide-y divide-slate-100 rounded-xl border border-slate-100">{roster.filter((l) => statusOf(l) === "absent").map((l) => <div key={l.admissionNo} className="flex justify-between px-3 py-2.5 text-xs"><strong className="text-slate-800">{l.name}</strong><span className="text-slate-500">Roll {l.rollNo}</span></div>)}</div></div>}
      </div>
    </Popup>
  </div>;
}
