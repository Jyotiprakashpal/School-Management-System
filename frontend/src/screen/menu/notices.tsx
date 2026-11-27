import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, DatePicker, Dropdown, Input, NoticeSkeleton, useToast } from "../../components";
import Header from "../../ui/header";
import Popup from "../../ui/popup";
import { API_BASE, API_ENDPOINTS } from "../../api/endpoints";
import { del, get, post, put } from "../../api/methods";
import { onNoticeCreated, onNoticeDeleted, onNoticeUpdated, type NoticeRealtime } from "../../api/socket";
import { formatConfiguredDate } from "../../utils/date-format";

type NoticePriority = "High" | "Normal";
type NoticeStatus = "Draft" | "Published" | "Scheduled";

type Notice = {
  audience: string;
  createdBy: string | null;
  body: string;
  expiresOn: string;
  id: number;
  priority: NoticePriority;
  publishedOn: string | null;
  status: NoticeStatus;
  title: string;
};

const blankNotice = {
  audience: "Everyone",
  body: "",
  expiresOn: "2026-10-15",
  priority: "Normal" as NoticePriority,
  publishedOn: currentDateInputValue(),
  status: "Draft" as NoticeStatus,
  title: "",
};

type NoticePage = {
  data: Notice[];
  hasMore: boolean;
  nextCursor: string | null;
};

function currentDateInputValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

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

function formatDate(value: string | null) {
  if (!value) return "Not published";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not set"
    : formatConfiguredDate(date);
}

function dateInputValue(value: string | null) {
  if (!value) return "";
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : value.slice(0, 10);
}

function statusClass(status: NoticeStatus) {
  if (status === "Published") return "status-success";
  if (status === "Scheduled") return "status-info";
  return "status-warning";
}

export default function Notices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [query, setQuery] = useState("");
  const [audience, setAudience] = useState("All Audiences");
  const [status, setStatus] = useState("All Status");
  const [priority, setPriority] = useState("All Priority");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const cursorRef = useRef<string | undefined>(undefined);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(blankNotice);
  const [saving, setSaving] = useState(false);
  const [previewNotice, setPreviewNotice] = useState<Notice | null>(null);
  const [deleteNotice, setDeleteNotice] = useState<Notice | null>(null);
  const { showToast } = useToast();

  const loadNotices = useCallback(async (cursor?: string) => {
    if (cursor) setLoadingMore(true);
    else setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "10" });
      if (cursor) params.set("cursor", cursor);
      const response = await get<NoticePage>(`${API_BASE}${API_ENDPOINTS.NOTICES}?${params.toString()}`, { cache: "no-store" });
      setNotices((current) => {
        if (!cursor) return response.data;
        const known = new Set(current.map((notice) => String(notice.id)));
        return [...current, ...response.data.filter((notice) => !known.has(String(notice.id)))];
      });
      cursorRef.current = response.nextCursor ?? undefined;
      setHasMore(response.hasMore);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to load notices.", { title: "Notices unavailable", tone: "error" });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [showToast]);

  useEffect(() => { void loadNotices(); }, [loadNotices]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || !hasMore) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !loadingMore && cursorRef.current) void loadNotices(cursorRef.current);
    }, { rootMargin: "240px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadNotices]);

  useEffect(() => {
    const removeCreated = onNoticeCreated((notice: NoticeRealtime) => {
      setNotices((current) => current.some((item) => String(item.id) === String(notice.id)) ? current : [notice, ...current]);
    });
    const removeUpdated = onNoticeUpdated((notice: NoticeRealtime) => {
      setNotices((current) => current.map((item) => item.id === notice.id ? notice : item));
      setPreviewNotice((current) => current?.id === notice.id ? notice : current);
    });
    const removeDeleted = onNoticeDeleted(({ id }) => {
      setNotices((current) => current.filter((item) => item.id !== id));
      setPreviewNotice((current) => current?.id === id ? null : current);
      setDeleteNotice((current) => current?.id === id ? null : current);
    });
    return () => { removeCreated(); removeUpdated(); removeDeleted(); };
  }, []);

  const filteredNotices = useMemo(() => notices.filter((notice) => {
    const matchesSearch = `${notice.title} ${notice.body} ${notice.createdBy || ""}`.toLowerCase().includes(query.toLowerCase());
    const matchesAudience = audience === "All Audiences" || notice.audience === audience;
    const matchesStatus = status === "All Status" || notice.status === status;
    const matchesPriority = priority === "All Priority" || notice.priority === priority;
    return matchesSearch && matchesAudience && matchesStatus && matchesPriority;
  }), [audience, notices, priority, query, status]);

  const published = notices.filter((notice) => notice.status === "Published").length;
  const drafts = notices.filter((notice) => notice.status === "Draft").length;
  const scheduled = notices.filter((notice) => notice.status === "Scheduled").length;
  const highPriority = notices.filter((notice) => notice.priority === "High").length;
  const hasActiveFilters = Boolean(query || audience !== "All Audiences" || status !== "All Status" || priority !== "All Priority");
  const audienceCounts = useMemo(() => Object.entries(notices.reduce<Record<string, number>>((totals, notice) => {
    totals[notice.audience] = (totals[notice.audience] ?? 0) + 1;
    return totals;
  }, {})).sort((first, second) => second[1] - first[1]), [notices]);

  const refreshNotices = async () => {
    cursorRef.current = undefined;
    await loadNotices();
    showToast("Notice board refreshed.", { title: "Notice board updated", tone: "info" });
  };

  const clearFilters = () => {
    setQuery("");
    setAudience("All Audiences");
    setStatus("All Status");
    setPriority("All Priority");
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(blankNotice);
    setEditorOpen(true);
  };

  const openEdit = (notice: Notice) => {
    setEditingId(notice.id);
    setForm({ audience: notice.audience, body: notice.body, expiresOn: dateInputValue(notice.expiresOn), priority: notice.priority, publishedOn: dateInputValue(notice.publishedOn), status: notice.status, title: notice.title });
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
    try {
      const saved = editingId
        ? await put<Notice>(`${API_BASE}${API_ENDPOINTS.NOTICES}/${editingId}`, form)
        : await post<Notice>(`${API_BASE}${API_ENDPOINTS.NOTICES}`, form);
      setNotices((current) => editingId
        ? current.map((notice) => notice.id === editingId ? saved : notice)
        : [saved, ...current.filter((notice) => String(notice.id) !== String(saved.id))]);
      setEditorOpen(false);
      showToast(`Notice was ${editingId ? "updated" : form.status === "Published" ? "published" : "saved"} successfully.`, { title: editingId ? "Notice updated" : "Notice created" });
    } catch (error) { showToast(error instanceof Error ? error.message : "Failed to save notice.", { title: "Notice save failed", tone: "error" }); }
    finally { setSaving(false); }
  };

  const togglePublish = (notice: Notice) => {
    const nextStatus: NoticeStatus = notice.status === "Published" ? "Draft" : "Published";
    const updated = { ...notice, status: nextStatus, publishedOn: nextStatus === "Published" ? currentDateInputValue() : notice.publishedOn };
    void put<Notice>(`${API_BASE}${API_ENDPOINTS.NOTICES}/${notice.id}`, updated)
      .then((saved) => { setNotices((current) => current.map((item) => item.id === saved.id ? saved : item)); setPreviewNotice(saved); showToast(`${notice.title} is now ${nextStatus.toLowerCase()}.`, { title: "Notice status updated", tone: "info" }); })
      .catch((error) => showToast(error instanceof Error ? error.message : "Failed to update notice status.", { title: "Notice update failed", tone: "error" }));
  };

  const confirmDelete = () => {
    if (!deleteNotice) return;
    void del(`${API_BASE}${API_ENDPOINTS.NOTICES}/${deleteNotice.id}`)
      .then(() => { setNotices((current) => current.filter((notice) => notice.id !== deleteNotice.id)); showToast(`${deleteNotice.title} was removed from the notice board.`, { title: "Notice deleted", tone: "info" }); setDeleteNotice(null); })
      .catch((error) => showToast(error instanceof Error ? error.message : "Failed to delete notice.", { title: "Notice deletion failed", tone: "error" }));
  };

  if (loading && notices.length === 0) return <NoticeSkeleton />;

  return <div className="min-h-screen dashboard-bg pb-16">
    <Header title="Notices" subtitle="Create, schedule, publish, and manage school-wide communication" />
    <main className="notices-main mx-auto w-full min-w-0 max-w-none space-y-5 p-3 sm:p-6 xl:p-8">
      <section className="notice-command-hero relative overflow-hidden rounded-3xl p-5 text-white sm:p-7">
        <span className="pointer-events-none absolute -right-16 -top-24 size-64 rounded-full border border-white/10 bg-white/10" />
        <span className="pointer-events-none absolute -bottom-20 right-1/3 size-44 rounded-full bg-white/5" />
        <div className="relative grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-white/80"><NoticeIcon type="notice" />Communication center</div>
            <div className="mt-4 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Keep your school community informed.</div>
            <p className="mt-2 max-w-xl text-xs leading-5 text-white/70 sm:text-sm sm:leading-6">Create timely announcements, target the right audience, and manage every message from one focused workspace.</p>
            <div className="mt-4 flex flex-wrap gap-2 text-[0.68rem] font-semibold text-white/75">
              <span className="rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/10">{published} live now</span>
              <span className="rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/10">{scheduled} scheduled</span>
              <span className="rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/10">{notices.length} total notices</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
            <Button className="!min-h-11 w-full !bg-white !text-(--app-accent-dark) shadow-xl hover:!bg-white/90 sm:w-auto" onClick={openCreate} icon={<svg className="size-4" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>}>Create New Notice</Button>
            <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-xs text-white/70"><span className="size-2 rounded-full bg-emerald-300 shadow-[0_0_0_4px_rgb(110_231_183_/_0.12)]" />Board is up to date</div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "Published", value: String(published), tone: "green", copy: "Visible announcements", icon: "notice" as const, surface: "from-emerald-50 to-white", iconStyle: "bg-emerald-100 text-emerald-600" },
          { label: "Scheduled", value: String(scheduled), tone: "teal", copy: "Upcoming communication", icon: "calendar" as const, surface: "from-cyan-50 to-white", iconStyle: "metric-icon-teal" },
          { label: "Drafts", value: String(drafts), tone: "amber", copy: "Awaiting publication", icon: "draft" as const, surface: "from-amber-50 to-white", iconStyle: "bg-amber-100 text-amber-600" },
          { label: "High Priority", value: String(highPriority), tone: "red", copy: "Important notices", icon: "alert" as const, surface: "from-rose-50 to-white", iconStyle: "bg-rose-100 text-rose-600" },
        ].map((stat) => <article key={stat.label} className={`notice-stat-card module-stat-${stat.tone} relative overflow-hidden rounded-2xl border bg-gradient-to-br p-3.5 shadow-sm sm:p-5 ${stat.surface}`}>
          <span className="absolute -right-7 -top-8 size-20 rounded-full bg-white/60" />
          <div className="relative flex items-start justify-between gap-3">
            <div><div className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-500 sm:text-xs sm:normal-case sm:tracking-normal">{stat.label}</div><div className="mt-1 font-display text-2xl font-extrabold text-slate-950 sm:text-3xl">{stat.value}</div></div>
            <span className={`grid size-10 place-items-center rounded-xl shadow-sm ${stat.iconStyle}`}><NoticeIcon type={stat.icon} /></span>
          </div>
          <div className="relative mt-2 text-[0.65rem] font-medium leading-4 text-slate-400 sm:mt-3 sm:text-xs">{stat.copy}</div>
        </article>)}
      </section>

      <section className="panel notice-filter-panel">
        <div className="panel-title flex-wrap gap-3"><div className="flex items-center gap-3"><span className="settings-icon grid size-9 place-items-center rounded-xl"><NoticeIcon type="search" /></span><div><div className="font-display text-sm font-bold text-slate-900">Notice Explorer</div><div className="mt-0.5 text-xs text-slate-400">{filteredNotices.length} results found</div></div></div>{hasActiveFilters && <Button variant="outline" className="!min-h-8 !px-3 !py-1.5 text-xs shadow-none" onClick={clearFilters}>Clear filters</Button>}</div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:gap-4 sm:p-5 xl:grid-cols-[1.4fr_1fr_1fr_1fr_auto] xl:items-end">
          <Input label="Search Notices" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, message, or creator..." startIcon={<NoticeIcon type="search" />} />
          <Dropdown label="Audience" value={audience} onChange={(event) => setAudience(event.target.value)} options={["All Audiences", "Everyone", "Students", "Parents", "Students & Parents", "Staff"].map((value) => ({ label: value, value }))} />
          <Dropdown label="Publication Status" value={status} onChange={(event) => setStatus(event.target.value)} options={["All Status", "Published", "Scheduled", "Draft"].map((value) => ({ label: value, value }))} />
          <Dropdown label="Priority" value={priority} onChange={(event) => setPriority(event.target.value)} options={["All Priority", "High", "Normal"].map((value) => ({ label: value, value }))} />
          <Button variant="outline" className="w-full sm:col-span-2 xl:col-span-1 xl:w-auto" onClick={refreshNotices} isLoading={loading} loadingText="Refreshing...">Refresh Board</Button>
        </div>
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[1fr_18rem]">
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3"><div><div className="font-display text-lg font-bold text-slate-950">Announcements</div><p className="mt-1 text-xs text-slate-400">Review, preview, and manage communication.</p></div><span className="notice-shown-count rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 shadow-sm ring-1 ring-slate-200">{filteredNotices.length} shown</span></div>
          {filteredNotices.map((notice) => <article key={notice.id} className={`notice-card group relative overflow-hidden rounded-2xl border bg-white ${notice.priority === "High" ? "notice-card-high" : "notice-card-normal"}`}>
            <span className={`absolute inset-x-0 top-0 h-1 ${notice.priority === "High" ? "bg-gradient-to-r from-rose-500 to-orange-400" : "notice-card-accent"}`} />
            <div className="p-4 sm:p-5">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className={`grid size-11 shrink-0 place-items-center rounded-2xl shadow-sm sm:size-12 ${notice.priority === "High" ? "bg-rose-100 text-rose-600 ring-1 ring-rose-200" : "metric-icon-teal"}`}><NoticeIcon type={notice.priority === "High" ? "alert" : "notice"} /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><div className="font-display text-sm font-bold leading-5 text-slate-950 sm:text-base">{notice.title}</div>{notice.priority === "High" && <span className="status-danger">High Priority</span>}<span className={statusClass(notice.status)}>{notice.status}</span></div>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{notice.body}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
                <div className="notice-meta-tile"><span><NoticeIcon type="people" /></span><div><div>Audience</div><strong>{notice.audience}</strong></div></div>
                <div className="notice-meta-tile"><span><NoticeIcon type="calendar" /></span><div><div>Published</div><strong>{notice.status === "Draft" ? "Not published" : formatDate(notice.publishedOn)}</strong></div></div>
                <div className="notice-meta-tile"><span><NoticeIcon type="calendar" /></span><div><div>Expires</div><strong>{formatDate(notice.expiresOn)}</strong></div></div>
                <div className="notice-meta-tile"><span><NoticeIcon type="draft" /></span><div><div>Created by</div><strong>{notice.createdBy || "—"}</strong></div></div>
              </div>
            </div>
            <div className="notice-card-footer grid grid-cols-3 gap-2 border-t border-slate-100 bg-slate-50/70 p-3">
              <Button className="min-w-0 !px-2" onClick={() => setPreviewNotice(notice)}>Preview</Button>
              <Button variant="outline" className="min-w-0 !px-2" onClick={() => openEdit(notice)}>Edit</Button>
              <Button variant="danger" className="min-w-0 !px-2 text-xs" onClick={() => setDeleteNotice(notice)}>Delete</Button>
            </div>
          </article>)}
          {!filteredNotices.length && <div className="panel grid min-h-60 place-items-center text-center"><div><div className="mx-auto grid size-16 place-items-center rounded-2xl bg-slate-100 text-slate-400"><NoticeIcon type="notice" /></div><div className="mt-4 font-display text-sm font-bold text-slate-700">No notices found</div><p className="mt-1 text-xs text-slate-400">Adjust the filters or create a new announcement.</p><Button className="mt-4" onClick={openCreate}>Create Notice</Button></div></div>}
          {hasMore && <div ref={loadMoreRef} className="p-4 text-center text-xs text-slate-400">{loadingMore ? "Loading more notices..." : "Scroll to load more"}</div>}
        </section>

        <aside className="space-y-5 xl:sticky xl:top-28">
          <section className="notice-audience-panel panel overflow-hidden">
            <div className="notice-audience-header p-5"><div className="flex items-center gap-2 text-teal-600"><span className="settings-icon grid size-9 place-items-center rounded-xl"><NoticeIcon type="people" /></span><div className="font-display text-sm font-bold text-slate-900">Audience Reach</div></div><p className="mt-2 text-xs leading-5 text-slate-500">Current notices by recipient group.</p></div>
            <div className="space-y-2 p-4 pt-0">{audienceCounts.map(([audienceName, count]) => <div key={audienceName} className="notice-audience-row flex items-center justify-between rounded-xl border px-3 py-3"><span className="text-xs font-semibold text-slate-700">{audienceName}</span><span className="settings-icon grid size-7 place-items-center rounded-lg text-xs font-bold shadow-sm">{count}</span></div>)}</div>
          </section>
          <section className="notice-publishing-tip rounded-2xl border border-blue-100 bg-blue-50 p-5"><div className="flex items-center gap-2 text-blue-700"><NoticeIcon type="calendar" /><div className="font-display text-sm font-bold">Publishing tip</div></div><p className="mt-2 text-xs leading-5 text-blue-700">Use scheduled notices for planned events and expiry dates to keep the board current automatically.</p></section>
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
        <DatePicker label={form.status === "Scheduled" ? "Scheduled Date" : "Publish Date"} required={form.status !== "Draft"} value={form.publishedOn || ""} onChange={(value) => setForm((current) => ({ ...current, publishedOn: value }))} />
        <DatePicker label="Expiry Date" required value={form.expiresOn} onChange={(value) => setForm((current) => ({ ...current, expiresOn: value }))} />
      </div>
    </Popup>

    <Popup
      open={Boolean(previewNotice)}
      onClose={() => setPreviewNotice(null)}
      title="Notice Preview"
      description="This is how the announcement will appear to recipients."
      footer={
        <>
          <Button variant="outline" onClick={() => setPreviewNotice(null)}>Close</Button>
          {previewNotice && (
            <Button
              variant={previewNotice.status === "Published" ? "warning" : "primary"}
              onClick={() => togglePublish(previewNotice)}
            >
              {previewNotice.status === "Published" ? "Move to Draft" : "Publish Now"}
            </Button>
          )}
        </>
      }
    >
      {previewNotice && (
        <article className={`notice-preview-card overflow-hidden rounded-2xl border ${previewNotice.priority === "High" ? "border-rose-200" : "border-violet-100"}`}>
          <div className={`p-5 text-white ${previewNotice.priority === "High" ? "bg-rose-600" : "bg-slate-950"}`}>
            <div className="flex items-start gap-4">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/15">
                <NoticeIcon type={previewNotice.priority === "High" ? "alert" : "notice"} />
              </div>
              <div>
                <div className="font-display text-xl font-bold">{previewNotice.title}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="status-neutral">{previewNotice.audience}</span>
                  {previewNotice.priority === "High" && <span className="status-danger">High Priority</span>}
                </div>
              </div>
            </div>
          </div>
          <div className="notice-preview-body p-5">
            <p className="text-sm leading-6 text-slate-700">{previewNotice.body}</p>
            <div className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-400">
              <div className="flex flex-wrap justify-between gap-2">
                <span>Created by {previewNotice.createdBy || "—"}</span>
                <span>Valid until {formatDate(previewNotice.expiresOn)}</span>
              </div>
            </div>
          </div>
        </article>
      )}
    </Popup>

    <Popup
      open={Boolean(deleteNotice)}
      onClose={() => setDeleteNotice(null)}
      title="Delete Notice"
      description="This announcement will be permanently removed from the notice board."
      footer={<><Button variant="outline" onClick={() => setDeleteNotice(null)}>Cancel</Button><Button variant="danger" onClick={confirmDelete}>Delete Notice</Button></>}
    >
      {deleteNotice && <div className="notice-delete-card rounded-2xl border border-red-100 bg-red-50 p-4"><div className="font-display text-lg font-bold text-red-700">{deleteNotice.title}</div><div className="mt-1 text-xs text-red-600">{deleteNotice.audience} · {deleteNotice.status}</div></div>}
    </Popup>
  </div>;
}
