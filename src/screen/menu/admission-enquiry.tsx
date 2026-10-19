import { useState } from "react"
import {
  Button,
  Dropdown,
  Input,
  PremiumPagination,
  useToast,
} from "../../components"
import Header from "../../ui/header"

type Enquiry = {
  address: string
  className: string
  fatherName: string
  fee: string
  formNumber: string
  mobile: string
  name: string
  status: "Form Issued" | "Admitted"
}

const initialEnquiries: Enquiry[] = [
  {
    name: "Karan Kumar",
    fatherName: "Rahul Kumar",
    mobile: "000000002652",
    className: "UKG",
    formNumber: "FORM-26-1003",
    fee: "₹150",
    address: "12 Knowledge Park, Lucknow, Uttar Pradesh",
    status: "Form Issued",
  },
  {
    name: "Ravi Kumar",
    fatherName: "Rahul Kumar",
    mobile: "8601XXXXXX",
    className: "UKG",
    formNumber: "ADM-26-1023",
    fee: "₹150",
    address: "Gomti Nagar, Lucknow, Uttar Pradesh",
    status: "Admitted",
  },
  {
    name: "Rahul Kumar",
    fatherName: "Kamta Prasad",
    mobile: "7CXXXXXXXXX",
    className: "Nursery",
    formNumber: "FORM-26-1004",
    fee: "₹50",
    address: "Indira Nagar, Lucknow, Uttar Pradesh",
    status: "Form Issued",
  },
  {
    name: "Ananya Sharma",
    fatherName: "Vikas Sharma",
    mobile: "9876543210",
    className: "Class 2",
    formNumber: "FORM-26-1005",
    fee: "₹150",
    address: "Aliganj, Lucknow, Uttar Pradesh",
    status: "Form Issued",
  },
  {
    name: "Aarav Singh",
    fatherName: "Rohit Singh",
    mobile: "9123456780",
    className: "Class 1",
    formNumber: "ADM-26-1024",
    fee: "₹150",
    address: "Hazratganj, Lucknow, Uttar Pradesh",
    status: "Admitted",
  },
  {
    name: "Meera Patel",
    fatherName: "Nitin Patel",
    mobile: "9988776655",
    className: "LKG",
    formNumber: "FORM-26-1006",
    fee: "₹150",
    address: "Mahanagar, Lucknow, Uttar Pradesh",
    status: "Form Issued",
  },
  {
    name: "Kabir Verma",
    fatherName: "Amit Verma",
    mobile: "9090909090",
    className: "Class 3",
    formNumber: "FORM-26-1007",
    fee: "₹150",
    address: "Jankipuram, Lucknow, Uttar Pradesh",
    status: "Form Issued",
  },
  {
    name: "Ishita Khan",
    fatherName: "Sameer Khan",
    mobile: "9812345678",
    className: "UKG",
    formNumber: "ADM-26-1025",
    fee: "₹150",
    address: "Chowk, Lucknow, Uttar Pradesh",
    status: "Admitted",
  },
  {
    name: "Vivaan Das",
    fatherName: "Sanjay Das",
    mobile: "9765432109",
    className: "Class 2",
    formNumber: "FORM-26-1008",
    fee: "₹150",
    address: "Vikas Nagar, Lucknow, Uttar Pradesh",
    status: "Form Issued",
  },
  {
    name: "Sara Ali",
    fatherName: "Imran Ali",
    mobile: "9654321098",
    className: "Nursery",
    formNumber: "FORM-26-1009",
    fee: "₹150",
    address: "Aminabad, Lucknow, Uttar Pradesh",
    status: "Form Issued",
  },
]

const emptyForm = {
  studentName: "",
  fatherName: "",
  mobile: "",
  className: "",
  address: "",
  remarks: "",
}

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
  onTakeAdmission: () => void
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
              <span className="max-sm:sr-only">Take Admission with this Form</span>
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
  const [enquiries, setEnquiries] = useState(initialEnquiries)
  const [saving, setSaving] = useState(false)
  const [updatingPrice, setUpdatingPrice] = useState(false)
  const [formPrice, setFormPrice] = useState("150")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [printEnquiry, setPrintEnquiry] = useState<Enquiry | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const { showToast } = useToast()

  const updateField = (field: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [field]: value }))
  const admittedCount = enquiries.filter(
    (enquiry) => enquiry.status === "Admitted",
  ).length
  const filteredEnquiries = enquiries.filter((enquiry) => {
    const matchesSearch =
      !search ||
      `${enquiry.name} ${enquiry.mobile} ${enquiry.formNumber}`
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
    setSaving(true)
    await new Promise((resolve) => window.setTimeout(resolve, 900))
    const nextFormNumber = `FORM-26-${1004 + enquiries.length}`
    setEnquiries((current) => [
      {
        name: form.studentName,
        fatherName: form.fatherName || "—",
        mobile: form.mobile,
        className: form.className,
        formNumber: nextFormNumber,
        fee: `₹${formPrice}`,
        address: form.address || "—",
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
  }

  const updatePrice = async () => {
    setUpdatingPrice(true)
    await new Promise((resolve) => window.setTimeout(resolve, 700))
    setUpdatingPrice(false)
    showToast(`Admission form price has been updated to ₹${formPrice}.`, {
      title: "Price updated",
    })
  }

  const takeAdmission = (enquiry: Enquiry) => {
    setEnquiries((current) =>
      current.map((item) =>
        item.formNumber === enquiry.formNumber
          ? { ...item, status: "Admitted" }
          : item,
      ),
    )
    showToast(`${enquiry.name} is now marked as admitted.`, {
      title: "Admission completed",
    })
  }

  if (printEnquiry)
    return (
      <AdmissionPrintForm
        enquiry={printEnquiry}
        onBack={() => setPrintEnquiry(null)}
        onTakeAdmission={() => {
          takeAdmission(printEnquiry)
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
              value: `₹${enquiries.length * Number(formPrice)}`,
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
                    New Enquiry
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
                  value={form.mobile}
                  onChange={(event) =>
                    updateField("mobile", event.target.value)
                  }
                  placeholder="10-digit mobile number"
                />
                <Dropdown
                  label="Class Interested In *"
                  value={form.className}
                  onChange={(event) =>
                    updateField("className", event.target.value)
                  }
                  placeholder="Select class"
                  options={[
                    "Nursery",
                    "LKG",
                    "UKG",
                    "Class 1",
                    "Class 2",
                    "Class 3",
                  ].map((item) => ({ label: item, value: item }))}
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
              <div className="admission-form-footer flex justify-center border-t p-5">
                <Button
                  onClick={saveEnquiry}
                  isLoading={saving}
                  loadingText="Saving enquiry..."
                >
                  Save Enquiry
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
                    placeholder="Name, phone or form number..."
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
                        <span className="text-slate-400">Form:</span>{" "}
                        <strong className="text-slate-700">
                          {enquiry.formNumber}
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
                      <Button
                        variant="success"
                        onClick={() => takeAdmission(enquiry)}
                      >
                        Take Admission
                      </Button>
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
    </div>
  )
}
