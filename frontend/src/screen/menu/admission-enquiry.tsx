import { useEffect, useState } from "react"
import {
  AdmissionEnquirySkeleton,
  Button,
  DeleteConfirmationPopup,
  Dropdown,
  Input,
  PremiumPagination,
  useToast,
} from "../../components"
import Header from "../../ui/header"
import { API_BASE, API_ENDPOINTS } from "../../api/endpoints"
import { del, get, post, put } from "../../api/methods"
import { getAuthUser } from "../../auth/session"
import { isValidMobileNumber, sanitizeMobileNumber } from "../../utils/validation"

type Enquiry = {
  studentId?: string
  address: string
  className: string
  fatherName: string
  fee: string
  revenue: number
  formNumber: string
  mobile: string
  name: string
  remarks: string
  status: "Form Issued" | "Admitted"
}


const emptyForm = {
  studentName: "",
  fatherName: "",
  mobile: "",
  className: "",
  address: "",
  remarks: "",
}

type AdmissionEnquiryResponse = {
  studentId: string
  name: string
  fatherName: string | null
  mobileNumber: string
  classInterested: string
  address: string | null
  remarks: string | null
  revenue: number | string
  status: "Form Issued" | "Admitted"
  createdAt: string
}

type AdmissionEnquiryListResponse = {
  data: AdmissionEnquiryResponse[]
  total: number
}

type SchoolClassResponse = {
  id: number
  name: string
  active: boolean
  createdBy: string | null
  createdAt: string
  updatedAt: string
  updatedBy: string | null
}

const toEnquiry = (item: AdmissionEnquiryResponse): Enquiry => ({
  studentId: item.studentId,
  name: item.name,
  fatherName: item.fatherName || "—",
  mobile: item.mobileNumber,
  className: item.classInterested,
  formNumber: item.studentId,
  revenue: Number(item.revenue) || 0,
  fee: `₹${Number(item.revenue) || 0}`,
  address: item.address || "—",
  remarks: item.remarks || "",
  status: item.status,
})

function SectionIcon({ type }: { type: "form" | "list" | "price" }) {
  const path =
    type === "form" ? (
      <>
        <path d="M12 3v18M3 12h18" />
        <circle cx="12" cy="12" r="9" />
      </>
    ) : type === "list" ? (
      <>
        <path d="M9 6h11M9 12h11M9 18h11" />
        <path d="M4 6h.01M4 12h.01M4 18h.01" />
      </>
    ) : (
      <>
        <path d="M5 5h14v14H5z" />
        <path d="M9 9h6M9 13h4" />
      </>
    )
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
      {path}
    </svg>
  )
}

function PrintActionIcon({ type }: { type: "back" | "print" | "user" }) {
  const path =
    type === "print" ? (
      <>
        <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <path d="M6 14h12v7H6z" />
      </>
    ) : type === "back" ? (
      <path d="m15 18-6-6 6-6" />
    ) : (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    )
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {path}
    </svg>
  )
}

function FormLine({ label, value }: { label: string; value?: string }) {
  return (
    <div className="admission-form-line flex min-w-0 items-end gap-2 text-xs leading-6 sm:text-sm">
      <span className="shrink-0 font-semibold text-slate-900">{label}:</span>
      <span className="min-h-6 min-w-0 flex-1 border-b border-slate-500 px-1 font-medium text-slate-700">
        {value}
      </span>
    </div>
  )
}

function AdmissionPrintForm({
  enquiry,
  onBack,
  onTakeAdmission,
}: {
  enquiry: Enquiry
  onBack: () => void
  onTakeAdmission: () => void | Promise<void>
}) {
  const terms = [
    "Admission will be confirmed only after verification of original documents and successful payment of admission fees.",
    "Fees once paid are non-refundable and non-transferable under any circumstances.",
    "The school reserves the right to refuse admission without assigning any reason.",
    "Parents or guardians must inform the school office of any change in address or contact details.",
    "The information provided in this form is true to the best of my knowledge. False information may lead to cancellation of admission.",
    "I agree to abide by all rules and regulations of the school as amended from time to time.",
  ]

  return (
    <div className="admission-print-root min-h-screen bg-slate-100 pb-20">
      <div className="admission-print-actions sticky top-0 z-20 border-b border-slate-200 bg-white/95 p-3 max-lg:pl-16! shadow-sm backdrop-blur-xl sm:p-4">
        <div className="mx-auto flex max-w-5xl flex-row flex-wrap items-center gap-2">
          <Button
            onClick={() => window.print()}
            aria-label="Print Admission Form"
            title="Print Admission Form"
            className="max-sm:size-10 max-sm:min-h-10 max-sm:rounded-xl max-sm:!p-0"
            icon={<PrintActionIcon type="print" />}
          >
            <span className="max-sm:sr-only">Print Admission Form</span>
          </Button>
          <Button
            variant="outline"
            onClick={onBack}
            aria-label="Back to Enquiry List"
            title="Back to Enquiry List"
            className="max-sm:size-10 max-sm:min-h-10 max-sm:rounded-xl max-sm:!p-0"
            icon={<PrintActionIcon type="back" />}
          >
            <span className="max-sm:sr-only">Back to Enquiry List</span>
          </Button>
          {enquiry.status !== "Admitted" && (
            <Button
              variant="success"
              onClick={onTakeAdmission}
              aria-label="Take Admission with this Form"
              title="Take Admission with this Form"
              className="max-sm:size-10 max-sm:min-h-10 max-sm:rounded-xl max-sm:!p-0"
              icon={<PrintActionIcon type="user" />}
            >
              <span className="max-sm:sr-only">
                Take Admission with this Form
              </span>
            </Button>
          )}
        </div>
      </div>

      <main className="overflow-x-auto p-3 sm:p-6">
        <article className="admission-print-sheet mx-auto w-full max-w-5xl border border-slate-800 bg-white p-4 text-slate-950 shadow-xl sm:p-8">
          <div className="admission-form-frame border border-slate-800 p-4 sm:p-5">
            <div className="text-center">
              <div className="font-display text-2xl font-extrabold tracking-tight text-blue-950 sm:text-3xl">
                PAL IT HUB
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-700">
                Knowledge for a Better Future
              </div>
              <div className="mx-auto mt-4 w-fit rounded-md bg-blue-950 px-8 py-2 font-display text-sm font-bold tracking-widest text-white sm:text-base">
                ADMISSION FORM
              </div>
            </div>

            <div className="mt-4 border-t-2 border-blue-950 pt-3">
              <div className="admission-print-meta flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                <span className="w-fit rounded-md border border-blue-950 bg-blue-50 px-3 py-1.5 font-bold">
                  Form No: {enquiry.formNumber}
                </span>
                <span className="font-semibold">
                  Issue Date: 26 Sep 2026&nbsp;&nbsp; | &nbsp;&nbsp;Session:
                  2027–28
                </span>
              </div>
            </div>

            <section className="admission-print-section mt-6">
              <div className="bg-blue-50 px-2 py-2 font-display text-sm font-bold text-blue-950">
                STUDENT DETAILS
              </div>
              <div className="mt-4 grid gap-5 md:grid-cols-[1fr_1fr_auto] print:grid-cols-[1fr_1fr_auto]">
                <div className="space-y-3">
                  <FormLine label="Student Name" value={enquiry.name} />
                  <FormLine label="Father's Name" value={enquiry.fatherName} />
                  <FormLine label="Mother's Name" />
                  <FormLine label="Date of Birth" />
                  <div className="flex flex-wrap items-center gap-4 pt-1 text-xs sm:text-sm">
                    <strong>Gender:</strong>
                    <span>□ Male</span>
                    <span>□ Female</span>
                    <span>□ Other</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <FormLine
                    label="Class Applying For"
                    value={enquiry.className}
                  />
                  <FormLine label="Category" />
                  <FormLine label="Religion" />
                  <FormLine label="Nationality" value="Indian" />
                  <FormLine label="Aadhaar No" />
                  <FormLine label="Blood Group" />
                </div>
                <div className="admission-photo-box mx-auto grid min-h-48 w-36 place-items-center border border-slate-500 p-3 text-center text-slate-400">
                  <div>
                    <svg
                      aria-hidden="true"
                      className="mx-auto size-16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 21a8 8 0 0 1 16 0" />
                    </svg>
                    <div className="mt-2 text-xs font-medium">
                      Paste Photo Here
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="admission-print-section mt-6">
              <div className="bg-blue-50 px-2 py-2 font-display text-sm font-bold text-blue-950">
                CONTACT DETAILS
              </div>
              <div className="mt-4 grid gap-x-8 gap-y-3 md:grid-cols-2 print:grid-cols-2">
                <FormLine label="Mobile" value={enquiry.mobile} />
                <FormLine label="Email" />
                <div className="md:col-span-2 print:col-span-2">
                  <FormLine label="Address" value={enquiry.address} />
                </div>
                <FormLine label="Pincode" />
                <FormLine label="State" value="Uttar Pradesh" />
                <FormLine label="District" value="Lucknow" />
              </div>
            </section>

            <section className="admission-print-section mt-6">
              <div className="bg-blue-50 px-2 py-2 font-display text-sm font-bold text-blue-950">
                PREVIOUS SCHOOL (IF ANY)
              </div>
              <div className="mt-4 grid gap-x-8 gap-y-3 md:grid-cols-2 print:grid-cols-2">
                <FormLine label="School Name" />
                <FormLine label="TC Number" />
                <FormLine label="Last Class Studied" />
              </div>
            </section>

            <section className="admission-print-section mt-6">
              <div className="bg-blue-50 px-2 py-2 font-display text-sm font-bold text-blue-950">
                TERMS & CONDITIONS
              </div>
              <ol className="admission-terms mt-3 list-decimal space-y-1 pl-6 text-xs leading-5 text-slate-800 sm:text-sm">
                {terms.map((term) => (
                  <li key={term}>{term}</li>
                ))}
              </ol>
            </section>

            <div className="admission-signatures mt-16 grid gap-12 text-center text-xs font-bold sm:grid-cols-2 print:grid-cols-2">
              <div>
                <div className="border-t border-slate-700 pt-2">
                  Parent / Guardian Signature
                </div>
              </div>
              <div>
                <div className="border-t border-slate-700 pt-2">
                  Principal / Authorized Signatory
                </div>
              </div>
            </div>

            <p className="admission-print-note mt-10 text-center text-xs text-slate-500">
              This is a computer-generated admission form. Form No.{" "}
              {enquiry.formNumber} is unique to this applicant.
            </p>
          </div>
        </article>
      </main>
    </div>
  )
}

export default function AdmissionEnquiry() {
  const [form, setForm] = useState(emptyForm)
  const [mobileInputError, setMobileInputError] = useState(false)
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [classes, setClasses] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [admittingId, setAdmittingId] = useState<string | null>(null)
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null)
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Enquiry | null>(null)
  const [updatingPrice, setUpdatingPrice] = useState(false)
  const [formPrice, setFormPrice] = useState("150")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [printEnquiry, setPrintEnquiry] = useState<Enquiry | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const { showToast } = useToast()

  useEffect(() => {
    let active = true
    const loadEnquiries = async () => {
      try {
        const [enquiryResponse, classResponse] = await Promise.all([
          get<AdmissionEnquiryListResponse>(
            `${API_BASE}${API_ENDPOINTS.ADMISSION_ENQUIRIES}?page=1&limit=100`,
          ),
          get<SchoolClassResponse[]>(`${API_BASE}${API_ENDPOINTS.CLASSES}`),
        ])
        if (active) {
          setEnquiries(enquiryResponse.data.map(toEnquiry))
          setClasses(classResponse.filter((item) => item.active).map((item) => item.name))
        }
      } catch (error) {
        if (active) {
          showToast(
            error instanceof Error ? error.message : "Unable to load admission enquiries.",
            { title: "Could not load enquiries", tone: "error" },
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    void loadEnquiries()
    return () => {
      active = false
    }
  }, [showToast])

  const updateField = (field: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [field]: value }))
  const admittedCount = enquiries.filter(
    (enquiry) => enquiry.status === "Admitted",
  ).length
  const classOptions = [...new Set([form.className, ...classes].filter(Boolean))]
  const filteredEnquiries = enquiries.filter((enquiry) => {
    const matchesSearch =
      !search ||
      `${enquiry.name} ${enquiry.mobile} ${enquiry.address}`
        .toLowerCase()
        .includes(search.toLowerCase())
    const matchesStatus =
      !status || enquiry.status.toLowerCase().replace(" ", "-") === status
    return matchesSearch && matchesStatus
  })
  const totalPages = Math.max(1, Math.ceil(filteredEnquiries.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const pageStart = (safePage - 1) * pageSize
  const visibleEnquiries = filteredEnquiries.slice(
    pageStart,
    pageStart + pageSize,
  )

  const saveEnquiry = async () => {
    if (
      !form.studentName.trim() ||
      !form.mobile.trim() ||
      !form.className.trim()
    ) {
      showToast("Student Name, Mobile Number, and Class are required.", {
        title: "Complete required fields",
        tone: "error",
      })
      return
    }
    if (!isValidMobileNumber(form.mobile)) {
      showToast("Enter a valid Indian mobile number starting with 6, 7, 8, or 9.", {
        title: "Invalid mobile number",
        tone: "error",
      })
      return
    }
    setSaving(true)
    if (editingStudentId) {
      try {
        const updated = await put<AdmissionEnquiryResponse>(
          `${API_BASE}${API_ENDPOINTS.ADMISSION_ENQUIRIES}/${encodeURIComponent(editingStudentId)}`,
          {
            name: form.studentName,
            fatherName: form.fatherName,
            mobileNumber: form.mobile,
            classInterested: form.className,
            address: form.address,
            remarks: form.remarks,
            revenue: Number(formPrice) || 0,
          },
        )
        setEnquiries((current) => current.map((item) => item.studentId === editingStudentId ? toEnquiry(updated) : item))
        setForm(emptyForm)
        setEditingStudentId(null)
        showToast("Admission enquiry updated successfully.", { title: "Enquiry updated" })
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Unable to update enquiry.", { title: "Could not update enquiry", tone: "error" })
      } finally {
        setSaving(false)
      }
      return
    }
    try {
    const currentUser = getAuthUser()
    const created = await post<AdmissionEnquiryResponse>(
      `${API_BASE}${API_ENDPOINTS.ADMISSION_ENQUIRIES}`,
      {
        name: form.studentName,
        fatherName: form.fatherName,
        mobileNumber: form.mobile,
        classInterested: form.className,
        address: form.address,
        remarks: form.remarks,
        revenue: Number(formPrice) || 0,
        createdBy: currentUser?.username || currentUser?.name || "System",
      },
    )
    const nextFormNumber = created.studentId
    setEnquiries((current) => [
      {
        studentId: nextFormNumber,
        name: form.studentName,
        fatherName: form.fatherName || "—",
        mobile: form.mobile,
        className: form.className,
        formNumber: nextFormNumber,
        revenue: Number(formPrice) || 0,
        fee: `₹${formPrice}`,
        address: form.address || "—",
        remarks: form.remarks,
        status: "Form Issued",
      },
      ...current,
    ])
    setSaving(false)
    setForm(emptyForm)
    setCurrentPage(1)
    showToast(`${form.studentName}'s admission enquiry has been recorded.`, {
      title: "Enquiry saved successfully",
    })
    } catch (error) {
      setSaving(false)
      showToast(
        error instanceof Error ? error.message : "Unable to save enquiry.",
        { title: "Could not save enquiry", tone: "error" },
      )
    }
  }

  const editEnquiry = (enquiry: Enquiry) => {
    if (!enquiry.studentId || enquiry.status === "Admitted") return
    setEditingStudentId(enquiry.studentId)
    setForm({
      studentName: enquiry.name,
      fatherName: enquiry.fatherName === "—" ? "" : enquiry.fatherName,
      mobile: enquiry.mobile,
      className: enquiry.className,
      address: enquiry.address === "—" ? "" : enquiry.address,
      remarks: enquiry.remarks,
    })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const deleteEnquiry = (enquiry: Enquiry) => {
    if (!enquiry.studentId || enquiry.status === "Admitted") return
    setDeleteTarget(enquiry)
  }

  const confirmDeleteEnquiry = async () => {
    if (!deleteTarget) return
    const enquiry = deleteTarget
    const studentId = enquiry.studentId
    if (!studentId) return
    setDeletingStudentId(studentId)
    try {
      await del(`${API_BASE}${API_ENDPOINTS.ADMISSION_ENQUIRIES}/${encodeURIComponent(studentId)}`)
      setEnquiries((current) => current.filter((item) => item.studentId !== studentId))
      setDeleteTarget(null)
      showToast("The enquiry was deleted.", { title: "Enquiry deleted", tone: "error" })
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to delete enquiry.", { title: "Could not delete enquiry", tone: "error" })
    } finally {
      setDeletingStudentId(null)
    }
  }

  const updatePrice = async () => {
    setUpdatingPrice(true)
    await new Promise((resolve) => window.setTimeout(resolve, 700))
    setUpdatingPrice(false)
    showToast(`Admission form price has been updated to ₹${formPrice}.`, {
      title: "Price updated",
    })
  }

  const takeAdmission = async (enquiry: Enquiry) => {
    if (!enquiry.studentId) return
    setAdmittingId(enquiry.studentId)
    try {
      const updated = await put<AdmissionEnquiryResponse>(
        `${API_BASE}${API_ENDPOINTS.ADMISSION_ENQUIRIES}/${encodeURIComponent(enquiry.studentId)}`,
        { status: "Admitted" },
      )
      setEnquiries((current) =>
        current.map((item) => item.studentId === enquiry.studentId ? { ...item, status: updated.status } : item),
      )
      showToast(`${enquiry.name} is now marked as admitted.`, { title: "Admission completed" })
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to update admission status.", { title: "Could not complete admission", tone: "error" })
    } finally {
      setAdmittingId(null)
    }
  }

  if (loading) return <AdmissionEnquirySkeleton />

  if (printEnquiry)
    return (
      <AdmissionPrintForm
        enquiry={printEnquiry}
        onBack={() => setPrintEnquiry(null)}
        onTakeAdmission={async () => {
          await takeAdmission(printEnquiry)
          setPrintEnquiry(null)
        }}
      />
    )

  return (
    <div className="min-h-full dashboard-bg">
      <Header
        title="Admission Enquiry"
        subtitle={`${enquiries.length} active admission enquiries`}
      />
      <main className="admission-enquiry-main space-y-5 p-4 sm:p-6 xl:p-8">
        <section className="admission-enquiry-hero relative overflow-hidden rounded-3xl p-5 text-white sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full border border-white/10 bg-white/5" />
          <div className="pointer-events-none absolute -bottom-28 left-1/3 size-56 rounded-full border-[36px] border-white/5" />
          <div className="relative grid items-center gap-6 lg:grid-cols-[1fr_25rem]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-white/85 backdrop-blur">
                <span className="size-1.5 rounded-full bg-emerald-300 shadow-[0_0_0_4px_rgb(110_231_183_/_0.12)]" />
                Admissions pipeline
              </div>
              <h1 className="mt-4 max-w-2xl font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                Turn every enquiry into a confident enrollment
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/72">
                Capture prospective families, issue forms, and follow each
                applicant through admission from one focused workspace.
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-2xl shadow-black/10 backdrop-blur-md">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-white/70">Conversion progress</span>
                <span>
                  {Math.round((admittedCount / enquiries.length) * 100)}%
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-white transition-all duration-500"
                  style={{
                    width: `${(admittedCount / enquiries.length) * 100}%`,
                  }}
                />
              </div>
              <div className="mt-4 grid grid-cols-3 divide-x divide-white/10 text-center">
                <div>
                  <div className="font-display text-xl font-bold">
                    {enquiries.length}
                  </div>
                  <div className="mt-0.5 text-[0.62rem] text-white/60">
                    Enquiries
                  </div>
                </div>
                <div>
                  <div className="font-display text-xl font-bold">
                    {enquiries.length - admittedCount}
                  </div>
                  <div className="mt-0.5 text-[0.62rem] text-white/60">
                    Follow-ups
                  </div>
                </div>
                <div>
                  <div className="font-display text-xl font-bold">
                    {admittedCount}
                  </div>
                  <div className="mt-0.5 text-[0.62rem] text-white/60">
                    Admitted
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[
            {
              label: "Total Enquiries",
              value: String(enquiries.length),
              tone: "teal",
              icon: "list" as const,
              helper: "All active records",
            },
            {
              label: "Forms Issued",
              value: String(
                enquiries.filter((item) => item.status === "Form Issued")
                  .length,
              ),
              tone: "amber",
              icon: "form" as const,
              helper: "Awaiting admission",
            },
            {
              label: "Admissions",
              value: String(admittedCount),
              tone: "green",
              icon: "form" as const,
              helper: "Successfully converted",
            },
            {
              label: "Form Collected",
              value: `₹${enquiries.reduce((total, enquiry) => total + enquiry.revenue, 0)}`,
              tone: "violet",
              icon: "price" as const,
              helper: "Total form revenue",
            },
          ].map((stat) => (
            <article
              key={stat.label}
              className={`admission-summary-card admission-summary-${stat.tone} relative overflow-hidden rounded-2xl p-4 sm:p-5`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-500">
                    {stat.label}
                  </div>
                  <div className="mt-1 font-display text-2xl font-bold text-slate-950">
                    {stat.value}
                  </div>
                </div>
                <span className="admission-summary-icon grid size-10 shrink-0 place-items-center rounded-xl">
                  <SectionIcon type={stat.icon} />
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-500">
                <span className="size-1.5 rounded-full bg-current opacity-50" />
                {stat.helper}
              </div>
            </article>
          ))}
        </section>

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(19rem,.8fr)_1.5fr]">
          <div className="space-y-5">
            <section className="admission-form-panel panel">
              <div className="admission-section-heading flex min-h-16 items-center gap-3 border-b px-5">
                <span className="admission-heading-icon grid size-10 shrink-0 place-items-center rounded-xl">
                  <SectionIcon type="form" />
                </span>
                <div>
                  <h2 className="font-display text-sm font-bold text-slate-900">
                    {editingStudentId ? "Edit Enquiry" : "New Enquiry"}
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Capture prospective student details
                  </p>
                </div>
              </div>
              <div className="admission-form-fields grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <Input
                  label="Student Name *"
                  value={form.studentName}
                  onChange={(event) =>
                    updateField("studentName", event.target.value)
                  }
                  placeholder="Full student name"
                />
                <Input
                  label="Father's Name"
                  value={form.fatherName}
                  onChange={(event) =>
                    updateField("fatherName", event.target.value)
                  }
                  placeholder="Father's name"
                />
                <Input
                  label="Mobile Number *"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={form.mobile}
                  onChange={(event) => {
                    const rawValue = event.target.value
                    setMobileInputError(/\D/.test(rawValue))
                    updateField("mobile", sanitizeMobileNumber(rawValue))
                  }}
                  hint={mobileInputError ? "Only numbers are allowed." : form.mobile.length > 0 && !isValidMobileNumber(form.mobile) ? "Use 10 digits starting with 6, 7, 8, or 9." : undefined}
                  className={mobileInputError || (form.mobile.length > 0 && form.mobile.length < 10) ? "border-rose-300! focus:border-rose-400!" : ""}
                  placeholder="10-digit mobile number"
                />
                <Dropdown
                  label="Class Interested In *"
                  value={form.className}
                  onChange={(event) =>
                    updateField("className", event.target.value)
                  }
                  placeholder="Select class"
                  options={classOptions.map((item) => ({ label: item, value: item }))}
                />
                <label className="sm:col-span-2 xl:col-span-1 2xl:col-span-2">
                  <span className="form-label">Address</span>
                  <textarea
                    value={form.address}
                    onChange={(event) =>
                      updateField("address", event.target.value)
                    }
                    className="form-input h-20 resize-none py-3"
                    placeholder="Full residential address"
                  />
                </label>
                <label className="sm:col-span-2 xl:col-span-1 2xl:col-span-2">
                  <span className="form-label">Remarks</span>
                  <textarea
                    value={form.remarks}
                    onChange={(event) =>
                      updateField("remarks", event.target.value)
                    }
                    className="form-input h-24 resize-none py-3"
                    placeholder="Any notes about this enquiry..."
                  />
                </label>
              </div>
              <div className="admission-form-footer flex justify-center gap-3 border-t p-5 [&>button+button]:ml-1">
                {editingStudentId && (
                  <Button variant="outline" onClick={() => { setEditingStudentId(null); setForm(emptyForm) }} disabled={saving}>
                    Cancel Edit
                  </Button>
                )}
                <Button
                  onClick={saveEnquiry}
                  isLoading={saving}
                  loadingText="Saving enquiry..."
                >
                  {editingStudentId ? "Update Enquiry" : "Save Enquiry"}
                </Button>
              </div>
            </section>

            <section className="admission-price-card panel p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-amber-100 text-amber-600">
                  <SectionIcon type="price" />
                </span>
                <div>
                  <h2 className="font-display text-sm font-bold text-slate-900">
                    Admission Form Price
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Standard charge per issued form
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-end gap-3">
                <div className="flex-1">
                  <Input
                    label="Price per form"
                    type="number"
                    min="0"
                    value={formPrice}
                    onChange={(event) => setFormPrice(event.target.value)}
                  />
                </div>
                <Button
                  variant="warning"
                  onClick={updatePrice}
                  isLoading={updatingPrice}
                  loadingText="Updating..."
                >
                  Update
                </Button>
              </div>
            </section>
          </div>

          <section className="admission-list-panel panel overflow-visible">
            <div className="admission-section-heading flex min-h-16 items-center justify-between gap-3 border-b px-5">
              <div className="flex items-center gap-3">
                <span className="admission-heading-icon grid size-10 place-items-center rounded-xl">
                  <SectionIcon type="list" />
                </span>
                <div>
                  <h2 className="font-display text-sm font-bold text-slate-900">
                    Enquiry List
                  </h2>
                  <p className="mt-0.5 hidden text-xs text-slate-500 sm:block">
                    Review and manage prospective admissions
                  </p>
                </div>
              </div>
              <span className="status-info shrink-0">
                {filteredEnquiries.length} records
              </span>
            </div>
            <div className="admission-filter-bar relative overflow-hidden border-b p-3 sm:p-4">
              <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 rounded-2xl border border-white/80 bg-white/85 p-3 shadow-sm ring-1 ring-slate-900/5 backdrop-blur-sm sm:grid-cols-12 sm:p-4">
                <div className="col-span-2 flex items-center gap-3 sm:col-span-12">
                  <span className="admission-heading-icon grid size-9 shrink-0 place-items-center rounded-xl">
                    <svg
                      aria-hidden="true"
                      className="size-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <div className="font-display text-sm font-bold text-slate-900">
                      Smart search
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      Find the right enquiry in seconds
                    </div>
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-7">
                  <Input
                    label="Search enquiries"
                    startIcon={
                      <svg
                        aria-hidden="true"
                        className="size-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="11" cy="11" r="7" />
                        <path d="m20 20-4-4" strokeLinecap="round" />
                      </svg>
                    }
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value)
                      setCurrentPage(1)
                    }}
                    placeholder="Name, phone or address..."
                    aria-label="Search enquiries"
                  />
                </div>
                <div className="min-w-0 sm:col-span-3">
                  <Dropdown
                    label="Application status"
                    value={status}
                    onChange={(event) => {
                      setStatus(event.target.value)
                      setCurrentPage(1)
                    }}
                    placeholder="All Status"
                    aria-label="Enquiry status"
                    options={[
                      { label: "Form Issued", value: "form-issued" },
                      { label: "Admitted", value: "admitted" },
                    ]}
                  />
                </div>
                <Button
                  className="min-w-24 sm:col-span-2 sm:w-full"
                  variant="outline"
                  disabled={!search && !status}
                  icon={
                    <svg
                      aria-hidden="true"
                      className="size-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        d="M3 12a9 9 0 1 0 3-6.7L3 8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M3 3v5h5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  }
                  onClick={() => {
                    setSearch("")
                    setStatus("")
                    setCurrentPage(1)
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
            <div className="admission-record-list space-y-2 p-3">
              {visibleEnquiries.map((enquiry) => (
                <article
                  key={enquiry.formNumber}
                  className="admission-record-card grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-4 rounded-xl border p-4 transition sm:flex sm:gap-4 sm:p-5"
                >
                  <div className="admission-student-avatar grid size-11 shrink-0 place-items-center rounded-2xl font-display text-sm font-bold">
                    {enquiry.name
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-sm font-bold text-slate-950">
                        {enquiry.name}
                      </h3>
                      <span
                        className={
                          enquiry.status === "Admitted"
                            ? "status-success"
                            : "status-warning"
                        }
                      >
                        {enquiry.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      S/D/o {enquiry.fatherName} · {enquiry.mobile}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs">
                      <span>
                        <span className="text-slate-400">Class:</span>{" "}
                        <strong className="text-slate-700">
                          {enquiry.className}
                        </strong>
                      </span>
                      <span>
                        <span className="text-slate-400">Address:</span>{" "}
                        <strong className="text-slate-700">
                          {enquiry.address}
                        </strong>
                      </span>
                      <span>
                        <span className="text-slate-400">Fee:</span>{" "}
                        <strong className="text-slate-700">
                          {enquiry.fee}
                        </strong>
                      </span>
                    </div>
                  </div>
                  <div className="col-span-2 flex gap-2 [&>button]:flex-1 sm:col-span-1 sm:shrink-0 sm:[&>button]:flex-none">
                    <Button
                      variant="outline"
                      onClick={() => setPrintEnquiry(enquiry)}
                    >
                      Print Form
                    </Button>
                    {enquiry.status !== "Admitted" && (
                      <>
                        <Button variant="outline" onClick={() => editEnquiry(enquiry)} disabled={Boolean(deletingStudentId)}>
                          Edit
                        </Button>
                        <Button variant="danger" onClick={() => void deleteEnquiry(enquiry)} isLoading={deletingStudentId === enquiry.studentId}>
                          Delete
                        </Button>
                        <Button variant="success" onClick={() => void takeAdmission(enquiry)} isLoading={admittingId === enquiry.studentId}>
                          Take Admission
                        </Button>
                      </>
                    )}
                  </div>
                </article>
              ))}
              {!filteredEnquiries.length && (
                <div className="grid min-h-52 place-items-center p-6 text-center text-sm text-slate-400">
                  No enquiries match the selected filters.
                </div>
              )}
            </div>
            <footer className="admission-list-footer border-t px-4 py-4 sm:px-5">
              <PremiumPagination
                currentPage={safePage}
                totalPages={totalPages}
                totalRecords={filteredEnquiries.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </footer>
          </section>
        </div>
      </main>
      <DeleteConfirmationPopup
        open={Boolean(deleteTarget)}
        record={deleteTarget ? {
          name: deleteTarget.name,
          reference: deleteTarget.formNumber,
          context: deleteTarget.className,
          status: deleteTarget.status,
          statusTone: "warning",
        } : null}
        title="Delete Admission Enquiry"
        description="Review this enquiry before permanently removing it."
        confirmLabel="Yes, Delete"
        onCancel={() => !deletingStudentId && setDeleteTarget(null)}
        onConfirm={() => void confirmDeleteEnquiry()}
      />
    </div>
  )
}
