import { useMemo, useState, type ReactNode } from "react";
import { Button, Dropdown, Input, PremiumPagination, useToast } from "../../components";
import Header from "../../ui/header";
import Popup from "../../ui/popup";

type SubjectType = "Core" | "Language" | "Elective" | "Activity";
type SubjectStatus = "Active" | "Inactive";
type Subject = { classes: string; code: string; id: number; name: string; status: SubjectStatus; teachers: number; type: SubjectType };

const initialSubjects: Subject[] = [
  { id: 1, code: "ENG-01", name: "English", type: "Language", classes: "UKG–Class 10", teachers: 4, status: "Active" },
  { id: 2, code: "MAT-01", name: "Mathematics", type: "Core", classes: "Class 1–10", teachers: 5, status: "Active" },
  { id: 3, code: "SCI-01", name: "Science", type: "Core", classes: "Class 3–10", teachers: 3, status: "Active" },
  { id: 4, code: "SST-01", name: "Social Studies", type: "Core", classes: "Class 4–10", teachers: 2, status: "Active" },
  { id: 5, code: "HIN-01", name: "Hindi", type: "Language", classes: "Class 1–10", teachers: 3, status: "Active" },
  { id: 6, code: "ART-01", name: "Art & Craft", type: "Activity", classes: "Nursery–Class 8", teachers: 1, status: "Inactive" },
];

const types: SubjectType[] = ["Core", "Language", "Elective", "Activity"];
const typeMeta: Record<SubjectType, { badge: string; tile: string; strip: string }> = {
  Core: { badge: "status-info", tile: "bg-sky-50 text-sky-600 ring-sky-100", strip: "from-sky-400 to-(--app-accent)" },
  Language: { badge: "status-success", tile: "bg-emerald-50 text-emerald-600 ring-emerald-100", strip: "from-emerald-400 to-teal-400" },
  Elective: { badge: "status-neutral", tile: "bg-violet-50 text-violet-600 ring-violet-100", strip: "from-violet-400 to-fuchsia-400" },
  Activity: { badge: "status-warning", tile: "bg-amber-50 text-amber-600 ring-amber-100", strip: "from-amber-400 to-orange-400" },
};
const blankSubject = { code: "", name: "", type: "Core" as SubjectType, classes: "", teachers: "1", status: "Active" as SubjectStatus };
const csvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

type IconType = "book" | "teacher" | "catalog" | "plus" | "edit" | "trash" | "copy" | "download" | "check" | "reset" | "search" | "language" | "class";

function SubjectIcon({ type, className = "size-5" }: { type: IconType; className?: string }) {
  const paths: Record<IconType, ReactNode> = {
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z" /><path d="M8 8h8M8 12h6" /></>,
    teacher: <><circle cx="9" cy="7" r="4" /><path d="M2 21a7 7 0 0 1 14 0M17 8h5M19.5 5.5v5" /></>,
    catalog: <path d="M4 4h16v16H4zM8 4v16M12 8h5M12 12h5M12 16h3" />,
    plus: <path d="M12 5v14M5 12h14" />,
    edit: <path d="M4 20h4L19 9l-4-4L4 16v4ZM13 7l4 4" />,
    trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" />,
    copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></>,
    download: <path d="M12 3v13M7 11l5 5 5-5M4 21h16" />,
    check: <path d="m5 12 5 5 9-10" />,
    reset: <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    language: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
    class: <><path d="M3 9 12 4l9 5-9 5-9-5Z" /><path d="M7 11.5V16c0 1.5 2.2 3 5 3s5-1.5 5-3v-4.5" /></>,
  };
  return <svg className={className} aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{paths[type]}</svg>;
}

function PanelHead({ icon, title, subtitle, action }: { icon: IconType; title: string; subtitle: string; action?: ReactNode }) {
  return <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5 border-b border-slate-100 px-3.5 py-3 max-sm:[&>:nth-child(2)]:w-full sm:px-5 sm:py-3.5">
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-(--app-accent-soft) text-(--app-accent-dark) ring-1 ring-(--app-accent)/20"><SubjectIcon type={icon} /></span>
      <div className="min-w-0"><h2 className="font-display truncate text-sm font-bold tracking-tight text-slate-900">{title}</h2><p className="truncate text-xs text-slate-500">{subtitle}</p></div>
    </div>
    {action}
  </div>;
}

const resetClass = "border-rose-200! bg-linear-to-r! from-rose-50! to-orange-50! text-rose-600! shadow-sm hover:from-rose-100! hover:to-orange-100! active:scale-95";

export default function Subjects() {
  const [subjects, setSubjects] = useState(initialSubjects);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | SubjectType>("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(blankSubject);
  const [saving, setSaving] = useState(false);
  const [deleteSubject, setDeleteSubject] = useState<Subject | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const { showToast } = useToast();

  const typeCounts = useMemo(() => Object.fromEntries(types.map((t) => [t, subjects.filter((s) => s.type === t).length])) as Record<SubjectType, number>, [subjects]);
  const totalTeachers = subjects.reduce((sum, s) => sum + s.teachers, 0);
  const activeCount = subjects.filter((s) => s.status === "Active").length;

  const filtered = subjects.filter((subject) => {
    const term = search.trim().toLowerCase();
    return (!term || `${subject.name} ${subject.code} ${subject.classes}`.toLowerCase().includes(term)) && (!typeFilter || subject.type === typeFilter) && (!statusFilter || subject.status === statusFilter);
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const hasFilters = Boolean(search || typeFilter || statusFilter);
  const resetFilters = () => { setSearch(""); setTypeFilter(""); setStatusFilter(""); setCurrentPage(1); };
  const setField = (key: keyof typeof blankSubject, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const openCreate = () => { setEditingId(null); setForm(blankSubject); setEditorOpen(true); };
  const openEdit = (subject: Subject) => {
    setEditingId(subject.id);
    setForm({ code: subject.code, name: subject.name, type: subject.type, classes: subject.classes, teachers: String(subject.teachers), status: subject.status });
    setEditorOpen(true);
  };

  const saveSubject = async () => {
    if (!form.code.trim() || !form.name.trim() || !form.classes.trim()) {
      showToast("Subject Code, Subject Name, and Class Coverage are required.", { title: "Complete required fields", tone: "error" });
      return;
    }
    if (subjects.some((subject) => subject.code.toLowerCase() === form.code.trim().toLowerCase() && subject.id !== editingId)) {
      showToast("This subject code is already in use.", { title: "Duplicate subject code", tone: "error" });
      return;
    }
    setSaving(true);
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    const payload = { code: form.code.trim().toUpperCase(), name: form.name.trim(), type: form.type, classes: form.classes.trim(), teachers: Math.max(0, Number(form.teachers) || 0), status: form.status };
    if (editingId) setSubjects((current) => current.map((subject) => subject.id === editingId ? { ...subject, ...payload } : subject));
    else setSubjects((current) => [...current, { id: Date.now(), ...payload }]);
    setSaving(false);
    setEditorOpen(false);
    showToast(`${payload.name} was ${editingId ? "updated" : "added"} successfully.`, { title: editingId ? "Subject updated" : "Subject added" });
  };

  const toggleStatus = (subject: Subject) => {
    const status: SubjectStatus = subject.status === "Active" ? "Inactive" : "Active";
    setSubjects((current) => current.map((item) => item.id === subject.id ? { ...item, status } : item));
    showToast(`${subject.name} is now ${status.toLowerCase()}.`, { title: "Subject status updated" });
  };

  const duplicateSubject = (subject: Subject) => {
    let code = `${subject.code}-COPY`;
    while (subjects.some((s) => s.code === code)) code += "2";
    setSubjects((current) => [...current, { ...subject, id: Date.now(), code, name: `${subject.name} (Copy)` }]);
    showToast(`A copy of ${subject.name} was added to the catalog.`, { title: "Subject duplicated" });
  };

  const confirmDelete = () => {
    if (!deleteSubject) return;
    setSubjects((current) => current.filter((subject) => subject.id !== deleteSubject.id));
    showToast(`${deleteSubject.name} was removed from the subject catalog.`, { title: "Subject deleted", tone: "info" });
    setDeleteSubject(null);
  };

  const exportCsv = () => {
    if (!filtered.length) { showToast("There are no subjects to export.", { title: "Nothing to export", tone: "error" }); return; }
    const head = ["Code", "Subject", "Type", "Class Coverage", "Teachers", "Status"].map(csvCell).join(",");
    const lines = filtered.map((s) => [s.code, s.name, s.type, s.classes, s.teachers, s.status].map(csvCell).join(","));
    const url = URL.createObjectURL(new Blob([[head, ...lines].join("\n")], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url; link.download = "subjects.csv"; link.click();
    URL.revokeObjectURL(url);
    showToast(`${filtered.length} subjects exported to CSV.`, { title: "Export ready" });
  };

  const stats: { label: string; value: number; copy: string; tone: string; icon: IconType }[] = [
    { label: "Total Subjects", value: subjects.length, copy: "In academic catalog", tone: "teal", icon: "catalog" },
    { label: "Core Subjects", value: typeCounts.Core, copy: "Primary curriculum", tone: "green", icon: "book" },
    { label: "Languages", value: typeCounts.Language, copy: "Language curriculum", tone: "amber", icon: "language" },
    { label: "Active Subjects", value: activeCount, copy: "Available for mapping", tone: "violet", icon: "check" },
  ];

  return <div className="min-h-screen dashboard-bg pb-16">
    <Header title="Subjects" subtitle="Build the academic catalog and manage class coverage" />
    <main className="space-y-4 p-3 sm:space-y-5 sm:p-6 xl:p-8">
      <section className="grid auto-rows-fr grid-cols-[repeat(2,minmax(0,1fr))] gap-2.5 sm:gap-3 xl:grid-cols-[repeat(4,minmax(0,1fr))] [&>article]:h-full">
        {stats.map((stat) => <article key={stat.label} className={`admission-summary-card admission-summary-${stat.tone} relative overflow-hidden rounded-2xl p-3 shadow-sm sm:p-5`}>
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="min-w-0"><div className="truncate text-[0.7rem] font-semibold text-slate-500 sm:text-xs">{stat.label}</div><div className="font-display mt-1 truncate text-xl font-bold text-slate-950 sm:text-2xl">{stat.value}</div></div>
            <span className="admission-summary-icon grid size-8 shrink-0 place-items-center rounded-xl sm:size-10"><SubjectIcon type={stat.icon} className="size-4 sm:size-5" /></span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[0.7rem] font-medium text-slate-500 sm:mt-3 sm:text-xs"><span className="size-1.5 shrink-0 rounded-full bg-current opacity-50" /><span className="truncate">{stat.copy}</span></div>
        </article>)}
      </section>

      <section className="relative overflow-hidden rounded-2xl bg-[linear-gradient(135deg,var(--app-sidebar-start),var(--app-accent-dark)_60%,var(--app-accent))] p-4 text-white shadow-lg sm:p-5">
        <div className="pointer-events-none absolute -right-10 -top-12 size-44 rounded-full bg-white/10" aria-hidden="true" />
        <div className="relative flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/15 ring-1 ring-white/25"><SubjectIcon type="teacher" /></span>
            <div className="min-w-0"><p className="text-[0.65rem] font-bold uppercase tracking-widest text-white/70">Teaching staff</p><h2 className="font-display text-base font-bold sm:text-lg">{totalTeachers} teacher assignments across {subjects.length} subjects</h2></div>
          </div>
          <div className="flex flex-wrap gap-1.5">{types.map((t) => <span key={t} className="rounded-full bg-white/15 px-2.5 py-1 text-[0.7rem] font-semibold ring-1 ring-white/20">{t} · {typeCounts[t]}</span>)}</div>
        </div>
      </section>

      <section className="panel overflow-hidden">
        <PanelHead icon="catalog" title="Subject Catalog" subtitle={`${filtered.length} of ${subjects.length} subjects`} action={
          <div className="flex gap-2 max-sm:w-full max-sm:[&>*]:flex-1">
            <Button variant="outline" onClick={exportCsv} icon={<SubjectIcon type="download" className="size-4" />}>Export</Button>
            <Button onClick={openCreate} icon={<SubjectIcon type="plus" className="size-4" />}>Add Subject</Button>
          </div>
        } />

        <div className="space-y-3 border-b border-slate-100 p-3.5 sm:p-4">
          <div className="grid grid-cols-2 items-stretch gap-2.5 max-sm:[&>:first-child]:col-span-2 sm:grid-cols-[1fr_11rem_auto] sm:gap-3">
            <Input value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }} placeholder="Search subject, code or class coverage..." aria-label="Search subjects" startIcon={<SubjectIcon type="search" className="size-4" />} />
            <Dropdown value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setCurrentPage(1); }} placeholder="All Status" aria-label="Subject status" options={["Active", "Inactive"].map((value) => ({ label: value, value }))} />
            <Button variant="outline" onClick={resetFilters} disabled={!hasFilters} icon={<SubjectIcon type="reset" className="size-4" />} className={resetClass}>Reset</Button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {([["", "All", subjects.length], ...types.map((t) => [t, t, typeCounts[t]])] as [string, string, number][]).map(([value, label, count]) => {
              const on = typeFilter === value;
              return <button key={label} type="button" onClick={() => { setTypeFilter(value as "" | SubjectType); setCurrentPage(1); }} className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition active:scale-95 ${on ? "border-transparent bg-(--app-accent-dark) text-white shadow-md" : "border-slate-200 bg-white text-slate-600 hover:border-(--app-accent)/40 hover:bg-(--app-accent-faint)"}`}>{label}<span className={`rounded-full px-1.5 py-0.5 text-[0.65rem] ${on ? "bg-white/25" : "bg-slate-100 text-slate-500"}`}>{count}</span></button>;
            })}
          </div>
        </div>

        {paged.length ? <div className="grid gap-3 p-3.5 sm:grid-cols-2 sm:gap-4 sm:p-4 2xl:grid-cols-3">
          {paged.map((subject) => {
            const meta = typeMeta[subject.type];
            const active = subject.status === "Active";
            return <article key={subject.id} className={`flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${active ? "" : "opacity-80"}`}>
              <div className={`h-1.5 bg-linear-to-r ${meta.strip}`} />
              <div className="flex flex-1 flex-col gap-3.5 p-4">
                <div className="flex items-start gap-3">
                  <span className={`grid size-11 shrink-0 place-items-center rounded-xl ring-1 ${meta.tile}`}><SubjectIcon type="book" /></span>
                  <div className="min-w-0 flex-1"><h3 className="font-display truncate text-sm font-bold text-slate-900">{subject.name}</h3><p className="truncate text-xs font-semibold text-(--app-accent-dark)">{subject.code}</p></div>
                  <span className={meta.badge}>{subject.type}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-slate-50 p-2.5"><div className="flex items-center gap-1.5 text-[0.62rem] font-bold uppercase tracking-wider text-slate-400"><SubjectIcon type="class" className="size-3" />Coverage</div><div className="mt-1 truncate font-semibold text-slate-800">{subject.classes}</div></div>
                  <div className="rounded-xl bg-slate-50 p-2.5"><div className="flex items-center gap-1.5 text-[0.62rem] font-bold uppercase tracking-wider text-slate-400"><SubjectIcon type="teacher" className="size-3" />Teachers</div><div className="mt-1 font-semibold text-slate-800">{subject.teachers} assigned</div></div>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2">
                  <span className="text-xs font-semibold text-slate-600">{active ? "Active" : "Inactive"}<span className="ml-1.5 font-normal text-slate-400">{active ? "· available for mapping" : "· hidden from mapping"}</span></span>
                  <button type="button" role="switch" aria-checked={active} aria-label={`Toggle ${subject.name}`} onClick={() => toggleStatus(subject)} className={`relative h-6 w-11 shrink-0 rounded-full transition ${active ? "bg-(--app-accent-dark)" : "bg-slate-300"}`}><span className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform ${active ? "translate-x-5" : ""}`} /></button>
                </div>
                <div className="mt-auto flex items-center gap-2 border-t border-slate-100 pt-3">
                  <Button variant="secondary" className="min-h-8 flex-1 px-3 py-1.5 text-xs" onClick={() => openEdit(subject)} icon={<SubjectIcon type="edit" className="size-3.5" />}>Edit</Button>
                  <button type="button" onClick={() => duplicateSubject(subject)} aria-label={`Duplicate ${subject.name}`} title="Duplicate" className="grid size-8 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-(--app-accent-dark) active:scale-95"><SubjectIcon type="copy" className="size-4" /></button>
                  <button type="button" onClick={() => setDeleteSubject(subject)} aria-label={`Delete ${subject.name}`} title="Delete" className="grid size-8 shrink-0 place-items-center rounded-lg border border-rose-200 text-rose-500 transition hover:bg-rose-50 active:scale-95"><SubjectIcon type="trash" className="size-4" /></button>
                </div>
              </div>
            </article>;
          })}
        </div> : <div className="grid min-h-60 place-items-center p-6 text-center"><div>
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-(--app-accent-soft) text-(--app-accent-dark)"><SubjectIcon type="book" /></div>
          <h3 className="font-display mt-4 text-sm font-bold text-slate-700">No subjects found</h3>
          <p className="mt-1 text-xs text-slate-400">{hasFilters ? "Try changing or clearing the filters." : "Add your first subject to build the catalog."}</p>
          <div className="mt-4 flex justify-center gap-2">{hasFilters && <Button variant="outline" onClick={resetFilters}>Clear Filters</Button>}<Button onClick={openCreate} icon={<SubjectIcon type="plus" className="size-4" />}>Add Subject</Button></div>
        </div></div>}

        {filtered.length > 0 && <div className="border-t border-slate-100 bg-slate-50/60 px-3.5 py-3 sm:px-5">
          <PremiumPagination currentPage={safePage} totalPages={totalPages} totalRecords={filtered.length} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={(size: number) => { setPageSize(size); setCurrentPage(1); }} wideLayout />
        </div>}
      </section>
    </main>

    <Popup
      open={editorOpen}
      footerClassName="!grid grid-cols-2 items-stretch gap-2.5 sm:!flex [&>button]:h-11 [&>button]:w-full sm:[&>button]:w-auto"
      onClose={() => !saving && setEditorOpen(false)}
      title={editingId ? "Edit Subject" : "Add New Subject"}
      description="Configure the subject identity, curriculum type, and class coverage."
      footer={<><Button variant="outline" onClick={() => setEditorOpen(false)} disabled={saving}>Cancel</Button><Button onClick={saveSubject} isLoading={saving} loadingText={editingId ? "Updating subject..." : "Adding subject..."}>{editingId ? "Update Subject" : "Add Subject"}</Button></>}
    >
      <div className="grid grid-cols-6 items-start gap-x-3 gap-y-3.5 sm:gap-x-4 sm:gap-y-4 [&>:nth-child(-n+2)]:col-span-6 sm:[&>:nth-child(-n+2)]:col-span-3 [&>:nth-child(3)]:col-span-3 [&>:nth-child(4)]:col-span-3 [&>:nth-child(5)]:col-span-3 [&>:last-child]:col-span-3">
        <Input label="Subject Code *" value={form.code} onChange={(event) => setField("code", event.target.value)} placeholder="e.g. MAT-01" />
        <Input label="Subject Name *" value={form.name} onChange={(event) => setField("name", event.target.value)} placeholder="e.g. Mathematics" />
        <Dropdown label="Subject Type" value={form.type} onChange={(event) => setField("type", event.target.value)} options={types.map((value) => ({ label: value, value }))} />
        <Dropdown label="Status" value={form.status} onChange={(event) => setField("status", event.target.value)} options={["Active", "Inactive"].map((value) => ({ label: value, value }))} />
        <div className="sm:col-span-2"><Input label="Class Coverage *" value={form.classes} onChange={(event) => setField("classes", event.target.value)} placeholder="e.g. Class 1–10" hint="Describe the class range where this subject is taught." /></div>
        <Input label="Assigned Teachers" type="number" min="0" value={form.teachers} onChange={(event) => setField("teachers", event.target.value)} />
      </div>
    </Popup>

    <Popup
      open={Boolean(deleteSubject)}
      footerClassName="!grid grid-cols-2 items-stretch gap-2.5 sm:!flex [&>button]:h-11 [&>button]:w-full sm:[&>button]:w-auto"
      onClose={() => setDeleteSubject(null)}
      title="Delete Subject"
      description="Review the impact before removing this subject."
      footer={<><Button variant="outline" onClick={() => setDeleteSubject(null)}>Cancel</Button><Button variant="danger" onClick={confirmDelete} icon={<SubjectIcon type="trash" className="size-4" />}>Delete Subject</Button></>}
    >
      {deleteSubject && <div className="space-y-4"><div className="rounded-2xl border border-red-100 bg-red-50 p-4"><div className="font-display text-lg font-bold text-red-700">{deleteSubject.name}</div><div className="mt-1 text-xs text-red-600">{deleteSubject.code} · {deleteSubject.classes}</div></div><p className="text-xs leading-5 text-slate-500">Removing this subject may affect class-subject mappings and future exam schedules. Existing marks and historical records will be preserved.</p></div>}
    </Popup>
  </div>;
}
