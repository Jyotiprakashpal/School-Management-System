import { useMemo, useState, type ReactNode } from "react";
import { Button, Dropdown, Input, PremiumPagination, useToast } from "../../components";
import Header from "../../ui/header";
import Popup from "../../ui/popup";

type Result = "Passed" | "Review" | "Failed";

type RosterStudent = {
  admissionNo: string;
  className: string;
  name: string;
  result: Result;
  section: string;
};

type HistoryEntry = {
  id: number;
  academicYear: string;
  from: string;
  moves: { admissionNo: string; name: string; previousClass: string; targetClass: string }[];
  time: string;
};

const classes = ["Nursery", "LKG", "UKG", "Class 1", "Class 2", "Class 3"];

const initialRoster: RosterStudent[] = [
  { admissionNo: "ADM-26-1001", name: "Rahul Kumar", className: "UKG", section: "A", result: "Passed" },
  { admissionNo: "ADM-26-1023", name: "Ravi Kumar", className: "UKG", section: "A", result: "Passed" },
  { admissionNo: "ADM-26-1041", name: "Anaya Patel", className: "UKG", section: "A", result: "Passed" },
  { admissionNo: "ADM-26-1056", name: "Kabir Singh", className: "UKG", section: "A", result: "Review" },
  { admissionNo: "ADM-26-1062", name: "Meera Nair", className: "UKG", section: "A", result: "Passed" },
  { admissionNo: "ADM-26-1068", name: "Aarav Mishra", className: "UKG", section: "A", result: "Failed" },
  { admissionNo: "ADM-26-1074", name: "Ishita Rao", className: "UKG", section: "B", result: "Passed" },
  { admissionNo: "ADM-26-1079", name: "Vihaan Shah", className: "UKG", section: "B", result: "Passed" },
  { admissionNo: "ADM-26-1085", name: "Diya Menon", className: "LKG", section: "A", result: "Passed" },
  { admissionNo: "ADM-26-1090", name: "Zaid Ahmed", className: "LKG", section: "A", result: "Review" },
  { admissionNo: "ADM-26-1096", name: "Pari Desai", className: "LKG", section: "A", result: "Passed" },
  { admissionNo: "ADM-26-1102", name: "Yash Tiwari", className: "Class 1", section: "A", result: "Passed" },
  { admissionNo: "ADM-26-1108", name: "Naina Kapoor", className: "Class 1", section: "A", result: "Passed" },
  { admissionNo: "ADM-26-1114", name: "Om Pandey", className: "Class 1", section: "B", result: "Failed" },
  { admissionNo: "ADM-26-1120", name: "Aditya Rao", className: "Class 1", section: "B", result: "Passed" },
  { admissionNo: "ADM-26-1121", name: "Sneha Iyer", className: "Class 1", section: "B", result: "Passed" },
  { admissionNo: "ADM-26-1122", name: "Karan Bhatt", className: "Class 1", section: "B", result: "Passed" },
  { admissionNo: "ADM-26-1130", name: "Tara Bose", className: "Class 2", section: "A", result: "Passed" },
  { admissionNo: "ADM-26-1131", name: "Hriday Sen", className: "Class 2", section: "A", result: "Passed" },
  { admissionNo: "ADM-26-1140", name: "Anvi Reddy", className: "LKG", section: "B", result: "Passed" },
  { admissionNo: "ADM-26-1141", name: "Jiya Kohli", className: "LKG", section: "B", result: "Passed" },
  { admissionNo: "ADM-26-1142", name: "Arnav Dutta", className: "LKG", section: "B", result: "Passed" },
];

const demoHistory: HistoryEntry[] = [
  { id: 3, academicYear: "2027–28", from: "Class 1-A", time: "Today, 10:20 AM", moves: [
    { admissionNo: "ADM-26-1130", name: "Tara Bose", previousClass: "Class 1", targetClass: "Class 2" },
    { admissionNo: "ADM-26-1131", name: "Hriday Sen", previousClass: "Class 1", targetClass: "Class 2" },
  ] },
  { id: 2, academicYear: "2027–28", from: "UKG-B", time: "Yesterday, 04:15 PM", moves: [
    { admissionNo: "ADM-26-1120", name: "Aditya Rao", previousClass: "UKG", targetClass: "Class 1" },
    { admissionNo: "ADM-26-1121", name: "Sneha Iyer", previousClass: "UKG", targetClass: "Class 1" },
    { admissionNo: "ADM-26-1122", name: "Karan Bhatt", previousClass: "UKG", targetClass: "Class 1" },
  ] },
  { id: 1, academicYear: "2027–28", from: "Nursery-B", time: "Yesterday, 11:05 AM", moves: [
    { admissionNo: "ADM-26-1140", name: "Anvi Reddy", previousClass: "Nursery", targetClass: "LKG" },
    { admissionNo: "ADM-26-1141", name: "Jiya Kohli", previousClass: "Nursery", targetClass: "LKG" },
    { admissionNo: "ADM-26-1142", name: "Arnav Dutta", previousClass: "Nursery", targetClass: "LKG" },
  ] },
];

type IconName = "users" | "check" | "up" | "history" | "undo" | "download";

function PromotionIcon({ name, className = "size-4" }: { name: IconName; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    up: <><path d="M12 20V6M6 12l6-6 6 6" /><path d="M4 20h16" /></>,
    history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" /><path d="M12 7v5l3 2" /></>,
    undo: <path d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" />,
    download: <path d="M12 3v13M7 11l5 5 5-5M4 21h16" />,
  };
  return <svg className={className} aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

const nextClass = (className: string) => classes[Math.min(classes.indexOf(className) + 1, classes.length - 1)];
const initialsOf = (name: string) => name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
const resultClass: Record<Result, string> = { Passed: "status-success", Review: "status-warning", Failed: "status-danger" };

export default function Promotion() {
  const [roster, setRoster] = useState(initialRoster);
  const [currentClass, setCurrentClass] = useState("UKG");
  const [section, setSection] = useState("A");
  const [targetClass, setTargetClass] = useState("Class 1");
  const [academicYear, setAcademicYear] = useState("2027–28");
  const [loaded, setLoaded] = useState({ className: "UKG", section: "A" });
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initialRoster.filter((s) => s.className === "UKG" && s.section === "A" && s.result === "Passed").map((s) => s.admissionNo)));
  const [targets, setTargets] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [history, setHistory] = useState<HistoryEntry[]>(demoHistory);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const { showToast } = useToast();

  const eligible = useMemo(() => roster.filter((s) => s.className === loaded.className && s.section === loaded.section), [roster, loaded]);
  const targetOf = (student: RosterStudent) => targets[student.admissionNo] ?? nextClass(student.className);
  const filtered = useMemo(() => eligible.filter((student) => {
    const query = search.trim().toLowerCase();
    return (!query || `${student.name} ${student.admissionNo}`.toLowerCase().includes(query)) && (!resultFilter || student.result === resultFilter);
  }), [eligible, search, resultFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const selectedStudents = eligible.filter((student) => selected.has(student.admissionNo));
  const selectedCount = selectedStudents.length;
  const allSelected = eligible.length > 0 && selectedCount === eligible.length;
  const promotedTotal = history.reduce((sum, entry) => sum + entry.moves.length, 0);
  const yearValid = /^\d{4}[–-]\d{2}$/.test(academicYear.trim());

  const stats = [
    { label: "Current Session", value: "2026–27", tone: "teal", copy: `Moving to ${academicYear}`, icon: "history" as IconName },
    { label: "Eligible Students", value: String(eligible.length), tone: "green", copy: `${loaded.className}-${loaded.section} loaded`, icon: "users" as IconName },
    { label: "Selected", value: String(selectedCount), tone: "amber", copy: "Ready to promote", icon: "check" as IconName },
    { label: "Promoted", value: String(promotedTotal), tone: "violet", copy: `${history.length} promotion ${history.length === 1 ? "batch" : "batches"}`, icon: "up" as IconName },
  ];

  const loadStudents = async () => {
    setLoadingStudents(true);
    await new Promise((resolve) => window.setTimeout(resolve, 500));
    const list = roster.filter((s) => s.className === currentClass && s.section === section);
    setLoaded({ className: currentClass, section });
    setSelected(new Set(list.filter((s) => s.result === "Passed").map((s) => s.admissionNo)));
    setTargets(Object.fromEntries(list.map((s) => [s.admissionNo, targetClass])));
    setSearch("");
    setResultFilter("");
    setCurrentPage(1);
    setLoadingStudents(false);
    showToast(list.length ? `${list.length} students loaded from ${currentClass}-${section}.` : `No students found in ${currentClass}-${section}.`, { title: list.length ? "Students loaded" : "Nothing to load", tone: list.length ? "info" : "error" });
  };

  const changeCurrentClass = (value: string) => {
    setCurrentClass(value);
    setTargetClass(nextClass(value));
  };

  const toggleStudent = (admissionNo: string) => setSelected((current) => {
    const copy = new Set(current);
    if (copy.has(admissionNo)) copy.delete(admissionNo); else copy.add(admissionNo);
    return copy;
  });
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(eligible.map((s) => s.admissionNo)));

  const openConfirm = () => {
    if (!selectedCount) {
      showToast("Select at least one student before promoting.", { title: "No students selected", tone: "error" });
      return;
    }
    if (!yearValid) {
      showToast("Enter the academic year like 2027–28.", { title: "Invalid academic year", tone: "error" });
      return;
    }
    if (selectedStudents.some((student) => targetOf(student) === student.className)) {
      showToast("Some students have the same target as their current class. Change the Promote To value.", { title: "Check target class", tone: "error" });
      return;
    }
    setConfirmOpen(true);
  };

  const promoteStudents = async () => {
    setPromoting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 800));
    const moves = selectedStudents.map((student) => ({ admissionNo: student.admissionNo, name: student.name, previousClass: student.className, targetClass: targetOf(student) }));
    const moveMap = new Map(moves.map((move) => [move.admissionNo, move.targetClass]));
    setRoster((current) => current.map((student) => moveMap.has(student.admissionNo) ? { ...student, className: moveMap.get(student.admissionNo) as string } : student));
    setHistory((current) => [{ id: Date.now(), academicYear: academicYear.trim(), from: `${loaded.className}-${loaded.section}`, moves, time: `Today, ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` }, ...current]);
    setSelected(new Set());
    setPromoting(false);
    setConfirmOpen(false);
    showToast(`${moves.length} students were promoted successfully for ${academicYear.trim()}.`, { title: "Promotion completed" });
  };

  const undoPromotion = (entry: HistoryEntry) => {
    const back = new Map(entry.moves.map((move) => [move.admissionNo, move.previousClass]));
    setRoster((current) => current.map((student) => back.has(student.admissionNo) ? { ...student, className: back.get(student.admissionNo) as string } : student));
    setHistory((current) => current.filter((item) => item.id !== entry.id));
    showToast(`${entry.moves.length} students were returned to ${entry.from}.`, { title: "Promotion reverted", tone: "info" });
  };

  const exportList = () => {
    const csvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const lines = [["Admission No", "Student", "Current Class", "Result", "Promote To", "Selected"], ...filtered.map((s) => [s.admissionNo, s.name, `${s.className}-${s.section}`, s.result, targetOf(s), selected.has(s.admissionNo) ? "Yes" : "No"])].map((row) => row.map(csvCell).join(","));
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `promotion-${loaded.className}-${loaded.section}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast(`${filtered.length} students exported.`, { title: "Promotion list exported" });
  };

  return <div className="min-h-screen dashboard-bg pb-16">
    <Header title="Student Promotion" subtitle="Move eligible students into the next class and academic session" />
    <main className="space-y-4 p-3 sm:space-y-5 sm:p-6 xl:p-8">
      <section className="grid auto-rows-fr grid-cols-[repeat(2,minmax(0,1fr))] gap-2.5 sm:gap-3 xl:grid-cols-[repeat(4,minmax(0,1fr))] [&>article]:h-full">
        {stats.map((stat) => <article key={stat.label} className={`admission-summary-card admission-summary-${stat.tone} relative overflow-hidden rounded-2xl p-3 shadow-sm sm:p-5`}>
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="min-w-0"><div className="truncate text-[0.7rem] font-semibold text-slate-500 sm:text-xs">{stat.label}</div><div className="mt-1 font-display text-xl sm:text-2xl font-bold text-slate-950">{stat.value}</div></div>
            <span className="admission-summary-icon grid size-8 shrink-0 sm:size-10 place-items-center rounded-xl"><PromotionIcon name={stat.icon} className="size-4 sm:size-5" /></span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[0.7rem] font-medium text-slate-500 sm:mt-3 sm:gap-2 sm:text-xs"><span className="size-1.5 shrink-0 rounded-full bg-current opacity-50" /><span className="truncate">{stat.copy}</span></div>
        </article>)}
      </section>

      <section className="panel overflow-visible">
        <div className="panel-title flex-wrap gap-2 py-3 sm:flex-nowrap sm:gap-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-teal-50 text-teal-600 ring-1 ring-teal-100 sm:size-11"><PromotionIcon name="up" className="size-5" /></div>
            <div className="min-w-0"><h2 className="truncate">Promotion Setup</h2><p className="mt-0.5 truncate text-xs text-slate-400">Choose a class and load its students</p></div>
          </div>
          <span className="status-info shrink-0">Next session: {academicYear || "—"}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 p-4 max-sm:[&>:nth-child(1)]:col-span-2 max-sm:[&>:nth-child(4)]:col-span-2 max-sm:[&>:nth-child(5)]:col-span-2 sm:grid-cols-3 sm:gap-4 sm:items-end sm:p-5 sm:[&>:nth-child(4)]:col-span-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto] xl:[&>:nth-child(4)]:col-span-1">
          <Dropdown label="Current Class" value={currentClass} onChange={(event) => changeCurrentClass(event.target.value)} placeholder="Select class" options={classes.slice(0, -1).map((value) => ({ label: value, value }))} />
          <Dropdown label="Section" value={section} onChange={(event) => setSection(event.target.value)} placeholder="Select section" options={["A", "B", "C"].map((value) => ({ label: value, value }))} />
          <Dropdown label="Promote To" value={targetClass} onChange={(event) => setTargetClass(event.target.value)} placeholder="Select class" options={classes.map((value) => ({ label: value, value }))} />
          <Input label="Academic Year" value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} placeholder="2027–28" />
          <Button onClick={loadStudents} isLoading={loadingStudents} loadingText="Loading..." disabled={!currentClass || !section}>Load Students</Button>
        </div>
      </section>

      <section className="panel overflow-visible">
        <div className="panel-title flex-wrap gap-2 py-3 sm:flex-nowrap sm:gap-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-violet-50 text-violet-600 ring-1 ring-violet-100 sm:size-11"><PromotionIcon name="users" className="size-5" /></div>
            <div className="min-w-0"><h2 className="truncate">Eligible Students</h2><p className="mt-0.5 truncate text-xs text-slate-400">{loaded.className}-{loaded.section} · {filtered.length} visible records</p></div>
          </div>
          <div className="grid w-full shrink-0 grid-cols-3 gap-2 sm:flex sm:w-auto sm:flex-wrap">
            <Button variant="outline" className="px-3" onClick={exportList} disabled={!filtered.length} icon={<PromotionIcon name="download" />}>Export</Button>
            <Button variant="outline" className="px-3" onClick={toggleAll} disabled={!eligible.length}>{allSelected ? "Clear All" : "Select All"}</Button>
            <Button className="px-3" onClick={openConfirm} disabled={!eligible.length} icon={<PromotionIcon name="up" />}>Promote{selectedCount ? ` ${selectedCount}` : ""}</Button>
          </div>
        </div>

        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-[1fr_11rem_auto] xl:grid-cols-[1fr_12rem_auto]">
          <Input value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }} placeholder="Search student or admission no..." aria-label="Search students" />
          <Dropdown value={resultFilter} onChange={(event) => { setResultFilter(event.target.value); setCurrentPage(1); }} placeholder="All Results" aria-label="Result filter" options={["Passed", "Review", "Failed"].map((value) => ({ label: value, value }))} />
          <Button variant="outline" className="border-rose-200! bg-linear-to-r! from-rose-50! to-orange-50! text-rose-600! shadow-sm hover:from-rose-100! hover:to-orange-100! hover:border-rose-300! active:scale-95" onClick={() => { setSearch(""); setResultFilter(""); setCurrentPage(1); }} icon={<PromotionIcon name="history" className="size-3.5" />}>Reset</Button>
        </div>

        <div className="overflow-x-auto">
          <table className="module-table student-directory-table student-premium-cards">
            <thead><tr><th>Admission No.</th><th>Student</th><th>Current Class</th><th>Result</th><th>Promote To</th><th>Readiness</th><th>Action</th></tr></thead>
            <tbody>{visible.map((student) => <tr key={student.admissionNo}>
              <td data-label="Admission No."><span className="font-semibold text-cyan-600">{student.admissionNo}</span></td>
              <td data-label="Student"><div className="flex items-center gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet-50 text-xs font-bold text-violet-600">{initialsOf(student.name)}</div><span className="font-semibold text-slate-900">{student.name}</span></div></td>
              <td data-label="Current Class">{student.className}-{student.section}</td>
              <td data-label="Result"><span className={resultClass[student.result]}>{student.result}</span></td>
              <td data-label="Promote To"><select value={targetOf(student)} onChange={(event) => setTargets((current) => ({ ...current, [student.admissionNo]: event.target.value }))} aria-label={`Promote ${student.name} to`} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-600 outline-none focus:border-teal-400">{classes.map((value) => <option key={value}>{value}</option>)}</select></td>
              <td data-label="Readiness"><span className={selected.has(student.admissionNo) ? "status-info" : "status-neutral"}>{selected.has(student.admissionNo) ? "Ready" : "Not selected"}</span></td>
              <td data-label="Action"><div className="flex gap-2"><Button variant={selected.has(student.admissionNo) ? "secondary" : "outline"} className={`min-h-8 px-3 py-1.5 text-xs ${selected.has(student.admissionNo) ? "student-edit-action" : "student-view-action"}`} aria-pressed={selected.has(student.admissionNo)} onClick={() => toggleStudent(student.admissionNo)}>{selected.has(student.admissionNo) ? "Selected" : "Select"}</Button></div></td>
            </tr>)}</tbody>
          </table>
          {!filtered.length && <div className="grid min-h-56 place-items-center p-6 text-center"><div><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-500"><PromotionIcon name="check" className="size-6" /></div><h3 className="mt-4 font-display text-sm font-bold text-slate-700">{eligible.length ? "No students match the filters" : "No students to promote"}</h3><p className="mt-1 text-xs text-slate-400">{eligible.length ? "Try changing your search or filter." : "Choose another class and section, then press Load Students."}</p></div></div>}
        </div>

        <footer className="space-y-3 border-t border-slate-100 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-1 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><span>{selectedCount} of {eligible.length} students selected</span><span>Promotions will be recorded under academic year <strong>{academicYear || "—"}</strong></span></div>
          <PremiumPagination currentPage={safePage} totalPages={totalPages} totalRecords={filtered.length} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} wideLayout />
        </footer>
      </section>

      <section className="panel overflow-visible">
        <div className="panel-title py-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-100 sm:size-11"><PromotionIcon name="history" className="size-5" /></div>
            <div className="min-w-0"><h2 className="truncate">Promotion History</h2><p className="mt-0.5 truncate text-xs text-slate-400">Review or undo promotions from this session</p></div>
          </div>
        </div>
        {history.length ? <ul className="divide-y divide-slate-100">{history.map((entry) => <li key={entry.id} className="flex flex-col gap-3 border-l-4 border-l-amber-300 bg-linear-to-r from-amber-50/60 to-transparent p-4 sm:border-l-0 sm:bg-none sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">{entry.moves.length} students · {entry.from}<span className="text-slate-300">→</span>{Array.from(new Set(entry.moves.map((move) => move.targetClass))).join(", ")}<span className="status-info">{entry.academicYear}</span></div>
            <p className="mt-1 truncate text-xs text-slate-400">{entry.time} · {entry.moves.map((move) => move.name).join(", ")}</p>
          </div>
          <Button variant="outline" className="w-full shrink-0 px-3 sm:w-auto sm:self-auto" onClick={() => undoPromotion(entry)} icon={<PromotionIcon name="undo" />}>Undo</Button>
        </li>)}</ul> : <div className="grid min-h-32 place-items-center p-6 text-center text-xs text-slate-400">No promotions yet. Promoted batches will appear here.</div>}
      </section>
    </main>

    <Popup
      open={confirmOpen}
      onClose={() => !promoting && setConfirmOpen(false)}
      title="Confirm Student Promotion"
      description="Review this action carefully before updating academic records."
      footer={<><Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={promoting}>Cancel</Button><Button onClick={promoteStudents} isLoading={promoting} loadingText="Promoting students...">Confirm Promotion</Button></>}
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4"><div className="text-sm font-bold text-amber-800">{selectedCount} students will be promoted</div><p className="mt-1 text-xs leading-5 text-amber-700">You can undo this from Promotion History while you stay on this screen.</p></div>
        <dl className="grid grid-cols-2 gap-3">{[["From", `${loaded.className}-${loaded.section}`], ["Academic Year", academicYear.trim()], ["Selected Students", String(selectedCount)], ["Promote To", Array.from(new Set(selectedStudents.map(targetOf))).join(", ")]].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-100 p-3"><dt className="text-[0.62rem] font-bold uppercase tracking-wider text-slate-400">{label}</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{value}</dd></div>)}</dl>
      </div>
    </Popup>
  </div>;
}
