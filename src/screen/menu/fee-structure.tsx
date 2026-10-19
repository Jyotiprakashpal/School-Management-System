import { useMemo, useState, type ReactNode } from "react";
import { Button, Dropdown, Input, PremiumPagination, useToast } from "../../components";
import Header from "../../ui/header";
import Popup from "../../ui/popup";
import { classBase, useStructure, useStudents, type FeeItem } from "../../data/feeStore";

type AssignmentLog = { id: number; className: string; year: string; students: number; heads: number; perStudent: number; time: string };

const classes = ["Nursery", "LKG", "UKG", "Class 1", "Class 2", "Class 3"];
const years = ["2026–27", "2027–28", "2028–29"];
const frequencies = ["One Time", "Monthly", "Quarterly", "Half Yearly", "Yearly"];
const activeStudents: Record<string, number> = { Nursery: 18, LKG: 24, UKG: 26, "Class 1": 28, "Class 2": 22, "Class 3": 20 };

const classOptions = classes.map((value) => ({ label: value, value }));
const yearOptions = years.map((value) => ({ label: value, value }));
const frequencyOptions = frequencies.map((value) => ({ label: value, value }));

const initialAssignments: AssignmentLog[] = [
  { id: 2, className: "UKG", year: "2027–28", students: 26, heads: 2, perStudent: 6200, time: "Yesterday, 03:40 PM" },
  { id: 1, className: "Class 1", year: "2027–28", students: 28, heads: 2, perStudent: 3300, time: "2 days ago, 11:10 AM" },
];

const emptyForm = { className: "", name: "", amount: "", year: "2027–28", frequency: "Monthly" };

type IconType = "add" | "assign" | "copy" | "table" | "money" | "classes" | "calendar" | "layers" | "download" | "reset";

function FeeIcon({ type, className = "size-5" }: { type: IconType; className?: string }) {
  const paths: Record<IconType, ReactNode> = {
    add: <><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></>,
    assign: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M16 11h6" /></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V4H4v12h4" /></>,
    table: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M9 4v16" /></>,
    money: <path d="M7 5h10M7 9h10M8 5c7 0 7 8 0 8l8 7" />,
    classes: <><path d="m3 9 9-5 9 5-9 5-9-5Z" /><path d="M7 11.5V16c3 2.7 7 2.7 10 0v-4.5" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></>,
    download: <path d="M12 3v13M7 11l5 5 5-5M4 21h16" />,
    reset: <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />,
  };
  return <svg className={className} aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{paths[type]}</svg>;
}

function PanelHead({ icon, title, subtitle, action }: { icon: IconType; title: string; subtitle: string; action?: ReactNode }) {
  return <div className="panel-title flex-wrap gap-3 py-3 sm:flex-nowrap">
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-(--app-accent-soft) text-(--app-accent-dark) ring-1 ring-(--app-accent)/20 sm:size-11"><FeeIcon type={icon} /></div>
      <div className="min-w-0"><h2 className="truncate">{title}</h2><p className="mt-0.5 truncate text-xs text-slate-400">{subtitle}</p></div>
    </div>
    {action}
  </div>;
}

const money = (value: number | string) => `₹${Number(value).toLocaleString("en-IN")}`;
const frequencyClass: Record<string, string> = { "One Time": "status-neutral", Monthly: "status-info", Quarterly: "status-warning", "Half Yearly": "status-warning", Yearly: "status-success" };
const csvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;

export default function FeeStructure() {
  const [fees, setFees] = useStructure();
  const [, setStudents] = useStudents();
  const [assignments, setAssignments] = useState(initialAssignments);
  const [feeForm, setFeeForm] = useState(emptyForm);
  const [assignClass, setAssignClass] = useState("");
  const [assignYear, setAssignYear] = useState("2027–28");
  const [fromYear, setFromYear] = useState("2026–27");
  const [toYear, setToYear] = useState("2027–28");
  const [saving, setSaving] = useState<"fee" | "assign" | "copy" | "edit" | null>(null);
  const [deleteItem, setDeleteItem] = useState<FeeItem | null>(null);
  const [editItem, setEditItem] = useState<FeeItem | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("2027–28");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const { showToast } = useToast();

  const filteredFees = useMemo(() => fees.filter((fee) => {
    const query = search.trim().toLowerCase();
    return (!query || `${fee.name} ${fee.className}`.toLowerCase().includes(query)) && (!classFilter || fee.className === classFilter) && (!yearFilter || fee.year === yearFilter);
  }), [fees, search, classFilter, yearFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredFees.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const visibleFees = filteredFees.slice((safePage - 1) * pageSize, safePage * pageSize);

  const sessionFees = fees.filter((fee) => fee.year === "2027–28");
  const assignedStudents = assignments.filter((entry) => entry.year === "2027–28").reduce((sum, entry) => sum + entry.students, 0);
  const stats = [
    { label: "Fee Types", value: String(sessionFees.length), tone: "teal", copy: "Configured for 2027–28", icon: "layers" as IconType },
    { label: "Classes Covered", value: String(new Set(sessionFees.map((fee) => fee.className)).size), tone: "green", copy: `Of ${classes.length} classes`, icon: "classes" as IconType },
    { label: "Students Assigned", value: String(assignedStudents), tone: "amber", copy: `${assignments.length} assignment runs`, icon: "assign" as IconType },
    { label: "Combined Amount", value: money(sessionFees.reduce((sum, fee) => sum + Number(fee.amount), 0)), tone: "violet", copy: "Across 2027–28 fee heads", icon: "money" as IconType },
  ];

  const isDuplicate = (candidate: { className: string; name: string; year: string }, ignoreId?: number) =>
    fees.some((fee) => fee.id !== ignoreId && fee.className === candidate.className && fee.year === candidate.year && fee.name.trim().toLowerCase() === candidate.name.trim().toLowerCase());

  const validate = (form: typeof emptyForm, ignoreId?: number) => {
    if (!form.className || !form.name.trim() || !form.amount) return "Class, Fee Type, and Amount are required.";
    if (!(Number(form.amount) > 0)) return "Amount must be greater than zero.";
    if (isDuplicate(form, ignoreId)) return `${form.name.trim()} already exists for ${form.className} in ${form.year}.`;
    return "";
  };

  const addFee = async () => {
    const error = validate(feeForm);
    if (error) { showToast(error, { title: "Check fee details", tone: "error" }); return; }
    setSaving("fee");
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    setFees((current) => [{ ...feeForm, name: feeForm.name.trim(), id: Date.now() }, ...current]);
    setSaving(null);
    setYearFilter(feeForm.year);
    setCurrentPage(1);
    showToast(`${feeForm.name.trim()} has been added for ${feeForm.className}.`, { title: "Fee type added" });
    setFeeForm({ ...emptyForm, year: feeForm.year });
  };

  const openEdit = (fee: FeeItem) => { setEditItem(fee); setEditForm({ className: fee.className, name: fee.name, amount: fee.amount, year: fee.year, frequency: fee.frequency }); };

  const saveEdit = async () => {
    if (!editItem) return;
    const error = validate(editForm, editItem.id);
    if (error) { showToast(error, { title: "Check fee details", tone: "error" }); return; }
    setSaving("edit");
    await new Promise((resolve) => window.setTimeout(resolve, 600));
    setFees((current) => current.map((fee) => fee.id === editItem.id ? { ...fee, ...editForm, name: editForm.name.trim() } : fee));
    setSaving(null);
    showToast(`${editForm.name.trim()} for ${editForm.className} was updated.`, { title: "Fee type updated" });
    setEditItem(null);
  };

  const assignFees = async () => {
    if (!assignClass) { showToast("Select a class before assigning fees.", { title: "Class required", tone: "error" }); return; }
    const heads = fees.filter((fee) => fee.className === assignClass && fee.year === assignYear);
    if (!heads.length) { showToast(`${assignClass} has no fee heads for ${assignYear}. Add one first.`, { title: "No fee heads found", tone: "error" }); return; }
    setSaving("assign");
    await new Promise((resolve) => window.setTimeout(resolve, 800));
    const students = activeStudents[assignClass] ?? 0;
    const perStudent = heads.reduce((sum, fee) => sum + Number(fee.amount), 0);
    setStudents((current) => current.map((student) => classBase(student.className) !== assignClass ? student : { ...student, fees: [...student.fees, ...heads.filter((fee) => !student.fees.some((existing) => existing.name === fee.name)).map((fee, index) => ({ id: Date.now() + index, name: fee.name, amount: Number(fee.amount), paid: 0, selected: false }))] }));
    setAssignments((current) => [{ id: Date.now(), className: assignClass, year: assignYear, students, heads: heads.length, perStudent, time: `Today, ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` }, ...current]);
    setSaving(null);
    showToast(`${heads.length} fee heads (${money(perStudent)}) were assigned to ${students} active ${assignClass} students.`, { title: "Fees assigned successfully" });
  };

  const copyStructure = async () => {
    if (fromYear === toYear) { showToast("From Year and To Year must be different.", { title: "Choose another year", tone: "error" }); return; }
    const source = fees.filter((fee) => fee.year === fromYear);
    if (!source.length) { showToast(`No fee heads exist for ${fromYear}.`, { title: "Nothing to copy", tone: "error" }); return; }
    setSaving("copy");
    await new Promise((resolve) => window.setTimeout(resolve, 800));
    const additions = source.filter((fee) => !isDuplicate({ className: fee.className, name: fee.name, year: toYear })).map((fee, index) => ({ ...fee, id: Date.now() + index, year: toYear }));
    setFees((current) => [...additions, ...current]);
    setSaving(null);
    setYearFilter(toYear);
    setCurrentPage(1);
    showToast(`${additions.length} copied from ${fromYear} to ${toYear}${source.length - additions.length ? `, ${source.length - additions.length} skipped as existing` : ""}.`, { title: additions.length ? "Structure copied" : "Nothing new to copy", tone: additions.length ? "success" : "info" });
  };

  const confirmDelete = () => {
    if (!deleteItem) return;
    setFees((current) => current.filter((fee) => fee.id !== deleteItem.id));
    showToast(`${deleteItem.name} was removed from ${deleteItem.className}.`, { title: "Fee type deleted", tone: "info" });
    setDeleteItem(null);
  };

  const exportFees = () => {
    const header = ["Class", "Fee Type", "Amount", "Academic Year", "Frequency"];
    const lines = filteredFees.map((fee) => [fee.className, fee.name, fee.amount, fee.year, fee.frequency].map(csvCell).join(","));
    const url = URL.createObjectURL(new Blob([[header.map(csvCell).join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `fee-structure-${yearFilter || "all"}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast(`${filteredFees.length} fee entries exported.`, { title: "Fee structure exported" });
  };

  const resetFilters = () => { setSearch(""); setClassFilter(""); setYearFilter("2027–28"); setCurrentPage(1); };

  return <div className="min-h-screen dashboard-bg pb-16">
    <Header title="Fee Structure" subtitle="Create fee heads, assign classes, and manage academic-year pricing" />
    <main className="space-y-4 p-3 sm:space-y-5 sm:p-6 xl:p-8">
      <section className="grid auto-rows-fr grid-cols-[repeat(2,minmax(0,1fr))] gap-2.5 sm:gap-3 xl:grid-cols-[repeat(4,minmax(0,1fr))] [&>article]:h-full">
        {stats.map((stat) => <article key={stat.label} className={`admission-summary-card admission-summary-${stat.tone} relative overflow-hidden rounded-2xl p-3 shadow-sm sm:p-5`}>
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="min-w-0"><div className="truncate text-[0.7rem] font-semibold text-slate-500 sm:text-xs">{stat.label}</div><div className="mt-1 truncate font-display text-xl font-bold text-slate-950 sm:text-2xl">{stat.value}</div></div>
            <span className="admission-summary-icon grid size-8 shrink-0 place-items-center rounded-xl sm:size-10"><FeeIcon type={stat.icon} className="size-4 sm:size-5" /></span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[0.7rem] font-medium text-slate-500 sm:mt-3 sm:gap-2 sm:text-xs"><span className="size-1.5 shrink-0 rounded-full bg-current opacity-50" /><span className="truncate">{stat.copy}</span></div>
        </article>)}
      </section>

      <div className="grid items-start gap-4 sm:gap-5 xl:grid-cols-[1.1fr_.9fr] xl:items-stretch">
        <section className="panel relative flex flex-col overflow-visible">
          <span aria-hidden="true" className="absolute inset-x-6 top-0 h-0.5 rounded-b-full bg-[linear-gradient(90deg,transparent,var(--app-accent),transparent)]" />
          <PanelHead icon="add" title="Add Fee Type" subtitle="Create a new fee head for a class" action={<span className="status-info shrink-0">New fee head</span>} />
          <form className="flex flex-1 flex-col" noValidate onSubmit={(event) => { event.preventDefault(); void addFee(); }}>
          <div className="flex items-center gap-2.5 bg-slate-50/60 px-4 pt-4 sm:px-6 sm:pt-5">
            <span className="grid size-6 place-items-center rounded-full bg-(--app-accent) text-[0.7rem] font-bold text-white shadow-sm">1</span>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Fee details</span>
            <span className="h-px flex-1 bg-linear-to-r from-slate-200 to-transparent" />
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-4 bg-linear-to-b from-slate-50/60 to-transparent px-4 pb-4 pt-3 max-sm:[&>:nth-child(-n+2)]:col-span-2 [&>*]:min-w-0 [&_label]:min-w-0 [&_select]:w-full [&_select]:min-w-0 [&_select]:max-w-full [&_input]:min-w-0 [&_input]:max-w-full [&_select]:truncate [&_select]:pr-8 sm:grid-cols-6 sm:gap-x-4 sm:gap-y-5 sm:px-6 sm:pb-6 sm:pt-4 sm:[&>:nth-child(-n+2)]:col-span-3 sm:[&>:nth-child(n+3)]:col-span-2">
            <Dropdown label="Class *" value={feeForm.className} onChange={(event) => setFeeForm((current) => ({ ...current, className: event.target.value }))} placeholder="Select class" options={classOptions} />
            <Input label="Fee Type *" value={feeForm.name} onChange={(event) => setFeeForm((current) => ({ ...current, name: event.target.value }))} placeholder="e.g. Tuition Fee" />
            <Input label="Amount (₹) *" type="number" min="0" value={feeForm.amount} onChange={(event) => setFeeForm((current) => ({ ...current, amount: event.target.value }))} placeholder="0.00" />
            <Dropdown label="Academic Year" value={feeForm.year} onChange={(event) => setFeeForm((current) => ({ ...current, year: event.target.value }))} options={yearOptions} />
            <div className="col-span-2"><Dropdown label="Frequency" value={feeForm.frequency} onChange={(event) => setFeeForm((current) => ({ ...current, frequency: event.target.value }))} options={frequencyOptions} /></div>
          </div>
          <div className="flex flex-1 flex-col justify-between gap-4 bg-slate-50/60 px-4 pb-4 sm:px-6 sm:pb-6">
            <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
              {(() => {
                const existing = fees.filter((fee) => fee.className === feeForm.className && fee.year === feeForm.year);
                const total = existing.reduce((sum, fee) => sum + Number(fee.amount), 0);
                return <>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[0.65rem] font-bold uppercase tracking-widest text-slate-400">{feeForm.className ? `Existing in ${feeForm.className}` : "Existing fee heads"}</span>
                    {feeForm.className && <span className="shrink-0 text-xs font-semibold text-(--app-accent-dark)">{existing.length} heads · {money(total)}</span>}
                  </div>
                  {!feeForm.className ? <p className="mt-3 text-xs leading-5 text-slate-500">Select a class to see the fee heads already set up, so you can avoid duplicates.</p>
                    : existing.length === 0 ? <p className="mt-3 text-xs leading-5 text-slate-500">No fee heads yet for {feeForm.className} in {feeForm.year}. This will be the first one.</p>
                    : <ul className="mt-3 divide-y divide-slate-100">{existing.slice(0, 4).map((fee) => <li key={fee.id} className="flex items-center justify-between gap-3 py-2 text-xs"><span className="min-w-0 truncate font-medium text-slate-700">{fee.name}</span><span className="shrink-0 text-slate-500">{money(fee.amount)}</span></li>)}{existing.length > 4 && <li className="pt-2 text-[0.7rem] text-slate-400">+{existing.length - 4} more</li>}</ul>}
                </>;
              })()}
            </div>
            <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(135deg,var(--app-sidebar-start),var(--app-accent-dark)_60%,var(--app-accent))] p-4 text-white shadow-lg shadow-black/10 sm:p-5">
              <span aria-hidden="true" className="pointer-events-none absolute -right-8 -top-10 size-32 rounded-full bg-white/10" />
              <div className="relative flex items-center justify-between gap-3">
                <span className="text-[0.65rem] font-bold uppercase tracking-widest text-white/70">Live preview</span>
                <span className="shrink-0 rounded-full bg-white/15 px-2.5 py-0.5 text-[0.7rem] font-semibold ring-1 ring-white/25">{feeForm.year || "Year"}</span>
              </div>
              <div className="relative mt-4 flex items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/15 ring-1 ring-white/25"><FeeIcon type="money" className="size-5" /></span>
                <div className="min-w-0 flex-1">
                  <div className={`truncate text-sm font-semibold ${feeForm.name.trim() ? "" : "text-white/50"}`}>{feeForm.name.trim() || "Fee type name"}</div>
                  <div className="truncate text-xs text-white/70">{feeForm.className || "No class selected"} · {feeForm.frequency}</div>
                </div>
                <div className={`shrink-0 font-display text-xl font-bold ${Number(feeForm.amount) > 0 ? "" : "text-white/50"}`}>{money(feeForm.amount || 0)}</div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 rounded-b-[inherit] border-t border-slate-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <p className="min-w-0 text-xs text-slate-500">Fields marked * are required.</p>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
              <Button variant="outline" onClick={() => setFeeForm({ ...emptyForm, year: feeForm.year })} disabled={saving === "fee"}>Clear</Button>
              <Button type="submit" icon={<FeeIcon type="add" className="size-4" />} isLoading={saving === "fee"} loadingText="Adding...">Add Fee Type</Button>
            </div>
          </div>
          </form>
        </section>

        <section className="panel overflow-visible">
          <PanelHead icon="assign" title="Assign Fees to Students" subtitle="Apply fee heads to a whole class" />
          <div className="p-4 sm:p-5">
            <div className="rounded-2xl border border-(--app-accent)/20 bg-(--app-accent-faint) p-4 text-xs leading-5 text-(--app-accent-dark)">Assign every configured fee head to all active students in a class. Existing fee assignments will be skipped safely.</div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-1 2xl:grid-cols-2">
              <Dropdown label="Select Class" value={assignClass} onChange={(event) => setAssignClass(event.target.value)} placeholder="Select class" options={classOptions} />
              <Dropdown label="Academic Year" value={assignYear} onChange={(event) => setAssignYear(event.target.value)} options={yearOptions} />
            </div>
            {assignClass && <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-500"><span>{fees.filter((fee) => fee.className === assignClass && fee.year === assignYear).length} fee heads · {activeStudents[assignClass]} active students</span><strong className="text-slate-800">{money(fees.filter((fee) => fee.className === assignClass && fee.year === assignYear).reduce((sum, fee) => sum + Number(fee.amount), 0))} / student</strong></div>}
            <Button className="mt-4" fullWidth onClick={assignFees} isLoading={saving === "assign"} loadingText="Assigning fees...">Assign to All Students</Button>
            {assignments.length > 0 && <ul className="mt-4 space-y-2">{assignments.slice(0, 2).map((entry) => <li key={entry.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs"><span className="min-w-0 truncate font-semibold text-slate-700">{entry.className} · {entry.year}</span><span className="shrink-0 text-slate-400">{entry.students} students · {entry.time}</span></li>)}</ul>}
          </div>
        </section>
      </div>

      <section className="panel overflow-visible">
        <PanelHead icon="copy" title="Copy Structure to Next Year" subtitle="Existing destination entries will be skipped" />
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end sm:gap-4 sm:p-5 xl:grid-cols-[16rem_auto_16rem_1fr]">
          <Dropdown label="From Year" value={fromYear} onChange={(event) => setFromYear(event.target.value)} options={yearOptions} />
          <div className="hidden pb-3 text-slate-300 sm:block">→</div>
          <Dropdown label="To Year" value={toYear} onChange={(event) => setToYear(event.target.value)} options={yearOptions} />
          <Button className="col-span-2 sm:col-span-3 xl:col-span-1 xl:justify-self-end" icon={<FeeIcon type="copy" className="size-4" />} onClick={copyStructure} isLoading={saving === "copy"} loadingText="Copying structure...">Copy Structure</Button>
        </div>
      </section>

      <section className="panel overflow-visible">
        <PanelHead icon="table" title="Current Fee Structure" subtitle={`${filteredFees.length} fee entries`} action={<Button variant="outline" className="shrink-0 px-3" onClick={exportFees} disabled={!filteredFees.length} icon={<FeeIcon type="download" className="size-4" />}>Export</Button>} />
        <div className="grid grid-cols-2 gap-2.5 border-b border-slate-100 bg-linear-to-b from-slate-50/80 to-transparent p-3 max-sm:[&>:first-child]:col-span-2 max-sm:[&>:last-child]:col-span-2 sm:grid-cols-[1fr_9rem_9rem_auto] sm:gap-3 sm:p-4 xl:grid-cols-[1fr_12rem_12rem_auto]">
          <Input value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }} placeholder="Search fee type or class..." aria-label="Search fee structure" />
          <Dropdown value={classFilter} onChange={(event) => { setClassFilter(event.target.value); setCurrentPage(1); }} placeholder="All Classes" aria-label="Class filter" options={classOptions} />
          <Dropdown value={yearFilter} onChange={(event) => { setYearFilter(event.target.value); setCurrentPage(1); }} placeholder="All Years" aria-label="Year filter" options={yearOptions} />
          <Button variant="outline" className="border-rose-200! bg-linear-to-r! from-rose-50! to-orange-50! text-rose-600! shadow-sm hover:from-rose-100! hover:to-orange-100! hover:border-rose-300! active:scale-95" onClick={resetFilters} icon={<FeeIcon type="reset" className="size-3.5" />}>Reset</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="module-table student-directory-table student-premium-cards">
            <thead><tr><th>Class</th><th>Fee Type</th><th>Amount</th><th>Academic Year</th><th>Frequency</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{visibleFees.map((fee) => <tr key={fee.id}>
              <td data-label="Class"><span className="font-semibold text-slate-900">{fee.className}</span></td>
              <td data-label="Fee Type">{fee.name}</td>
              <td data-label="Amount"><span className="font-display font-bold text-slate-900">{money(fee.amount)}</span></td>
              <td data-label="Academic Year">{fee.year}</td>
              <td data-label="Frequency"><span className={frequencyClass[fee.frequency] ?? "status-neutral"}>{fee.frequency}</span></td>
              <td data-label="Status"><span className="status-success">Active</span></td>
              <td data-label="Actions"><div className="flex gap-2"><Button variant="secondary" className="student-edit-action min-h-8 px-3 py-1.5 text-xs" onClick={() => openEdit(fee)}>Edit</Button><Button variant="danger" className="min-h-8 px-3 py-1.5 text-xs" onClick={() => setDeleteItem(fee)}>Delete</Button></div></td>
            </tr>)}</tbody>
          </table>
          {!filteredFees.length && <div className="grid min-h-60 place-items-center p-6 text-center"><div><div className="mx-auto grid size-16 place-items-center rounded-2xl bg-(--app-accent-soft) text-(--app-accent-dark)"><FeeIcon type="table" /></div><h3 className="mt-4 font-display text-sm font-bold text-slate-700">No fee structure found</h3><p className="mt-1 text-xs text-slate-400">Add a fee type or change your filters.</p></div></div>}
        </div>
        <footer className="border-t border-slate-100 px-4 py-4 sm:px-5">
          <PremiumPagination currentPage={safePage} totalPages={totalPages} totalRecords={filteredFees.length} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} wideLayout />
        </footer>
      </section>
    </main>

    <Popup
      open={Boolean(editItem)}
      onClose={() => saving !== "edit" && setEditItem(null)}
      title="Edit Fee Type"
      description="Update the amount, class, year or frequency of this fee head."
      footer={<><Button variant="outline" onClick={() => setEditItem(null)} disabled={saving === "edit"}>Cancel</Button><Button onClick={saveEdit} isLoading={saving === "edit"} loadingText="Saving...">Save Changes</Button></>}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Dropdown label="Class *" value={editForm.className} onChange={(event) => setEditForm((current) => ({ ...current, className: event.target.value }))} options={classOptions} />
        <Input label="Fee Type *" value={editForm.name} onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))} />
        <Input label="Amount (₹) *" type="number" min="0" value={editForm.amount} onChange={(event) => setEditForm((current) => ({ ...current, amount: event.target.value }))} />
        <Dropdown label="Academic Year" value={editForm.year} onChange={(event) => setEditForm((current) => ({ ...current, year: event.target.value }))} options={yearOptions} />
        <Dropdown label="Frequency" value={editForm.frequency} onChange={(event) => setEditForm((current) => ({ ...current, frequency: event.target.value }))} options={frequencyOptions} />
      </div>
    </Popup>

    <Popup
      open={Boolean(deleteItem)}
      onClose={() => setDeleteItem(null)}
      title="Delete Fee Type"
      description="This action removes the fee head from the current structure."
      footer={<><Button variant="outline" onClick={() => setDeleteItem(null)}>Cancel</Button><Button variant="danger" onClick={confirmDelete}>Delete Fee Type</Button></>}
    >
      {deleteItem && <div className="rounded-2xl border border-red-100 bg-red-50 p-4"><div className="text-sm font-bold text-red-700">{deleteItem.name} · {deleteItem.className} · {deleteItem.year}</div><p className="mt-1 text-xs leading-5 text-red-600">Existing student payment records will not be deleted, but this fee type will no longer be available for new assignments.</p></div>}
    </Popup>
  </div>;
}
