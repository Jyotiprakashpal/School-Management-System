import { useMemo, useState, type ReactNode } from "react";
import { Button, Dropdown, Input, PremiumPagination, useToast } from "../../components";
import Header from "../../ui/header";
import Popup from "../../ui/popup";
import { useDeletions, useStudents, useTransactions, type DeletionRecord, type Transaction } from "../../data/feeStore";

const reasons = ["Duplicate payment entry", "Incorrect fee type selected", "Receipt generated against wrong student", "Payment reversed after bank failure", "Other"];
const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;
const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} · ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
};
const monthKey = (iso: string) => iso.slice(0, 7);
const monthLabel = (key: string) => new Date(`${key}-01T00:00:00`).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
const csvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
const initials = (name: string) => name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();

type IconType = "shield" | "delete" | "view" | "download" | "reset" | "users" | "money" | "calendar" | "print" | "alert";

function AuditIcon({ type, className = "size-5" }: { type: IconType; className?: string }) {
  const paths: Record<IconType, ReactNode> = {
    shield: <><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" /><path d="m9 12 2 2 4-4" /></>,
    delete: <path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6" />,
    view: <><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    download: <path d="M12 3v13M7 11l5 5 5-5M4 21h16" />,
    reset: <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>,
    money: <><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
    print: <><path d="M7 9V3h10v6" /><rect x="4" y="9" width="16" height="8" rx="2" /><path d="M7 14h10v7H7z" /></>,
    alert: <><path d="M12 3 2 20h20L12 3Z" /><path d="M12 10v4M12 17h.01" /></>,
  };
  return <svg className={className} aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{paths[type]}</svg>;
}

function PanelHead({ icon, title, subtitle, action }: { icon: IconType; title: string; subtitle: string; action?: ReactNode }) {
  return <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-red-50 text-red-500 ring-1 ring-red-100"><AuditIcon type={icon} /></span>
      <div className="min-w-0"><h2 className="font-display truncate text-sm font-bold tracking-tight text-slate-900">{title}</h2><p className="truncate text-xs text-slate-500">{subtitle}</p></div>
    </div>
    {action}
  </div>;
}

export default function FeeDeletionLog() {
  const [deletions, setDeletions] = useDeletions();
  const [transactions, setTransactions] = useTransactions();
  const [students, setStudents] = useStudents();
  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [selectedRecord, setSelectedRecord] = useState<DeletionRecord | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pickReceipt, setPickReceipt] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const { showToast } = useToast();

  const ownerOf = (transaction: Transaction) => students.find((student) => student.id === transaction.studentId);
  const userOptions = useMemo(() => Array.from(new Set(deletions.map((item) => item.deletedBy))).map((value) => ({ label: value, value })), [deletions]);
  const monthOptions = useMemo(() => Array.from(new Set(deletions.map((item) => monthKey(item.date)))).sort().reverse().map((value) => ({ label: monthLabel(value), value })), [deletions]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return deletions
      .filter((record) => (!term || `${record.receipt} ${record.student} ${record.studentId} ${record.feeType} ${record.reason}`.toLowerCase().includes(term)) && (!userFilter || record.deletedBy === userFilter) && (!monthFilter || monthKey(record.date) === monthFilter))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [deletions, search, userFilter, monthFilter]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paged = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const removedValue = deletions.reduce((sum, record) => sum + record.amount, 0);
  const thisMonthKey = new Date().toISOString().slice(0, 7);
  const thisMonth = deletions.filter((record) => monthKey(record.date) === thisMonthKey).length;
  const stats = [
    { label: "Deleted Records", value: String(deletions.length), tone: "amber", icon: "delete" as IconType, copy: "All audited entries" },
    { label: "Value Removed", value: money(removedValue), tone: "violet", icon: "money" as IconType, copy: "Total transaction value" },
    { label: "Authorized Users", value: String(new Set(deletions.map((item) => item.deletedBy)).size), tone: "teal", icon: "users" as IconType, copy: "Performed deletions" },
    { label: "This Month", value: String(thisMonth), tone: "green", icon: "calendar" as IconType, copy: monthLabel(thisMonthKey) },
  ];

  const target = transactions.find((item) => item.receipt === pickReceipt);
  const targetOwner = target ? ownerOf(target) : undefined;
  const receiptOptions = transactions.map((item) => ({ label: `${item.receipt} · ${ownerOf(item)?.name ?? "Unknown"} · ${money(item.amount)}`, value: item.receipt }));
  const canDelete = Boolean(target && reason && (reason !== "Other" || notes.trim()) && confirmText.trim().toUpperCase() === "DELETE");

  const resetFilters = () => { setSearch(""); setUserFilter(""); setMonthFilter(""); setCurrentPage(1); };
  const closeDelete = () => { if (busy) return; setDeleteOpen(false); setPickReceipt(""); setReason(""); setNotes(""); setConfirmText(""); };

  const performDelete = async () => {
    if (!target || !canDelete) return;
    setBusy(true);
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    const names = target.heads.split(",").map((name) => name.trim());
    let remaining = target.amount;
    setStudents((current) => current.map((student) => student.id !== target.studentId ? student : {
      ...student,
      fees: student.fees.map((fee) => {
        if (!names.includes(fee.name) || remaining <= 0) return fee;
        const back = Math.min(fee.paid, remaining);
        remaining -= back;
        return { ...fee, paid: fee.paid - back };
      }),
    }));
    setTransactions((current) => current.filter((item) => item.receipt !== target.receipt));
    const record: DeletionRecord = {
      receipt: target.receipt, student: targetOwner?.name ?? "Unknown", studentId: targetOwner?.adm ?? "-", feeType: target.heads, amount: target.amount,
      deletedBy: "superadmin", date: new Date().toISOString(), reason: reason === "Other" ? notes.trim() : notes.trim() ? `${reason} — ${notes.trim()}` : reason, ipAddress: "192.168.1.24", mode: target.mode,
    };
    setDeletions((current) => [record, ...current]);
    setBusy(false);
    setDeleteOpen(false);
    setPickReceipt(""); setReason(""); setNotes(""); setConfirmText("");
    setCurrentPage(1);
    showToast(`${record.receipt} was deleted and ${money(record.amount)} was added back to the student's dues.`, { title: "Receipt deleted" });
  };

  const exportLog = () => {
    const header = ["Receipt", "Student", "Admission No.", "Fee Type", "Amount", "Payment Mode", "Deleted By", "Date & Time", "Reason", "IP Address"];
    const lines = rows.map((r) => [r.receipt, r.student, r.studentId, r.feeType, r.amount, r.mode, r.deletedBy, formatDate(r.date), r.reason, r.ipAddress].map(csvCell).join(","));
    const url = URL.createObjectURL(new Blob([[header.map(csvCell).join(","), ...lines].join("\n")], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url; link.download = "fee-deletion-audit-log.csv"; link.click();
    URL.revokeObjectURL(url);
    showToast(`${rows.length} audit records exported to CSV.`, { title: "Audit log exported" });
  };

  const printAudit = (record: DeletionRecord) => {
    const frame = document.createElement("iframe");
    frame.style.cssText = "position:fixed;width:0;height:0;border:0";
    document.body.appendChild(frame);
    const cells = [["Receipt", record.receipt], ["Student", record.student], ["Admission No.", record.studentId], ["Fee Type", record.feeType], ["Amount", money(record.amount)], ["Deleted By", record.deletedBy], ["Date & Time", formatDate(record.date)], ["IP Address", record.ipAddress], ["Reason", record.reason]];
    const esc = (v: string) => v.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] as string);
    frame.contentDocument?.write(`<html><body style="font-family:sans-serif;padding:32px"><h2>Fee Deletion Audit</h2><table style="border-collapse:collapse;width:100%">${cells.map(([k, v]) => `<tr><td style="border:1px solid #ddd;padding:8px;font-weight:bold;width:160px">${k}</td><td style="border:1px solid #ddd;padding:8px">${esc(v)}</td></tr>`).join("")}</table></body></html>`);
    frame.contentDocument?.close();
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    window.setTimeout(() => frame.remove(), 1500);
  };

  return <div className="min-h-screen dashboard-bg pb-16">
    <Header title="Fee Deletion Log" subtitle="Review and audit removed fee transactions" />
    <main className="space-y-4 p-4 sm:space-y-5 sm:p-6 xl:p-8">
      <section className="grid auto-rows-fr grid-cols-[repeat(2,minmax(0,1fr))] gap-2.5 sm:gap-3 xl:grid-cols-[repeat(4,minmax(0,1fr))] [&>article]:h-full">
        {stats.map((stat) => <article key={stat.label} className={`admission-summary-card admission-summary-${stat.tone} relative overflow-hidden rounded-2xl p-3 shadow-sm sm:p-5`}>
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="min-w-0"><div className="truncate text-[0.7rem] font-semibold text-slate-500 sm:text-xs">{stat.label}</div><div className="mt-1 truncate font-display text-xl font-bold text-slate-950 sm:text-2xl">{stat.value}</div></div>
            <span className="admission-summary-icon grid size-8 shrink-0 place-items-center rounded-xl sm:size-10"><AuditIcon type={stat.icon} className="size-4 sm:size-5" /></span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[0.7rem] font-medium text-slate-500 sm:mt-3 sm:text-xs"><span className="size-1.5 shrink-0 rounded-full bg-current opacity-50" /><span className="truncate">{stat.copy}</span></div>
        </article>)}
      </section>

      <section className="relative overflow-hidden rounded-2xl border border-red-100 bg-linear-to-r from-red-50 via-white to-orange-50 p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-red-100 text-red-600"><AuditIcon type="shield" /></div>
            <div className="min-w-0"><h2 className="font-display text-sm font-bold text-red-700">Protected audit trail</h2><p className="mt-1 text-xs leading-5 text-slate-600">Deletion records are permanent and cannot be edited. Each entry captures the responsible user, timestamp, reason and network address. Deleting a receipt returns its amount to the student's pending dues.</p></div>
          </div>
          <Button variant="danger" className="shrink-0 max-sm:w-full" onClick={() => setDeleteOpen(true)} disabled={!transactions.length} icon={<AuditIcon type="delete" className="size-4" />}>Delete a Receipt</Button>
        </div>
      </section>

      <section className="panel overflow-visible">
        <PanelHead icon="delete" title="Deleted Fee Transactions" subtitle={`${rows.length} matching audit records`} action={<Button variant="outline" className="shrink-0 px-3" onClick={exportLog} disabled={!rows.length} icon={<AuditIcon type="download" className="size-4" />}>Export</Button>} />
        <div className="grid grid-cols-2 gap-2.5 border-b border-slate-100 bg-linear-to-b from-slate-50/80 to-transparent p-3 max-sm:[&>:first-child]:col-span-2 max-sm:[&>:last-child]:col-span-2 sm:grid-cols-[1fr_10rem_10rem_auto] sm:gap-3 sm:p-4 xl:grid-cols-[1fr_12rem_12rem_auto]">
          <Input value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }} placeholder="Search receipt, student, fee or reason..." aria-label="Search deletion log" />
          <Dropdown value={userFilter} onChange={(event) => { setUserFilter(event.target.value); setCurrentPage(1); }} placeholder="Deleted By" aria-label="Deleted by" options={userOptions} />
          <Dropdown value={monthFilter} onChange={(event) => { setMonthFilter(event.target.value); setCurrentPage(1); }} placeholder="All Months" aria-label="Month filter" options={monthOptions} />
          <Button variant="outline" className="border-rose-200! bg-linear-to-r! from-rose-50! to-orange-50! text-rose-600! shadow-sm hover:from-rose-100! hover:to-orange-100! hover:border-rose-300! active:scale-95" onClick={resetFilters} icon={<AuditIcon type="reset" className="size-3.5" />}>Reset</Button>
        </div>

        <div className="overflow-x-auto">
          <table className="module-table student-directory-table student-premium-cards">
            <thead><tr><th>Student</th><th>Receipt</th><th>Fee Type</th><th>Amount</th><th>Deleted By</th><th>Date & Time</th><th>Reason</th><th>Action</th></tr></thead>
            <tbody>{paged.map((record) => <tr key={`${record.receipt}-${record.date}`}>
              <td data-label="Student"><div className="flex min-w-0 items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-red-50 text-xs font-bold text-red-500 max-sm:bg-white/20 max-sm:text-white max-sm:ring-1 max-sm:ring-white/30">{initials(record.student)}</span><div className="min-w-0"><div className="truncate font-semibold text-slate-900 max-sm:text-white">{record.student}</div><div className="text-[0.7rem] font-medium text-slate-600 max-sm:text-white/80">{record.studentId}</div></div></div></td>
              <td data-label="Receipt"><span className="font-semibold text-red-500">{record.receipt}</span></td>
              <td data-label="Fee Type">{record.feeType}</td>
              <td data-label="Amount"><span className="font-display font-bold text-red-500">{money(record.amount)}</span></td>
              <td data-label="Deleted By"><span className="status-neutral">{record.deletedBy}</span></td>
              <td data-label="Date & Time">{formatDate(record.date)}</td>
              <td data-label="Reason"><span className="line-clamp-2 max-w-52 text-xs">{record.reason}</span></td>
              <td data-label="Action"><Button variant="outline" className="min-h-8 px-3 py-1.5" icon={<AuditIcon type="view" className="size-4" />} onClick={() => setSelectedRecord(record)}>View</Button></td>
            </tr>)}</tbody>
          </table>
          {!rows.length && <div className="grid min-h-60 place-items-center p-6 text-center"><div><div className="mx-auto grid size-16 place-items-center rounded-2xl bg-slate-100 text-slate-400"><AuditIcon type="view" className="size-7" /></div><h3 className="mt-4 font-display text-sm font-bold text-slate-700">No deletion records found</h3><p className="mt-1 text-xs text-slate-400">Try changing the audit filters.</p></div></div>}
        </div>
        <PremiumPagination currentPage={safePage} totalPages={totalPages} totalRecords={rows.length} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }} wideLayout />
      </section>
    </main>

    <Popup
      open={Boolean(selectedRecord)}
      onClose={() => setSelectedRecord(null)}
      title="Deletion Audit Details"
      description="Complete information captured when this payment was removed."
      footer={<><Button variant="outline" onClick={() => setSelectedRecord(null)}>Close</Button><Button icon={<AuditIcon type="print" className="size-4" />} onClick={() => selectedRecord && printAudit(selectedRecord)}>Print Audit</Button></>}
    >
      {selectedRecord && <div className="space-y-5">
        <div className="rounded-2xl bg-[linear-gradient(135deg,#7f1d1d,#dc2626_70%,#f97316)] p-5 text-white"><div className="text-xs text-white/70">Deleted transaction</div><div className="mt-1 font-display text-3xl font-bold">{money(selectedRecord.amount)}</div><div className="mt-4 flex justify-between gap-3 text-xs"><span className="text-white/70">Receipt No.</span><strong>{selectedRecord.receipt}</strong></div></div>
        <dl className="grid gap-3 sm:grid-cols-2">{[
          ["Student", selectedRecord.student],
          ["Admission No.", selectedRecord.studentId],
          ["Fee Type", selectedRecord.feeType],
          ["Payment Mode", selectedRecord.mode],
          ["Deleted By", selectedRecord.deletedBy],
          ["Date & Time", formatDate(selectedRecord.date)],
          ["IP Address", selectedRecord.ipAddress],
          ["Record Status", "Permanently deleted"],
        ].map(([label, value]) => <div key={label} className="min-w-0 rounded-xl border border-slate-100 p-3"><dt className="text-[0.62rem] font-bold uppercase tracking-wider text-slate-400">{label}</dt><dd className="mt-1 break-words text-sm font-semibold text-slate-800">{value}</dd></div>)}</dl>
        <div><div className="form-label">Deletion Reason</div><div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-600">{selectedRecord.reason}</div></div>
      </div>}
    </Popup>

    <Popup
      open={deleteOpen}
      onClose={closeDelete}
      title="Delete Fee Receipt"
      description="The amount will be returned to the student's pending dues and logged permanently."
      footer={<><Button variant="outline" onClick={closeDelete} disabled={busy}>Cancel</Button><Button variant="danger" onClick={performDelete} disabled={!canDelete} isLoading={busy} loadingText="Deleting..." icon={<AuditIcon type="delete" className="size-4" />}>Delete Receipt</Button></>}
    >
      <div className="space-y-4">
        <div><label className="form-label">Receipt *</label><Dropdown value={pickReceipt} onChange={(event) => setPickReceipt(event.target.value)} placeholder="Select a receipt" aria-label="Receipt to delete" options={receiptOptions} /></div>
        {target && <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-red-700"><AuditIcon type="alert" className="mt-0.5 size-5 shrink-0" /><div className="min-w-0 text-xs leading-5"><div className="font-display text-base font-bold">{money(target.amount)} · {target.mode}</div><div className="break-words">{targetOwner?.name} ({targetOwner?.adm}) — {target.heads}</div><div className="mt-1 text-red-500">Student's dues will increase by {money(target.amount)}.</div></div></div>}
        <div><label className="form-label">Reason *</label><Dropdown value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Select a reason" aria-label="Deletion reason" options={reasons.map((value) => ({ label: value, value }))} /></div>
        <div><label htmlFor="delete-notes" className="form-label">Notes{reason === "Other" ? " *" : ""}</label><textarea id="delete-notes" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={200} className="form-input h-20 resize-none py-3" placeholder="Add details for the audit trail..." /></div>
        <div><label htmlFor="delete-confirm" className="form-label">Type DELETE to confirm *</label><Input id="delete-confirm" value={confirmText} onChange={(event) => setConfirmText(event.target.value)} placeholder="DELETE" /></div>
      </div>
    </Popup>
  </div>;
}
