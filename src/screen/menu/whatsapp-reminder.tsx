import { useMemo, useRef, useState, type ReactNode } from "react";
import { Button, Dropdown, Input, PremiumPagination, useToast } from "../../components";
import Header from "../../ui/header";
import Popup from "../../ui/popup";
import { classBase, studentPending, useStudents, type Student } from "../../data/feeStore";

const templates = {
  friendly: "Dear {guardian}, this is a friendly reminder that ₹{amount} is pending for {student} ({class}). Please complete the payment at your convenience. Thank you — PAL IT HUB.",
  urgent: "Dear {guardian}, ₹{amount} remains overdue for {student}. Kindly clear the pending school fee as soon as possible. Contact the school office if payment has already been made.",
  final: "Final fee reminder: ₹{amount} is pending for {student} ({class}). Please make payment before the due date to avoid interruption of school services.",
};
type TemplateKey = keyof typeof templates;
const templateLabels: { key: TemplateKey; label: string }[] = [{ key: "friendly", label: "Friendly" }, { key: "urgent", label: "Urgent" }, { key: "final", label: "Final" }];
const variables = ["{guardian}", "{student}", "{class}", "{amount}"];
const maxLength = 500;

type LogEntry = { id: number; count: number; amount: number; template: string; time: string };

const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;
const initials = (name: string) => name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
const nowLabel = () => new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const timeLabel = () => new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

type IconType = "whatsapp" | "send" | "users" | "reset" | "message" | "clock" | "check";

function Icon({ type, className = "size-5" }: { type: IconType; className?: string }) {
  const paths: Record<IconType, ReactNode> = {
    whatsapp: <><path d="M21 11.5a9 9 0 0 1-13.3 7.9L3 21l1.6-4.5A9 9 0 1 1 21 11.5Z" /><path d="M8 8c1 4 3 6 7 7" /></>,
    send: <path d="m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13" />,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>,
    reset: <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />,
    message: <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    check: <path d="m5 12 5 5 9-10" />,
  };
  return <svg className={className} aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{paths[type]}</svg>;
}

function PanelHead({ icon, title, subtitle, action }: { icon: IconType; title: string; subtitle: string; action?: ReactNode }) {
  return <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/70"><Icon type={icon} /></span>
      <div className="min-w-0"><h2 className="font-display truncate text-sm font-bold tracking-tight text-slate-900">{title}</h2><p className="truncate text-xs text-slate-500">{subtitle}</p></div>
    </div>
    {action}
  </div>;
}

const personalize = (text: string, student: Student, due: number) => text
  .replace(/\{guardian\}/g, student.father)
  .replace(/\{student\}/g, student.name)
  .replace(/\{class\}/g, student.className)
  .replace(/\{amount\}/g, due.toLocaleString("en-IN"));

export default function WhatsAppReminder() {
  const [students] = useStudents();
  const [selected, setSelected] = useState<Set<number>>(new Set([1, 2]));
  const [lastSent, setLastSent] = useState<Record<number, string>>({ 4: "07 Oct 2026", 6: "05 Oct 2026" });
  const [log, setLog] = useState<LogEntry[]>([
    { id: 2, count: 3, amount: 2100, template: "Friendly", time: "Yesterday, 05:30 PM" },
    { id: 1, count: 2, amount: 1350, template: "Urgent", time: "05 Oct, 11:15 AM" },
  ]);
  const [classFilter, setClassFilter] = useState("");
  const [minimumDue, setMinimumDue] = useState("0");
  const [search, setSearch] = useState("");
  const [template, setTemplate] = useState<TemplateKey>("friendly");
  const [message, setMessage] = useState(templates.friendly);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState(12);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const { showToast } = useToast();

  const debtors = useMemo(() => students.map((student) => ({ student, due: studentPending(student) })).filter((entry) => entry.due > 0), [students]);
  const classOptions = useMemo(() => Array.from(new Set(debtors.map((entry) => classBase(entry.student.className)))).map((value) => ({ label: value, value })), [debtors]);

  const visible = debtors.filter(({ student, due }) => {
    const term = search.trim().toLowerCase();
    if (term && !`${student.name} ${student.father} ${student.phone}`.toLowerCase().includes(term)) return false;
    if (classFilter && classBase(student.className) !== classFilter) return false;
    return due >= Number(minimumDue || 0);
  }).sort((a, b) => b.due - a.due);

  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paged = visible.slice((safePage - 1) * pageSize, safePage * pageSize);

  const chosen = debtors.filter((entry) => selected.has(entry.student.id));
  const chosenDue = chosen.reduce((sum, entry) => sum + entry.due, 0);
  const allVisibleSelected = visible.length > 0 && visible.every((entry) => selected.has(entry.student.id));
  const previewEntry = chosen[0] ?? debtors[0];
  const preview = previewEntry ? personalize(message, previewEntry.student, previewEntry.due) : message;
  const totalDue = debtors.reduce((sum, entry) => sum + entry.due, 0);

  const toggle = (id: number) => setSelected((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const toggleAllVisible = () => setSelected((current) => { const next = new Set(current); visible.forEach((entry) => allVisibleSelected ? next.delete(entry.student.id) : next.add(entry.student.id)); return next; });
  const changeTemplate = (key: TemplateKey) => { setTemplate(key); setMessage(templates[key]); };
  const resetFilters = () => { setSearch(""); setClassFilter(""); setMinimumDue("0"); setCurrentPage(1); };

  const insertVariable = (variable: string) => {
    const el = textRef.current;
    const start = el?.selectionStart ?? message.length;
    const end = el?.selectionEnd ?? message.length;
    const next = `${message.slice(0, start)}${variable}${message.slice(end)}`.slice(0, maxLength);
    setMessage(next);
    window.setTimeout(() => { el?.focus(); el?.setSelectionRange(start + variable.length, start + variable.length); }, 0);
  };

  const openChat = (student: Student, due: number) => {
    const url = `https://wa.me/91${student.phone.replace(/\D/g, "")}?text=${encodeURIComponent(personalize(message, student, due))}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setLastSent((current) => ({ ...current, [student.id]: nowLabel() }));
    showToast(`WhatsApp chat opened for ${student.father}.`, { title: "Opening WhatsApp", tone: "info" });
  };

  const askSend = () => {
    if (!message.trim()) { showToast("Write a message before sending reminders.", { title: "Message is empty", tone: "error" }); return; }
    if (!chosen.length) { showToast("Select at least one guardian before sending.", { title: "No recipients selected", tone: "error" }); return; }
    setConfirmOpen(true);
  };

  const sendReminders = async () => {
    setSending(true);
    await new Promise((resolve) => window.setTimeout(resolve, 1200));
    const date = nowLabel();
    setLastSent((current) => { const next = { ...current }; chosen.forEach((entry) => { next[entry.student.id] = date; }); return next; });
    setLog((current) => [{ id: Date.now(), count: chosen.length, amount: chosenDue, template: templateLabels.find((item) => item.key === template)?.label ?? "Custom", time: `Today, ${timeLabel()}` }, ...current].slice(0, 6));
    setSentCount((current) => current + chosen.length);
    setSelected(new Set());
    setSending(false);
    setConfirmOpen(false);
    showToast(`${chosen.length} WhatsApp fee reminders were queued successfully.`, { title: "Reminders sent" });
  };

  const stats = [
    { label: "Pending Contacts", value: String(debtors.length), tone: "amber", icon: "clock" as IconType, copy: `${money(totalDue)} outstanding` },
    { label: "Selected Now", value: String(chosen.length), tone: "teal", icon: "users" as IconType, copy: `${money(chosenDue)} total due` },
    { label: "Sent This Month", value: String(sentCount), tone: "green", icon: "whatsapp" as IconType, copy: "Reminder messages" },
    { label: "Delivery Rate", value: "96.4%", tone: "violet", icon: "check" as IconType, copy: "Successfully delivered" },
  ];

  return <div className="min-h-screen dashboard-bg pb-16">
    <Header title="WhatsApp Fee Reminder" subtitle="Notify guardians about pending fees with personalized messages" />
    <main className="space-y-4 p-4 sm:space-y-5 sm:p-6 xl:p-8">
      <section className="grid auto-rows-fr grid-cols-[repeat(2,minmax(0,1fr))] gap-2.5 sm:gap-3 xl:grid-cols-[repeat(4,minmax(0,1fr))] [&>article]:h-full">
        {stats.map((stat) => <article key={stat.label} className={`admission-summary-card admission-summary-${stat.tone} relative overflow-hidden rounded-2xl p-3 shadow-sm sm:p-5`}>
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="min-w-0"><div className="truncate text-[0.7rem] font-semibold text-slate-500 sm:text-xs">{stat.label}</div><div className="mt-1 truncate font-display text-xl font-bold text-slate-950 sm:text-2xl">{stat.value}</div></div>
            <span className="admission-summary-icon grid size-8 shrink-0 place-items-center rounded-xl sm:size-10"><Icon type={stat.icon} className="size-4 sm:size-5" /></span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[0.7rem] font-medium text-slate-500 sm:mt-3 sm:text-xs"><span className="size-1.5 shrink-0 rounded-full bg-current opacity-50" /><span className="truncate">{stat.copy}</span></div>
        </article>)}
      </section>

      <div className="grid items-start gap-4 sm:gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <section className="panel overflow-visible">
          <PanelHead icon="users" title="Reminder Recipients" subtitle={`${visible.length} guardians · ${chosen.length} selected`} action={<Button variant="success" className="shrink-0" onClick={askSend} icon={<Icon type="send" className="size-4" />}>Send{chosen.length ? ` (${chosen.length})` : ""}</Button>} />
          <div className="grid grid-cols-2 gap-2.5 border-b border-slate-100 bg-linear-to-b from-slate-50/80 to-transparent p-3 max-sm:[&>:first-child]:col-span-2 max-sm:[&>:last-child]:col-span-2 sm:grid-cols-[1fr_9rem_9rem_auto] sm:gap-3 sm:p-4">
            <Input value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }} placeholder="Search student, guardian or phone..." aria-label="Search recipients" />
            <Dropdown value={classFilter} onChange={(event) => { setClassFilter(event.target.value); setCurrentPage(1); }} placeholder="All Classes" aria-label="Class filter" options={classOptions} />
            <Dropdown value={minimumDue} onChange={(event) => { setMinimumDue(event.target.value); setCurrentPage(1); }} placeholder="Minimum Due" aria-label="Minimum due" options={[{ label: "Any Amount", value: "0" }, { label: "₹500+", value: "500" }, { label: "₹1,000+", value: "1000" }]} />
            <Button variant="outline" className="border-rose-200! bg-linear-to-r! from-rose-50! to-orange-50! text-rose-600! shadow-sm hover:from-rose-100! hover:to-orange-100! hover:border-rose-300! active:scale-95" onClick={resetFilters} icon={<Icon type="reset" className="size-3.5" />}>Reset</Button>
          </div>

          <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-2.5 sm:px-5">
            <label className="flex cursor-pointer items-center gap-2.5 text-xs font-semibold text-slate-600"><input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} disabled={!visible.length} className="size-4 accent-emerald-600" />Select all {visible.length} shown</label>
            {chosen.length > 0 && <button type="button" onClick={() => setSelected(new Set())} className="text-xs font-semibold text-slate-500 hover:text-rose-600">Clear selection</button>}
          </div>

          <ul className="space-y-2.5 bg-linear-to-b from-slate-50/60 to-transparent p-3 sm:p-4">
            {paged.map(({ student, due }) => {
              const isOn = selected.has(student.id);
              const sent = lastSent[student.id];
              return <li key={student.id} className={`rounded-2xl border p-3 transition sm:p-4 ${isOn ? "border-emerald-400 bg-emerald-50/70 shadow-md ring-2 ring-emerald-400/20" : "border-slate-200 bg-white shadow-sm hover:border-emerald-300 hover:shadow-md"}`}>
                <div className="flex items-center gap-3">
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                    <input type="checkbox" checked={isOn} onChange={() => toggle(student.id)} aria-label={`Select ${student.name}`} className="size-4 shrink-0 accent-emerald-600" />
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-xs font-bold text-emerald-700">{initials(student.name)}</span>
                    <span className="min-w-0"><span className="block truncate text-sm font-semibold text-slate-900">{student.name}</span><span className="block truncate text-xs text-slate-500">{student.className} · C/o {student.father}</span></span>
                  </label>
                  <div className="shrink-0 text-right"><div className="font-display text-base font-bold text-red-500 sm:text-lg">{money(due)}</div><div className="text-[0.65rem] font-medium text-slate-400">pending</div></div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500"><span className="font-medium text-slate-700">{student.phone}</span>{sent ? <span className="inline-flex items-center gap-1"><Icon type="clock" className="size-3.5" />Last sent {sent}</span> : <span className="status-warning">Not reminded yet</span>}</div>
                  <Button variant="outline" className="min-h-8 px-3 py-1.5 text-emerald-700" onClick={() => openChat(student, due)} icon={<Icon type="whatsapp" className="size-3.5" />}>Chat</Button>
                </div>
              </li>;
            })}
            {!paged.length && <li className="grid min-h-40 place-items-center rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-400">{debtors.length ? "No guardians match the selected filters." : "All fees are cleared. No reminders needed."}</li>}
          </ul>
          <PremiumPagination currentPage={safePage} totalPages={totalPages} totalRecords={visible.length} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }} wideLayout />
        </section>

        <div className="space-y-4 sm:space-y-5 xl:sticky xl:top-4">
          <section className="panel overflow-visible">
            <PanelHead icon="message" title="Message Composer" subtitle="Personalize the guardian reminder" />
            <div className="space-y-4 p-4 sm:p-5">
              <div>
                <span className="form-label">Template</span>
                <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-100 p-1">{templateLabels.map((item) => <button key={item.key} type="button" onClick={() => changeTemplate(item.key)} aria-pressed={template === item.key} className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${template === item.key ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>{item.label}</button>)}</div>
              </div>
              <div>
                <label htmlFor="reminder-message" className="form-label">Message</label>
                <textarea id="reminder-message" ref={textRef} value={message} maxLength={maxLength} onChange={(event) => setMessage(event.target.value)} className="form-input h-36 resize-none py-3 leading-5" />
                <div className="mt-2 flex flex-wrap items-center gap-1.5">{variables.map((variable) => <button key={variable} type="button" onClick={() => insertVariable(variable)} className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[0.7rem] font-semibold text-emerald-700 transition hover:bg-emerald-100">{variable}</button>)}<span className={`ml-auto text-[0.7rem] ${message.length > maxLength - 40 ? "text-amber-600" : "text-slate-400"}`}>{message.length}/{maxLength}</span></div>
              </div>
              <Button variant="outline" fullWidth onClick={() => setMessage(templates[template])} icon={<Icon type="reset" className="size-3.5" />}>Reset Template</Button>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-[#e8f5e9] shadow-lg shadow-emerald-900/5">
            <div className="flex items-center justify-between bg-[#075e54] px-4 py-3 text-white"><div className="flex min-w-0 items-center gap-2"><Icon type="whatsapp" className="size-5 shrink-0" /><span className="truncate text-sm font-semibold">{previewEntry ? previewEntry.student.father : "Message Preview"}</span></div><span className="shrink-0 text-[0.62rem] text-white/70">Preview</span></div>
            <div className="p-4"><div className="ml-auto max-w-[92%] break-words rounded-2xl rounded-br-sm bg-[#dcf8c6] p-3 text-xs leading-5 text-slate-700 shadow-sm">{preview || "Your message will appear here."}<div className="mt-1 flex items-center justify-end gap-1 text-[0.58rem] text-slate-400">{timeLabel()}<Icon type="check" className="size-3 text-sky-500" /></div></div></div>
          </section>

          <section className="panel overflow-visible">
            <PanelHead icon="clock" title="Recent Activity" subtitle="Latest reminder batches" />
            <ul className="divide-y divide-slate-100">{log.map((entry) => <li key={entry.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5"><div className="min-w-0"><div className="truncate text-sm font-semibold text-slate-800">{entry.count} reminders · {entry.template}</div><div className="text-xs text-slate-500">{entry.time}</div></div><span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{money(entry.amount)}</span></li>)}</ul>
          </section>
        </div>
      </div>
    </main>

    <Popup
      open={confirmOpen}
      onClose={() => !sending && setConfirmOpen(false)}
      title="Send WhatsApp Reminders"
      description="Confirm the recipients and total pending amount."
      footer={<><Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={sending}>Cancel</Button><Button variant="success" onClick={sendReminders} isLoading={sending} loadingText="Sending reminders..." icon={<Icon type="send" className="size-4" />}>Send Reminders</Button></>}
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4"><div className="flex items-center gap-3 text-emerald-700"><Icon type="whatsapp" /><div><div className="font-display text-lg font-bold">{chosen.length} guardians</div><div className="mt-0.5 text-xs">{money(chosenDue)} combined outstanding fee</div></div></div></div>
        <div><div className="form-label">Recipients</div><div className="max-h-44 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-100">{chosen.map(({ student, due }) => <div key={student.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-xs"><div className="min-w-0"><strong className="block truncate text-slate-800">{student.father}</strong><div className="mt-0.5 truncate text-slate-500">{student.name} · {student.className}</div></div><span className="shrink-0 font-semibold text-red-500">{money(due)}</span></div>)}</div></div>
        <p className="text-xs leading-5 text-slate-500">Messages are queued through WhatsApp and may take a few moments to deliver. Delivery status will be recorded automatically.</p>
      </div>
    </Popup>
  </div>;
}
