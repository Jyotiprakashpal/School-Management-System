import { useState, type ReactNode } from "react";
import { Button, Input, useToast } from "../../components";
import Header from "../../ui/header";
import Popup from "../../ui/popup";

type AcademicSession = {
  current: boolean;
  endDate: string;
  id: number;
  name: string;
  startDate: string;
};

type SessionIconName = "calendar" | "edit" | "plus" | "star" | "trash";

const iconPaths: Record<SessionIconName, ReactNode> = {
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
  edit: <><path d="M4 20h4L19 9l-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  star: <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />,
  trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14" /><path d="M10 11v6M14 11v6" /></>,
};

function SessionIcon({ name, className = "size-5" }: { name: SessionIconName; className?: string }) {
  return <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{iconPaths[name]}</svg>;
}

const initialSessions: AcademicSession[] = [
  { id: 1, name: "2027–28", startDate: "2027-04-01", endDate: "2028-03-31", current: true },
  { id: 2, name: "2026–27", startDate: "2026-04-01", endDate: "2027-03-31", current: false },
  { id: 3, name: "2025–26", startDate: "2025-04-01", endDate: "2026-03-31", current: false },
];

const blankForm = { name: "", startDate: "", endDate: "" };

function readableDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function Sessions() {
  const [sessions, setSessions] = useState(initialSessions);
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);
  const [editingSession, setEditingSession] = useState<AcademicSession | null>(null);
  const [editForm, setEditForm] = useState(blankForm);
  const [deletingSession, setDeletingSession] = useState<AcademicSession | null>(null);
  const { showToast } = useToast();

  const currentSession = sessions.find((session) => session.current) ?? sessions[0];

  const validate = (values: typeof blankForm, ignoredId?: number) => {
    if (!values.name.trim() || !values.startDate || !values.endDate) {
      showToast("Session Name, Start Date, and End Date are required.", { title: "Complete required fields", tone: "error" });
      return false;
    }
    if (values.endDate <= values.startDate) {
      showToast("The session end date must be after its start date.", { title: "Invalid session dates", tone: "error" });
      return false;
    }
    if (sessions.some((session) => session.name.toLowerCase() === values.name.trim().toLowerCase() && session.id !== ignoredId)) {
      showToast("A session with this name already exists.", { title: "Duplicate session", tone: "error" });
      return false;
    }
    return true;
  };

  const addSession = async () => {
    if (!validate(form)) return;
    setSaving(true);
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    setSessions((current) => [...current, {
      id: Date.now(),
      name: form.name.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      current: false,
    }]);
    setSaving(false);
    setForm(blankForm);
    showToast(`${form.name} has been added. Set it as current when you are ready to use it.`, { title: "Session created" });
  };

  const openEdit = (session: AcademicSession) => {
    setEditingSession(session);
    setEditForm({ name: session.name, startDate: session.startDate, endDate: session.endDate });
  };

  const updateSession = async () => {
    if (!editingSession || !validate(editForm, editingSession.id)) return;
    setSaving(true);
    await new Promise((resolve) => window.setTimeout(resolve, 600));
    setSessions((current) => current.map((session) => session.id === editingSession.id ? { ...session, ...editForm, name: editForm.name.trim() } : session));
    setSaving(false);
    setEditingSession(null);
    showToast(`${editForm.name} has been updated.`, { title: "Session updated" });
  };

  const setCurrent = (session: AcademicSession) => {
    setSessions((current) => current.map((item) => ({
      ...item,
      current: item.id === session.id,
    })));
    showToast(`${session.name} is now the current academic session.`, { title: "Current session changed" });
  };

  const deleteSession = () => {
    if (!deletingSession || deletingSession.current) return;
    setSessions((current) => current.filter((session) => session.id !== deletingSession.id));
    showToast(`${deletingSession.name} has been deleted.`, { title: "Session deleted", tone: "info" });
    setDeletingSession(null);
  };

  return <div className="min-h-screen dashboard-bg pb-20">
    <Header title="Sessions" subtitle="Manage academic years" />
    <main className="mx-auto max-w-7xl space-y-4 p-3 sm:space-y-5 sm:p-6 xl:p-8">
      <div className="grid gap-4 lg:grid-cols-[minmax(15rem,.65fr)_minmax(0,1.35fr)] lg:items-stretch">
        <section className="session-current-hero relative overflow-hidden rounded-2xl border p-5 text-white sm:p-6">
          <div className="absolute -right-10 -top-12 size-40 rounded-full border border-white/10 bg-white/10" />
          <div className="absolute -bottom-16 -left-12 size-36 rounded-full bg-white/5" />
          <div className="relative flex h-full flex-col">
            <div className="flex items-start justify-between gap-4">
              <span className="grid size-12 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur-sm"><SessionIcon name="calendar" className="size-6" /></span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold ring-1 ring-white/20 backdrop-blur-sm"><span className="size-2 rounded-full bg-white shadow-sm" />In use</span>
            </div>
            <div className="mt-5 text-xs font-bold uppercase tracking-widest text-white/70">Current session</div>
            <div className="mt-1 font-display text-4xl font-extrabold tracking-tight">{currentSession.name}</div>
            <div className="mt-4 rounded-xl bg-slate-950/10 p-3 ring-1 ring-white/15">
              <div className="text-xs font-semibold text-white/65">Academic year dates</div>
              <div className="mt-1 text-sm font-bold">{readableDate(currentSession.startDate)} – {readableDate(currentSession.endDate)}</div>
            </div>
            <p className="mt-auto pt-4 text-xs leading-5 text-white/75">Used for attendance, fees, exams, and reports.</p>
          </div>
        </section>

        <section className="panel">
          <div className="panel-title justify-start gap-3">
            <span className="metric-icon-teal grid size-8 place-items-center rounded-lg"><SessionIcon name="plus" className="size-4" /></span>
            <div><div className="font-display text-sm font-bold text-slate-900">Create session</div><p className="mt-0.5 text-xs text-slate-400">Add a new academic year</p></div>
          </div>
          <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
            <Input id="session-name" label="Session name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="e.g. 2028–29" />
            <Input id="session-start" label="Start date" type="date" value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} />
            <Input id="session-end" label="End date" type="date" value={form.endDate} onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))} />
          </div>
          <div className="flex border-t border-slate-100 bg-slate-50/70 p-4 sm:justify-end sm:px-5">
            <Button className="w-full sm:w-auto" onClick={addSession} isLoading={saving} loadingText="Adding session..." icon={<SessionIcon name="plus" />}>Add Session</Button>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-title">
          <div className="flex items-center gap-3">
            <span className="metric-icon-teal grid size-8 place-items-center rounded-lg"><SessionIcon name="calendar" className="size-4" /></span>
            <div><div className="font-display text-sm font-bold text-slate-900">Academic sessions</div><p className="mt-0.5 text-xs text-slate-400">{sessions.length} total</p></div>
          </div>
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3 sm:p-5">
          {sessions.map((session) => <article key={session.id} className={`relative overflow-hidden rounded-2xl border ${session.current ? "session-list-current" : "border-slate-200 bg-white"}`}>
            <div className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-display text-xl font-extrabold text-slate-900">{session.name}</div>
                  <div className={`mt-1 text-xs ${session.current ? "font-semibold text-teal-600" : "text-slate-400"}`}>{session.current ? "Active academic year" : "Academic year"}</div>
                </div>
                <span className={session.current ? "session-current-badge inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold" : "status-neutral"}>
                  {session.current && <SessionIcon name="star" className="size-3" />}{session.current ? "Current" : "Archived"}
                </span>
              </div>
              <div className={`mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl p-3 ${session.current ? "session-current-dates" : "bg-slate-50"}`}>
                <div><div className="text-xs text-slate-400">Starts</div><div className="mt-1 text-xs font-semibold text-slate-700">{readableDate(session.startDate)}</div></div>
                <span className="h-px w-5 bg-slate-300" />
                <div className="text-right"><div className="text-xs text-slate-400">Ends</div><div className="mt-1 text-xs font-semibold text-slate-700">{readableDate(session.endDate)}</div></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-slate-100 bg-slate-50/60 p-3">
              {!session.current && <Button className="col-span-2 min-h-9 px-3 py-2" onClick={() => setCurrent(session)} icon={<SessionIcon name="star" className="size-3.5" />}>Set as Current</Button>}
              <Button variant="outline" className={`${session.current ? "col-span-2" : ""} !inline-flex min-h-9 items-center justify-center gap-2 px-3 py-2`} onClick={() => openEdit(session)} icon={<SessionIcon name="edit" className="size-3.5 text-teal-600" />}>Edit Session</Button>
              {!session.current && <Button variant="danger" className="!inline-flex min-h-9 items-center justify-center gap-2 px-3 py-2 text-xs" onClick={() => setDeletingSession(session)} icon={<SessionIcon name="trash" className="size-3.5" />}>Delete</Button>}
            </div>
          </article>)}
        </div>
      </section>
    </main>

    <Popup open={Boolean(editingSession)} onClose={() => !saving && setEditingSession(null)} title="Edit Academic Session" description={editingSession?.name} footer={<><Button variant="outline" onClick={() => setEditingSession(null)} disabled={saving}>Cancel</Button><Button onClick={updateSession} isLoading={saving} loadingText="Updating session...">Update Session</Button></>}>
      <div className="space-y-4">
        <Input label="Session Name *" value={editForm.name} onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))} />
        <div className="grid gap-4 sm:grid-cols-2"><Input label="Start Date *" type="date" value={editForm.startDate} onChange={(event) => setEditForm((current) => ({ ...current, startDate: event.target.value }))} /><Input label="End Date *" type="date" value={editForm.endDate} onChange={(event) => setEditForm((current) => ({ ...current, endDate: event.target.value }))} /></div>
        {editingSession?.current && <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-xs leading-5 text-amber-800">You are editing the current session. Date changes affect the active academic year across the application.</div>}
      </div>
    </Popup>

    <Popup open={Boolean(deletingSession)} onClose={() => setDeletingSession(null)} title="Delete Academic Session" description="This action removes the session from session management." footer={<><Button variant="outline" onClick={() => setDeletingSession(null)}>Cancel</Button><Button variant="danger" onClick={deleteSession}>Delete Session</Button></>}>
      {deletingSession && <div className="rounded-2xl border border-red-100 bg-red-50 p-5"><div className="font-display text-lg font-bold text-red-700">{deletingSession.name}</div><p className="mt-2 text-xs leading-5 text-red-600">Historical records linked to this session may no longer be available through session filters.</p></div>}
    </Popup>
  </div>;
}
