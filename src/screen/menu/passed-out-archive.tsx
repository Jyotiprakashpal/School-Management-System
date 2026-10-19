import { useMemo, useState, type ReactNode } from "react";
import { Button, Dropdown, Input, PremiumPagination, useToast } from "../../components";
import Header from "../../ui/header";
import Popup from "../../ui/popup";

type ArchivedStudent = {
  admissionNo: string;
  className: string;
  fatherName: string;
  name: string;
  passingYear: string;
  phone: string;
  reason: string;
  tcNumber: string;
};

const initialStudents: ArchivedStudent[] = [
  { admissionNo: "ADM-22-0081", name: "Neha Sharma", fatherName: "Rajesh Sharma", className: "Class 12-A", passingYear: "2025–26", tcNumber: "TC-26018", phone: "9876512345", reason: "Passed Class 12" },
  { admissionNo: "ADM-21-0063", name: "Kabir Singh", fatherName: "Aman Singh", className: "Class 12-B", passingYear: "2025–26", tcNumber: "TC-26011", phone: "8765412345", reason: "Passed Class 12" },
  { admissionNo: "ADM-20-0042", name: "Priya Verma", fatherName: "Suresh Verma", className: "Class 10-A", passingYear: "2024–25", tcNumber: "TC-25047", phone: "7654312345", reason: "School transfer" },
  { admissionNo: "ADM-19-0034", name: "Arjun Mehta", fatherName: "Vikas Mehta", className: "Class 12-A", passingYear: "2023–24", tcNumber: "TC-24029", phone: "9123412345", reason: "Passed Class 12" },
  { admissionNo: "ADM-20-0057", name: "Sana Qureshi", fatherName: "Imtiyaz Qureshi", className: "Class 10-B", passingYear: "2024–25", tcNumber: "TC-25039", phone: "9988712345", reason: "Passed Class 10" },
  { admissionNo: "ADM-19-0021", name: "Rohan Gupta", fatherName: "Anil Gupta", className: "Class 12-B", passingYear: "2023–24", tcNumber: "TC-24017", phone: "9012312345", reason: "Passed Class 12" },
  { admissionNo: "ADM-21-0072", name: "Tanvi Joshi", fatherName: "Mukesh Joshi", className: "Class 10-A", passingYear: "2025–26", tcNumber: "TC-26024", phone: "9345612345", reason: "Family relocation" },
  { admissionNo: "ADM-20-0066", name: "Dev Malhotra", fatherName: "Ravi Malhotra", className: "Class 12-A", passingYear: "2024–25", tcNumber: "TC-25051", phone: "9456712345", reason: "Passed Class 12" },
];

const emptyForm = { admissionNo: "", name: "", fatherName: "", className: "", passingYear: "2025–26", phone: "", reason: "Passed Class 12" };

type IconName = "archive" | "check" | "document" | "plus" | "restore" | "calendar" | "book";

function ArchiveIcon({ name, className = "size-4" }: { name: IconName; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    archive: <path d="M4 7h16v14H4zM3 3h18v4H3zM9 11h6" />,
    check: <path d="m5 12 4 4L19 6" />,
    document: <><path d="M6 2h8l4 4v16H6z" /><path d="M14 2v5h5M9 12h6M9 16h6" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    restore: <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
    book: <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z" />,
  };
  return <svg className={className} aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function downloadFile(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const csvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;
const initialsOf = (name: string) => name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();

export default function PassedOutArchive() {
  const [students, setStudents] = useState(initialStudents);
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [reasonFilter, setReasonFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [selectedStudent, setSelectedStudent] = useState<ArchivedStudent | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<ArchivedStudent | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { showToast } = useToast();

  const filteredStudents = useMemo(() => students.filter((student) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || `${student.name} ${student.admissionNo} ${student.tcNumber} ${student.fatherName}`.toLowerCase().includes(query);
    const matchesYear = !year || student.passingYear === year;
    const matchesClass = !classFilter || student.className.startsWith(classFilter);
    const matchesReason = !reasonFilter || (reasonFilter === "passed" ? student.reason.startsWith("Passed") : !student.reason.startsWith("Passed"));
    return matchesSearch && matchesYear && matchesClass && matchesReason;
  }), [students, search, year, classFilter, reasonFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const visibleStudents = filteredStudents.slice((safePage - 1) * pageSize, safePage * pageSize);

  const years = useMemo(() => Array.from(new Set(students.map((student) => student.passingYear))).sort().reverse(), [students]);
  const latestYear = years[0];
  const stats = [
    { label: "Archived Students", value: String(students.length), tone: "teal", copy: `Across ${years.length} sessions`, icon: "archive" as IconName },
    { label: latestYear ? `Session ${latestYear}` : "This Session", value: String(students.filter((student) => student.passingYear === latestYear).length), tone: "amber", copy: "Latest passing batch", icon: "calendar" as IconName },
    { label: "TC Issued", value: String(students.filter((student) => student.tcNumber).length), tone: "green", copy: "Certificates generated", icon: "document" as IconName },
    { label: "Passed Out", value: String(students.filter((student) => student.reason.startsWith("Passed")).length), tone: "violet", copy: `${students.filter((student) => !student.reason.startsWith("Passed")).length} left for other reasons`, icon: "book" as IconName },
  ];

  const resetFilters = () => { setSearch(""); setYear(""); setClassFilter(""); setReasonFilter(""); setCurrentPage(1); };

  const exportArchive = async () => {
    setExporting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 600));
    const header = ["Admission No", "Student", "Father Name", "Last Class", "Passing Year", "TC Number", "Reason", "Phone"];
    const lines = filteredStudents.map((student) => [student.admissionNo, student.name, student.fatherName, student.className, student.passingYear, student.tcNumber, student.reason, student.phone].map(csvCell).join(","));
    downloadFile("passed-out-archive.csv", [header.map(csvCell).join(","), ...lines].join("\n"), "text/csv;charset=utf-8");
    setExporting(false);
    showToast(`${filteredStudents.length} archived student records were downloaded.`, { title: "Archive exported" });
  };

  const downloadTc = async (student: ArchivedStudent) => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const width = doc.internal.pageSize.getWidth();
    doc.setDrawColor(51, 65, 85);
    doc.setLineWidth(1);
    doc.rect(10, 10, width - 20, 277);
    doc.setLineWidth(0.3);
    doc.rect(13, 13, width - 26, 271);
    doc.setFont("times", "bold");
    doc.setFontSize(22);
    doc.text("TRANSFER CERTIFICATE", width / 2, 42, { align: "center" });
    doc.setLineWidth(0.5);
    doc.line(60, 47, width - 60, 47);
    doc.setFont("times", "normal");
    doc.setFontSize(12);
    doc.text(`TC No: ${student.tcNumber}`, 25, 66);
    doc.text(`Admission No: ${student.admissionNo}`, width - 25, 66, { align: "right" });
    const body = `This is to certify that ${student.name}, son/daughter of ${student.fatherName}, was a bonafide student of this school and last studied in ${student.className}. The student left the school in session ${student.passingYear} (${student.reason}).`;
    doc.text(doc.splitTextToSize(body, width - 50), 25, 90, { lineHeightFactor: 1.8 });
    doc.text("Conduct and character: Good.", 25, 135);
    doc.line(25, 245, 75, 245);
    doc.line(width - 75, 245, width - 25, 245);
    doc.text("Class Teacher", 50, 252, { align: "center" });
    doc.text("Principal", width - 50, 252, { align: "center" });
    doc.save(`${student.tcNumber}.pdf`);
    showToast(`${student.tcNumber} for ${student.name} has been downloaded as PDF.`, { title: "Transfer certificate ready", tone: "info" });
  };

  const confirmRestore = () => {
    if (!restoreTarget) return;
    setStudents((current) => current.filter((student) => student.admissionNo !== restoreTarget.admissionNo));
    showToast(`${restoreTarget.name} has been moved back to the active student directory.`, { title: "Student restored" });
    setRestoreTarget(null);
    setSelectedStudent(null);
  };

  const saveRecord = async () => {
    if (!form.name.trim() || !form.admissionNo.trim() || !form.className.trim()) {
      showToast("Student name, admission no. and last class are required.", { title: "Complete required fields", tone: "error" });
      return;
    }
    if (students.some((student) => student.admissionNo.toLowerCase() === form.admissionNo.trim().toLowerCase())) {
      showToast("This admission number is already in the archive.", { title: "Record already exists", tone: "error" });
      return;
    }
    setSaving(true);
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    const shortYear = form.passingYear.slice(2, 4) + form.passingYear.slice(7, 9);
    const record: ArchivedStudent = {
      admissionNo: form.admissionNo.trim(),
      name: form.name.trim(),
      fatherName: form.fatherName.trim() || "—",
      className: form.className.trim(),
      passingYear: form.passingYear,
      phone: form.phone.trim() || "—",
      reason: form.reason,
      tcNumber: `TC-${shortYear}${String(students.length + 1).padStart(3, "0")}`,
    };
    setStudents((current) => [record, ...current]);
    setSaving(false);
    setAddOpen(false);
    setForm(emptyForm);
    setCurrentPage(1);
    showToast(`${record.name} was archived with ${record.tcNumber}.`, { title: "Archive record added" });
  };

  const setField = (key: keyof typeof emptyForm, value: string) => setForm((current) => ({ ...current, [key]: value }));

  return <div className="min-h-screen dashboard-bg pb-16">
    <Header title="Passed Out Archive" subtitle="Former students, passing records, and transfer certificates" />
    <main className="space-y-5 p-4 sm:p-6 xl:p-8">
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map((stat) => <article key={stat.label} className={`admission-summary-card admission-summary-${stat.tone} relative overflow-hidden rounded-2xl p-4 sm:p-5`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0"><div className="text-xs font-semibold text-slate-500">{stat.label}</div><div className="mt-1 font-display text-2xl font-bold text-slate-950">{stat.value}</div></div>
            <span className="admission-summary-icon grid size-10 shrink-0 place-items-center rounded-xl"><ArchiveIcon name={stat.icon} /></span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-500"><span className="size-1.5 shrink-0 rounded-full bg-current opacity-50" /><span className="truncate">{stat.copy}</span></div>
        </article>)}
      </section>

      <section className="panel overflow-visible">
        <div className="panel-title flex-col items-stretch gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-linear-to-br from-violet-100 to-violet-50 text-violet-600 shadow-sm ring-1 ring-violet-200 sm:size-12"><ArchiveIcon name="archive" className="size-5 sm:size-6" /></div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate leading-tight">Student Archive</h2>
              <p className="mt-1 flex items-center gap-1.5 truncate text-xs font-medium text-slate-500"><span className="size-1.5 shrink-0 rounded-full bg-violet-400" />{filteredStudents.length} matching records</p>
            </div>
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex sm:gap-3">
            <Button variant="outline" className="w-full justify-center px-4 sm:w-auto" onClick={exportArchive} isLoading={exporting} loadingText="Exporting...">Export</Button>
            <Button className="w-full justify-center px-4 sm:w-auto" onClick={() => { setForm(emptyForm); setAddOpen(true); }} icon={<ArchiveIcon name="plus" />}>Add Record</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 border-b border-slate-100 p-3 [&>:first-child]:col-span-2 sm:grid-cols-3 sm:gap-3 sm:p-4 sm:[&>:first-child]:col-span-2 xl:grid-cols-[1fr_11rem_11rem_11rem_auto] xl:[&>:first-child]:col-span-1">
          <Input className="h-10 px-3 text-xs sm:h-11 sm:px-3.5 sm:text-sm" value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }} placeholder="Search student, admission no., father or TC..." aria-label="Search archived students" />
          <Dropdown className="h-10 px-3 text-xs sm:h-11 sm:px-3.5 sm:text-sm" value={year} onChange={(event) => { setYear(event.target.value); setCurrentPage(1); }} placeholder="Passing Year" aria-label="Passing year" options={years.map((value) => ({ label: value, value }))} />
          <Dropdown className="h-10 px-3 text-xs sm:h-11 sm:px-3.5 sm:text-sm" value={classFilter} onChange={(event) => { setClassFilter(event.target.value); setCurrentPage(1); }} placeholder="Last Class" aria-label="Last class" options={["Class 10", "Class 12"].map((value) => ({ label: value, value }))} />
          <Dropdown className="h-10 px-3 text-xs sm:h-11 sm:px-3.5 sm:text-sm" value={reasonFilter} onChange={(event) => { setReasonFilter(event.target.value); setCurrentPage(1); }} placeholder="All Reasons" aria-label="Archive reason" options={[{ label: "Passed out", value: "passed" }, { label: "Left / transfer", value: "other" }]} />
          <Button variant="outline" className="w-full min-h-10 border-rose-200! bg-linear-to-r! from-rose-50! to-orange-50! px-3 py-2 text-rose-600! shadow-sm hover:from-rose-100! hover:to-orange-100! hover:border-rose-300! active:scale-95 sm:px-4 sm:py-2.5" onClick={resetFilters} icon={<ArchiveIcon name="restore" className="size-3.5" />}>Reset</Button>
        </div>

        <div className="overflow-x-auto">
          <table className="module-table student-directory-table student-premium-cards">
            <thead><tr><th>Admission No.</th><th>Student</th><th>Last Class</th><th>Passing Year</th><th>TC Number</th><th>Reason</th><th>Actions</th></tr></thead>
            <tbody>{visibleStudents.map((student) => <tr key={student.admissionNo}>
              <td data-label="Admission No."><span className="font-semibold text-cyan-600">{student.admissionNo}</span></td>
              <td data-label="Student"><div className="flex items-center gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet-50 text-xs font-bold text-violet-600">{initialsOf(student.name)}</div><div><div className="font-semibold text-slate-900">{student.name}</div><div className="mt-0.5 text-[0.65rem] text-slate-400">{student.fatherName}</div></div></div></td>
              <td data-label="Last Class">{student.className}</td>
              <td data-label="Passing Year">{student.passingYear}</td>
              <td data-label="TC Number"><span className="status-info">{student.tcNumber}</span></td>
              <td data-label="Reason">{student.reason}</td>
              <td data-label="Actions"><div className="flex gap-2"><Button variant="outline" className="student-view-action min-h-8 px-3 py-1.5" onClick={() => setSelectedStudent(student)}>View</Button><Button variant="secondary" className="student-edit-action min-h-8 px-3 py-1.5 text-xs" onClick={() => downloadTc(student)}>TC</Button></div></td>
            </tr>)}</tbody>
          </table>
          {!filteredStudents.length && <div className="grid min-h-60 place-items-center p-6 text-center"><div><div className="mx-auto grid size-16 place-items-center rounded-2xl bg-slate-100 text-slate-400"><ArchiveIcon name="archive" className="size-8" /></div><h3 className="mt-4 font-display text-sm font-bold text-slate-700">No archive records found</h3><p className="mt-1 text-xs text-slate-400">Try changing your search or filter selection.</p></div></div>}
        </div>

        <footer className="border-t border-slate-100 px-4 py-4 sm:px-5">
          <PremiumPagination
            currentPage={safePage}
            totalPages={totalPages}
            totalRecords={filteredStudents.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            wideLayout
          />
        </footer>
      </section>
    </main>

    <Popup
      open={Boolean(selectedStudent)}
      onClose={() => setSelectedStudent(null)}
      title="Archived Student Details"
      description="Review passing and transfer-certificate information."
      footerClassName="!grid grid-cols-3 [&>button]:w-full"
      footer={<>
        <Button variant="outline" onClick={() => setSelectedStudent(null)}>Close</Button>
        {selectedStudent && <Button variant="secondary" onClick={() => setRestoreTarget(selectedStudent)} icon={<ArchiveIcon name="restore" />}>Restore</Button>}
        {selectedStudent && <Button onClick={() => downloadTc(selectedStudent)}>Download TC</Button>}
      </>}
    >
      {selectedStudent && <div className="space-y-5">
        <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-violet-50 to-white p-4 ring-1 ring-violet-100"><div className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 font-display text-lg font-bold text-white shadow-lg">{initialsOf(selectedStudent.name)}</div><div><h3 className="font-display text-lg font-bold text-slate-950">{selectedStudent.name}</h3><p className="mt-1 text-xs text-slate-500">{selectedStudent.admissionNo}</p></div></div>
        <dl className="grid gap-4 sm:grid-cols-2">{[
          ["Father's Name", selectedStudent.fatherName],
          ["Phone", selectedStudent.phone],
          ["Last Class", selectedStudent.className],
          ["Passing Year", selectedStudent.passingYear],
          ["TC Number", selectedStudent.tcNumber],
          ["Archive Reason", selectedStudent.reason],
        ].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-100 p-3"><dt className="text-[0.62rem] font-bold uppercase tracking-wider text-slate-400">{label}</dt><dd className="mt-1 text-sm font-semibold text-slate-700">{value}</dd></div>)}</dl>
      </div>}
    </Popup>

    <Popup
      open={Boolean(restoreTarget)}
      onClose={() => setRestoreTarget(null)}
      title="Restore Student"
      description="Move this student back to the active directory."
      footer={<><Button variant="outline" onClick={() => setRestoreTarget(null)}>Cancel</Button><Button onClick={confirmRestore}>Yes, Restore</Button></>}
    >
      {restoreTarget && <p className="text-sm leading-6 text-slate-600"><strong className="text-slate-900">{restoreTarget.name}</strong> ({restoreTarget.admissionNo}) will be removed from the archive and returned to the active student list.</p>}
    </Popup>

    <Popup
      open={addOpen}
      onClose={() => setAddOpen(false)}
      title="Add Archive Record"
      description="Archive a former student and generate a transfer certificate number."
      footer={<><Button variant="outline" onClick={() => setAddOpen(false)} disabled={saving}>Cancel</Button><Button onClick={saveRecord} isLoading={saving} loadingText="Saving record...">Save Record</Button></>}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Student Name" value={form.name} onChange={(event) => setField("name", event.target.value)} placeholder="Enter student name" required />
        <Input label="Admission No." value={form.admissionNo} onChange={(event) => setField("admissionNo", event.target.value)} placeholder="e.g. ADM-22-0099" required />
        <Input label="Father Name" value={form.fatherName} onChange={(event) => setField("fatherName", event.target.value)} placeholder="Enter father name" />
        <Input label="Last Class" value={form.className} onChange={(event) => setField("className", event.target.value)} placeholder="e.g. Class 12-A" required />
        <Input label="Phone" value={form.phone} onChange={(event) => setField("phone", event.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit mobile number" inputMode="numeric" />
        <div>
          <span className="form-label">Passing Year</span>
          <Dropdown value={form.passingYear} onChange={(event) => setField("passingYear", event.target.value)} aria-label="Passing year" options={["2025–26", "2024–25", "2023–24"].map((value) => ({ label: value, value }))} />
        </div>
        <div className="sm:col-span-2">
          <span className="form-label">Archive Reason</span>
          <Dropdown value={form.reason} onChange={(event) => setField("reason", event.target.value)} aria-label="Archive reason" options={["Passed Class 12", "Passed Class 10", "School transfer", "Family relocation"].map((value) => ({ label: value, value }))} />
        </div>
      </div>
    </Popup>
  </div>;
}
