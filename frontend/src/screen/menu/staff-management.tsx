import { useEffect, useMemo, useState } from "react"
import { del, get, post, put } from "../../api/methods"
import { API_BASE, API_ENDPOINTS } from "../../api/endpoints"
import { getAuthUser } from "../../auth/session"
import { onStaffCreated, onStaffDeleted, onStaffStatusChanged, onStaffUpdated } from "../../api/socket"
import { formatConfiguredDate } from "../../utils/date-format"
import {
  Button,
  DatePicker,
  Dropdown,
  Input,
  StaffManagementSkeleton,
  useToast,
} from "../../components"
import Header from "../../ui/header"
import Popup from "../../ui/popup"

type StaffStatus = "Active" | "On Leave"
type BankAccountType = "Savings" | "Current"
type UserRole = "Superadmin" | "Admin" | "Operator" | "Accountant" | "Student" | "Teacher"

type UserOption = {
  id: number
  userId: string
  name: string
  role: UserRole
  status: "Active" | "Suspended"
}

type StaffMember = {
  userId: string | null
  accountHolderName: string | null
  accountNumber: string | null
  accountType: BankAccountType | null
  bankName: string | null
  branchName: string | null
  ifscCode: string | null
  department: string
  designation: string
  email: string
  id: number
  joiningDate: string
  name: string
  phone: string
  salary: number
  staffId: string
  status: StaffStatus
}

const blankStaff = {
  accountHolderName: "",
  accountNumber: "",
  accountType: "Savings" as BankAccountType,
  bankName: "",
  branchName: "",
  department: "",
  designation: "",
  email: "",
  joiningDate: "2026-09-28",
  name: "",
  phone: "",
  salary: "",
  ifscCode: "",
  status: "Active" as StaffStatus,
}

function StaffIcon({
  type,
}: {
  type: "people" | "department" | "salary" | "search" | "profile" | "calendar" | "download" | "mail" | "phone"
}) {
  const paths = {
    people: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
      </>
    ),
    department: (
      <>
        <path d="M3 21h18M5 21V7l7-4 7 4v14" />
        <path d="M9 10h2M14 10h2M9 14h2M14 14h2M11 21v-4h2v4" />
      </>
    ),
    salary: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18M7 15h4" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    profile: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v13M7 11l5 5 5-5M4 21h16" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    phone: (
      <path d="M6 3h4l1 5-2.5 1.5a15 15 0 0 0 6 6L16 13l5 1v4a3 3 0 0 1-3 3C9.7 20.5 3.5 14.3 3 6a3 3 0 0 1 3-3Z" />
    ),
  }
  return (
    <svg
      className="size-5"
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[type]}
    </svg>
  )
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function formatCurrency(value: number) {
  return `₹${value.toLocaleString("en-IN")}`
}

function formatDate(value: string) {
  return formatConfiguredDate(value)
}

function csvCell(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`
}

function progressWidth(value: number, max: number) {
  const ratio = max ? value / max : 0
  if (ratio >= 0.85) return "w-full"
  if (ratio >= 0.65) return "w-3/4"
  if (ratio >= 0.4) return "w-1/2"
  if (ratio >= 0.2) return "w-1/3"
  return "w-1/4"
}

type StaffListResponse = {
  data: StaffMember[]
  total: number
  page: number
  limit: number
  totalPages: number
}

function normalizeStaff(member: StaffMember): StaffMember {
  return {
    ...member,
    joiningDate: String(member.joiningDate).slice(0, 10),
    salary: Number(member.salary),
  }
}

export default function StaffManagement() {
  const [initialLoading, setInitialLoading] = useState(true)
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [query, setQuery] = useState("")
  const [department, setDepartment] = useState("All Departments")
  const [status, setStatus] = useState("All Status")
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(blankStaff)
  const [saving, setSaving] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [deletingStaff, setDeletingStaff] = useState<StaffMember | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    let active = true
    void get<StaffListResponse>(`${API_BASE}${API_ENDPOINTS.STAFF}?limit=100`)
      .then((response) => {
        if (active) setStaff(response.data.map(normalizeStaff))
      })
      .catch((error) => {
        if (active) {
          showToast(error instanceof Error ? error.message : "Failed to load staff profiles.", {
            title: "Staff unavailable",
            tone: "error",
          })
        }
      })
      .finally(() => {
        if (active) setInitialLoading(false)
      })

    return () => {
      active = false
    }
  }, [showToast])

  useEffect(() => {
    const removeCreated = onStaffCreated((staffMember) => {
      const staff = normalizeStaff(staffMember as StaffMember)
      setStaff((current) => current.some((item) => item.id === staff.id) ? current : [staff, ...current])
    })
    const removeUpdated = onStaffUpdated((staffMember) => {
      const staff = normalizeStaff(staffMember as StaffMember)
      setStaff((current) => current.map((item) => item.id === staff.id ? staff : item))
      setSelectedStaff((current) => current?.id === staff.id ? staff : current)
    })
    const removeStatusChanged = onStaffStatusChanged((staffMember) => {
      const staff = normalizeStaff(staffMember as StaffMember)
      setStaff((current) => current.map((item) => item.id === staff.id ? staff : item))
      setSelectedStaff((current) => current?.id === staff.id ? staff : current)
    })
    const removeDeleted = onStaffDeleted(({ id }) => {
      setStaff((current) => current.filter((item) => item.id !== id))
      setSelectedStaff((current) => current?.id === id ? null : current)
    })
    return () => { removeCreated(); removeUpdated(); removeStatusChanged(); removeDeleted() }
  }, [])

  useEffect(() => {
    let active = true
    void get<{ data: Array<{ departmentId: string; departmentName: string }> }>(`${API_BASE}${API_ENDPOINTS.DEPARTMENTS}?limit=100`, { cache: "no-store" })
      .then((response) => {
        if (active) setDepartments(response.data.map((department) => department.departmentName))
      })
      .catch((error) => {
        if (active) {
          showToast(error instanceof Error ? error.message : "Failed to load departments.", {
            title: "Departments unavailable",
            tone: "error",
          })
        }
      })

    return () => {
      active = false
    }
  }, [showToast])

  useEffect(() => {
    let active = true
    void get<{ data: UserOption[] }>(`${API_BASE}${API_ENDPOINTS.USER}?limit=100`, { cache: "no-store" })
      .then((response) => {
        if (active) setUsers(response.data.filter((user) => user.role !== "Student"))
      })
      .catch((error) => {
        if (active) {
          showToast(error instanceof Error ? error.message : "Failed to load users.", {
            title: "Users unavailable",
            tone: "error",
          })
        }
      })

    return () => {
      active = false
    }
  }, [showToast])

  const filteredStaff = useMemo(
    () =>
      staff.filter((member) => {
        const matchesSearch =
          `${member.name} ${member.staffId} ${member.phone} ${member.designation}`
            .toLowerCase()
            .includes(query.toLowerCase())
        const matchesDepartment =
          department === "All Departments" || member.department === department
        const matchesStatus =
          status === "All Status" || member.status === status
        return matchesSearch && matchesDepartment && matchesStatus
      }),
    [department, query, staff, status],
  )

  const activeStaff = staff.filter(
    (member) => member.status === "Active",
  ).length
  const monthlyPayroll = staff
    .filter((member) => member.status === "Active")
    .reduce((sum, member) => sum + member.salary, 0)
  const departmentTotals = useMemo(
    () =>
      Object.entries(
        staff.reduce<Record<string, number>>((totals, member) => {
          totals[member.department] = (totals[member.department] ?? 0) + 1
          return totals
        }, {}),
      ).sort((first, second) => second[1] - first[1]),
    [staff],
  )

  if (initialLoading) return <StaffManagementSkeleton />

  const refreshStaff = async () => {
    setLoading(true)
    try {
      const response = await get<StaffListResponse>(`${API_BASE}${API_ENDPOINTS.STAFF}?limit=100`)
      setStaff(response.data.map(normalizeStaff))
      showToast(`${response.data.length} staff profiles loaded from the database.`, {
        title: "Directory updated",
        tone: "info",
      })
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to refresh staff profiles.", {
        title: "Refresh failed",
        tone: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(blankStaff)
    setEditorOpen(true)
  }

  const openEdit = (member: StaffMember) => {
    setEditingId(member.id)
    setForm({
      accountHolderName: member.accountHolderName || "",
      accountNumber: member.accountNumber || "",
      accountType: member.accountType || "Savings",
      bankName: member.bankName || "",
      branchName: member.branchName || "",
      department: member.department,
      designation: member.designation,
      email: member.email,
      joiningDate: member.joiningDate,
      name: member.name,
      phone: member.phone,
      salary: String(member.salary),
      status: member.status,
      ifscCode: member.ifscCode || "",
    })
    setEditorOpen(true)
  }

  const saveStaff = async () => {
    const salary = Number(form.salary)
    if (
      !form.name.trim() ||
      !form.designation.trim() ||
      !form.department ||
      !form.phone.trim() ||
      !form.email.trim() ||
      !form.joiningDate ||
      !form.accountHolderName.trim() ||
      !form.accountNumber.trim() ||
      !form.accountType ||
      !form.bankName.trim() ||
      !form.branchName.trim() ||
      !form.ifscCode.trim() ||
      !salary ||
      salary <= 0
    ) {
      showToast(
        "Name, role, department, contact details, joining date, and salary are required.",
        { title: "Complete required fields", tone: "error" },
      )
      return
    }
    if (
      !form.email.includes("@") ||
      form.phone.replace(/\D/g, "").length < 10
    ) {
      showToast("Enter a valid email address and 10-digit phone number.", {
        title: "Invalid contact details",
        tone: "error",
      })
      return
    }
    const accountNumber = form.accountNumber.replace(/\D/g, "")
    const ifscCode = form.ifscCode.trim().toUpperCase()
    if (accountNumber.length < 9 || accountNumber.length > 18 || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
      showToast("Enter a valid 9-18 digit account number and 11-character IFSC code.", { title: "Invalid bank details", tone: "error" })
      return
    }
    if (!editingId && staff.some((member) => member.name.toLowerCase() === form.name.trim().toLowerCase())) {
      showToast("This user already has a staff profile and cannot be added again.", {
        title: "Staff profile already exists",
        tone: "error",
      })
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        designation: form.designation.trim(),
        department: form.department,
        phone: form.phone.trim(),
        email: form.email.trim(),
        salary,
        joiningDate: form.joiningDate,
        status: form.status,
        accountHolderName: form.accountHolderName.trim(),
        accountNumber,
        accountType: form.accountType,
        bankName: form.bankName.trim(),
        branchName: form.branchName.trim(),
        ifscCode,
      }

      if (editingId) {
        const updated = await put<StaffMember>(`${API_BASE}${API_ENDPOINTS.STAFF}/${editingId}`, payload)
        const normalized = normalizeStaff(updated)
        setStaff((current) => current.map((member) => member.id === editingId ? normalized : member))
        setSelectedStaff((current) => current?.id === editingId ? normalized : current)
        showToast(`${form.name} was updated successfully.`, { title: "Staff profile updated" })
      } else {
        const selectedUser = users.find((user) => `${user.name} (${user.role})` === form.name)
        const created = await post<StaffMember>(`${API_BASE}${API_ENDPOINTS.STAFF}`, {
          ...payload,
          ...(selectedUser ? { userId: selectedUser.userId } : {}),
          ...(selectedUser ? { staffId: `EMP-${selectedUser.id}` } : {}),
          createdBy: getAuthUser()?.username,
        })
        setStaff((current) => [normalizeStaff(created), ...current])
        showToast(`${form.name} was added successfully.`, { title: "Staff member added" })
      }
      setEditorOpen(false)
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to save staff profile.", {
        title: "Staff save failed",
        tone: "error",
      })
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = (member: StaffMember) => {
    const nextStatus: StaffStatus =
      member.status === "Active" ? "On Leave" : "Active"
    setStaff((current) =>
      current.map((item) =>
        item.id === member.id ? { ...item, status: nextStatus } : item,
      ),
    )
    setSelectedStaff((current) =>
      current?.id === member.id ? { ...current, status: nextStatus } : current,
    )
    showToast(`${member.name} is now marked ${nextStatus.toLowerCase()}.`, {
      title: "Employment status updated",
      tone: "info",
    })
  }

  const confirmDelete = async () => {
    if (!deletingStaff) return
    setDeleting(true)
    try {
      await del<{ message: string }>(`${API_BASE}${API_ENDPOINTS.STAFF}/${deletingStaff.id}`)
      setStaff((current) => current.filter((member) => member.id !== deletingStaff.id))
      setSelectedStaff((current) => current?.id === deletingStaff.id ? null : current)
      showToast(`${deletingStaff.name} was removed from the staff directory.`, {
        title: "Staff member removed",
        tone: "info",
      })
      setDeletingStaff(null)
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to delete staff profile.", {
        title: "Delete failed",
        tone: "error",
      })
    } finally {
      setDeleting(false)
    }
  }

  const exportDirectory = async () => {
    setExporting(true)
    await new Promise((resolve) => window.setTimeout(resolve, 350))
    const rows: Array<Array<string | number>> = [
      ["PAL IT HUB — Staff Directory"],
      ["Department Filter", department],
      ["Employment Status Filter", status],
      ["Exported Records", filteredStaff.length],
      [],
      [
        "Employee ID",
        "Full Name",
        "Designation",
        "Department",
        "Phone",
        "Email",
        "Monthly Salary",
        "Joining Date",
        "Employment Status",
      ],
      ...filteredStaff.map((member) => [
        member.staffId,
        member.name,
        member.designation,
        member.department,
        member.phone,
        member.email,
        member.salary,
        member.joiningDate,
        member.status,
      ]),
      [],
      [
        "Filtered Monthly Payroll",
        "",
        "",
        "",
        "",
        "",
        filteredStaff
          .filter((member) => member.status === "Active")
          .reduce((sum, member) => sum + member.salary, 0),
        "",
        "",
      ],
    ]
    const content = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/csv;charset=utf-8" }),
    )
    const link = document.createElement("a")
    link.href = url
    link.download =
      `staff-directory-${department}-${status}`
        .replace(/\s+/g, "-")
        .toLowerCase() + ".csv"
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    setExporting(false)
    showToast(`${filteredStaff.length} staff profiles were downloaded.`, {
      title: "Directory exported",
    })
  }

  return (
    <div className="min-h-screen dashboard-bg pb-16">
      <Header
        title="Staff Management"
        subtitle="Manage employees, departments, employment status, and payroll profiles"
      />
      <main className="staff-management-main mx-auto w-full min-w-0 max-w-none space-y-5 p-3 sm:p-6 xl:p-8">
        <section className="staff-management-hero relative overflow-hidden rounded-3xl p-5 text-white sm:p-7">
          <span className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full border border-white/10 bg-white/10" />
          <span className="pointer-events-none absolute -bottom-28 left-1/3 size-60 rounded-full bg-white/5" />
          <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-white/80">
                <StaffIcon type="people" />
                People operations
              </div>
              <div className="mt-4 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                Build and support your school team.
              </div>
              <p className="mt-2 max-w-xl text-xs leading-5 text-white/70 sm:text-sm sm:leading-6">
                Maintain staff profiles, employment details, contact
                information, and payroll commitments from one focused directory.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-[0.68rem] font-semibold text-white/75">
                <span className="rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/10">
                  {staff.length} team members
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/10">
                  {activeStaff} active
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/10">
                  {departmentTotals.length} departments
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/5 p-1.5 sm:flex sm:border-0 sm:bg-transparent sm:p-0 lg:flex-col">
              <Button
                className="w-full !min-h-10 !bg-white !px-3 !text-(--app-accent-dark) shadow-xl hover:!bg-white/90 sm:w-auto"
                onClick={openCreate}
                icon={
                  <svg
                    className="size-4"
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                }
              >
                <span className="sm:hidden">Add Staff</span>
                <span className="hidden sm:inline">Add Staff Member</span>
              </Button>
              <Button
                variant="outline"
                className="w-full !min-h-10 !border-white/15 !bg-white/10 !px-3 text-white !shadow-none hover:!bg-white/20 sm:w-auto"
                onClick={exportDirectory}
                isLoading={exporting}
                loadingText="Exporting..."
                icon={<StaffIcon type="download" />}
              >
                <span className="sm:hidden">Export</span>
                <span className="hidden sm:inline">Export Directory</span>
              </Button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[
            {
              label: "Total Staff",
              value: String(staff.length),
              tone: "teal",
              copy: "Across all departments",
              icon: "people" as const,
              iconStyle: "metric-icon-teal",
            },
            {
              label: "Active Staff",
              value: String(activeStaff),
              tone: "green",
              copy: `${staff.length - activeStaff} currently on leave`,
              icon: "profile" as const,
              iconStyle: "bg-emerald-100 text-emerald-600",
            },
            {
              label: "Departments",
              value: String(departmentTotals.length),
              tone: "amber",
              copy: "Operational teams",
              icon: "department" as const,
              iconStyle: "bg-amber-100 text-amber-600",
            },
            {
              label: "Monthly Payroll",
              value: formatCurrency(monthlyPayroll),
              tone: "teal",
              copy: "Active employees",
              icon: "salary" as const,
              iconStyle: "bg-violet-100 text-violet-600",
            },
          ].map((stat) => (
            <article
              key={stat.label}
              className={`staff-management-stat module-stat-${stat.tone} relative overflow-hidden rounded-2xl border bg-white p-3.5 shadow-sm sm:p-5`}
            >
              <span className="absolute -right-8 -top-9 size-24 rounded-full bg-slate-50" />
              <div className="relative flex items-start justify-between gap-2">
                <div>
                  <div className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-500 sm:text-xs sm:normal-case sm:tracking-normal">
                    {stat.label}
                  </div>
                  <div className="mt-1 font-display text-xl font-extrabold text-slate-950 sm:text-2xl">
                    {stat.value}
                  </div>
                </div>
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-xl shadow-sm sm:size-10 ${stat.iconStyle}`}
                >
                  <StaffIcon type={stat.icon} />
                </span>
              </div>
              <div className="relative mt-2 text-[0.65rem] text-slate-400 sm:text-xs">
                {stat.copy}
              </div>
            </article>
          ))}
        </section>

        <section className="panel staff-directory-filters">
          <div className="panel-title flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="settings-icon grid size-9 place-items-center rounded-xl">
                <StaffIcon type="search" />
              </span>
              <div>
                <div className="font-display text-sm font-bold text-slate-900">
                  Directory Filters
                </div>
                <div className="mt-0.5 text-xs text-slate-400">
                  {filteredStaff.length} profiles match your view
                </div>
              </div>
            </div>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-end sm:gap-3 sm:p-5 lg:gap-4 xl:grid-cols-[1.4fr_1fr_1fr_auto]">
            <Input
              label="Search Staff"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name, employee ID, phone, or role..."
              startIcon={<StaffIcon type="search" />}
            />
            <Dropdown
              label="Department"
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              options={["All Departments", ...departments].map((value) => ({
                label: value,
                value,
              }))}
            />
            <Dropdown
              label="Employment Status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              options={["All Status", "Active", "On Leave"].map((value) => ({
                label: value,
                value,
              }))}
            />
            <Button
              className="w-full whitespace-nowrap sm:w-auto sm:px-3 lg:px-4"
              onClick={refreshStaff}
              isLoading={loading}
              loadingText="Refreshing..."
            >
              Refresh Directory
            </Button>
          </div>
        </section>

        <div className="grid items-start gap-5 xl:grid-cols-[1fr_18rem]">
          <section className="panel overflow-hidden">
            <div className="panel-title !grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="settings-icon grid size-9 shrink-0 place-items-center rounded-xl">
                  <StaffIcon type="people" />
                </span>
                <div className="min-w-0">
                  <div className="truncate font-display text-sm font-bold text-slate-900 sm:text-base">
                    Team Members
                  </div>
                  <div className="mt-0.5 truncate text-[0.68rem] text-slate-400 sm:text-xs">
                    {filteredStaff.length} matching profiles
                  </div>
                </div>
              </div>
              <span className="staff-directory-count rounded-full px-2.5 py-1 text-[0.62rem] font-bold sm:px-3 sm:text-xs">
                {filteredStaff.length} shown
              </span>
            </div>

            <div className="grid gap-3 p-3 lg:hidden">
              {filteredStaff.map((member) => (
                <article
                  key={member.id}
                  className="staff-mobile-card relative overflow-hidden rounded-2xl border p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="staff-mobile-avatar grid size-12 shrink-0 place-items-center rounded-2xl font-display text-sm font-extrabold text-white">
                      {initials(member.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate font-display text-sm font-bold text-slate-900">
                            {member.name}
                          </div>
                          <div className="mt-0.5 truncate text-[0.68rem] text-slate-500">
                            {member.designation}
                          </div>
                        </div>
                        <span
                          className={
                            member.status === "Active"
                              ? "status-success"
                              : "status-warning"
                          }
                        >
                          {member.status}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span className="text-[0.65rem] font-bold text-(--app-accent)">
                          {member.staffId}
                        </span>
                        <span className="status-neutral">
                          {member.department}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2">
                    <div className="staff-contact-row">
                      <span>
                        <StaffIcon type="phone" />
                      </span>
                      <div>
                        <small>Phone</small>
                        <strong>{member.phone}</strong>
                      </div>
                    </div>
                    <div className="staff-contact-row">
                      <span>
                        <StaffIcon type="mail" />
                      </span>
                      <div className="min-w-0">
                        <small>Email</small>
                        <strong className="truncate">{member.email}</strong>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="staff-mobile-metric">
                      <span>Monthly salary</span>
                      <strong>{formatCurrency(member.salary)}</strong>
                    </div>
                    <div className="staff-mobile-metric">
                      <span>Joined</span>
                      <strong>{formatDate(member.joiningDate)}</strong>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <Button
                      className="min-w-0 !px-2"
                      onClick={() => setSelectedStaff(member)}
                    >
                      View
                    </Button>
                    <Button
                      variant="outline"
                      className="min-w-0 !px-2"
                      onClick={() => openEdit(member)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      className="min-w-0 !px-2 text-xs"
                      onClick={() => setDeletingStaff(member)}
                    >
                      Delete
                    </Button>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto lg:block">
              <table className="module-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Contact</th>
                    <th>Monthly Salary</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((member) => (
                    <tr key={member.id}>
                      <td data-label="Employee">
                        <div className="flex items-center gap-3">
                          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 font-display text-xs font-bold text-white shadow-md shadow-teal-100">
                            {initials(member.name)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">
                              {member.name}
                            </div>
                            <div className="mt-1 text-xs font-semibold text-cyan-600">
                              {member.staffId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td data-label="Role">{member.designation}</td>
                      <td data-label="Department">
                        <span className="status-neutral">
                          {member.department}
                        </span>
                      </td>
                      <td data-label="Contact">
                        <div>{member.phone}</div>
                        <div className="mt-1 text-xs text-slate-400">
                          {member.email}
                        </div>
                      </td>
                      <td data-label="Monthly Salary">
                        <span className="font-display font-bold text-slate-800">
                          {formatCurrency(member.salary)}
                        </span>
                      </td>
                      <td data-label="Joined">
                        {formatDate(member.joiningDate)}
                      </td>
                      <td data-label="Status">
                        <span
                          className={
                            member.status === "Active"
                              ? "status-success"
                              : "status-warning"
                          }
                        >
                          {member.status}
                        </span>
                      </td>
                      <td data-label="Actions">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            className="min-h-8 px-3 py-1.5"
                            onClick={() => setSelectedStaff(member)}
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            className="min-h-8 px-3 py-1.5"
                            onClick={() => openEdit(member)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            className="min-h-8 px-3 py-1.5 text-xs"
                            onClick={() => setDeletingStaff(member)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!filteredStaff.length && (
              <div className="grid min-h-60 place-items-center text-center">
                <div>
                  <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                    <StaffIcon type="people" />
                  </div>
                  <div className="mt-4 font-display text-sm font-bold text-slate-700">
                    No staff profiles found
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Adjust the filters or add a staff member.
                  </p>
                  <Button className="mt-4" onClick={openCreate}>
                    Add Staff Member
                  </Button>
                </div>
              </div>
            )}
          </section>

          <aside className="space-y-5 xl:sticky xl:top-28">
            <section className="staff-team-panel panel overflow-hidden">
              <div className="staff-team-header p-5">
                <div className="flex items-center gap-2">
                  <span className="settings-icon grid size-9 place-items-center rounded-xl">
                    <StaffIcon type="department" />
                  </span>
                  <div className="font-display text-sm font-bold text-slate-900">
                    Team Distribution
                  </div>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Employees by department.
                </p>
              </div>
              <div className="space-y-4 p-5 pt-1">
                {departmentTotals.map(([departmentName, count]) => (
                  <div key={departmentName}>
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700">
                        {departmentName}
                      </span>
                      <span className="text-slate-500">{count} staff</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`${progressWidth(count, departmentTotals[0]?.[1] ?? 1)} staff-team-progress h-full rounded-full`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section className="staff-payroll-snapshot rounded-2xl border p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <StaffIcon type="salary" />
                  <div className="font-display text-sm font-bold">
                    Payroll Snapshot
                  </div>
                </div>
                <span className="rounded-full bg-white/70 px-2.5 py-1 text-[0.62rem] font-bold">
                  {activeStaff} active
                </span>
              </div>
              <div className="mt-4 font-display text-2xl font-extrabold">
                {formatCurrency(monthlyPayroll)}
              </div>
              <p className="mt-2 text-xs leading-5">
                Estimated monthly salary commitment for active employees.
              </p>
            </section>
          </aside>
        </div>
      </main>

      <Popup
        open={editorOpen}
        onClose={() => !saving && setEditorOpen(false)}
        title={editingId ? "Edit Staff Profile" : "Add Staff Member"}
        description="Maintain employment, contact, and payroll details."
        footerClassName="!grid grid-cols-2 items-stretch gap-2 [&>button]:w-full sm:!flex sm:[&>button]:w-auto"
        footer={
          <>
            <Button
              variant="outline"
              className="!px-2 sm:!px-4"
              onClick={() => setEditorOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              className="!px-2 sm:!px-4"
              onClick={saveStaff}
              isLoading={saving}
              loadingText="Saving..."
            >
              {editingId ? "Update Profile" : "Add Staff Member"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Dropdown
            label="Full Name *"
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="Select a user"
            options={[
              ...(form.name && !users.some((user) => `${user.name} (${user.role})` === form.name)
                ? [{ label: form.name, value: form.name }]
                : []),
              ...users
                .filter((user) => !staff.some((member) => {
                  const selectedName = `${user.name} (${user.role})`.toLowerCase()
                  const userName = user.name.toLowerCase()
                  const existingName = member.name.toLowerCase()
                  return existingName === selectedName || existingName === userName
                }))
                .map((user) => ({
                label: `${user.name} (${user.role})`,
                value: `${user.name} (${user.role})`,
                })),
            ]}
          />
          <Input
            label="Designation *"
            value={form.designation}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                designation: event.target.value,
              }))
            }
            placeholder="e.g. English Teacher"
          />
          <Dropdown
            label="Department *"
            value={form.department}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                department: event.target.value,
              }))
            }
            placeholder="Select department"
            options={departments.map((value) => ({ label: value, value }))}
          />
          <Dropdown
            label="Employment Status"
            value={form.status}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                status: event.target.value as StaffStatus,
              }))
            }
            options={[
              { label: "Active", value: "Active" },
              { label: "On Leave", value: "On Leave" },
            ]}
          />
          <Input
            label="Phone Number *"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            pattern="[0-9]{10}"
            aria-invalid={Boolean(form.phone && form.phone.length !== 10)}
            value={form.phone}
            onChange={(event) => {
              const phone = event.target.value.replace(/\D/g, "").slice(0, 10)
              setForm((current) => ({ ...current, phone }))
            }}
            placeholder="10-digit phone number"
            hint={form.phone && form.phone.length !== 10 ? `${form.phone.length}/10 digits entered. Enter exactly 10 digits.` : undefined}
          />
          <Input
            label="Email Address *"
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm((current) => ({ ...current, email: event.target.value }))
            }
            placeholder="name@school.edu"
          />
          <Input
            label="Account Holder Name *"
            value={form.accountHolderName}
            onChange={(event) => setForm((current) => ({ ...current, accountHolderName: event.target.value }))}
            placeholder="Name as per bank account"
          />
          <Input
            label="Account Number *"
            type="text"
            inputMode="numeric"
            value={form.accountNumber}
            onChange={(event) => setForm((current) => ({ ...current, accountNumber: event.target.value.replace(/\D/g, "") }))}
            placeholder="9-18 digit account number"
          />
          <Dropdown
            label="Account Type *"
            value={form.accountType}
            onChange={(event) => setForm((current) => ({ ...current, accountType: event.target.value as BankAccountType }))}
            options={["Savings", "Current"].map((value) => ({ label: value, value }))}
          />
          <Input
            label="Bank Name *"
            value={form.bankName}
            onChange={(event) => setForm((current) => ({ ...current, bankName: event.target.value }))}
            placeholder="Bank name"
          />
          <Input
            label="Branch Name *"
            value={form.branchName}
            onChange={(event) => setForm((current) => ({ ...current, branchName: event.target.value }))}
            placeholder="Branch name"
          />
          <Input
            label="IFSC Code *"
            value={form.ifscCode}
            maxLength={11}
            onChange={(event) => setForm((current) => ({ ...current, ifscCode: event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11) }))}
            placeholder="ABCD0123456"
          />
          <DatePicker label="Joining Date" required value={form.joiningDate} onChange={(value) => setForm((current) => ({ ...current, joiningDate: value }))} />
          <Input
            label="Monthly Salary (₹) *"
            type="number"
            min="1"
            value={form.salary}
            onChange={(event) =>
              setForm((current) => ({ ...current, salary: event.target.value }))
            }
            placeholder="0"
          />
        </div>
      </Popup>

      <Popup
        open={Boolean(selectedStaff)}
        onClose={() => setSelectedStaff(null)}
        title="Staff Profile"
        description="Review employment and payroll information."
        footerClassName="!grid grid-cols-2 items-stretch gap-2 [&>button]:w-full sm:!flex sm:[&>button]:w-auto"
        footer={
          <>
            <Button
              variant="outline"
              className="!px-2 sm:!px-4"
              onClick={() => setSelectedStaff(null)}
            >
              Close
            </Button>
            {selectedStaff && (
              <Button
                className="!px-2 sm:!px-4"
                variant={
                  selectedStaff.status === "Active" ? "warning" : "success"
                }
                onClick={() => updateStatus(selectedStaff)}
              >
                {selectedStaff.status === "Active"
                  ? "Mark On Leave"
                  : "Mark Active"}
              </Button>
            )}
          </>
        }
      >
        {selectedStaff && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-950 p-5 text-white">
              <div className="flex items-center gap-4">
                <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 font-display text-xl font-bold">
                  {initials(selectedStaff.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-xl font-bold">
                    {selectedStaff.name}
                  </div>
                  <div className="mt-1 text-xs text-slate-300">
                    {selectedStaff.designation} · {selectedStaff.department}
                  </div>
                  <div className="mt-3">
                    <span
                      className={
                        selectedStaff.status === "Active"
                          ? "status-success"
                          : "status-warning"
                      }
                    >
                      {selectedStaff.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <dl className="staff-profile-details grid grid-cols-2 gap-3">
              {[
                ["Employee ID", selectedStaff.staffId],
                ["Joining Date", formatDate(selectedStaff.joiningDate)],
                ["Phone", selectedStaff.phone],
                ["Email", selectedStaff.email],
                ["Monthly Salary", formatCurrency(selectedStaff.salary)],
                ["Department", selectedStaff.department],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-100 p-3"
                >
                  <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {label}
                  </dt>
                  <dd className="mt-1 break-words text-sm font-semibold text-slate-800">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </Popup>

      <Popup
        open={Boolean(deletingStaff)}
        onClose={() => setDeletingStaff(null)}
        title="Remove Staff Member"
        description="This profile will be removed from the active staff directory."
        footerClassName="!grid grid-cols-2 items-stretch gap-2 [&>button]:w-full sm:!flex sm:[&>button]:w-auto"
        footer={
          <>
            <Button
              variant="outline"
              className="!px-2 sm:!px-4"
              onClick={() => setDeletingStaff(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="!px-2 sm:!px-4"
              onClick={confirmDelete}
              isLoading={deleting}
              loadingText="Removing..."
            >
              Remove Profile
            </Button>
          </>
        }
      >
        {deletingStaff && (
          <div className="staff-delete-card rounded-2xl border border-red-100 bg-red-50 p-4">
            <div className="font-display text-lg font-bold text-red-700">
              {deletingStaff.name}
            </div>
            <div className="mt-1 text-xs text-red-600">
              {deletingStaff.staffId} · {deletingStaff.designation}
            </div>
          </div>
        )}
      </Popup>
    </div>
  )
}
