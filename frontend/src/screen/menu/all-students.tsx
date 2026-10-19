import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button, Calendar, Dropdown, Input, PremiumPagination, useToast } from "../../components";
import Header from "../../ui/header";
import Popup from "../../ui/popup";

const initialRows = [
  ["ADM-26-1001", "Rahul Kumar", "Hari Prasad", "UKG", "7310095239", "Active", "View"],
  ["ADM-26-1023", "Ravi Kumar", "Rahul Kumar", "UKG", "8601XXXXXX", "Active", "View"],
  ["ADM-26-1024", "Ananya Sharma", "Vikas Sharma", "Class 2", "9876543210", "Active", "View"],
  ["ADM-26-1025", "Aarav Singh", "Rohit Singh", "Class 1", "9123456780", "Active", "View"],
  ["ADM-26-1026", "Meera Patel", "Nitin Patel", "LKG", "9988776655", "Active", "View"],
  ["ADM-26-1027", "Kabir Verma", "Amit Verma", "Class 2", "9090909090", "Inactive", "View"],
  ["ADM-26-1028", "Ishita Khan", "Sameer Khan", "UKG", "9812345678", "Active", "View"],
  ["ADM-26-1029", "Vivaan Das", "Sanjay Das", "Class 1", "9765432109", "Active", "View"],
  ["ADM-26-1030", "Sara Ali", "Imran Ali", "LKG", "9654321098", "Active", "View"],
  ["ADM-26-1031", "Arjun Joshi", "Manoj Joshi", "Class 2", "9543210987", "Inactive", "View"],
];

const studentFields = ["Student Name", "Admission No.", "Father Name", "Class", "Section", "Phone", "Gender", "Admission Date"];
function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function AdmissionDateField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(`${value}T00:00:00`) : undefined;
  const [draftDate, setDraftDate] = useState<Date | undefined>(selected);
  const displayValue = selected ? selected.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "";

  return <div className="min-w-0">
    <span className="form-label">Admission Date</span>
    <button type="button" onClick={() => { setDraftDate(selected ?? new Date()); setOpen(true); }} className="form-input flex items-center text-left">
      <span className={value ? "text-slate-700" : "text-slate-300"}>{displayValue || "Select admission date"}</span>
      <svg className="ml-auto size-4 text-slate-400" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></svg>
    </button>
    {open && createPortal(
      <div className="fixed inset-0 z-[120] grid items-end sm:place-items-center sm:p-5" role="dialog" aria-modal="true" aria-label="Select admission date">
        <button type="button" className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={() => setOpen(false)} aria-label="Close date picker" />
        <section className="date-picker-dialog relative z-10 w-full overflow-hidden rounded-t-3xl bg-white sm:max-w-sm sm:rounded-3xl">
          <div className="p-3 sm:p-4"><Calendar selected={draftDate} onSelect={setDraftDate} /></div>
          <footer className="flex gap-2 border-t border-slate-100 bg-slate-50/80 px-4 py-4 sm:justify-end sm:px-5">
            <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="flex-1 sm:flex-none" disabled={!draftDate} onClick={() => { if (draftDate) onChange(formatDate(draftDate)); setOpen(false); }}>Use this date</Button>
          </footer>
        </section>
      </div>,
      document.body,
    )}
  </div>;
}

type ProfileIconName = "arrow-left" | "archive" | "book" | "card" | "check" | "document" | "edit" | "fee" | "lightning" | "list" | "location" | "receipt" | "rupee" | "user";

function ProfileIcon({ name, className = "size-4" }: { name: ProfileIconName; className?: string }) {
  const paths: Record<ProfileIconName, ReactNode> = {
    "arrow-left": <path d="m15 18-6-6 6-6M9 12h10" />,
    archive: <><path d="M4 7h16v13H4zM3 3h18v4H3z" /><path d="M9 11h6" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 0 4 22zM20 5.5A2.5 2.5 0 0 0 17.5 3H13v17h4.5A2.5 2.5 0 0 1 20 22z" /></>,
    card: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 9h18M7 14h4" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    document: <><path d="M6 2h8l4 4v16H6z" /><path d="M14 2v5h5M9 12h6M9 16h6" /></>,
    edit: <><path d="M12 20h9" /><path d="m16.5 3.5 4 4L8 20l-5 1 1-5z" /></>,
    fee: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6" /></>,
    lightning: <path d="m13 2-8 12h7l-1 8 8-12h-7z" />,
    list: <><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 6h.01M4 12h.01M4 18h.01" /></>,
    location: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    receipt: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6M9 16h3" /></>,
    rupee: <><path d="M7 5h10M7 9h10M8 5c7 0 7 8 0 8l8 7" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 22a8 8 0 0 1 16 0" /></>,
  };
  return <svg className={className} aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

const profileSubjects = [
  ["Computer", "COM", "100", "50", "150"],
  ["English", "ENG", "100", "50", "150"],
  ["Hindi", "HIN", "100", "50", "150"],
  ["Mathematics", "MAT", "100", "50", "150"],
  ["Science", "SCI", "100", "50", "150"],
  ["Social Science", "SST", "100", "50", "150"],
];

type ProfileTransaction = {
  amount: number;
  balance: number;
  date: string;
  feeType: string;
  mode: string;
  month: string;
  receipt: string;
};

const initialProfileTransactions: ProfileTransaction[] = [
  { receipt: "RC-2707-0148", feeType: "Tuition Fee", month: "July", amount: 500, balance: 3500, date: "08 Jul 2027", mode: "UPI" },
  { receipt: "RC-2706-0112", feeType: "Computer Fee", month: "June", amount: 600, balance: 400, date: "16 Jun 2027", mode: "Cash" },
  { receipt: "RC-2705-0076", feeType: "Tuition Fee", month: "May", amount: 1000, balance: 4000, date: "10 May 2027", mode: "Card" },
  { receipt: "RC-2704-0021", feeType: "Admission Fee", month: "April", amount: 500, balance: 0, date: "04 Apr 2027", mode: "Cash" },
];

function QrMark() {
  const modules = Array.from({ length: 21 * 21 }, (_, index) => {
    const x = index % 21;
    const y = Math.floor(index / 21);
    const inFinder = (originX: number, originY: number) =>
      x >= originX && x < originX + 7 && y >= originY && y < originY + 7;
    if (inFinder(0, 0) || inFinder(14, 0) || inFinder(0, 14)) return false;
    return (x * 3 + y * 5 + x * y) % 7 < 3;
  });

  return <svg className="size-full" viewBox="0 0 21 21" aria-label="Student verification code">
    <rect width="21" height="21" fill="white" />
    {modules.map((filled, index) => filled && <rect key={index} x={index % 21} y={Math.floor(index / 21)} width="1" height="1" fill="currentColor" />)}
    {[[0, 0], [14, 0], [0, 14]].map(([x, y]) => <g key={`${x}-${y}`}>
      <rect x={x} y={y} width="7" height="7" fill="currentColor" />
      <rect x={x + 1} y={y + 1} width="5" height="5" fill="white" />
      <rect x={x + 2} y={y + 2} width="3" height="3" fill="currentColor" />
    </g>)}
  </svg>;
}

function StudentIdCard({ initials, student }: { initials: string; student: string[] }) {
  const cardNumber = student[0].replaceAll("-", "");

  return <div className="student-id-card-spread grid gap-5 sm:grid-cols-2">
    <article className="student-id-card student-id-card-front">
      <div className="student-id-card-banner">
        <div className="relative z-10 flex items-center gap-3 px-5 pt-5 text-white">
          <span className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-amber-300 bg-white font-display text-lg font-extrabold text-(--app-accent-dark)">P</span>
          <span>
            <span className="block font-display text-base font-extrabold tracking-wide">PAL IT HUB</span>
            <span className="mt-0.5 block text-[0.6rem] font-medium text-white/75">Knowledge Park · Student Services</span>
          </span>
        </div>
      </div>

      <div className="relative z-10 flex flex-1 flex-col px-5 pb-4">
        <div className="mx-auto -mt-9 grid size-28 place-items-center rounded-2xl border-4 border-white bg-slate-100 p-1 shadow-xl ring-4 ring-amber-300">
          <div className="student-profile-avatar grid size-full place-items-center rounded-xl font-display text-2xl font-extrabold text-white">{initials}</div>
        </div>
        <div className="mt-3 text-center">
          <div className="font-display text-xl font-extrabold tracking-tight text-slate-950">{student[1]}</div>
          <span className="mt-2 inline-flex rounded-full bg-(--app-accent) px-5 py-1 text-xs font-bold text-white">{student[3]} · Section A</span>
        </div>

        <dl className="mt-5 grid gap-2 text-[0.68rem]">
          {[
            ["ADM NO", student[0]],
            ["FATHER", student[2]],
            ["D.O.B.", "22-01-2017"],
            ["MOBILE", student[4]],
            ["ADDRESS", "12, Lake View Road"],
          ].map(([label, value]) => <div key={label} className="grid grid-cols-[4.75rem_0.5rem_1fr] items-start">
            <dt className="font-bold tracking-wide text-slate-500">{label}</dt>
            <span className="text-slate-400">:</span>
            <dd className="font-semibold text-slate-800">{value}</dd>
          </div>)}
        </dl>

        <div className="mt-auto flex items-end justify-between pt-5">
          <div className="rounded-lg border-2 border-(--app-accent) px-3 py-1 text-center">
            <div className="text-[0.5rem] font-bold uppercase tracking-wider text-slate-500">Session</div>
            <div className="font-display text-sm font-extrabold text-(--app-accent-dark)">2027–28</div>
          </div>
          <div className="w-28 border-t border-slate-500 pt-1 text-center text-[0.65rem] font-semibold text-slate-700">Principal</div>
        </div>
      </div>
      <div className="h-3 bg-(--app-accent)" />
    </article>

    <article className="student-id-card student-id-card-back">
      <div className="student-id-card-back-header px-5 py-5 text-center text-white">
        <div className="font-display text-base font-extrabold tracking-wider">PAL IT HUB</div>
        <div className="mt-0.5 text-[0.58rem] font-bold uppercase tracking-[0.24em] text-amber-300">Student Identity Card</div>
      </div>
      <div className="h-1.5 bg-amber-400" />

      <div className="flex flex-1 flex-col p-5">
        <dl className="grid gap-2 text-[0.68rem]">
          <div className="grid grid-cols-[4.75rem_0.5rem_1fr]"><dt className="font-bold tracking-wide text-slate-500">MOTHER</dt><span className="text-slate-400">:</span><dd className="font-semibold text-slate-800">Sunita Devi</dd></div>
          <div className="grid grid-cols-[4.75rem_0.5rem_1fr]"><dt className="font-bold tracking-wide text-slate-500">ADDRESS</dt><span className="text-slate-400">:</span><dd className="font-semibold text-slate-800">12, Lake View Road · 700001</dd></div>
        </dl>

        <div className="mt-4 rounded-xl border border-rose-200 border-l-4 border-l-rose-600 bg-rose-50 px-4 py-3">
          <div className="text-[0.55rem] font-bold uppercase tracking-widest text-rose-700">Emergency Contact</div>
          <div className="mt-0.5 text-xs font-extrabold text-slate-900">{student[2]} · {student[4]}</div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <div className="size-28 shrink-0 rounded-xl border-2 border-(--app-accent-dark) bg-white p-1.5 text-slate-950"><QrMark /></div>
          <div className="min-w-0 text-[0.65rem] text-slate-600">
            <div className="font-bold uppercase tracking-widest text-slate-500">Scan to verify</div>
            <div className="mt-1 truncate font-display text-sm font-extrabold text-slate-900">{cardNumber}</div>
            <div className="mt-2">Valid for session</div>
            <div className="font-bold text-slate-900">2027–28</div>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-violet-50 p-3 text-[0.63rem] leading-4 text-slate-700">
          <div className="font-bold uppercase tracking-widest text-(--app-accent-dark)">If found, please return to</div>
          <div className="mt-1 font-bold">PAL IT HUB</div>
          <div>Knowledge Park · School Office</div>
          <div>Ph: 7310095239 · help@palithub.edu</div>
        </div>

        <p className="mt-auto pt-5 text-[0.52rem] leading-3 text-slate-500"><strong className="text-slate-700">Note:</strong> This card must be carried daily and shown on demand. It is not transferable. Loss of the card must be reported to the school office.</p>
      </div>
      <div className="border-t-4 border-amber-400 bg-(--app-accent) px-3 py-2 text-center text-[0.6rem] font-extrabold uppercase tracking-wider text-white">This card is the property of the school</div>
    </article>
  </div>;
}

function StudentProfileView({ student, onArchive, onBack, onEdit }: { student: string[]; onArchive: () => void; onBack: () => void; onEdit: () => void }) {
  const { showToast } = useToast();
  const [activeDocument, setActiveDocument] = useState<string | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [feeOpen, setFeeOpen] = useState(false);
  const [marksOpen, setMarksOpen] = useState(false);
  const [transportOpen, setTransportOpen] = useState(false);
  const [transportFee, setTransportFee] = useState("1200");
  const [transportDraft, setTransportDraft] = useState("1200");
  const [feeAmount, setFeeAmount] = useState("500");
  const [feeMode, setFeeMode] = useState("UPI");
  const [feeType, setFeeType] = useState("Tuition Fee");
  const [feeHeads, setFeeHeads] = useState([
    { name: "Admission Fee", total: 500, paid: 500 },
    { name: "Computer Fee", total: 1000, paid: 600 },
    { name: "Tuition Fee", total: 5000, paid: 1500 },
  ]);
  const [transactions, setTransactions] = useState(initialProfileTransactions);
  const [subjectMarks, setSubjectMarks] = useState(["128", "134", "119", "141", "136", "126"]);
  const [marksDraft, setMarksDraft] = useState(subjectMarks);
  const [selectedReceipt, setSelectedReceipt] = useState<ProfileTransaction | null>(null);
  const initials = student[1].split(" ").map((part) => part[0]).slice(0, 2).join("");
  const totalFee = feeHeads.reduce((sum, fee) => sum + fee.total, 0);
  const totalPaid = feeHeads.reduce((sum, fee) => sum + fee.paid, 0);
  const totalPending = totalFee - totalPaid;
  const actions: { label: string; icon: ProfileIconName; tone: string }[] = [
    { label: "TC Print", icon: "document", tone: "border-amber-200 text-amber-700 hover:bg-amber-50" },
    { label: "Character Certificate", icon: "document", tone: "border-violet-200 text-violet-700 hover:bg-violet-50" },
    { label: "ID Card", icon: "card", tone: "border-indigo-200 text-indigo-700 hover:bg-indigo-50" },
    { label: "Report Card", icon: "document", tone: "student-profile-outline" },
    { label: "Admit Card", icon: "card", tone: "student-profile-outline" },
    { label: "Fee Slip", icon: "receipt", tone: "border-orange-200 text-orange-700 hover:bg-orange-50" },
  ];

  const openDocument = (documentName: string) => {
    setSelectedReceipt(null);
    setActiveDocument(documentName);
  };

  const printDocument = () => {
    window.print();
    showToast(`${activeDocument ?? "Document"} has been sent to the printer.`, { title: "Print started", tone: "info" });
  };

  const collectFee = () => {
    const amount = Number(feeAmount);
    const selected = feeHeads.find((fee) => fee.name === feeType);
    const balance = selected ? selected.total - selected.paid : 0;
    if (!amount || amount <= 0 || amount > balance) {
      showToast(`Enter an amount between ₹1 and ₹${balance.toLocaleString("en-IN")}.`, { title: "Invalid payment amount", tone: "error" });
      return;
    }
    const receipt = `RC-2707-${String(149 + transactions.length).padStart(4, "0")}`;
    const newTransaction: ProfileTransaction = { receipt, feeType, month: "July", amount, balance: balance - amount, date: "12 Jul 2027", mode: feeMode };
    setFeeHeads((current) => current.map((fee) => fee.name === feeType ? { ...fee, paid: fee.paid + amount } : fee));
    setTransactions((current) => [newTransaction, ...current]);
    if (balance === amount) {
      setFeeType(feeHeads.find((fee) => fee.name !== feeType && fee.total > fee.paid)?.name ?? feeType);
    }
    setFeeOpen(false);
    setFeeAmount("");
    showToast(`₹${amount.toLocaleString("en-IN")} was collected and receipt ${receipt} was generated.`, { title: "Fee collected successfully" });
  };

  const saveMarks = () => {
    if (marksDraft.some((mark) => !mark || Number(mark) < 0 || Number(mark) > 150)) {
      showToast("Enter marks between 0 and 150 for every subject.", { title: "Check marks entry", tone: "error" });
      return;
    }
    setSubjectMarks(marksDraft);
    setMarksOpen(false);
    showToast(`Marks for ${student[1]} were updated successfully.`, { title: "Marks saved" });
  };

  const saveTransportFee = () => {
    if (!Number(transportDraft) || Number(transportDraft) < 0) {
      showToast("Enter a valid yearly transport fee.", { title: "Invalid transport fee", tone: "error" });
      return;
    }
    setTransportFee(transportDraft);
    setTransportOpen(false);
    showToast(`Transport fee was updated to ₹${Number(transportDraft).toLocaleString("en-IN")}.`, { title: "Transport fee updated" });
  };

  return <div className="min-h-screen dashboard-bg pb-16">
    <Header title="Student Profile" subtitle={`${student[0]} · Academic session 2027–28`} />
    <main className="space-y-4 p-3 sm:space-y-5 sm:p-6 xl:p-8">
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" className="min-w-0 w-auto" onClick={onBack} icon={<ProfileIcon name="arrow-left" />}>Back to Students</Button>
        <span className={student[5] === "Active" ? "status-success" : "status-danger"}>{student[5]} Student</span>
      </div>

      <section className="student-profile-premium-hero overflow-hidden rounded-3xl border border-white/30 bg-white shadow-xl shadow-slate-900/10">
        <div className="student-profile-hero relative overflow-hidden p-5 text-white sm:p-6 lg:p-7">
          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="grid size-20 shrink-0 place-items-center rounded-3xl border-4 border-white/80 bg-white/15 font-display text-2xl font-extrabold text-white shadow-2xl backdrop-blur-sm sm:size-24">{initials}</div>
              <div className="min-w-0">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/65">Student profile</div>
                <div className="mt-1 truncate font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{student[1]}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium text-white/80">
                  <span>{student[0]}</span>
                  <span className="size-1 rounded-full bg-white/50" />
                  <span>{student[3]} · Section A</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-[0.65rem] font-bold ring-1 ring-white/20 backdrop-blur-sm">English Medium</span>
                  <span className="rounded-full bg-emerald-400/20 px-2.5 py-1 text-[0.65rem] font-bold text-emerald-50 ring-1 ring-emerald-200/25">Academic record verified</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:w-[28rem]">
              {[
                [student[3], "Class"],
                ["92.3%", "Attendance"],
                [`₹${totalPending.toLocaleString("en-IN")}`, "Fees Due"],
                ["2027–28", "Session"],
              ].map(([value, label]) => <div key={label} className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
                <div className="truncate font-display text-base font-extrabold text-white">{value}</div>
                <div className="mt-1 text-[0.6rem] font-bold uppercase tracking-wider text-white/60">{label}</div>
              </div>)}
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="font-display text-sm font-bold text-slate-900">Documents & actions</div>
              <p className="mt-0.5 text-[0.65rem] text-slate-400">Print records or update this student</p>
            </div>
            <span className="hidden rounded-full bg-slate-100 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-slate-500 sm:inline-flex">Quick access</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {actions.map((action) => <Button key={action.label} variant="outline" className={`min-h-9 min-w-0 w-full px-2 py-2 text-center sm:w-auto sm:px-3 ${action.tone}`} icon={<ProfileIcon name={action.icon} className="size-4 shrink-0" />} onClick={() => openDocument(action.label)}>{action.label}</Button>)}
            <Button className="col-span-2 min-h-9 w-full px-3 py-2 sm:w-auto" icon={<ProfileIcon name="lightning" />} onClick={() => setFeeOpen(true)}>Collect Fee</Button>
            <Button variant="outline" className="min-h-9 w-full px-3 py-2 sm:w-auto" icon={<ProfileIcon name="edit" />} onClick={onEdit}>Edit</Button>
            <Button variant="outline" className="min-h-9 w-full border-red-200 px-3 py-2 text-red-600 hover:bg-red-50 sm:w-auto" icon={<ProfileIcon name="archive" />} onClick={() => setArchiveOpen(true)}>Archive</Button>
          </div>
        </div>
      </section>

      <section className="grid items-start gap-4 sm:gap-5 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <article className="panel overflow-hidden">
          <div className="panel-title py-3">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><ProfileIcon name="user" className="size-5" /></span>
              <div><div className="font-display text-sm font-bold text-slate-900">Personal Information</div><p className="mt-0.5 text-[0.65rem] text-slate-400">Admission and contact details</p></div>
            </div>
            <span className="status-info">General</span>
          </div>
          <div className="p-4 sm:p-5 xl:grid xl:grid-cols-2 xl:gap-4 [&>dl]:xl:col-span-2 [&>div]:xl:mt-0">
            <dl className="grid grid-cols-2 gap-x-5 gap-y-4 text-xs">
              {[
                ["Admission No.", student[0]],
                ["Father", student[2]],
                ["Mother", "Sunita Devi"],
                ["Date of Birth", "22 Jan 2017"],
                ["Phone", student[4]],
                ["Email", "Not provided"],
                ["Medium", "English"],
                ["Session", "2027–28"],
              ].map(([label, value]) => <div key={label} className="min-w-0 rounded-xl bg-slate-50 px-3 py-2.5"><dt className="text-[0.6rem] font-bold uppercase tracking-wider text-slate-400">{label}</dt><dd className="mt-1 truncate font-semibold text-slate-700">{value}</dd></div>)}
            </dl>
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-3 text-xs leading-5 text-slate-500 shadow-sm">
              <ProfileIcon name="location" className="mt-0.5 size-4 shrink-0 student-profile-accent" />
              <div><div className="font-bold text-slate-700">Residential address</div><div className="mt-0.5">12, Lake View Road, Ward 8 · PIN 700001</div></div>
            </div>
            <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-700"><ProfileIcon name="fee" />Transport Fee</div>
                <span className="text-[0.6rem] font-bold uppercase tracking-wider text-amber-600">Yearly</span>
              </div>
              <div className="mt-3 grid gap-2">
                <div className="flex h-10 min-w-0 flex-1 items-center rounded-xl border border-amber-100 bg-white px-3 font-display text-base font-extrabold text-slate-800">₹{Number(transportFee).toLocaleString("en-IN")}</div>
                <Button className="min-h-10 w-full" onClick={() => { setTransportDraft(transportFee); setTransportOpen(true); }} icon={<ProfileIcon name="check" />}>Update</Button>
              </div>
            </div>
          </div>
        </article>

        <article className="panel min-w-0 self-stretch">
          <div className="panel-title flex-wrap gap-3 py-3">
            <div className="flex items-center gap-2"><ProfileIcon name="rupee" className="size-5 student-profile-accent" /><div><div className="font-display text-sm font-bold tracking-tight text-slate-900">Fee Summary</div><p className="mt-0.5 text-[0.65rem] text-slate-400">Session 2027–28</p></div></div>
            <Button className="w-full min-h-9 px-3 py-2 sm:w-auto" icon={<ProfileIcon name="lightning" />} onClick={() => setFeeOpen(true)}>Quick Fee Collect</Button>
          </div>
          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-2 min-[390px]:grid-cols-3 sm:gap-3">
              {[
                [`₹${totalFee.toLocaleString("en-IN")}`, "Total Fee", "student-profile-metric"],
                [`₹${totalPaid.toLocaleString("en-IN")}`, "Paid", "bg-emerald-50 text-emerald-700"],
                [`₹${totalPending.toLocaleString("en-IN")}`, "Pending", "bg-red-50 text-red-600"],
              ].map(([value, label, tone]) => <div key={label} className={`rounded-2xl p-3 text-center ring-1 ring-inset ring-black/5 sm:p-4 ${tone}`}><div className="font-display text-base font-extrabold sm:text-xl">{value}</div><div className="mt-1 text-[0.58rem] font-bold uppercase tracking-wider opacity-65 sm:text-[0.65rem]">{label}</div></div>)}
            </div>
            <div className="mt-6 text-[0.65rem] font-bold uppercase tracking-widest text-slate-400">Fee-wise breakdown</div>
            <div className="mt-3 overflow-x-auto rounded-xl border border-slate-100">
              <div className="grid gap-3 bg-slate-50/60 p-3 sm:grid-cols-3">
                {feeHeads.map((fee) => {
                  const pending = fee.total - fee.paid;
                  const isPaid = pending === 0;
                  return <article key={fee.name} className="group rounded-2xl border border-white bg-white p-3.5 shadow-sm ring-1 ring-slate-200/70 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/70">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-600 ring-1 ring-teal-100 transition group-hover:bg-teal-100"><ProfileIcon name="fee" className="size-4" /></span>
                        <div className="min-w-0">
                          <div className="truncate font-display text-xs font-bold text-slate-900">{fee.name}</div>
                          <div className="mt-0.5 text-[0.55rem] font-semibold text-slate-400">Session 2027–28</div>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-1 text-[0.52rem] font-extrabold uppercase tracking-wide ring-1 ${isPaid ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : "bg-amber-50 text-amber-700 ring-amber-100"}`}>{isPaid ? "Paid" : "Due"}</span>
                    </div>

                    <progress className="attendance-progress mt-4 block" max={fee.total} value={fee.paid} aria-label={`${fee.name} payment progress`} />

                    <dl className="mt-3 grid grid-cols-3 divide-x divide-slate-100 rounded-xl bg-slate-50 py-2.5 text-center">
                      {[["Total", fee.total, "text-slate-700"], ["Paid", fee.paid, "text-emerald-600"], ["Due", pending, pending ? "text-amber-600" : "text-slate-400"]].map(([label, value, tone]) => <div key={label} className="min-w-0 px-1">
                        <dd className={`truncate font-display text-xs font-extrabold ${tone}`}>₹{Number(value).toLocaleString("en-IN")}</dd>
                        <dt className="mt-1 text-[0.48rem] font-bold uppercase tracking-wider text-slate-400">{label}</dt>
                      </div>)}
                    </dl>
                  </article>;
                })}
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-title flex-wrap gap-3 py-3">
          <div className="flex items-center gap-2"><ProfileIcon name="book" className="size-5 text-violet-600" /><div><div className="font-display text-sm font-bold tracking-tight text-slate-900">Assigned Subjects</div><p className="mt-0.5 text-[0.65rem] text-slate-400">6 subjects in the current curriculum</p></div></div>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
            <Button variant="outline" className="min-h-9 w-full px-3 py-2 student-profile-outline sm:w-auto" icon={<ProfileIcon name="card" />} onClick={() => openDocument("Admit Card")}>Admit Card</Button>
            <Button variant="outline" className="min-h-9 w-full px-3 py-2 student-profile-outline sm:w-auto" icon={<ProfileIcon name="document" />} onClick={() => openDocument("Report Card")}>Report Card</Button>
            <Button className="col-span-2 min-h-9 w-full px-3 py-2 sm:w-auto" icon={<ProfileIcon name="edit" />} onClick={() => { setMarksDraft(subjectMarks); setMarksOpen(true); }}>Fill Marks</Button>
          </div>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
          {profileSubjects.map((subject, index) => {
            const percentage = Number(subjectMarks[index]) / Number(subject[4]) * 100;
            const grade = percentage >= 90 ? "A+" : percentage >= 80 ? "A" : percentage >= 70 ? "B+" : "B";
            return <article key={subject[1]} className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg hover:shadow-slate-200/70">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-violet-50 text-violet-600 ring-1 ring-violet-100 transition group-hover:bg-violet-100"><ProfileIcon name="book" className="size-5" /></span>
                  <div className="min-w-0">
                    <div className="truncate font-display text-sm font-bold text-slate-900">{subject[0]}</div>
                    <div className="mt-1 font-mono text-[0.6rem] font-bold uppercase tracking-widest text-slate-400">{subject[1]}</div>
                  </div>
                </div>
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-(--app-accent) font-display text-sm font-extrabold text-white shadow-md">{grade}</span>
              </div>

              <div className="mt-4 grid grid-cols-4 divide-x divide-slate-100 rounded-xl bg-slate-50 px-2 py-3 text-center">
                {[["Theory", subject[2]], ["Practical", subject[3]], ["Total", subject[4]], ["Scored", subjectMarks[index]]].map(([label, value]) => <div key={label} className="min-w-0 px-1">
                  <div className={`font-display text-sm font-extrabold ${label === "Scored" ? "text-emerald-600" : "text-slate-700"}`}>{value}</div>
                  <div className="mt-1 truncate text-[0.5rem] font-bold uppercase tracking-wide text-slate-400">{label}</div>
                </div>)}
              </div>

              <div className="mt-4 flex items-center gap-3">
                <progress className="report-progress report-progress-good flex-1" max="100" value={percentage} aria-label={`${subject[0]} score percentage`} />
                <span className="font-display text-xs font-extrabold text-slate-600">{percentage.toFixed(0)}%</span>
              </div>
            </article>;
          })}
        </div>
      </section>

      <section className="panel">
        <div className="panel-title"><div className="flex items-center gap-2"><ProfileIcon name="list" className="size-5 student-profile-accent" /><div><div className="font-display text-sm font-bold tracking-tight text-slate-900">Fee Transactions</div><p className="mt-0.5 text-[0.65rem] text-slate-400">Receipts and payment history</p></div></div></div>
        <div className="grid gap-3 p-4 sm:p-5">
          {transactions.map((transaction) => <article key={transaction.receipt} className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-slate-200/70">
            <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-emerald-500" />
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 transition group-hover:bg-emerald-100"><ProfileIcon name="receipt" className="size-5" /></span>
                <div className="min-w-0">
                  <div className="truncate font-display text-sm font-extrabold text-slate-900">{transaction.receipt}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[0.65rem] font-medium text-slate-500">
                    <span>{transaction.feeType}</span>
                    <span className="size-1 rounded-full bg-slate-300" />
                    <span>{transaction.month}</span>
                  </div>
                </div>
              </div>

              <dl className="grid grid-cols-3 gap-2 lg:w-[25rem]">
                <div className="rounded-xl bg-emerald-50/70 px-3 py-2">
                  <dt className="text-[0.55rem] font-bold uppercase tracking-wider text-emerald-600/70">Received</dt>
                  <dd className="mt-1 font-display text-sm font-extrabold text-emerald-700">₹{transaction.amount.toLocaleString("en-IN")}</dd>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2">
                  <dt className="text-[0.55rem] font-bold uppercase tracking-wider text-slate-400">Balance</dt>
                  <dd className="mt-1 font-display text-sm font-extrabold text-slate-700">₹{transaction.balance.toLocaleString("en-IN")}</dd>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2">
                  <dt className="text-[0.55rem] font-bold uppercase tracking-wider text-slate-400">Paid on</dt>
                  <dd className="mt-1 truncate text-xs font-bold text-slate-700">{transaction.date}</dd>
                </div>
              </dl>

              <div className="flex items-center justify-between gap-3 lg:justify-end">
                <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[0.65rem] font-bold text-blue-700 ring-1 ring-blue-100">{transaction.mode}</span>
                <Button variant="outline" className="min-h-9 border-emerald-200 px-3 py-2 text-emerald-700 hover:bg-emerald-50" icon={<ProfileIcon name="document" className="size-4" />} onClick={() => { setSelectedReceipt(transaction); setActiveDocument("Fee Receipt"); }}>View Receipt</Button>
              </div>
            </div>
          </article>)}
        </div>
      </section>

      <section className="panel">
        <div className="panel-title"><div className="flex items-center gap-2"><ProfileIcon name="check" className="size-5 student-profile-accent" /><div><div className="font-display text-sm font-bold tracking-tight text-slate-900">Attendance Summary</div><p className="mt-0.5 text-[0.65rem] text-slate-400">Current academic session</p></div></div></div>
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4 sm:p-5">
          {[["92.3%", "Attendance", "student-profile-metric"], ["120", "Working Days", "bg-blue-50 text-blue-700"], ["111", "Present", "bg-emerald-50 text-emerald-700"], ["9", "Absent / Leave", "bg-amber-50 text-amber-700"]].map(([value, label, tone]) => <div key={label} className={`rounded-2xl p-4 text-center ${tone}`}><div className="font-display text-xl font-extrabold">{value}</div><div className="mt-1 text-[0.65rem] font-bold uppercase tracking-wider opacity-70">{label}</div></div>)}
        </div>
        <div className="grid gap-3 border-t border-slate-100 bg-slate-50/50 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3 xl:grid-cols-5">
          {[["April", "24", "23", "1", "0", "95.8%"], ["May", "25", "22", "2", "1", "88.0%"], ["June", "22", "21", "1", "0", "95.5%"], ["July", "26", "24", "1", "1", "92.3%"], ["August", "23", "21", "1", "1", "91.3%"]].map((row) => {
            const attendance = Number(row[5].replace("%", ""));
            const isStrong = attendance >= 92;
            return <article key={row[0]} className="group rounded-2xl border border-white bg-white p-4 shadow-sm ring-1 ring-slate-200/70 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/70">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[0.55rem] font-bold uppercase tracking-widest text-slate-400">Monthly record</div>
                  <div className="mt-1 font-display text-base font-extrabold text-slate-900">{row[0]}</div>
                </div>
                <span className={`inline-flex rounded-full px-2.5 py-1 font-display text-xs font-extrabold ring-1 ${isStrong ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : "bg-amber-50 text-amber-700 ring-amber-100"}`}>{row[5]}</span>
              </div>

              <progress className="attendance-progress mt-4 block" max="100" value={attendance} aria-label={`${row[0]} attendance percentage`} />

              <dl className="mt-4 grid grid-cols-2 gap-2">
                {[["Working", row[1], "bg-blue-50 text-blue-700"], ["Present", row[2], "bg-emerald-50 text-emerald-700"], ["Absent", row[3], "bg-rose-50 text-rose-600"], ["Leave", row[4], "bg-amber-50 text-amber-700"]].map(([label, value, tone]) => <div key={label} className={`rounded-xl px-3 py-2.5 ${tone}`}>
                  <dd className="font-display text-base font-extrabold">{value}</dd>
                  <dt className="mt-0.5 text-[0.52rem] font-bold uppercase tracking-wider opacity-70">{label}</dt>
                </div>)}
              </dl>
            </article>;
          })}
        </div>
      </section>
    </main>

    <Popup
      open={Boolean(activeDocument)}
      onClose={() => { setActiveDocument(null); setSelectedReceipt(null); }}
      title={activeDocument === "ID Card" ? "ID Card · Front + Back" : activeDocument ?? "Student Document"}
      description={`${student[1]} · ${student[0]} · Session 2027–28`}
      icon={<ProfileIcon name={activeDocument === "ID Card" || activeDocument === "Admit Card" ? "card" : "document"} className="size-5" />}
      footerClassName="!grid grid-cols-2"
      footer={<><Button variant="outline" className="w-full" onClick={() => { setActiveDocument(null); setSelectedReceipt(null); }}>Close</Button><Button className="w-full" onClick={printDocument} icon={<ProfileIcon name="document" />}>Print {activeDocument}</Button></>}
    >
      {activeDocument && <div className={`student-document-preview ${activeDocument === "ID Card" ? "student-id-card-print-root" : "rounded-2xl border-2 border-slate-200 bg-white p-5 sm:p-7"}`}>
        {activeDocument !== "ID Card" && <div className="border-b-2 border-slate-900 pb-4 text-center"><div className="font-display text-2xl font-extrabold text-slate-950">PAL IT HUB</div><p className="mt-1 text-xs text-slate-500">Knowledge Park · School Management System</p><div className="mt-3 font-display text-sm font-bold uppercase tracking-widest student-profile-accent">{activeDocument}</div></div>}
        {activeDocument === "ID Card" ? <StudentIdCard student={student} initials={initials} />
          : activeDocument === "Report Card" ? <div className="mt-6"><div className="grid grid-cols-1 gap-3 text-xs min-[420px]:grid-cols-2">{[["Student", student[1]], ["Class", `${student[3]}-A`], ["Admission No.", student[0]], ["Examination", "Half Yearly 2027"]].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><span className="text-slate-400">{label}</span><div className="mt-1 font-bold text-slate-800">{value}</div></div>)}</div><table className="module-table mt-5"><thead><tr><th>Subject</th><th>Maximum</th><th>Obtained</th></tr></thead><tbody>{profileSubjects.map((subject, index) => <tr key={subject[1]}><td data-label="Subject">{subject[0]}</td><td data-label="Maximum">{subject[4]}</td><td data-label="Obtained" className="font-bold">{subjectMarks[index]}</td></tr>)}</tbody></table></div>
          : activeDocument === "Admit Card" ? <div className="mt-6"><dl className="grid grid-cols-1 gap-3 text-xs min-[420px]:grid-cols-2">{[["Student", student[1]], ["Class", `${student[3]}-A`], ["Roll No.", "27-A-014"], ["Exam", "Half Yearly 2027"]].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><dt className="text-slate-400">{label}</dt><dd className="mt-1 font-bold">{value}</dd></div>)}</dl><table className="module-table mt-5"><thead><tr><th>Date</th><th>Subject</th><th>Time</th></tr></thead><tbody>{profileSubjects.slice(0, 4).map((subject, index) => <tr key={subject[1]}><td data-label="Date">{12 + index * 2} Sep 2027</td><td data-label="Subject">{subject[0]}</td><td data-label="Time">09:30 AM–12:30 PM</td></tr>)}</tbody></table></div>
          : activeDocument === "Fee Slip" || activeDocument === "Fee Receipt" ? <div className="mt-6"><div className="rounded-2xl bg-slate-950 p-5 text-white"><div className="text-xs text-slate-400">{activeDocument === "Fee Receipt" ? "Amount received" : "Total paid this session"}</div><div className="mt-1 font-display text-3xl font-bold">₹{(selectedReceipt?.amount ?? totalPaid).toLocaleString("en-IN")}</div><div className="mt-4 flex justify-between text-xs"><span className="text-slate-400">Receipt</span><strong>{selectedReceipt?.receipt ?? transactions[0].receipt}</strong></div></div><dl className="mt-4 grid grid-cols-2 gap-3">{[["Student", student[1]], ["Admission No.", student[0]], ["Fee Head", selectedReceipt?.feeType ?? "All fee heads"], ["Payment Mode", selectedReceipt?.mode ?? "Multiple"], ["Date", selectedReceipt?.date ?? "12 Jul 2027"], ["Received By", "Super Admin"]].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-100 p-3"><dt className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400">{label}</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{value}</dd></div>)}</dl></div>
          : <div className="py-10 text-center"><div className="mx-auto grid size-20 place-items-center rounded-full border-4 border-double border-slate-300 font-display text-2xl font-extrabold student-profile-accent">{initials}</div><p className="mx-auto mt-6 max-w-lg text-sm leading-7 text-slate-600">This is to certify that <strong className="text-slate-900">{student[1]}</strong>, admission number <strong className="text-slate-900">{student[0]}</strong>, is a duly enrolled student of {student[3]} during the academic session 2027–28. The student&apos;s conduct and academic participation have been satisfactory.</p><div className="mt-16 grid grid-cols-2 gap-16 text-xs font-semibold text-slate-700"><div className="border-t border-slate-500 pt-2">Class Teacher</div><div className="border-t border-slate-500 pt-2">Principal</div></div></div>}
      </div>}
    </Popup>

    <Popup open={feeOpen} onClose={() => setFeeOpen(false)} title="Quick Fee Collect" description={`Record a payment for ${student[1]}.`} icon={<ProfileIcon name="lightning" className="size-5" />} footer={<><Button variant="outline" onClick={() => setFeeOpen(false)}>Cancel</Button><Button onClick={collectFee}>Collect Fee & Generate Receipt</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2"><Dropdown label="Fee Head" value={feeType} onChange={(event) => setFeeType(event.target.value)} options={feeHeads.filter((fee) => fee.total > fee.paid).map((fee) => ({ label: `${fee.name} · ₹${(fee.total - fee.paid).toLocaleString("en-IN")} due`, value: fee.name }))} /><Input label="Payment Amount (₹)" type="number" min="1" value={feeAmount} onChange={(event) => setFeeAmount(event.target.value)} /><Dropdown label="Payment Mode" value={feeMode} onChange={(event) => setFeeMode(event.target.value)} options={["Cash", "UPI", "Card", "Bank Transfer"].map((value) => ({ label: value, value }))} /><Input label="Payment Date" value="12 Jul 2027" readOnly /></div>
    </Popup>

    <Popup open={marksOpen} onClose={() => setMarksOpen(false)} title="Fill Student Marks" description="Half Yearly Examination · Maximum 150 per subject" icon={<ProfileIcon name="edit" className="size-5" />} footer={<><Button variant="outline" onClick={() => setMarksOpen(false)}>Cancel</Button><Button onClick={saveMarks}>Save Marks</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">{profileSubjects.map((subject, index) => <Input key={subject[1]} label={`${subject[0]} (${subject[1]})`} type="number" min="0" max="150" value={marksDraft[index]} onChange={(event) => setMarksDraft((current) => current.map((mark, markIndex) => markIndex === index ? event.target.value : mark))} hint={`Current grade: ${Number(marksDraft[index]) >= 135 ? "A+" : Number(marksDraft[index]) >= 120 ? "A" : "B+"}`} />)}</div>
    </Popup>

    <Popup open={transportOpen} onClose={() => setTransportOpen(false)} title="Update Transport Fee" description="Set the yearly transport amount for the current session." icon={<ProfileIcon name="fee" className="size-5" />} footer={<><Button variant="outline" onClick={() => setTransportOpen(false)}>Cancel</Button><Button onClick={saveTransportFee}>Update Fee</Button></>}>
      <Input label="Yearly Transport Fee (₹)" type="number" min="0" value={transportDraft} onChange={(event) => setTransportDraft(event.target.value)} hint="This amount is maintained separately from academic fee heads." />
    </Popup>

    <Popup open={archiveOpen} onClose={() => setArchiveOpen(false)} title="Archive Student Record" description="The student will be marked inactive and remain available in records." icon={<ProfileIcon name="archive" className="size-5" />} footer={<><Button variant="outline" onClick={() => setArchiveOpen(false)}>Keep Active</Button><Button variant="danger" onClick={() => { showToast(`${student[1]} was moved to the student archive.`, { title: "Student archived", tone: "info" }); onArchive(); }}>Archive Student</Button></>}>
      <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm leading-6 text-red-700">Archiving disables active enrollment actions, but fee history, documents, marks, and attendance remain preserved.</div>
    </Popup>
  </div>;
}

export default function AllStudents() {
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [rows, setRows] = useState(initialRows);
  const [editingAdmissionNo, setEditingAdmissionNo] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string[] | null>(null);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const { showToast } = useToast();
  const filteredRows = rows.filter((row) => {
    const matchesSearch = !search || `${row[0]} ${row[1]} ${row[2]} ${row[4]}`.toLowerCase().includes(search.toLowerCase());
    const matchesClass = !classFilter || row[3] === classFilter;
    const matchesStatus = !statusFilter || row[5].toLowerCase() === statusFilter;
    return matchesSearch && matchesClass && matchesStatus;
  });
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const visibleRows = filteredRows.slice(pageStart, pageStart + pageSize);

  const close = () => {
    if (!saving) {
      setModalOpen(false);
      setEditingAdmissionNo(null);
      setFormValues({});
    }
  };

  const openCreate = () => {
    setEditingAdmissionNo(null);
    setFormValues({});
    setModalOpen(true);
  };

  const openEdit = (row: string[]) => {
    setEditingAdmissionNo(row[0]);
    setFormValues({
      "Admission No.": row[0],
      "Student Name": row[1],
      "Father Name": row[2],
      "Class": row[3],
      "Section": "A",
      "Phone": row[4],
      "Gender": "Not specified",
      "Admission Date": "2026-04-01",
    });
    setModalOpen(true);
  };

  const saveStudent = async () => {
    if (!formValues["Student Name"]?.trim() || !formValues["Admission No."]?.trim()) {
      showToast("Student Name and Admission No. are required before saving.", { title: "Complete required fields", tone: "error" });
      return;
    }
    if (rows.some((row) => row[0] === formValues["Admission No."] && row[0] !== editingAdmissionNo)) {
      showToast("This admission number already belongs to another student.", { title: "Admission number already exists", tone: "error" });
      return;
    }
    setSaving(true);
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    const savedRow = [
      formValues["Admission No."],
      formValues["Student Name"],
      formValues["Father Name"] || "—",
      formValues["Class"] || "—",
      formValues["Phone"] || "—",
      "Active",
      "View",
    ];
    setRows((current) => editingAdmissionNo
      ? current.map((row) => row[0] === editingAdmissionNo ? savedRow : row)
      : [...current, savedRow]);
    setSaving(false);
    setModalOpen(false);
    showToast(
      editingAdmissionNo ? `${formValues["Student Name"]}'s student record has been updated.` : `${formValues["Student Name"]} has been added to the student directory.`,
      { title: editingAdmissionNo ? "Student updated successfully" : "Student added successfully" },
    );
    setEditingAdmissionNo(null);
    setFormValues({});
  };

  if (selectedStudent) {
    return <StudentProfileView
      student={selectedStudent}
      onBack={() => setSelectedStudent(null)}
      onArchive={() => {
        setRows((current) => current.map((row) => row[0] === selectedStudent[0] ? row.map((value, index) => index === 5 ? "Inactive" : value) : row));
        setSelectedStudent(null);
      }}
      onEdit={() => {
        const student = selectedStudent;
        setSelectedStudent(null);
        openEdit(student);
      }}
    />;
  }

  return <div className="min-h-screen dashboard-bg pb-16">
    <Header title="All Students" subtitle="Search, manage, and review every enrolled student" />
    <main className="space-y-5 p-4 sm:p-6 xl:p-8">
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "Total Students", value: String(rows.length), tone: "teal", copy: "Across 5 classes", icon: "list" as ProfileIconName },
          { label: "Active Students", value: String(rows.filter((row) => row[5] === "Active").length), tone: "green", copy: "Currently enrolled", icon: "check" as ProfileIconName },
          { label: "Male Students", value: "6", tone: "violet", copy: "67% of students", icon: "user" as ProfileIconName },
          { label: "Female Students", value: "3", tone: "amber", copy: "33% of students", icon: "user" as ProfileIconName },
        ].map((stat) => <article key={stat.label} className={`admission-summary-card admission-summary-${stat.tone} relative overflow-hidden rounded-2xl p-4 sm:p-5`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0"><div className="text-xs font-semibold text-slate-500">{stat.label}</div><div className="mt-1 font-display text-2xl font-bold text-slate-950">{stat.value}</div></div>
            <span className="admission-summary-icon grid size-10 shrink-0 place-items-center rounded-xl"><ProfileIcon name={stat.icon} /></span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-500"><span className="size-1.5 rounded-full bg-current opacity-50" />{stat.copy}</div>
        </article>)}
      </section>

      <section className="panel overflow-visible">
        <div className="panel-title flex-nowrap gap-2 py-3 sm:gap-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-(--app-accent-soft) text-(--app-accent-dark) ring-1 ring-(--app-accent)/20 sm:size-11"><svg className="size-5" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M16 11h6" /></svg></div>
            <div className="min-w-0"><h2 className="truncate">Student Directory</h2><p className="mt-0.5 truncate text-xs text-slate-400">{filteredRows.length} visible records</p></div>
          </div>
          <Button className="shrink-0 px-3" onClick={openCreate} icon={<svg className="size-4" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>}>Add Student</Button>
        </div>

        <div className="grid grid-cols-2 gap-2.5 border-b border-slate-100 bg-linear-to-b from-slate-50/80 to-transparent p-3 max-sm:[&>:first-child]:col-span-2 max-sm:[&>:last-child]:col-span-2 sm:grid-cols-[1fr_9rem_9rem_auto] sm:gap-3 sm:p-4 xl:grid-cols-[1fr_12rem_12rem_auto]">
          <Input value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }} placeholder="Search name, admission no., father or phone..." aria-label="Search students" />
          <Dropdown value={classFilter} onChange={(event) => { setClassFilter(event.target.value); setCurrentPage(1); }} placeholder="All Classes" aria-label="Class filter" options={["UKG", "LKG", "Class 1", "Class 2"].map((value) => ({ label: value, value }))} />
          <Dropdown value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setCurrentPage(1); }} placeholder="All Status" aria-label="Status filter" options={[{ label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }]} />
          <Button variant="outline" className="border-rose-200! bg-linear-to-r! from-rose-50! to-orange-50! text-rose-600! shadow-sm hover:from-rose-100! hover:to-orange-100! hover:border-rose-300! active:scale-95" onClick={() => { setSearch(""); setClassFilter(""); setStatusFilter(""); setCurrentPage(1); }} icon={<svg className="size-3.5" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" /></svg>}>Reset</Button>
        </div>

        <div className="overflow-x-auto">
          <table className="module-table student-directory-table student-premium-cards">
            <thead><tr><th>Admission No.</th><th>Student</th><th>Father Name</th><th>Class</th><th>Phone</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{visibleRows.map((row) => <tr key={row[0]}>
              <td data-label="Admission No."><span className="font-semibold text-cyan-600">{row[0]}</span></td>
              <td data-label="Student"><div className="flex items-center gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet-50 text-xs font-bold text-violet-600">{row[1].split(" ").map((part) => part[0]).slice(0, 2).join("")}</div><span className="font-semibold text-slate-900">{row[1]}</span></div></td>
              <td data-label="Father Name">{row[2]}</td><td data-label="Class">{row[3]}</td><td data-label="Phone">{row[4]}</td>
              <td data-label="Status"><span className={row[5] === "Inactive" ? "status-danger" : "status-success"}>{row[5]}</span></td>
              <td data-label="Actions"><div className="flex gap-2"><Button variant="outline" className="student-view-action min-h-8 px-3 py-1.5" onClick={() => setSelectedStudent(row)}>View</Button><Button variant="secondary" className="student-edit-action min-h-8 px-3 py-1.5 text-xs" onClick={() => openEdit(row)}>Edit</Button></div></td>
            </tr>)}</tbody>
          </table>
          {!filteredRows.length && <div className="grid min-h-56 place-items-center p-6 text-center"><div><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-400"><svg className="size-6" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg></div><h3 className="mt-4 font-display text-sm font-bold text-slate-700">No students found</h3><p className="mt-1 text-xs text-slate-400">Try changing your search or filters.</p></div></div>}
        </div>
        <footer className="border-t border-slate-100 px-4 py-4 sm:px-5">
          <PremiumPagination
            currentPage={safePage}
            totalPages={totalPages}
            totalRecords={filteredRows.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            wideLayout
          />
        </footer>
      </section>
    </main>
    <Popup
      open={modalOpen}
      onClose={close}
      title={editingAdmissionNo ? "Edit Student Record" : "Add New Student"}
      description={editingAdmissionNo ? "Update the student's admission, contact, and class information." : "Enter the student's admission, contact, and class information."}
      footer={<><Button variant="outline" onClick={close} disabled={saving}>Cancel</Button><Button onClick={saveStudent} isLoading={saving} loadingText={editingAdmissionNo ? "Updating student..." : "Adding student..."}>{editingAdmissionNo ? "Update Student" : "Save Student"}</Button></>}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {studentFields.map((field) => field === "Admission Date"
          ? <AdmissionDateField key={field} value={formValues[field] ?? ""} onChange={(value) => setFormValues((current) => ({ ...current, [field]: value }))} />
          : <Input key={field} label={field} value={formValues[field] ?? ""} onChange={(event) => setFormValues((current) => ({ ...current, [field]: event.target.value }))} placeholder={`Enter ${field.toLowerCase()}`} required={field === "Student Name" || field === "Admission No."} />)}
      </div>
    </Popup>
  </div>;
}
