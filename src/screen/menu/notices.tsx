import { useMemo, useState } from "react";
import { Button, Dropdown, Input, useToast } from "../../components";
import Header from "../../ui/header";
import Popup from "../../ui/popup";

type NoticePriority = "High" | "Normal";
type NoticeStatus = "Draft" | "Published" | "Scheduled";

type Notice = {
  audience: string;
  author: string;
  body: string;
  expiresOn: string;
  id: number;
  priority: NoticePriority;
  publishedOn: string;
  status: NoticeStatus;
  title: string;
};

const initialNotices: Notice[] = [
  { id: 1, title: "Half Yearly Examination Schedule", body: "The half yearly examinations will begin on 14 October 2026. Students should review the detailed timetable and arrive thirty minutes before each paper.", audience: "Students & Parents", author: "Academic Office", publishedOn: "2026-09-26", expiresOn: "2026-10-22", status: "Published", priority: "High" },
  { id: 2, title: "School Closed on Monday", body: "The school will remain closed on Monday due to scheduled campus maintenance. Regular classes will resume on Tuesday.", audience: "Everyone", author: "Administration", publishedOn: "2026-09-25", expiresOn: "2026-09-30", status: "Published", priority: "High" },
  { id: 3, title: "Parent-Teacher Meeting", body: "The monthly parent-teacher meeting is scheduled for 5 October from 9:00 AM to 1:00 PM. Parents are requested to attend.", audience: "Parents", author: "Principal Office", publishedOn: "2026-09-24", expiresOn: "2026-10-06", status: "Published", priority: "Normal" },
  { id: 4, title: "Teacher Training Workshop", body: "A classroom technology workshop will be conducted in the seminar hall. Department coordinators will share session allocations.", audience: "Staff", author: "HR Department", publishedOn: "2026-10-01", expiresOn: "2026-10-12", status: "Scheduled", priority: "Normal" },
  { id: 5, title: "Annual Sports Day Registration", body: "Registrations for the annual sports day will open next week. Event details and eligibility criteria will follow.", audience: "Students", author: "Sports Department", publishedOn: "", expiresOn: "2026-10-28", status: "Draft", priority: "Normal" },
];

const blankNotice = {
  audience: "Everyone",
  body: "",
  expiresOn: "2026-10-15",
  priority: "Normal" as NoticePriority,
  publishedOn: "2026-09-28",
  status: "Draft" as NoticeStatus,
  title: "",
};

function NoticeIcon({ type }: { type: "notice" | "people" | "calendar" | "draft" | "search" | "alert" }) {
  const paths = {
    notice: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    people: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
    draft: <><path d="M5 3h10l4 4v14H5z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    alert: <><path d="m12 3 10 18H2L12 3Z" /><path d="M12 9v5M12 18h.01" /></>,
  };
  return <svg className="size-5" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{paths[type]}</svg>;
}

function formatDate(value: string) {
  if (!value) return "Not published";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function statusClass(status: NoticeStatus) {
  if (status === "Published") return "status-success";
  if (status === "Scheduled") return "status-info";
  return "status-warning";
}

export default function Notices() {
  const [notices, setNotices] = useState(initialNotices);
  const [query, setQuery] = useState("");
  const [audience, setAudience] = useState("All Audiences");
  const [status, setStatus] = useState("All Status");
  const [priority, setPriority] = useState("All Priority");
  const [loading, setLoading] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(blankNotice);
  const [saving, setSaving] = useState(false);
  const [previewNotice, setPreviewNotice] = useState<Notice | null>(null);
  const [deleteNotice, setDeleteNotice] = useState<Notice | null>(null);
  const { showToast } = useToast();

  const filteredNotices = useMemo(() => notices.filter((notice) => {
    const matchesSearch = `${notice.title} ${notice.body} ${notice.author}`.toLowerCase().includes(query.toLowerCase());
    const matchesAudience = audience === "All Audiences" || notice.audience === audience;
    const matchesStatus = status === "All Status" || notice.status === status;
    const matchesPriority = priority === "All Priority" || notice.priority === priority;
    return matchesSearch && matchesAudience && matchesStatus && matchesPriority;
  }), [audience, notices, priority, query, status]);

  const published = notices.filter((notice) => notice.status === "Published").length;
  const drafts = notices.filter((notice) => notice.status === "Draft").length;
  const scheduled = notices.filter((notice) => notice.status === "Scheduled").length;
  const highPriority = notices.filter((notice) => notice.priority === "High").length;
  const audienceCounts = useMemo(() => Object.entries(notices.reduce<Record<string, number>>((totals, notice) => {
    totals[notice.audience] = (totals[notice.audience] ?? 0) + 1;
    return totals;
  }, {})).sort((first, second) => second[1] - first[1]), [notices]);

  const refreshNotices = async () => {
    setLoading(true);
    await new Promise((resolve) => window.setTimeout(resolve, 650));
    setLoading(false);
    showToast(`${filteredNotices.length} notices match the current filters.`, { title: "Notice board updated", tone: "info" });
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(blankNotice);
    setEditorOpen(true);
  };

  const openEdit = (notice: Notice) => {
    setEditingId(notice.id);
    setForm({ audience: notice.audience, body: notice.body, expiresOn: notice.expiresOn, priority: notice.priority, publishedOn: notice.publishedOn || "2026-09-28", status: notice.status, title: notice.title });
    setEditorOpen(true);
  };

  const saveNotice = async () => {
    if (!form.title.trim() || !form.body.trim() || !form.audience || !form.expiresOn) {
      showToast("Title, message, audience, and expiry date are required.", { title: "Complete required fields", tone: "error" });
      return;
    }
    if (form.body.trim().length < 20) {
      showToast("Add at least 20 characters so the announcement is clear.", { title: "Notice message is too short", tone: "error" });
      return;
    }
    if (form.status !== "Draft" && (!form.publishedOn || form.expiresOn < form.publishedOn)) {
      showToast("Expiry date must be after the publish date.", { title: "Invalid notice dates", tone: "error" });
      return;
    }
    setSaving(true);
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    if (editingId) {
      setNotices((current) => current.map((notice) => notice.id === editingId ? { ...notice, ...form } : notice));
    } else {
      setNotices((current) => [{ id: Date.now(), author: "Super Administrator", ...form }, ...current]);
    }
    setSaving(false);
    setEditorOpen(false);
    showToast(`Notice was ${editingId ? "updated" : form.status === "Published" ? "published" : "saved"} successfully.`, { title: editingId ? "Notice updated" : "Notice created" });
  };

  const togglePublish = (notice: Notice) => {
    const nextStatus: NoticeStatus = notice.status === "Published" ? "Draft" : "Published";
    const updated = { ...notice, status: nextStatus, publishedOn: nextStatus === "Published" ? "2026-09-28" : notice.publishedOn };
    setNotices((current) => current.map((item) => item.id === notice.id ? updated : item));
    setPreviewNotice((current) => current?.id === notice.id ? updated : current);
    showToast(`${notice.title} is now ${nextStatus.toLowerCase()}.`, { title: "Notice status updated", tone: "info" });
  };

  const confirmDelete = () => {
    if (!deleteNotice) return;
    setNotices((current) => current.filter((notice) => notice.id !== deleteNotice.id));
    showToast(`${deleteNotice.title} was removed from the notice board.`, { title: "Notice deleted", tone: "info" });
    setDeleteNotice(null);
  };

  return <div className="min-h-screen dashboard-bg pb-16">
    <Header title="Notices" subtitle="Create, schedule, publish, and manage school-wide communication" />
    <main className="space-y-5 p-4 sm:p-6 xl:p-8">
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "Published", value: String(published), tone: "green", copy: "Visible announcements", icon: "notice" as const, surface: "from-emerald-50 to-white", iconStyle: "bg-emerald-100 text-emerald-600" },
          { label: "Scheduled", value: String(scheduled), tone: "teal", copy: "Upcoming communication", icon: "calendar" as const, surface: "from-cyan-50 to-white", iconStyle: "metric-icon-teal" },
          { label: "Drafts", value: String(drafts), tone: "amber", copy: "Awaiting publication", icon: "draft" as const, surface: "from-amber-50 to-white", iconStyle: "bg-amber-100 text-amber-600" },
          { label: "High Priority", value: String(highPriority), tone: "red", copy: "Important notices", icon: "alert" as const, surface: "from-rose-50 to-white", iconStyle: "bg-rose-100 text-rose-600" },
        ].map((stat) => <article key={stat.label} className={`module-stat module-stat-${stat.tone} bg-gradient-to-br ${stat.surface}`}>
          <div className="flex items-start justify-between gap-3">
            <div><div className="text-xs font-semibold text-slate-600">{stat.label}</div><div className="mt-1 font-display text-2xl font-extrabold text-slate-950">{stat.value}</div></div>
            <span className={`grid size-10 place-items-center rounded-xl shadow-sm ${stat.iconStyle}`}><NoticeIcon type={stat.icon} /></span>
          </div>
          <div className="mt-3 text-xs font-medium text-slate-400">{stat.copy}</div>
        </article>)}
      </section>

      <section className="panel notice-filter-panel">
        <div className="panel-title flex-wrap gap-3"><div className="flex items-center gap-2 text-teal-600"><NoticeIcon type="search" /><div>Notice Explorer</div></div><Button onClick={openCreate} icon={<svg className="size-4" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>}>Create Notice</Button></div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_auto] xl:items-end">
          <Input label="Search Notices" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, message, or author..." />
          <Dropdown label="Audience" value={audience} onChange={(event) => setAudience(event.target.value)} options={["All Audiences", "Everyone", "Students", "Parents", "Students & Parents", "Staff"].map((value) => ({ label: value, value }))} />
          <Dropdown label="Publication Status" value={status} onChange={(event) => setStatus(event.target.value)} options={["All Status", "Published", "Scheduled", "Draft"].map((value) => ({ label: value, value }))} />
          <Dropdown label="Priority" value={priority} onChange={(event) => setPriority(event.target.value)} options={["All Priority", "High", "Normal"].map((value) => ({ label: value, value }))} />
          <Button variant="outline" onClick={refreshNotices} isLoading={loading} loadingText="Refreshing...">Refresh</Button>
        </div>
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[1fr_18rem]">
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3"><div><div className="font-display text-lg font-bold text-slate-950">Announcements</div><p className="mt-1 text-xs text-slate-400">{filteredNotices.length} notices match the selected filters.</p></div></div>
          {filteredNotices.map((notice) => <article key={notice.id} className={`panel notice-card overflow-hidden ${notice.priority === "High" ? "border-l-4 border-l-rose-500 bg-gradient-to-br from-white to-rose-50/70 shadow-lg shadow-rose-500/10" : "notice-card-normal"}`}>
            <div className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className={`grid size-12 shrink-0 place-items-center rounded-2xl shadow-sm ${notice.priority === "High" ? "bg-rose-100 text-rose-600 ring-1 ring-rose-200" : "metric-icon-teal"}`}><NoticeIcon type={notice.priority === "High" ? "alert" : "notice"} /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><div className="font-display text-base font-bold text-slate-950">{notice.title}</div>{notice.priority === "High" && <span className="status-danger">High Priority</span>}<span className={statusClass(notice.status)}>{notice.status}</span></div>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{notice.body}</p>
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400"><span className="flex items-center gap-1.5"><NoticeIcon type="people" />{notice.audience}</span><span className="flex items-center gap-1.5"><NoticeIcon type="calendar" />{notice.status === "Draft" ? "Not published" : formatDate(notice.publishedOn)}</span><span>Expires {formatDate(notice.expiresOn)}</span><span>By {notice.author}</span></div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end"><Button variant="outline" className="min-h-8 px-3 py-1.5" onClick={() => setPreviewNotice(notice)}>Preview</Button><Button variant="outline" className="min-h-8 px-3 py-1.5" onClick={() => openEdit(notice)}>Edit</Button><Button variant="danger" className="min-h-8 px-3 py-1.5 text-xs" onClick={() => setDeleteNotice(notice)}>Delete</Button></div>
              </div>
            </div>
          </article>)}
          {!filteredNotices.length && <div className="panel grid min-h-60 place-items-center text-center"><div><div className="mx-auto grid size-16 place-items-center rounded-2xl bg-slate-100 text-slate-400"><NoticeIcon type="notice" /></div><div className="mt-4 font-display text-sm font-bold text-slate-700">No notices found</div><p className="mt-1 text-xs text-slate-400">Adjust the filters or create a new announcement.</p><Button className="mt-4" onClick={openCreate}>Create Notice</Button></div></div>}
        </section>

        <aside className="space-y-5">
          <section className="panel overflow-hidden">
            <div className="notice-audience-header p-5"><div className="flex items-center gap-2 text-teal-600"><span className="settings-icon grid size-9 place-items-center rounded-xl"><NoticeIcon type="people" /></span><div className="font-display text-sm font-bold text-slate-900">Audience Reach</div></div><p className="mt-2 text-xs leading-5 text-slate-500">Current notices by recipient group.</p></div>
            <div className="space-y-2 p-4 pt-0">{audienceCounts.map(([audienceName, count]) => <div key={audienceName} className="notice-audience-row flex items-center justify-between rounded-xl border px-3 py-3"><span className="text-xs font-semibold text-slate-700">{audienceName}</span><span className="settings-icon grid size-7 place-items-center rounded-lg text-xs font-bold shadow-sm">{count}</span></div>)}</div>
          </section>
          <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5"><div className="flex items-center gap-2 text-blue-700"><NoticeIcon type="calendar" /><div className="font-display text-sm font-bold">Publishing tip</div></div><p className="mt-2 text-xs leading-5 text-blue-700">Use scheduled notices for planned events and expiry dates to keep the board current automatically.</p></section>
        </aside>
      </div>
    </main>

    <Popup
      open={editorOpen}
      onClose={() => !saving && setEditorOpen(false)}
      title={editingId ? "Edit Notice" : "Create Notice"}
      description="Compose an announcement and choose when and where it appears."
      footer={<><Button variant="outline" onClick={() => setEditorOpen(false)} disabled={saving}>Cancel</Button><Button onClick={saveNotice} isLoading={saving} loadingText="Saving notice...">{form.status === "Published" ? "Publish Notice" : form.status === "Scheduled" ? "Schedule Notice" : "Save Draft"}</Button></>}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Input label="Notice Title *" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Clear and concise announcement title" /></div>
        <div className="sm:col-span-2"><Input label="Notice Message *" value={form.body} onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))} placeholder="Write the complete announcement..." hint={`${form.body.length} characters · minimum 20`} /></div>
        <Dropdown label="Audience *" value={form.audience} onChange={(event) => setForm((current) => ({ ...current, audience: event.target.value }))} options={["Everyone", "Students", "Parents", "Students & Parents", "Staff"].map((value) => ({ label: value, value }))} />
        <Dropdown label="Priority" value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as NoticePriority }))} options={[{ label: "Normal Priority", value: "Normal" }, { label: "High Priority", value: "High" }]} />
        <Dropdown label="Publication Status" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as NoticeStatus }))} options={[{ label: "Save as Draft", value: "Draft" }, { label: "Publish Now", value: "Published" }, { label: "Schedule Publication", value: "Scheduled" }]} />
        <Input label={form.status === "Scheduled" ? "Scheduled Date *" : "Publish Date"} type="date" value={form.publishedOn} onChange={(event) => setForm((current) => ({ ...current, publishedOn: event.target.value }))} disabled={form.status === "Draft"} />
        <Input label="Expiry Date *" type="date" value={form.expiresOn} onChange={(event) => setForm((current) => ({ ...current, expiresOn: event.target.value }))} />
      </div>
    </Popup>

    <Popup
      open={Boolean(previewNotice)}
      onClose={() => setPreviewNotice(null)}
      title="Notice Preview"
      description="This is how the announcement will appear to recipients."
      footer={<><Button variant="outline" onClick={() => setPreviewNotice(null)}>Close</Button>{previewNotice && <Button variant={previewNotice.status === "Published" ? "warning" : "primary"} onClick={() => togglePublish(previewNotice)}>{previewNotice.status === "Published" ? "Move to Draft" : "Publish Now"}</Button>}</>}
    >
      {previewNotice && <article className={`overflow-hidden rounded-2xl border ${previewNotice.priority === "High" ? "border-rose-200" : "border-violet-100"}`}><div className={`p-5 text-white ${previewNotice.priority === "High" ? "bg-rose-600" : "bg-slate-950"}`}><div className="flex items-start gap-4"><div className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/15"><NoticeIcon type={previewNotice.priority === "High" ? "alert" : "notice"} /></div><div><div className="font-display text-xl font-bold">{previewNotice.title}</div><div className="mt-2 flex flex-wrap gap-2"><span className="status-neutral">{previewNotice.audience}</span>{previewNotice.priority === "High" && <span className="status-danger">High Priority</span>}</div></div></div></div><div className="p-5"><p className="text-sm leading-6 text-slate-700">{previewNotice.body}</p><div className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-400"><div className="flex flex-wrap justify-between gap-2"><span>Published by {previewNotice.author}</span><span>Valid until {formatDate(previewNotice.expiresOn)}</span></div></div></div></article>}
    </Popup>

    <Popup
      open={Boolean(deleteNotice)}
      onClose={() => setDeleteNotice(null)}
      title="Delete Notice"
      description="This announcement will be permanently removed from the notice board."
      footer={<><Button variant="outline" onClick={() => setDeleteNotice(null)}>Cancel</Button><Button variant="danger" onClick={confirmDelete}>Delete Notice</Button></>}
    >
      {deleteNotice && <div className="rounded-2xl border border-red-100 bg-red-50 p-4"><div className="font-display text-lg font-bold text-red-700">{deleteNotice.title}</div><div className="mt-1 text-xs text-red-600">{deleteNotice.audience} · {deleteNotice.status}</div></div>}
    </Popup>
  </div>;
}
