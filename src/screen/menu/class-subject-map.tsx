import { useMemo, useState, type ReactNode } from "react";
import { Button, Dropdown, Input, useToast } from "../../components";
import Header from "../../ui/header";
import Popup from "../../ui/popup";

type MappingType = "Required" | "Optional";
type SubjectMapping = { code: string; id: number; periods: number; subject: string; teacher: string; type: MappingType };

const classes = ["Nursery", "LKG", "UKG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5"];
const sections = ["A", "B", "C"];
const years = ["2026–27", "2027–28"];
const teachers = ["Priya Sharma", "Ravi Verma", "Neha Singh", "Anjali Gupta", "Meera Joshi", "Karan Malhotra"];
const UNASSIGNED = "Unassigned";
const WEEK_CAPACITY = 36;
const TEACHER_LIMIT = 18;

const subjectPool: Record<string, { code: string; subject: string; teacher: string; periods: number; type: MappingType }> = {
  eng: { code: "ENG-01", subject: "English", teacher: "Priya Sharma", periods: 6, type: "Required" },
  mat: { code: "MAT-01", subject: "Mathematics", teacher: "Ravi Verma", periods: 6, type: "Required" },
  evs: { code: "EVS-01", subject: "Environmental Studies", teacher: "Neha Singh", periods: 4, type: "Required" },
  hin: { code: "HIN-01", subject: "Hindi", teacher: "Anjali Gupta", periods: 5, type: "Required" },
  art: { code: "ART-01", subject: "Art & Craft", teacher: "Meera Joshi", periods: 2, type: "Optional" },
  sci: { code: "SCI-01", subject: "Science", teacher: "Neha Singh", periods: 5, type: "Required" },
  sst: { code: "SST-01", subject: "Social Studies", teacher: "Karan Malhotra", periods: 4, type: "Required" },
  cmp: { code: "CMP-01", subject: "Computer Science", teacher: UNASSIGNED, periods: 2, type: "Optional" },
};

const keyOf = (className: string, section: string, year: string) => `${className}|${section}|${year}`;

function defaultMapping(className: string): SubjectMapping[] {
  const level = classes.indexOf(className);
  const picks = level < 3 ? ["eng", "mat", "evs", "hin", "art"] : level < 5 ? ["eng", "mat", "evs", "hin", "art", "cmp"] : ["eng", "mat", "sci", "sst", "hin", "cmp"];
  return picks.map((pick, index) => ({ id: level * 100 + index + 1, ...subjectPool[pick] }));
}

type IconType = "link" | "book" | "teacher" | "plus" | "trash" | "copy" | "download" | "reset" | "search" | "clock" | "save" | "alert";

function MapIcon({ type, className = "size-5" }: { type: IconType; className?: string }) {
  const paths: Record<IconType, ReactNode> = {
    link: <><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.1 1.1" /><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.1" /></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z" /><path d="M8 8h8M8 12h6" /></>,
    teacher: <><circle cx="9" cy="7" r="4" /><path d="M2 21a7 7 0 0 1 14 0M17 8h5M19.5 5.5v5" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" />,
    copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></>,
    download: <path d="M12 3v13M7 11l5 5 5-5M4 21h16" />,
    reset: <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    save: <><path d="M5 4h11l3 3v13H5z" /><path d="M8 4v5h7V4M8 20v-6h8v6" /></>,
    alert: <><path d="M12 3 2 20h20L12 3Z" /><path d="M12 10v4M12 17h.01" /></>,
  };
  return <svg className={className} aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{paths[type]}</svg>;
}

function PanelHead({ icon, title, subtitle, action }: { icon: IconType; title: string; subtitle: string; action?: ReactNode }) {
  return <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5 border-b border-slate-100 px-3.5 py-3 max-sm:[&>:nth-child(2)]:w-full sm:px-5 sm:py-3.5">
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-(--app-accent-soft) text-(--app-accent-dark) ring-1 ring-(--app-accent)/20"><MapIcon type={icon} /></span>
      <div className="min-w-0"><h2 className="font-display truncate text-sm font-bold tracking-tight text-slate-900">{title}</h2><p className="truncate text-xs text-slate-500">{subtitle}</p></div>
    </div>
    {action}
  </div>;
}

const resetClass = "border-rose-200! bg-linear-to-r! from-rose-50! to-orange-50! text-rose-600! shadow-sm hover:from-rose-100! hover:to-orange-100! active:scale-95";
const csvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
const blankMapping = { subject: "", code: "", teacher: UNASSIGNED, periods: "1", type: "Required" as MappingType };
const initials = (name: string) => name.split(" ").map((part) => part[0]).join("").slice(0, 2);

export default function ClassSubjectMap() {
  const [className, setClassName] = useState("UKG");
  const [section, setSection] = useState("A");
  const [year, setYear] = useState("2027–28");
  const [drafts, setDrafts] = useState<Record<string, SubjectMapping[]>>({});
  const [saved, setSaved] = useState<Record<string, SubjectMapping[]>>({});
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | MappingType | "Unassigned">("All");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(blankMapping);
  const [removeTarget, setRemoveTarget] = useState<SubjectMapping | null>(null);
  const [copyOpen, setCopyOpen] = useState(false);
  const [copyFrom, setCopyFrom] = useState({ className: "Nursery", section: "A" });
  const { showToast } = useToast();

  const key = keyOf(className, section, year);
  const label = `${className}-${section}`;
  const baseline = saved[key] ?? defaultMapping(className);
  const mappings = drafts[key] ?? baseline;
  const dirty = JSON.stringify(mappings) !== JSON.stringify(baseline);

  const setMappings = (updater: (current: SubjectMapping[]) => SubjectMapping[]) => setDrafts((current) => ({ ...current, [key]: updater(current[key] ?? baseline) }));

  const totalPeriods = useMemo(() => mappings.reduce((sum, mapping) => sum + mapping.periods, 0), [mappings]);
  const unassigned = mappings.filter((mapping) => mapping.teacher === UNASSIGNED).length;
  const optionalCount = mappings.filter((mapping) => mapping.type === "Optional").length;
  const teacherLoad = useMemo(() => {
    const load = new Map<string, number>();
    mappings.forEach((mapping) => { if (mapping.teacher !== UNASSIGNED) load.set(mapping.teacher, (load.get(mapping.teacher) ?? 0) + mapping.periods); });
    return [...load.entries()].sort((a, b) => b[1] - a[1]);
  }, [mappings]);
  const capacityPercent = Math.min(100, Math.round((totalPeriods / WEEK_CAPACITY) * 100));
  const overCapacity = totalPeriods > WEEK_CAPACITY;

  const filtered = mappings.filter((mapping) => {
    const term = query.trim().toLowerCase();
    const matchesQuery = !term || `${mapping.subject} ${mapping.code} ${mapping.teacher}`.toLowerCase().includes(term);
    const matchesType = typeFilter === "All" || (typeFilter === "Unassigned" ? mapping.teacher === UNASSIGNED : mapping.type === typeFilter);
    return matchesQuery && matchesType;
  });
  const filtersActive = Boolean(query) || typeFilter !== "All";

  const chips: { id: typeof typeFilter; count: number }[] = [
    { id: "All", count: mappings.length },
    { id: "Required", count: mappings.length - optionalCount },
    { id: "Optional", count: optionalCount },
    { id: "Unassigned", count: unassigned },
  ];

  const updateMapping = (id: number, patch: Partial<SubjectMapping>) => setMappings((current) => current.map((mapping) => mapping.id === id ? { ...mapping, ...patch } : mapping));
  const stepPeriods = (mapping: SubjectMapping, delta: number) => updateMapping(mapping.id, { periods: Math.min(12, Math.max(1, mapping.periods + delta)) });

  const confirmRemove = () => {
    if (!removeTarget) return;
    setMappings((current) => current.filter((mapping) => mapping.id !== removeTarget.id));
    showToast(`${removeTarget.subject} was removed from ${label}. Save to apply.`, { title: "Subject removed", tone: "info" });
    setRemoveTarget(null);
  };

  const addMapping = () => {
    const code = form.code.trim().toUpperCase();
    if (!form.subject.trim() || !code) {
      showToast("Subject Name and Subject Code are required.", { title: "Complete required fields", tone: "error" });
      return;
    }
    if (mappings.some((mapping) => mapping.code === code)) {
      showToast("This subject is already mapped to the class.", { title: "Duplicate mapping", tone: "error" });
      return;
    }
    const periods = Math.min(12, Math.max(1, Number(form.periods) || 1));
    setMappings((current) => [...current, { id: Date.now(), subject: form.subject.trim(), code, teacher: form.teacher, periods, type: form.type }]);
    setAddOpen(false);
    setForm(blankMapping);
    showToast(`${form.subject.trim()} was added to ${label}.`, { title: "Subject mapped" });
  };

  const copyMapping = () => {
    const sourceKey = keyOf(copyFrom.className, copyFrom.section, year);
    if (sourceKey === key) {
      showToast("Choose a different class or section to copy from.", { title: "Same class selected", tone: "error" });
      return;
    }
    const source = (drafts[sourceKey] ?? saved[sourceKey] ?? defaultMapping(copyFrom.className)).map((mapping, index) => ({ ...mapping, id: Date.now() + index }));
    setMappings(() => source);
    setCopyOpen(false);
    showToast(`${source.length} subjects copied from ${copyFrom.className}-${copyFrom.section}. Save to apply.`, { title: "Mapping copied", tone: "info" });
  };

  const discard = () => {
    setDrafts((current) => { const next = { ...current }; delete next[key]; return next; });
    showToast("Unsaved changes were discarded.", { title: "Changes reverted", tone: "info" });
  };

  const saveMapping = async () => {
    if (mappings.some((mapping) => mapping.periods < 1)) {
      showToast("Every mapped subject requires at least one weekly period.", { title: "Invalid weekly periods", tone: "error" });
      return;
    }
    setSaving(true);
    await new Promise((resolve) => window.setTimeout(resolve, 800));
    setSaved((current) => ({ ...current, [key]: mappings }));
    setDrafts((current) => { const next = { ...current }; delete next[key]; return next; });
    setSaving(false);
    showToast(`${mappings.length} subject mappings were saved for ${label}.`, { title: "Class mapping saved" });
  };

  const exportCsv = () => {
    const rows = [["Class", "Section", "Year", "Subject", "Code", "Teacher", "Weekly Periods", "Type"], ...mappings.map((mapping) => [className, section, year, mapping.subject, mapping.code, mapping.teacher, mapping.periods, mapping.type])];
    const url = URL.createObjectURL(new Blob([rows.map((row) => row.map(csvCell).join(",")).join("\n")], { type: "text/csv" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `class-subject-map-${className}-${section}.csv`.replace(/\s+/g, "-").toLowerCase();
    anchor.click();
    URL.revokeObjectURL(url);
    showToast(`${label} mapping exported as CSV.`, { title: "Export ready" });
  };

  const stats = [
    { label: "Mapped Subjects", value: mappings.length, tone: "teal", copy: `${label} · ${year}`, icon: "book" as IconType },
    { label: "Teachers", value: teacherLoad.length, tone: "green", copy: "Unique educators", icon: "teacher" as IconType },
    { label: "Weekly Periods", value: totalPeriods, tone: "amber", copy: `of ${WEEK_CAPACITY} timetable slots`, icon: "clock" as IconType },
    { label: "Unassigned", value: unassigned, tone: "violet", copy: unassigned ? "Need a teacher" : "All covered", icon: "link" as IconType },
  ];

  return <div className="min-h-screen dashboard-bg pb-16">
    <Header title="Class-Subject Map" subtitle="Assign subjects, teachers, and weekly periods to each class" />
    <main className="space-y-4 p-3 sm:space-y-5 sm:p-6 xl:p-8">
      <section className="panel overflow-hidden">
        <PanelHead icon="link" title="Class Mapping Setup" subtitle="Pick a class to view or edit its curriculum" action={<span className={dirty ? "status-warning" : "status-success"}>{dirty ? "Unsaved changes" : "All changes saved"}</span>} />
        <div className="grid grid-cols-2 items-end gap-x-3 gap-y-3.5 p-3.5 sm:gap-x-4 sm:p-5 xl:grid-cols-[1fr_1fr_1fr_auto] [&>:last-child]:min-w-0 [&>:last-child]:px-3">
          <Dropdown label="Class" value={className} onChange={(event) => setClassName(event.target.value)} options={classes.map((value) => ({ label: value, value }))} />
          <Dropdown label="Section" value={section} onChange={(event) => setSection(event.target.value)} options={sections.map((value) => ({ label: value, value }))} />
          <Dropdown label="Academic Year" value={year} onChange={(event) => setYear(event.target.value)} options={years.map((value) => ({ label: value, value }))} />
          <Button variant="outline" onClick={() => { setCopyFrom({ className: classes.find((value) => value !== className) ?? "Nursery", section }); setCopyOpen(true); }} icon={<MapIcon type="copy" className="size-4" />}>Copy from class</Button>
        </div>
      </section>

      <section className="grid auto-rows-fr grid-cols-[repeat(2,minmax(0,1fr))] gap-2.5 sm:gap-3 xl:grid-cols-[repeat(4,minmax(0,1fr))] [&>article]:h-full">
        {stats.map((stat) => <article key={stat.label} className={`admission-summary-card admission-summary-${stat.tone} relative overflow-hidden rounded-2xl p-3 shadow-sm sm:p-5`}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0"><div className="truncate text-[0.7rem] font-medium text-slate-500 sm:text-xs">{stat.label}</div><div className="mt-1 font-display text-2xl font-bold text-slate-950 sm:text-3xl">{stat.value}</div></div>
            <span className="admission-summary-icon grid size-8 shrink-0 place-items-center rounded-xl sm:size-10"><MapIcon type={stat.icon} className="size-4 sm:size-5" /></span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[0.62rem] text-slate-500 sm:mt-3 sm:text-xs"><span className="size-1.5 shrink-0 rounded-full bg-current opacity-60" /><span className="truncate">{stat.copy}</span></div>
        </article>)}
      </section>

      <div className="grid items-start gap-4 sm:gap-5 xl:grid-cols-[1fr_20rem]">
        <section className="panel overflow-hidden">
          <PanelHead icon="book" title={`${label} Curriculum`} subtitle={`${year} · ${mappings.length} subjects · ${totalPeriods} periods/week`} action={<div className="flex gap-2 max-sm:w-full max-sm:[&>button]:flex-1"><Button variant="outline" onClick={exportCsv} disabled={!mappings.length} icon={<MapIcon type="download" className="size-4" />}>Export</Button><Button onClick={() => { setForm(blankMapping); setAddOpen(true); }} icon={<MapIcon type="plus" className="size-4" />}>Add Subject</Button></div>} />

          <div className="space-y-3 border-b border-slate-100 p-3.5 sm:p-5">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-stretch gap-2.5 sm:gap-3">
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search subject, code or teacher" startIcon={<MapIcon type="search" className="size-4" />} aria-label="Search subjects" />
              <Button variant="outline" disabled={!filtersActive} onClick={() => { setQuery(""); setTypeFilter("All"); }} icon={<MapIcon type="reset" className="size-4" />} className={`${resetClass} min-w-28`}>Reset</Button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none]">
              {chips.map((chip) => <button key={chip.id} type="button" onClick={() => setTypeFilter(chip.id)} className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${typeFilter === chip.id ? "border-(--app-accent) bg-(--app-accent) text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>{chip.id}<span className={`rounded-full px-1.5 text-[0.65rem] ${typeFilter === chip.id ? "bg-white/25" : "bg-slate-100 text-slate-500"}`}>{chip.count}</span></button>)}
            </div>
          </div>

          <ul className="grid gap-2.5 p-3.5 sm:p-5">
            {filtered.map((mapping) => {
              const isUnassigned = mapping.teacher === UNASSIGNED;
              return <li key={mapping.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:grid sm:grid-cols-[minmax(10rem,13rem)_minmax(0,1fr)_auto_auto] sm:items-center sm:gap-x-3 sm:px-4 sm:py-3">
                <div className="flex items-center gap-3">
                  <span className={`grid size-10 shrink-0 place-items-center rounded-xl ring-1 ${mapping.type === "Required" ? "bg-sky-50 text-sky-600 ring-sky-100" : "bg-amber-50 text-amber-600 ring-amber-100"}`}><MapIcon type="book" /></span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display truncate text-sm font-bold text-slate-900">{mapping.subject}</h3>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs"><span className="font-semibold text-cyan-600">{mapping.code}</span><button type="button" onClick={() => updateMapping(mapping.id, { type: mapping.type === "Required" ? "Optional" : "Required" })} className={`${mapping.type === "Required" ? "status-info" : "status-warning"} text-[0.62rem] transition active:scale-95`} aria-label={`Toggle type, currently ${mapping.type}`}>{mapping.type}</button></div>
                  </div>
                  {isUnassigned && <span className="status-danger inline-flex shrink-0 items-center gap-1 text-[0.62rem] sm:hidden"><MapIcon type="alert" className="size-3" />No teacher</span>}
                </div>
                <div className="mt-3 sm:mt-0">
                  <span className="form-label sm:sr-only">Assigned Teacher</span>
                  <select value={mapping.teacher} onChange={(event) => updateMapping(mapping.id, { teacher: event.target.value })} className={`form-input h-10 text-xs ${isUnassigned ? "border-rose-300 bg-rose-50/40" : ""}`} aria-label="Assigned teacher">{[UNASSIGNED, ...teachers].map((teacher) => <option key={teacher}>{teacher}</option>)}</select>
                </div>
                <div className="mt-3 grid grid-cols-[1fr_auto] items-end gap-3 sm:contents">
                  <div className="sm:mt-0">
                    <span className="form-label sm:sr-only">Periods / week</span>
                    <div className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white shadow-sm">
                      <button type="button" onClick={() => stepPeriods(mapping, -1)} disabled={mapping.periods <= 1} className="grid size-10 place-items-center rounded-l-xl text-lg font-bold text-slate-500 transition hover:bg-slate-50 active:scale-90 disabled:opacity-30" aria-label="Decrease periods">−</button>
                      <span className="w-8 text-center text-sm font-bold text-slate-800" aria-live="polite">{mapping.periods}</span>
                      <button type="button" onClick={() => stepPeriods(mapping, 1)} disabled={mapping.periods >= 12} className="grid size-10 place-items-center rounded-r-xl text-lg font-bold text-slate-500 transition hover:bg-slate-50 active:scale-90 disabled:opacity-30" aria-label="Increase periods">+</button>
                    </div>
                  </div>
                  <button type="button" onClick={() => setRemoveTarget(mapping)} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 active:scale-95 sm:w-10 sm:px-0" aria-label={`Remove ${mapping.subject}`}><MapIcon type="trash" className="size-4" /><span className="sm:hidden">Remove</span></button>
                </div>
              </li>;
            })}
            {!filtered.length && <div className="grid min-h-52 place-items-center text-center"><div><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-400"><MapIcon type="book" /></div><h3 className="mt-4 font-display text-sm font-bold text-slate-700">{mappings.length ? "No subjects match" : "No subjects mapped"}</h3><p className="mt-1 text-xs text-slate-400">{mappings.length ? "Try a different search or filter." : "Add a subject to build the class curriculum."}</p></div></div>}
          </ul>

          <footer className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 px-3.5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="text-xs text-slate-500">{mappings.length} subjects · {totalPeriods} weekly periods</div>
            <div className="grid grid-cols-2 gap-2.5 sm:flex [&>button]:h-11">
              <Button variant="outline" onClick={discard} disabled={!dirty || saving}>Discard</Button>
              <Button onClick={saveMapping} isLoading={saving} loadingText="Saving..." disabled={!dirty} icon={<MapIcon type="save" className="size-4" />}>Save Mapping</Button>
            </div>
          </footer>
        </section>

        <aside className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-1">
          <section className="panel overflow-hidden">
            <PanelHead icon="clock" title="Timetable Capacity" subtitle={`${WEEK_CAPACITY} slots per week`} />
            <div className="p-4 sm:p-5">
              <div className="flex items-end justify-between"><div className="font-display text-3xl font-bold text-slate-950">{totalPeriods}<span className="text-sm font-semibold text-slate-400"> / {WEEK_CAPACITY}</span></div><span className={overCapacity ? "status-danger" : capacityPercent >= 90 ? "status-warning" : "status-success"}>{overCapacity ? "Over capacity" : `${capacityPercent}% used`}</span></div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full transition-all duration-500 ${overCapacity ? "bg-linear-to-r from-rose-400 to-red-500" : "bg-linear-to-r from-(--app-accent) to-(--app-accent-dark)"}`} style={{ width: `${capacityPercent}%` }} /></div>
              <p className="mt-3 text-xs leading-5 text-slate-500">{overCapacity ? `Reduce ${totalPeriods - WEEK_CAPACITY} period(s) so the class fits the weekly timetable.` : `${WEEK_CAPACITY - totalPeriods} slot(s) free for activities or study hours.`}</p>
            </div>
          </section>

          <section className="panel overflow-hidden">
            <PanelHead icon="teacher" title="Teacher Load" subtitle="Periods per week in this class" />
            <div className="space-y-3.5 p-4 sm:p-5">
              {teacherLoad.map(([teacher, periods]) => {
                const heavy = periods > TEACHER_LIMIT;
                return <div key={teacher} className="flex items-center gap-3">
                  <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-(--app-accent-soft) text-[0.65rem] font-bold text-(--app-accent-dark)">{initials(teacher)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2"><span className="truncate text-xs font-semibold text-slate-700">{teacher}</span><span className={`shrink-0 text-[0.65rem] font-bold ${heavy ? "text-rose-600" : "text-slate-500"}`}>{periods}</span></div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full transition-all duration-500 ${heavy ? "bg-rose-400" : "bg-(--app-accent)"}`} style={{ width: `${Math.min(100, (periods / TEACHER_LIMIT) * 100)}%` }} /></div>
                  </div>
                </div>;
              })}
              {!teacherLoad.length && <p className="text-xs text-slate-400">No teachers assigned yet.</p>}
            </div>
          </section>
        </aside>
      </div>
    </main>

    <Popup
      open={addOpen}
      onClose={() => setAddOpen(false)}
      title="Add Subject Mapping"
      description={`Add a subject to ${label} for ${year}.`}
      footerClassName="!grid grid-cols-2 items-stretch gap-2.5 sm:!flex [&>button]:h-11 [&>button]:w-full sm:[&>button]:w-auto"
      footer={<><Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button><Button onClick={addMapping}>Add to Class</Button></>}
    >
      <div className="grid grid-cols-2 items-start gap-x-3 gap-y-3.5 sm:gap-x-4 sm:gap-y-4 [&>*]:min-w-0 [&>:nth-child(3)]:col-span-2 max-sm:[&>:nth-child(-n+2)]:col-span-2">
        <Input label="Subject Name *" value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} placeholder="e.g. Computer Science" />
        <Input label="Subject Code *" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} placeholder="e.g. CMP-02" />
        <Dropdown label="Assigned Teacher" value={form.teacher} onChange={(event) => setForm((current) => ({ ...current, teacher: event.target.value }))} options={[UNASSIGNED, ...teachers].map((value) => ({ label: value, value }))} />
        <Input label="Weekly Periods" type="number" min="1" max="12" value={form.periods} onChange={(event) => setForm((current) => ({ ...current, periods: event.target.value }))} />
        <Dropdown label="Subject Type" value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as MappingType }))} options={[{ label: "Required", value: "Required" }, { label: "Optional", value: "Optional" }]} />
      </div>
    </Popup>

    <Popup
      open={copyOpen}
      onClose={() => setCopyOpen(false)}
      title="Copy Class Mapping"
      description={`Replace the ${label} curriculum with another class's subjects.`}
      footerClassName="!grid grid-cols-2 items-stretch gap-2.5 sm:!flex [&>button]:h-11 [&>button]:w-full sm:[&>button]:w-auto"
      footer={<><Button variant="outline" onClick={() => setCopyOpen(false)}>Cancel</Button><Button onClick={copyMapping}>Copy Mapping</Button></>}
    >
      <div className="grid grid-cols-2 gap-x-3 gap-y-3.5 sm:gap-x-4">
        <Dropdown label="Copy from class" value={copyFrom.className} onChange={(event) => setCopyFrom((current) => ({ ...current, className: event.target.value }))} options={classes.map((value) => ({ label: value, value }))} />
        <Dropdown label="Section" value={copyFrom.section} onChange={(event) => setCopyFrom((current) => ({ ...current, section: event.target.value }))} options={sections.map((value) => ({ label: value, value }))} />
        <p className="col-span-2 rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs leading-5 text-amber-700">Current subjects in {label} will be replaced. Nothing is saved until you press Save Mapping.</p>
      </div>
    </Popup>

    <Popup
      open={Boolean(removeTarget)}
      onClose={() => setRemoveTarget(null)}
      title="Remove Subject"
      description={`Take this subject out of ${label}.`}
      footerClassName="!grid grid-cols-2 items-stretch gap-2.5 sm:!flex [&>button]:h-11 [&>button]:w-full sm:[&>button]:w-auto"
      footer={<><Button variant="outline" onClick={() => setRemoveTarget(null)}>Cancel</Button><Button variant="danger" onClick={confirmRemove} icon={<MapIcon type="trash" className="size-4" />}>Remove</Button></>}
    >
      {removeTarget && <div className="rounded-2xl border border-red-100 bg-red-50 p-4"><div className="font-display text-lg font-bold text-red-700">{removeTarget.subject}</div><div className="mt-1 text-xs text-red-600">{removeTarget.code} · {removeTarget.teacher} · {removeTarget.periods} periods/week</div><p className="mt-3 text-xs leading-5 text-red-600/80">The subject is removed from this class only. Remember to save the mapping afterwards.</p></div>}
    </Popup>
  </div>;
}
