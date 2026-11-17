import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import {
  Button,
  Calendar,
  Dropdown,
  Input,
  NewAdmissionSkeleton,
  useToast,
} from "../../components"
import { API_BASE, API_ENDPOINTS } from "../../api/endpoints"
import { post } from "../../api/methods"
import { getAuthUser } from "../../auth/session"
import Header from "../../ui/header"

type FormState = Record<string, string>

const createAdmissionNo = () => {
  const year = String(new Date().getFullYear()).slice(-2)
  return `ADM-${year}-${String(Date.now()).slice(-6)}`
}

const createInitialForm = (): FormState => ({
  admissionNo: createAdmissionNo(),
  academicYear: "2027–28",
  status: "Active",
  nationality: "Indian",
  transportFee: "0",
})

const options = (values: string[]) =>
  values.map((value) => ({ label: value, value }))

const themeTile =
  "bg-[linear-gradient(135deg,var(--app-accent),var(--app-accent-dark))] shadow-slate-900/15"
const tones = {
  teal: themeTile,
  violet: themeTile,
  amber: themeTile,
  emerald: themeTile,
  rose: themeTile,
}

function SectionTitle({
  icon,
  title,
  subtitle,
  tone,
  step,
}: {
  icon: "student" | "academic" | "contact" | "transport" | "document"
  title: string
  subtitle: string
  tone: keyof typeof tones
  step: number
}) {
  const paths = {
    student: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    academic: (
      <>
        <path d="m3 9 9-5 9 5-9 5-9-5Z" />
        <path d="M7 11.5V16c3 2.7 7 2.7 10 0v-4.5" />
      </>
    ),
    contact: (
      <>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />
      </>
    ),
    transport: (
      <>
        <rect x="3" y="6" width="18" height="11" rx="2" />
        <path d="M7 17v3M17 17v3M3 11h18M7 9h.01M17 9h.01" />
      </>
    ),
    document: (
      <>
        <path d="M5 3h10l4 4v14H5z" />
        <path d="M15 3v5h5M9 13h6M9 17h6" />
      </>
    ),
  }
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-xl text-white shadow-lg sm:size-11 ${tones[tone]}`}
      >
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
          {paths[icon]}
        </svg>
      </span>
      <div className="min-w-0">
        <h2 className="truncate leading-tight">{title}</h2>
        <p className="mt-0.5 truncate text-xs text-slate-400">{subtitle}</p>
      </div>
      <span className="ml-auto shrink-0 rounded-full bg-(--app-accent-faint) px-2.5 py-1 text-[0.65rem] font-bold tracking-wide text-(--app-accent-dark)">
        STEP {step}/5
      </span>
    </div>
  )
}

function DatePickerField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = value ? new Date(`${value}T00:00:00`) : undefined
  const [draftDate, setDraftDate] = useState<Date | undefined>(selected)
  const displayValue = selected
    ? selected.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : ""
  const format = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`

  return (
    <div className="min-w-0">
      <span className="form-label">{label}</span>
      <button
        type="button"
        onClick={() => {
          setDraftDate(selected ?? new Date())
          setOpen(true)
        }}
        className="form-input flex items-center text-left"
      >
        <span className={value ? "text-slate-700" : "text-slate-300"}>
          {displayValue || `Select ${label.toLowerCase()}`}
        </span>
        <svg
          className="ml-auto size-4 text-slate-400"
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        >
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M8 3v4M16 3v4M3 10h18" />
        </svg>
      </button>
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[120] grid items-end sm:place-items-center sm:p-5"
            role="dialog"
            aria-modal="true"
            aria-label={`Select ${label}`}
          >
            <button
              type="button"
              className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
              onClick={() => setOpen(false)}
              aria-label="Close date picker"
            />
            <section style={{ width: "calc(100vw - 2rem)", maxWidth: "24rem" }} className="date-picker-dialog relative z-10 box-border overflow-hidden rounded-3xl border border-white/80 bg-white">
              <div className="p-3 sm:p-4">
                <Calendar selected={draftDate} onSelect={setDraftDate} />
              </div>
              <div className="calendar-actions box-border grid w-full max-w-full grid-cols-2 gap-2 rounded-b-3xl border-t border-slate-200 bg-slate-50/90 px-4 py-4">
                <Button
                  variant="outline"
                  className="flex-1 sm:flex-none"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 sm:flex-none"
                  onClick={() => {
                    if (draftDate) onChange(format(draftDate))
                    setOpen(false)
                  }}
                >
                  Use this date
                </Button>
              </div>
            </section>
          </div>,
          document.body,
        )}
    </div>
  )
}

export default function NewAdmission() {
  const [form, setForm] = useState<FormState>(createInitialForm)
  const [savingMode, setSavingMode] = useState<"save" | "print" | null>(null)
  const [studentPhoto, setStudentPhoto] = useState("")
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()
  const [pinLookup, setPinLookup] = useState<{
    status: "idle" | "loading" | "found" | "error"
    district: string
    state: string
  }>({ status: "idle", district: "", state: "" })
  const pinRequest = useRef(0)
  const update = (name: string, value: string) =>
    setForm((current) => ({ ...current, [name]: value }))

  useEffect(() => {
    const finishLoading = () => setLoading(false)
    const hydrationFallback = window.setTimeout(finishLoading, 750)
    if (!navigator.onLine) finishLoading()
    window.addEventListener("offline", finishLoading)
    return () => {
      window.clearTimeout(hydrationFallback)
      window.removeEventListener("offline", finishLoading)
    }
  }, [])

  const changePinCode = async (raw: string) => {
    const pin = raw.replace(/\D/g, "").slice(0, 6)
    update("pinCode", pin)
    const requestId = ++pinRequest.current
    if (pin.length !== 6) {
      setPinLookup({ status: "idle", district: "", state: "" })
      return
    }
    if (!navigator.onLine) {
      setPinLookup({ status: "error", district: "", state: "" })
      return
    }
    setPinLookup({ status: "loading", district: "", state: "" })
    try {
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${pin}`,
      )
      const data = await response.json()
      const office =
        data?.[0]?.Status === "Success" ? data[0].PostOffice?.[0] : null
      if (requestId !== pinRequest.current) return
      setPinLookup(
        office
          ? { status: "found", district: office.District, state: office.State }
          : { status: "error", district: "", state: "" },
      )
    } catch {
      if (requestId === pinRequest.current)
        setPinLookup({ status: "error", district: "", state: "" })
    }
  }

  const applyPinSuggestion = () => {
    setForm((current) => ({
      ...current,
      district: pinLookup.district,
      state: pinLookup.state,
    }))
    setPinLookup((current) => ({ ...current, status: "idle" }))
    showToast(`District and state were filled from PIN ${form.pinCode}.`, {
      title: "Location applied",
    })
  }

  const trackedFields = [
    "fullName",
    "fatherName",
    "motherName",
    "dateOfBirth",
    "gender",
    "className",
    "section",
    "admissionDate",
    "category",
    "mobile",
    "email",
    "address",
    "pinCode",
    "district",
    "state",
  ]
  const completion = Math.round(
    (trackedFields.filter((key) => form[key]?.trim()).length /
      trackedFields.length) *
      100,
  )
  const requiredChecks = [
    { label: "Name", done: Boolean(form.fullName?.trim()) },
    { label: "Class", done: Boolean(form.className?.trim()) },
    { label: "Mobile", done: Boolean(form.mobile?.trim()) },
  ]

  const save = async (mode: "save" | "print") => {
    if (
      !form.fullName?.trim() ||
      !form.className?.trim() ||
      !form.mobile?.trim()
    ) {
      showToast("Full Name, Class, and Mobile Number are required.", {
        title: "Complete required fields",
        tone: "error",
      })
      return
    }
    setSavingMode(mode)
    try {
      const user = getAuthUser()
      await post(`${API_BASE}${API_ENDPOINTS.ADMISSIONS}`, {
        admissionNo: form.admissionNo.trim(),
        formNumber: form.formNumber?.trim() || undefined,
        fullName: form.fullName.trim(),
        fatherName: form.fatherName?.trim() || undefined,
        motherName: form.motherName?.trim() || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        bloodGroup: form.bloodGroup || undefined,
        aadhaar: form.aadhaar?.trim() || undefined,
        pen: form.pen?.trim() || undefined,
        className: form.className || undefined,
        section: form.section || undefined,
        status: form.status || "Active",
        admissionDate: form.admissionDate || undefined,
        category: form.category || undefined,
        religion: form.religion || undefined,
        nationality: form.nationality?.trim() || undefined,
        academicYear: form.academicYear?.trim() || undefined,
        mobile: form.mobile?.trim() || undefined,
        altMobile: form.altMobile?.trim() || undefined,
        email: form.email?.trim() || undefined,
        address: form.address?.trim() || undefined,
        pinCode: form.pinCode?.trim() || undefined,
        district: form.district?.trim() || undefined,
        state: form.state?.trim() || undefined,
        transportFee: Math.max(0, Number(form.transportFee) || 0),
        studentPhoto: studentPhoto || undefined,
        remarks: form.remarks?.trim() || undefined,
        createdBy: user?.username || undefined,
      })
      showToast(
        `${form.fullName}'s admission has been registered${
          mode === "print" ? " and the print form is ready" : ""
        }.`,
        { title: "Admission saved successfully" },
      )
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Unable to save admission.",
        { title: "Admission save failed", tone: "error" },
      )
    } finally {
      setSavingMode(null)
    }
  }

  if (loading) return <NewAdmissionSkeleton />

  return (
    <div className="new-admission-screen min-h-screen dashboard-bg pb-16">
      <Header
        title="New Admission"
        subtitle="Register a new student and complete their academic profile"
      />
      <main className="mx-auto max-w-[100rem] space-y-4 p-3 sm:space-y-5 sm:p-6 xl:p-8">
        <section className="new-admission-hero relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,var(--app-sidebar-start),var(--app-accent-dark)_60%,var(--app-accent))] p-4 text-white shadow-xl shadow-slate-900/15 sm:p-6">
          <div className="pointer-events-none absolute -right-10 -top-12 size-44 rounded-full bg-white/10 blur-sm" />
          <div className="pointer-events-none absolute -bottom-28 left-1/3 size-56 rounded-full border-[36px] border-white/5" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/20 font-display text-lg font-bold ring-2 ring-white/40 backdrop-blur sm:size-16 sm:text-xl">
                {form.fullName?.trim()
                  ? form.fullName
                      .trim()
                      .split(/\s+/)
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  : "NA"}
              </div>
              <div className="min-w-0">
                <div className="mb-1 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-white/60">
                  New enrollment · {form.academicYear}
                </div>
                <div className="truncate font-display text-lg font-bold sm:text-xl">
                  {form.fullName?.trim() || "New student"}
                </div>
                <div className="mt-0.5 truncate text-xs text-white/75">
                  {form.admissionNo || "Admission number pending"} ·{" "}
                  {form.className
                    ? `${form.className}${
                        form.section ? `-${form.section}` : ""
                      }`
                    : "Class not selected"}
                </div>
              </div>
            </div>
            <div className="min-w-0 flex-1 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md sm:ml-auto sm:max-w-sm">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>Form completion</span>
                <span>{completion}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-linear-to-r from-white/70 to-white transition-all duration-500"
                  style={{ width: `${completion}%` }}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {requiredChecks.map((check) => (
                  <span
                    key={check.label}
                    className={`rounded-full px-2.5 py-1 text-[0.65rem] font-bold ${
                      check.done
                        ? "bg-white text-(--app-accent-dark)"
                        : "bg-white/15 text-white/80"
                    }`}
                  >
                    {check.done ? "✓ " : ""}
                    {check.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-title">
            <SectionTitle
              step={1}
              tone="teal"
              icon="student"
              title="Student & Parent Information"
              subtitle="Identity, family and personal details"
            />
          </div>
          <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
            <Input
              label="Admission No. *"
              value={form.admissionNo}
              onChange={(event) => update("admissionNo", event.target.value)}
            />
            <Input
              label="Admission Form No."
              value={form.formNumber ?? ""}
              onChange={(event) => update("formNumber", event.target.value)}
              placeholder="e.g. FORM-26-1001"
            />
            <Input
              label="Full Name *"
              value={form.fullName ?? ""}
              onChange={(event) => update("fullName", event.target.value)}
              placeholder="Student full name"
            />
            <Input
              label="Father's Name"
              value={form.fatherName ?? ""}
              onChange={(event) => update("fatherName", event.target.value)}
            />
            <Input
              label="Mother's Name"
              value={form.motherName ?? ""}
              onChange={(event) => update("motherName", event.target.value)}
            />
            <DatePickerField
              label="Date of Birth"
              value={form.dateOfBirth ?? ""}
              onChange={(value) => update("dateOfBirth", value)}
            />
            <Dropdown
              label="Gender"
              value={form.gender ?? ""}
              onChange={(event) => update("gender", event.target.value)}
              options={options(["Male", "Female", "Other"])}
            />
            <Dropdown
              label="Blood Group"
              value={form.bloodGroup ?? ""}
              onChange={(event) => update("bloodGroup", event.target.value)}
              options={options([
                "A+",
                "A-",
                "B+",
                "B-",
                "AB+",
                "AB-",
                "O+",
                "O-",
              ])}
            />
            <Input
              label="Aadhaar No."
              value={form.aadhaar ?? ""}
              onChange={(event) => update("aadhaar", event.target.value)}
              placeholder="12-digit number"
            />
            <Input
              label="PEN No."
              value={form.pen ?? ""}
              onChange={(event) => update("pen", event.target.value)}
              placeholder="Permanent Education Number"
            />
          </div>
        </section>

        <section className="panel">
          <div className="panel-title">
            <SectionTitle
              step={2}
              tone="violet"
              icon="academic"
              title="Class & Admission"
              subtitle="Class, section and admission record"
            />
          </div>
          <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
            <Dropdown
              label="Class *"
              value={form.className ?? ""}
              onChange={(event) => update("className", event.target.value)}
              options={options([
                "Nursery",
                "LKG",
                "UKG",
                "Class 1",
                "Class 2",
                "Class 3",
                "Class 4",
                "Class 5",
              ])}
            />
            <Dropdown
              label="Section"
              value={form.section ?? ""}
              onChange={(event) => update("section", event.target.value)}
              options={options(["A", "B", "C"])}
            />
            <Dropdown
              label="Status"
              value={form.status}
              onChange={(event) => update("status", event.target.value)}
              options={options(["Active", "Pending", "Inactive"])}
            />
            <DatePickerField
              label="Admission Date"
              value={form.admissionDate ?? ""}
              onChange={(value) => update("admissionDate", value)}
            />
            <Dropdown
              label="Category"
              value={form.category ?? ""}
              onChange={(event) => update("category", event.target.value)}
              options={options(["General", "OBC", "SC", "ST"])}
            />
            <Dropdown
              label="Religion"
              value={form.religion ?? ""}
              onChange={(event) => update("religion", event.target.value)}
              options={options([
                "Hindu",
                "Muslim",
                "Sikh",
                "Christian",
                "Other",
              ])}
            />
            <Input
              label="Nationality"
              value={form.nationality}
              onChange={(event) => update("nationality", event.target.value)}
            />
            <Input
              label="Academic Year"
              value={form.academicYear}
              onChange={(event) => update("academicYear", event.target.value)}
            />
          </div>
        </section>

        <section className="panel">
          <div className="panel-title">
            <SectionTitle
              step={3}
              tone="amber"
              icon="contact"
              title="Contact & Address"
              subtitle="Phone, email and residence"
            />
          </div>
          <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
            <Input
              label="Mobile Number *"
              value={form.mobile ?? ""}
              onChange={(event) => update("mobile", event.target.value)}
              placeholder="+91 XXXXX XXXXX"
            />
            <Input
              label="Alternate Mobile"
              value={form.altMobile ?? ""}
              onChange={(event) => update("altMobile", event.target.value)}
            />
            <Input
              label="Email"
              type="email"
              value={form.email ?? ""}
              onChange={(event) => update("email", event.target.value)}
              placeholder="email@example.com"
            />
            <Input
              label="Address"
              value={form.address ?? ""}
              onChange={(event) => update("address", event.target.value)}
              placeholder="Full residential address"
            />
            <Input
              label="PIN Code"
              inputMode="numeric"
              maxLength={6}
              value={form.pinCode ?? ""}
              onChange={(event) => changePinCode(event.target.value)}
              placeholder="6-digit PIN code"
            />
            <Input
              label="District"
              value={form.district ?? ""}
              onChange={(event) => update("district", event.target.value)}
            />
            <Input
              label="State"
              value={form.state ?? ""}
              onChange={(event) => update("state", event.target.value)}
            />
            {pinLookup.status !== "idle" && (
              <div
                className="new-admission-pin-status col-span-full flex flex-col gap-2 rounded-xl border border-teal-100 bg-linear-to-r from-teal-50 to-cyan-50 p-3 text-xs sm:flex-row sm:items-center sm:justify-between"
                role="status"
              >
                {pinLookup.status === "loading" && (
                  <span className="font-medium text-teal-700">
                    Looking up PIN {form.pinCode}...
                  </span>
                )}
                {pinLookup.status === "error" && (
                  <span className="font-medium text-rose-600">
                    No location found for PIN {form.pinCode}. Enter district and
                    state manually.
                  </span>
                )}
                {pinLookup.status === "found" && (
                  <>
                    <span className="min-w-0 font-medium text-slate-600">
                      Suggested for {form.pinCode}:{" "}
                      <strong className="text-teal-700">
                        {pinLookup.district}
                      </strong>
                      ,{" "}
                      <strong className="text-teal-700">
                        {pinLookup.state}
                      </strong>
                    </span>
                    <Button
                      className="min-h-9 shrink-0"
                      onClick={applyPinSuggestion}
                    >
                      Use suggestion
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="panel">
            <div className="panel-title">
              <SectionTitle
                step={4}
                tone="emerald"
                icon="transport"
                title="Transport Fee"
                subtitle="Optional yearly bus fee"
              />
            </div>
            <div className="p-5">
              <Input
                label="Yearly Transport Fee"
                type="number"
                min="0"
                value={form.transportFee}
                onChange={(event) => update("transportFee", event.target.value)}
                hint="Enter 0 if transport service is not required."
              />
            </div>
          </section>
          <section className="panel">
            <div className="panel-title">
              <SectionTitle
                step={5}
                tone="rose"
                icon="document"
                title="Photo & Remarks"
                subtitle="Upload photo and add notes"
              />
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <label>
                <span className="form-label">Student Photo</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  className="form-input py-2"
                  onChange={(event) =>
                    setStudentPhoto(event.target.files?.[0]?.name ?? "")
                  }
                />
                <span className="mt-1.5 block text-[0.65rem] text-slate-400">
                  {studentPhoto || "JPG or PNG, maximum 2 MB"}
                </span>
              </label>
              <label>
                <span className="form-label">Remarks</span>
                <textarea
                  value={form.remarks ?? ""}
                  onChange={(event) => update("remarks", event.target.value)}
                  className="form-input h-20 resize-none py-3"
                  placeholder="Any special notes..."
                />
              </label>
            </div>
          </section>
        </div>

        <section className="new-admission-actions grid grid-cols-2 gap-2.5 rounded-2xl border border-white bg-white/90 p-3 shadow-lg shadow-slate-900/5 sm:flex sm:justify-end sm:gap-3 sm:p-4">
          <Button
            variant="outline"
            className="new-admission-cancel min-h-11 border-rose-200! text-rose-600! hover:bg-rose-50! sm:min-h-10"
            onClick={() => setForm(createInitialForm())}
            disabled={Boolean(savingMode)}
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            className="new-admission-print min-h-11 sm:min-h-10"
            onClick={() => save("print")}
            isLoading={savingMode === "print"}
            loadingText="Preparing print..."
          >
            Save & Print
          </Button>
          <Button
            className="col-span-2 -order-1 min-h-12 text-sm shadow-md shadow-teal-600/20 sm:order-none sm:col-span-1 sm:min-h-10 sm:text-xs sm:shadow-none"
            onClick={() => save("save")}
            isLoading={savingMode === "save"}
            loadingText="Saving admission..."
          >
            Save Admission
          </Button>
        </section>
      </main>
    </div>
  )
}
