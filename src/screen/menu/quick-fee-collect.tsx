import { useMemo, useState, type ReactNode } from "react";
import { Button, Dropdown, Input, PremiumPagination, useToast } from "../../components";
import Header from "../../ui/header";
import Popup from "../../ui/popup";
import { classBase, feeBalance, nextReceiptNumber, studentPending, useStructure, useStudents, useTransactions, type Student, type Transaction } from "../../data/feeStore";

const methods = [
  { label: "Cash", description: "Collect at counter" },
  { label: "UPI", description: "Scan or enter UPI" },
  { label: "Card", description: "Debit or credit card" },
  { label: "Bank Transfer", description: "NEFT / IMPS" },
];

const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;
const today = () => new Date().toISOString().slice(0, 10);
const formatDate = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const initials = (name: string) => name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
const csvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
const structureYear = "2027–28";

type IconType = "search" | "flash" | "receipt" | "table" | "download" | "reset" | "layers";

function QuickIcon({ type, className = "size-5" }: { type: IconType; className?: string }) {
  const paths: Record<IconType, ReactNode> = {
    flash: <path d="m13 2-9 12h8l-1 8 9-13h-8l1-7Z" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    receipt: <><path d="M7 3h10v18l-2-1.5L13 21l-2-1.5L9 21l-2-1.5V3Z" /><path d="M10 8h4M10 12h4" /></>,
    table: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M9 4v16" /></>,
    download: <path d="M12 3v13M7 11l5 5 5-5M4 21h16" />,
    reset: <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></>,
  };
  return <svg className={className} aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{paths[type]}</svg>;
}

function PanelHead({ icon, title, subtitle, action }: { icon: IconType; title: string; subtitle: string; action?: ReactNode }) {
  return <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-(--app-accent-soft) text-(--app-accent-dark) ring-1 ring-(--app-accent)/20"><QuickIcon type={icon} /></span>
      <div className="min-w-0"><h2 className="font-display truncate text-sm font-bold tracking-tight text-slate-900">{title}</h2><p className="truncate text-xs text-slate-500">{subtitle}</p></div>
    </div>
    {action}
  </div>;
}

export default function QuickFeeCollect() {
  const [students, setStudents] = useStudents();
  const [transactions, setTransactions] = useTransactions();
  const [structure] = useStructure();
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [target, setTarget] = useState<Student | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Cash");
  const [reference, setReference] = useState("");
  const [collecting, setCollecting] = useState(false);
  const [receipt, setReceipt] = useState<Transaction | null>(null);
  const { showToast } = useToast();

  const liveTarget = target ? students.find((item) => item.id === target.id) ?? null : null;
  const targetPending = liveTarget ? studentPending(liveTarget) : 0;
  const ownerOf = (item: Transaction) => students.find((entry) => entry.id === item.studentId);

  const todayIso = today();
  const todaysTransactions = transactions.filter((item) => item.date === todayIso);
  const collectedToday = todaysTransactions.reduce((sum, item) => sum + item.amount, 0);
  const totalPending = students.reduce((sum, item) => sum + studentPending(item), 0);
  const duesCount = students.filter((item) => studentPending(item) > 0).length;
  const totalBilled = students.reduce((sum, item) => sum + item.fees.reduce((inner, fee) => inner + fee.amount, 0), 0);
  const recoveryRate = totalBilled ? Math.round(((totalBilled - totalPending) / totalBilled) * 100) : 0;

  const stats = [
    { label: "Collected Today", value: money(collectedToday), tone: "green", icon: "flash" as IconType, copy: `${todaysTransactions.length} payments` },
    { label: "Pending Dues", value: money(totalPending), tone: "amber", icon: "layers" as IconType, copy: `${duesCount} students owe fees` },
    { label: "Recovery Rate", value: `${recoveryRate}%`, tone: "teal", icon: "table" as IconType, copy: "Of total billed fees" },
    { label: "Receipts Issued", value: String(transactions.length), tone: "violet", icon: "receipt" as IconType, copy: "All time" },
  ];

  const classOptions = useMemo(() => Array.from(new Set(students.map((item) => classBase(item.className)))).map((value) => ({ label: value, value })), [students]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return students.filter((item) => {
      if (classFilter && classBase(item.className) !== classFilter) return false;
      const due = studentPending(item);
      if (statusFilter === "due" && due === 0) return false;
      if (statusFilter === "cleared" && due > 0) return false;
      if (!term) return true;
      return [item.name, item.adm, item.phone, item.className, item.father].some((value) => value.toLowerCase().includes(term));
    }).sort((a, b) => studentPending(b) - studentPending(a));
  }, [students, search, classFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pagedRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const classStructure = liveTarget ? structure.filter((fee) => fee.className === classBase(liveTarget.className) && fee.year === structureYear) : [];
  const structureTotal = classStructure.reduce((sum, fee) => sum + Number(fee.amount), 0);

  const openCollect = (student: Student) => {
    setTarget(student);
    setAmount(String(studentPending(student)));
    setMethod("Cash");
    setReference("");
  };

  const resetFilters = () => { setSearch(""); setClassFilter(""); setStatusFilter(""); setCurrentPage(1); };

  const collect = async () => {
    if (!liveTarget) return;
    const payment = Number(amount);
    if (!payment || payment <= 0) { showToast("Enter a valid amount to collect.", { title: "Amount required", tone: "error" }); return; }
    if (payment > targetPending) { showToast(`Payment cannot exceed the pending balance of ${money(targetPending)}.`, { title: "Amount exceeds balance", tone: "error" }); return; }
    if (method !== "Cash" && !reference.trim()) { showToast(`Enter the ${method.toLowerCase()} reference number.`, { title: "Reference required", tone: "error" }); return; }
    setCollecting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 800));
    let remaining = payment;
    const applied: string[] = [];
    const nextFees = liveTarget.fees.map((fee) => {
      const balance = feeBalance(fee);
      if (remaining <= 0 || balance <= 0) return { ...fee, selected: false };
      const part = Math.min(balance, remaining);
      remaining -= part;
      applied.push(fee.name);
      return { ...fee, paid: fee.paid + part, selected: false };
    });
    const transaction: Transaction = { receipt: nextReceiptNumber(transactions.length), studentId: liveTarget.id, heads: applied.join(", "), amount: payment, date: today(), mode: method, reference: reference.trim(), remarks: "Quick collect" };
    setStudents((current) => current.map((item) => item.id === liveTarget.id ? { ...item, fees: nextFees } : item));
    setTransactions((current) => [transaction, ...current]);
    setCollecting(false);
    setTarget(null);
    setReceipt(transaction);
    showToast(`${money(payment)} collected from ${liveTarget.name}.`, { title: "Payment successful" });
  };

  const exportRows = () => {
    const header = ["Student", "Admission No", "Class", "Total Fee", "Paid", "Pending"];
    const lines = rows.map((item) => { const total = item.fees.reduce((sum, fee) => sum + fee.amount, 0); const due = studentPending(item); return [item.name, item.adm, item.className, total, total - due, due].map(csvCell).join(","); });
    const url = URL.createObjectURL(new Blob([[header.map(csvCell).join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "fee-dues.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast(`${rows.length} students exported.`, { title: "Dues exported" });
  };

  const recent = transactions.slice(0, 5);

  return <div className="min-h-screen dashboard-bg pb-16">
    <Header title="Quick Fee Collect" subtitle="Find a student and complete a payment in seconds" />
    <main className="space-y-4 p-4 sm:space-y-5 sm:p-6 xl:p-8">
      <section className="grid auto-rows-fr grid-cols-[repeat(2,minmax(0,1fr))] gap-2.5 sm:gap-3 xl:grid-cols-[repeat(4,minmax(0,1fr))] [&>article]:h-full">
        {stats.map((stat) => <article key={stat.label} className={`admission-summary-card admission-summary-${stat.tone} relative overflow-hidden rounded-2xl p-3 shadow-sm sm:p-5`}>
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="min-w-0"><div className="truncate text-[0.7rem] font-semibold text-slate-500 sm:text-xs">{stat.label}</div><div className="mt-1 truncate font-display text-xl font-bold text-slate-950 sm:text-2xl">{stat.value}</div></div>
            <span className="admission-summary-icon grid size-8 shrink-0 place-items-center rounded-xl sm:size-10"><QuickIcon type={stat.icon} className="size-4 sm:size-5" /></span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[0.7rem] font-medium text-slate-500 sm:mt-3 sm:text-xs"><span className="size-1.5 shrink-0 rounded-full bg-current opacity-50" /><span className="truncate">{stat.copy}</span></div>
        </article>)}
      </section>

      <section className="panel overflow-visible">
        <PanelHead icon="table" title="Student Fee Accounts" subtitle={`${rows.length} students · live from Fee Structure & Fee Collection`} action={<Button variant="outline" className="shrink-0 px-3" onClick={exportRows} disabled={!rows.length} icon={<QuickIcon type="download" className="size-4" />}>Export</Button>} />
        <div className="grid grid-cols-2 gap-2.5 border-b border-slate-100 bg-linear-to-b from-slate-50/80 to-transparent p-3 max-sm:[&>:first-child]:col-span-2 max-sm:[&>:last-child]:col-span-2 sm:grid-cols-[1fr_9rem_9rem_auto] sm:gap-3 sm:p-4 xl:grid-cols-[1fr_12rem_12rem_auto]">
          <Input value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }} placeholder="Student name, admission no. or mobile..." aria-label="Search student" />
          <Dropdown value={classFilter} onChange={(event) => { setClassFilter(event.target.value); setCurrentPage(1); }} placeholder="All Classes" aria-label="Class filter" options={classOptions} />
          <Dropdown value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setCurrentPage(1); }} placeholder="All Status" aria-label="Status filter" options={[{ label: "Dues pending", value: "due" }, { label: "Fully paid", value: "cleared" }]} />
          <Button variant="outline" className="border-rose-200! bg-linear-to-r! from-rose-50! to-orange-50! text-rose-600! shadow-sm hover:from-rose-100! hover:to-orange-100! hover:border-rose-300! active:scale-95" onClick={resetFilters} icon={<QuickIcon type="reset" className="size-3.5" />}>Reset</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="module-table student-directory-table student-premium-cards">
            <thead><tr><th>Student</th><th>Class</th><th>Total Fee</th><th>Paid</th><th>Pending</th><th>Progress</th><th>Action</th></tr></thead>
            <tbody>{pagedRows.map((item) => {
              const total = item.fees.reduce((sum, fee) => sum + fee.amount, 0);
              const due = studentPending(item);
              const percent = total ? Math.round(((total - due) / total) * 100) : 0;
              return <tr key={item.id}>
                <td data-label="Student"><div className="flex items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-(--app-accent-soft) text-xs font-bold text-(--app-accent-dark) max-sm:bg-white/20 max-sm:text-white max-sm:ring-1 max-sm:ring-white/30">{initials(item.name)}</span><div className="min-w-0"><div className="font-semibold text-slate-900 max-sm:text-white">{item.name}</div><div className="text-[0.7rem] font-medium text-slate-600 max-sm:text-white/80">{item.adm}</div></div></div></td>
                <td data-label="Class">{item.className}</td>
                <td data-label="Total Fee">{money(total)}</td>
                <td data-label="Paid"><span className="font-semibold text-emerald-600">{money(total - due)}</span></td>
                <td data-label="Pending"><span className={due ? "font-semibold text-red-500" : "font-semibold text-slate-400"}>{money(due)}</span></td>
                <td data-label="Progress"><div className="flex min-w-28 items-center gap-2"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${due ? "bg-(--app-accent)" : "bg-emerald-500"}`} style={{ width: `${percent}%` }} /></div><span className="w-9 text-right text-[0.7rem] font-semibold text-slate-500">{percent}%</span></div></td>
                <td data-label="Action">{due ? <Button className="min-h-8 px-3 py-1.5" onClick={() => openCollect(item)} icon={<QuickIcon type="flash" className="size-3.5" />}>Collect</Button> : <span className="status-success">Cleared</span>}</td>
              </tr>;
            })}</tbody>
          </table>
          {!pagedRows.length && <div className="grid min-h-40 place-items-center p-6 text-center text-sm text-slate-400">No students match these filters.</div>}
        </div>
        <PremiumPagination currentPage={safePage} totalPages={totalPages} totalRecords={rows.length} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }} wideLayout />
      </section>

      <section className="panel overflow-visible">
        <PanelHead icon="receipt" title="Recent Payments" subtitle="Latest receipts across Fee Collection and Quick Collect" />
        <div className="overflow-x-auto"><table className="module-table student-directory-table student-premium-cards"><thead><tr><th>Receipt</th><th>Student</th><th>Class</th><th>Fee Heads</th><th>Amount</th><th>Mode</th><th>Date</th><th>Action</th></tr></thead><tbody>{recent.map((item) => <tr key={item.receipt}><td data-label="Receipt"><span className="font-semibold text-(--app-accent-dark)">{item.receipt}</span></td><td data-label="Student">{ownerOf(item)?.name}</td><td data-label="Class">{ownerOf(item)?.className}</td><td data-label="Fee Heads">{item.heads}</td><td data-label="Amount"><span className="font-bold text-emerald-600">{money(item.amount)}</span></td><td data-label="Mode"><span className="status-neutral">{item.mode}</span></td><td data-label="Date">{formatDate(item.date)}</td><td data-label="Action"><Button variant="outline" className="min-h-8 px-3 py-1.5" onClick={() => setReceipt(item)}>Receipt</Button></td></tr>)}</tbody></table></div>
      </section>
    </main>

    <Popup
      open={Boolean(liveTarget)}
      onClose={() => setTarget(null)}
      title="Quick Collect"
      description={liveTarget ? `${liveTarget.name} · ${liveTarget.className}` : ""}
      footer={<><Button variant="outline" onClick={() => setTarget(null)}>Cancel</Button><Button onClick={collect} isLoading={collecting} loadingText="Processing..." icon={<QuickIcon type="flash" className="size-4" />}>Collect {money(Number(amount) > 0 ? Number(amount) : 0)}</Button></>}
    >
      {liveTarget && <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-[linear-gradient(135deg,var(--app-sidebar-start),var(--app-accent-dark)_60%,var(--app-accent))] p-4 text-white">
          <div className="min-w-0"><div className="truncate font-display text-base font-bold">{liveTarget.name}</div><div className="truncate text-xs text-white/70">{liveTarget.adm}</div></div>
          <div className="shrink-0 text-right"><div className="text-[0.6rem] font-bold uppercase tracking-wider text-white/70">Total due</div><div className="font-display text-xl font-bold">{money(targetPending)}</div></div>
        </div>
        <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-100">{liveTarget.fees.filter((fee) => feeBalance(fee) > 0).map((fee) => <li key={fee.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-xs"><span className="min-w-0 truncate font-medium text-slate-700">{fee.name}</span><span className="shrink-0 font-semibold text-red-500">{money(feeBalance(fee))}</span></li>)}</ul>
        {classStructure.length > 0 && <div className="rounded-2xl border border-(--app-accent)/20 bg-(--app-accent-faint) p-3">
          <div className="flex items-center justify-between gap-2 text-[0.65rem] font-bold uppercase tracking-widest text-(--app-accent-dark)"><span className="flex items-center gap-1.5"><QuickIcon type="layers" className="size-3.5" />{classBase(liveTarget.className)} fee structure · {structureYear}</span><span>{money(structureTotal)}</span></div>
          <div className="mt-2 flex flex-wrap gap-1.5">{classStructure.map((fee) => <span key={fee.id} className="rounded-full bg-white px-2.5 py-1 text-[0.7rem] text-slate-600 ring-1 ring-slate-200">{fee.name} · <strong>{money(Number(fee.amount))}</strong></span>)}</div>
        </div>}
        <div>
          <Input label="Payment Amount (₹)" type="number" min="1" max={targetPending} value={amount} onChange={(event) => setAmount(event.target.value)} hint={`Maximum collectable: ${money(targetPending)}`} />
          <div className="mt-2 flex flex-wrap gap-1.5">{[["Full", targetPending], ["Half", Math.ceil(targetPending / 2)], ["₹100", 100], ["₹500", 500]].filter(([, value]) => Number(value) <= targetPending).map(([label, value]) => <button key={label as string} type="button" onClick={() => setAmount(String(value))} className="rounded-full border border-(--app-accent)/30 bg-(--app-accent-faint) px-3 py-1 text-xs font-semibold text-(--app-accent-dark) transition hover:bg-(--app-accent-soft)">{label === "Full" || label === "Half" ? `${label} ${money(value as number)}` : label}</button>)}</div>
        </div>
        <div><span className="form-label">Payment Method</span><div className="grid grid-cols-2 gap-2">{methods.map((item) => <button key={item.label} type="button" onClick={() => setMethod(item.label)} aria-pressed={method === item.label} className={`rounded-xl border p-3 text-left transition ${method === item.label ? "border-(--app-accent) bg-(--app-accent-faint) ring-2 ring-(--app-accent)/20" : "border-slate-200 bg-white hover:border-(--app-accent)/50"}`}><div className="text-sm font-semibold text-slate-900">{item.label}</div><div className="text-[0.7rem] text-slate-500">{item.description}</div></button>)}</div></div>
        {method !== "Cash" && <Input label={`${method} Reference No. *`} value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Transaction number" />}
      </div>}
    </Popup>

    <Popup
      open={Boolean(receipt)}
      onClose={() => setReceipt(null)}
      title="Payment Receipt"
      description="The payment was recorded and the receipt is ready."
      footer={<><Button variant="outline" onClick={() => setReceipt(null)}>Close</Button><Button onClick={() => showToast(`${receipt?.receipt} was sent to the printer.`, { title: "Printing receipt", tone: "info" })}>Print Receipt</Button></>}
    >
      {receipt && <div className="space-y-4"><div className="rounded-2xl bg-[linear-gradient(135deg,var(--app-sidebar-start),var(--app-accent-dark)_60%,var(--app-accent))] p-5 text-white"><div className="text-xs text-white/70">Payment received</div><div className="mt-1 font-display text-3xl font-bold">{money(receipt.amount)}</div><div className="mt-4 flex justify-between text-xs"><span className="text-white/70">Receipt No.</span><strong>{receipt.receipt}</strong></div></div><dl className="grid grid-cols-2 gap-3">{[["Student", ownerOf(receipt)?.name ?? ""], ["Class", ownerOf(receipt)?.className ?? ""], ["Fee Heads", receipt.heads], ["Mode", receipt.mode], ["Date", formatDate(receipt.date)], ["Reference", receipt.reference || "—"]].map(([label, value]) => <div key={label} className="min-w-0 rounded-xl border border-slate-100 p-3"><dt className="text-[0.62rem] font-bold uppercase tracking-wider text-slate-400">{label}</dt><dd className="mt-1 break-words text-sm font-semibold text-slate-800">{value}</dd></div>)}</dl></div>}
    </Popup>
  </div>;
}
