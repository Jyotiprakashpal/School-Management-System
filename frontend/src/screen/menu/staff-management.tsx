import { useMemo, useState } from "react";
import { Button, Dropdown, Input, useToast } from "../../components";
import Header from "../../ui/header";
import Popup from "../../ui/popup";

type StaffStatus = "Active" | "On Leave";

type StaffMember = {
  department: string;
  designation: string;
  email: string;
  id: number;
  joiningDate: string;
  name: string;
  phone: string;
  salary: number;
  staffId: string;
  status: StaffStatus;
};

const initialStaff: StaffMember[] = [
  { id: 1, staffId: "EMP-26-1001", name: "Raj Kumar", designation: "Principal", department: "Administration", phone: "9827142339", email: "raj.kumar@pal.edu", salary: 42000, joiningDate: "2022-04-01", status: "Active" },
  { id: 2, staffId: "EMP-26-1002", name: "Priya Sharma", designation: "English Teacher", department: "Academics", phone: "9876543210", email: "priya.sharma@pal.edu", salary: 28500, joiningDate: "2023-07-10", status: "Active" },
  { id: 3, staffId: "EMP-26-1003", name: "Ravi Verma", designation: "Mathematics Teacher", department: "Academics", phone: "9837456120", email: "ravi.verma@pal.edu", salary: 30000, joiningDate: "2021-06-15", status: "Active" },
  { id: 4, staffId: "EMP-26-1004", name: "Neha Singh", designation: "Science Teacher", department: "Academics", phone: "9765432180", email: "neha.singh@pal.edu", salary: 29500, joiningDate: "2024-04-03", status: "On Leave" },
  { id: 5, staffId: "EMP-26-1005", name: "Anjali Gupta", designation: "Accountant", department: "Finance", phone: "9654321870", email: "anjali.gupta@pal.edu", salary: 26500, joiningDate: "2022-09-12", status: "Active" },
  { id: 6, staffId: "EMP-26-1006", name: "Mohan Yadav", designation: "Transport Coordinator", department: "Transport", phone: "9543218760", email: "mohan.yadav@pal.edu", salary: 22000, joiningDate: "2020-02-20", status: "Active" },
];

const blankStaff = {
  department: "",
  designation: "",
  email: "",
  joiningDate: "2026-09-28",
  name: "",
  phone: "",
  salary: "",
  status: "Active" as StaffStatus,
};

function StaffIcon({ type }: { type: "people" | "department" | "salary" | "search" | "profile" }) {
  const paths = {
    people: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>,
    department: <><path d="M3 21h18M5 21V7l7-4 7 4v14" /><path d="M9 10h2M14 10h2M9 14h2M14 14h2M11 21v-4h2v4" /></>,
    salary: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  };
  return <svg className="size-5" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{paths[type]}</svg>;
}

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function formatCurrency(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function progressWidth(value: number, max: number) {
  const ratio = max ? value / max : 0;
  if (ratio >= 0.85) return "w-full";
  if (ratio >= 0.65) return "w-3/4";
  if (ratio >= 0.4) return "w-1/2";
  if (ratio >= 0.2) return "w-1/3";
  return "w-1/4";
}

export default function StaffManagement() {
  const [staff, setStaff] = useState(initialStaff);
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("All Departments");
  const [status, setStatus] = useState("All Status");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(blankStaff);
  const [saving, setSaving] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<StaffMember | null>(null);
  const { showToast } = useToast();

  const filteredStaff = useMemo(() => staff.filter((member) => {
    const matchesSearch = `${member.name} ${member.staffId} ${member.phone} ${member.designation}`.toLowerCase().includes(query.toLowerCase());
    const matchesDepartment = department === "All Departments" || member.department === department;
    const matchesStatus = status === "All Status" || member.status === status;
    return matchesSearch && matchesDepartment && matchesStatus;
  }), [department, query, staff, status]);

  const activeStaff = staff.filter((member) => member.status === "Active").length;
  const monthlyPayroll = staff.filter((member) => member.status === "Active").reduce((sum, member) => sum + member.salary, 0);
  const departmentTotals = useMemo(() => Object.entries(staff.reduce<Record<string, number>>((totals, member) => {
    totals[member.department] = (totals[member.department] ?? 0) + 1;
    return totals;
  }, {})).sort((first, second) => second[1] - first[1]), [staff]);

  const refreshStaff = async () => {
    setLoading(true);
    await new Promise((resolve) => window.setTimeout(resolve, 650));
    setLoading(false);
    showToast(`${filteredStaff.length} staff members match the selected filters.`, { title: "Directory updated", tone: "info" });
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(blankStaff);
    setEditorOpen(true);
  };

  const openEdit = (member: StaffMember) => {
    setEditingId(member.id);
    setForm({ department: member.department, designation: member.designation, email: member.email, joiningDate: member.joiningDate, name: member.name, phone: member.phone, salary: String(member.salary), status: member.status });
    setEditorOpen(true);
  };

  const saveStaff = async () => {
    const salary = Number(form.salary);
    if (!form.name.trim() || !form.designation.trim() || !form.department || !form.phone.trim() || !form.email.trim() || !form.joiningDate || !salary || salary <= 0) {
      showToast("Name, role, department, contact details, joining date, and salary are required.", { title: "Complete required fields", tone: "error" });
      return;
    }
    if (!form.email.includes("@") || form.phone.replace(/\D/g, "").length < 10) {
      showToast("Enter a valid email address and 10-digit phone number.", { title: "Invalid contact details", tone: "error" });
      return;
    }
    setSaving(true);
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    if (editingId) {
      setStaff((current) => current.map((member) => member.id === editingId ? { ...member, ...form, salary } : member));
    } else {
      const staffId = `EMP-26-${String(1001 + staff.length).padStart(4, "0")}`;
      setStaff((current) => [...current, { id: Date.now(), staffId, ...form, salary }]);
    }
    setSaving(false);
    setEditorOpen(false);
    showToast(`${form.name} was ${editingId ? "updated" : "added"} successfully.`, { title: editingId ? "Staff profile updated" : "Staff member added" });
  };

  const updateStatus = (member: StaffMember) => {
    const nextStatus: StaffStatus = member.status === "Active" ? "On Leave" : "Active";
    setStaff((current) => current.map((item) => item.id === member.id ? { ...item, status: nextStatus } : item));
    setSelectedStaff((current) => current?.id === member.id ? { ...current, status: nextStatus } : current);
    showToast(`${member.name} is now marked ${nextStatus.toLowerCase()}.`, { title: "Employment status updated", tone: "info" });
  };

  const confirmDelete = () => {
    if (!deletingStaff) return;
    setStaff((current) => current.filter((member) => member.id !== deletingStaff.id));
    showToast(`${deletingStaff.name} was removed from the staff directory.`, { title: "Staff member removed", tone: "info" });
    setDeletingStaff(null);
  };

  const exportDirectory = async () => {
    setExporting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 800));
    setExporting(false);
    showToast("The filtered staff directory is ready to download.", { title: "Directory exported", tone: "info" });
  };

  return <div className="min-h-screen dashboard-bg pb-16">
    <Header title="Staff Management" subtitle="Manage employees, departments, employment status, and payroll profiles" />
    <main className="space-y-5 p-4 sm:p-6 xl:p-8">
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "Total Staff", value: String(staff.length), tone: "teal", copy: "Across all departments" },
          { label: "Active Staff", value: String(activeStaff), tone: "green", copy: `${staff.length - activeStaff} currently on leave` },
          { label: "Departments", value: String(departmentTotals.length), tone: "amber", copy: "Operational teams" },
          { label: "Monthly Payroll", value: formatCurrency(monthlyPayroll), tone: "teal", copy: "Active employees" },
        ].map((stat) => <article key={stat.label} className={`module-stat module-stat-${stat.tone}`}><div className="text-xs font-medium text-slate-500">{stat.label}</div><div className="mt-1 font-display text-xl font-bold text-slate-950 sm:text-2xl">{stat.value}</div><div className="mt-1 text-xs text-slate-400">{stat.copy}</div></article>)}
      </section>

      <section className="panel">
        <div className="panel-title flex-wrap gap-3"><div className="flex items-center gap-2 text-teal-600"><StaffIcon type="search" /><div>Staff Directory</div></div><Button onClick={openCreate} icon={<svg className="size-4" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>}>Add Staff Member</Button></div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_auto] xl:items-end">
          <Input label="Search Staff" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, employee ID, phone, or role..." />
          <Dropdown label="Department" value={department} onChange={(event) => setDepartment(event.target.value)} options={["All Departments", "Academics", "Administration", "Finance", "Transport"].map((value) => ({ label: value, value }))} />
          <Dropdown label="Employment Status" value={status} onChange={(event) => setStatus(event.target.value)} options={["All Status", "Active", "On Leave"].map((value) => ({ label: value, value }))} />
          <Button variant="outline" onClick={refreshStaff} isLoading={loading} loadingText="Refreshing...">Refresh</Button>
        </div>
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[1fr_18rem]">
        <section className="panel">
          <div className="panel-title flex-wrap gap-3 py-3"><div className="flex items-center gap-2 text-violet-600"><StaffIcon type="people" /><div><div className="font-display font-bold text-slate-900">Team Members</div><div className="mt-0.5 text-xs text-slate-400">{filteredStaff.length} matching profiles</div></div></div><Button variant="outline" className="min-h-9 px-3 py-2" onClick={exportDirectory} isLoading={exporting} loadingText="Exporting...">Export Directory</Button></div>
          <div className="overflow-x-auto"><table className="module-table"><thead><tr><th>Employee</th><th>Role</th><th>Department</th><th>Contact</th><th>Monthly Salary</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead><tbody>{filteredStaff.map((member) => <tr key={member.id}>
            <td data-label="Employee"><div className="flex items-center gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 font-display text-xs font-bold text-white shadow-md shadow-teal-100">{initials(member.name)}</div><div><div className="font-semibold text-slate-900">{member.name}</div><div className="mt-1 text-xs font-semibold text-cyan-600">{member.staffId}</div></div></div></td>
            <td data-label="Role">{member.designation}</td><td data-label="Department"><span className="status-neutral">{member.department}</span></td>
            <td data-label="Contact"><div>{member.phone}</div><div className="mt-1 text-xs text-slate-400">{member.email}</div></td><td data-label="Monthly Salary"><span className="font-display font-bold text-slate-800">{formatCurrency(member.salary)}</span></td><td data-label="Joined">{formatDate(member.joiningDate)}</td>
            <td data-label="Status"><span className={member.status === "Active" ? "status-success" : "status-warning"}>{member.status}</span></td>
            <td data-label="Actions"><div className="flex flex-wrap gap-2"><Button variant="outline" className="min-h-8 px-3 py-1.5" onClick={() => setSelectedStaff(member)}>View</Button><Button variant="outline" className="min-h-8 px-3 py-1.5" onClick={() => openEdit(member)}>Edit</Button><Button variant="danger" className="min-h-8 px-3 py-1.5 text-xs" onClick={() => setDeletingStaff(member)}>Delete</Button></div></td>
          </tr>)}</tbody></table></div>
          {!filteredStaff.length && <div className="grid min-h-60 place-items-center text-center"><div><div className="mx-auto grid size-16 place-items-center rounded-2xl bg-slate-100 text-slate-400"><StaffIcon type="people" /></div><div className="mt-4 font-display text-sm font-bold text-slate-700">No staff profiles found</div><p className="mt-1 text-xs text-slate-400">Adjust the filters or add a staff member.</p><Button className="mt-4" onClick={openCreate}>Add Staff Member</Button></div></div>}
        </section>

        <aside className="space-y-5">
          <section className="panel p-5">
            <div className="flex items-center gap-2 text-teal-600"><StaffIcon type="department" /><div className="font-display text-sm font-bold text-slate-900">Team Distribution</div></div><p className="mt-2 text-xs leading-5 text-slate-400">Employees by department.</p>
            <div className="mt-5 space-y-4">{departmentTotals.map(([departmentName, count]) => <div key={departmentName}><div className="flex justify-between text-xs"><span className="font-semibold text-slate-700">{departmentName}</span><span className="text-slate-500">{count} staff</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`${progressWidth(count, departmentTotals[0]?.[1] ?? 1)} h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-400`} /></div></div>)}</div>
          </section>
          <section className="rounded-2xl border border-violet-100 bg-violet-50 p-5"><div className="flex items-center gap-2 text-violet-700"><StaffIcon type="salary" /><div className="font-display text-sm font-bold">Payroll Snapshot</div></div><div className="mt-3 font-display text-2xl font-bold text-violet-800">{formatCurrency(monthlyPayroll)}</div><p className="mt-2 text-xs leading-5 text-violet-700">Estimated monthly salary commitment for active employees.</p></section>
        </aside>
      </div>
    </main>

    <Popup
      open={editorOpen}
      onClose={() => !saving && setEditorOpen(false)}
      title={editingId ? "Edit Staff Profile" : "Add Staff Member"}
      description="Maintain employment, contact, and payroll details."
      footer={<><Button variant="outline" onClick={() => setEditorOpen(false)} disabled={saving}>Cancel</Button><Button onClick={saveStaff} isLoading={saving} loadingText="Saving profile...">{editingId ? "Update Profile" : "Add Staff Member"}</Button></>}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Full Name *" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Employee full name" />
        <Input label="Designation *" value={form.designation} onChange={(event) => setForm((current) => ({ ...current, designation: event.target.value }))} placeholder="e.g. English Teacher" />
        <Dropdown label="Department *" value={form.department} onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))} placeholder="Select department" options={["Academics", "Administration", "Finance", "Transport"].map((value) => ({ label: value, value }))} />
        <Dropdown label="Employment Status" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as StaffStatus }))} options={[{ label: "Active", value: "Active" }, { label: "On Leave", value: "On Leave" }]} />
        <Input label="Phone Number *" type="tel" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} placeholder="10-digit phone number" />
        <Input label="Email Address *" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="name@school.edu" />
        <Input label="Joining Date *" type="date" value={form.joiningDate} onChange={(event) => setForm((current) => ({ ...current, joiningDate: event.target.value }))} />
        <Input label="Monthly Salary (₹) *" type="number" min="1" value={form.salary} onChange={(event) => setForm((current) => ({ ...current, salary: event.target.value }))} placeholder="0" />
      </div>
    </Popup>

    <Popup
      open={Boolean(selectedStaff)}
      onClose={() => setSelectedStaff(null)}
      title="Staff Profile"
      description="Review employment and payroll information."
      footer={<><Button variant="outline" onClick={() => setSelectedStaff(null)}>Close</Button>{selectedStaff && <Button variant={selectedStaff.status === "Active" ? "warning" : "success"} onClick={() => updateStatus(selectedStaff)}>{selectedStaff.status === "Active" ? "Mark On Leave" : "Mark Active"}</Button>}</>}
    >
      {selectedStaff && <div className="space-y-4">
        <div className="rounded-2xl bg-slate-950 p-5 text-white"><div className="flex items-center gap-4"><div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 font-display text-xl font-bold">{initials(selectedStaff.name)}</div><div className="min-w-0 flex-1"><div className="font-display text-xl font-bold">{selectedStaff.name}</div><div className="mt-1 text-xs text-slate-300">{selectedStaff.designation} · {selectedStaff.department}</div><div className="mt-3"><span className={selectedStaff.status === "Active" ? "status-success" : "status-warning"}>{selectedStaff.status}</span></div></div></div></div>
        <dl className="grid grid-cols-2 gap-3">{[["Employee ID", selectedStaff.staffId], ["Joining Date", formatDate(selectedStaff.joiningDate)], ["Phone", selectedStaff.phone], ["Email", selectedStaff.email], ["Monthly Salary", formatCurrency(selectedStaff.salary)], ["Department", selectedStaff.department]].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-100 p-3"><dt className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</dt><dd className="mt-1 break-words text-sm font-semibold text-slate-800">{value}</dd></div>)}</dl>
      </div>}
    </Popup>

    <Popup
      open={Boolean(deletingStaff)}
      onClose={() => setDeletingStaff(null)}
      title="Remove Staff Member"
      description="This profile will be removed from the active staff directory."
      footer={<><Button variant="outline" onClick={() => setDeletingStaff(null)}>Cancel</Button><Button variant="danger" onClick={confirmDelete}>Remove Profile</Button></>}
    >
      {deletingStaff && <div className="rounded-2xl border border-red-100 bg-red-50 p-4"><div className="font-display text-lg font-bold text-red-700">{deletingStaff.name}</div><div className="mt-1 text-xs text-red-600">{deletingStaff.staffId} · {deletingStaff.designation}</div></div>}
    </Popup>
  </div>;
}
