import { useState, type ReactNode } from "react";
import AppSkeleton from "../components/AppSkeleton";
import { PasswordChangePopup, SignOutPopup, ToastProvider } from "../components";
import { useAppController } from "../controllers/useAppController";
import Dashboard from "../screen/dashboard";
import AdminSettings from "../screen/admin-settings";
import Login from "../screen/login";
import { menuScreens } from "../screen/menu";
import Footer from "../ui/footer";
import Header from "../ui/header";
import Sidebar from "../ui/sidebar";
import { ThemeProvider } from "../ui/theme";

type IconName =
  | "admission" | "alert" | "arrow" | "attendance" | "book" | "calendar"
  | "chart" | "checklist" | "dashboard" | "download" | "expense" | "fee"
  | "menu" | "notice" | "people" | "person" | "report" | "rupee"
  | "search" | "settings" | "wallet" | "whatsapp" | "zap";

const paths: Record<IconName, ReactNode> = {
  admission: <><path d="M12 3v18M3 12h18"/><circle cx="12" cy="12" r="9"/></>,
  alert: <><path d="m12 3 10 18H2L12 3Z"/><path d="M12 9v5M12 18h.01"/></>,
  arrow: <path d="m9 18 6-6-6-6"/>,
  attendance: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18m-13 5 2 2 5-5"/></>,
  book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z"/><path d="M8 8h8M8 12h6"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></>,
  chart: <><path d="M4 19V9M10 19V5M16 19v-7M22 19V3"/></>,
  checklist: <><path d="m4 6 1.5 1.5L8 5M4 12l1.5 1.5L8 11M4 18l1.5 1.5L8 17M11 6h9M11 12h9M11 18h9"/></>,
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  download: <><path d="M12 3v13M7 11l5 5 5-5M4 21h16"/></>,
  expense: <><path d="M7 3h10v18H7zM9.5 7h5M9.5 11h5M9.5 15h3"/></>,
  fee: <><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M7 3v6M17 3v6"/></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
  notice: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
  people: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></>,
  person: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  report: <><path d="M5 3h14v18H5zM9 8h6M9 12h6M9 16h4"/></>,
  rupee: <><path d="M6 5h12M6 9h12M7 5c7 0 7 8 0 8l8 7"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1A8 8 0 0 0 15 6l-.3-2.6h-4L10.4 6A8 8 0 0 0 8 7.2l-2.4-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a8 8 0 0 0 2.4 1.2l.3 2.6h4l.3-2.6a8 8 0 0 0 2.4-1.2l2.4 1 2-3.4-2-1.5a7 7 0 0 0 .2-1.1Z"/></>,
  wallet: <><path d="M4 6h14a2 2 0 0 1 2 2v11H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h13"/><path d="M16 11h6v5h-6a2.5 2.5 0 0 1 0-5Z"/></>,
  whatsapp: <><path d="M21 11.5a9 9 0 0 1-13.3 7.9L3 21l1.6-4.5A9 9 0 1 1 21 11.5Z"/><path d="M8 8c1 4 3 6 7 7"/></>,
  zap: <path d="m13 2-9 12h8l-1 8 9-13h-8l1-7Z"/>,
};

function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  return <svg className={className} aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

type ScreenStat = { label: string; value: string; tone?: "teal" | "green" | "amber" | "red" };
type ScreenConfig = {
  subtitle: string;
  action?: string;
  stats?: ScreenStat[];
  filters?: string[];
  columns: string[];
  rows?: string[][];
  empty?: string;
};

const screenConfigs: Record<string, ScreenConfig> = {
  "All Students": {
    subtitle: "Manage enrolled students and view profiles",
    action: "Add Student",
    stats: [{ label: "Total Students", value: "9" }, { label: "Active", value: "9", tone: "green" }, { label: "Classes", value: "5", tone: "amber" }],
    filters: ["Search name, admission no...", "All Classes", "Active"],
    columns: ["Adm. No", "Student", "Class", "Guardian", "Phone", "Status"],
    rows: [["ADM-26-1001", "Rahul Kumar", "UKG", "S/O Raj Kumar", "7310095239", "Active"], ["ADM-26-1023", "Ravi Kumar", "UKG", "S/O Ravi Lal", "8601XXXXXX", "Active"], ["ADM-26-1041", "Amit Kumar", "Class 10-A", "Mahima Kumar", "—", "Active"]],
  },
  "Passed Out Archive": {
    subtitle: "Former students and transfer records",
    action: "Export Archive",
    stats: [{ label: "Archived Students", value: "18" }, { label: "This Session", value: "3", tone: "amber" }],
    filters: ["Search archived students...", "Passing Year", "All Classes"],
    columns: ["Adm. No", "Student", "Last Class", "Passed Year", "TC No.", "Action"],
    rows: [["ADM-22-081", "Neha Sharma", "Class 12", "2025–26", "TC-26018", "View"], ["ADM-21-063", "Kabir Singh", "Class 12", "2025–26", "TC-26011", "View"]],
  },
  "Promotion": {
    subtitle: "Promote students to the next academic session",
    action: "Run Promotion",
    stats: [{ label: "Current Session", value: "2027–28" }, { label: "Eligible", value: "9", tone: "green" }, { label: "Pending", value: "2", tone: "amber" }],
    filters: ["Select Class", "Select Section", "Promote To"],
    columns: ["Student", "Current Class", "Result", "Promote To", "Selected"],
    rows: [["Rahul Kumar", "UKG", "Passed", "Class 1", "Yes"], ["Ravi Kumar", "UKG", "Passed", "Class 1", "Yes"]],
  },
  "Fee Collection": {
    subtitle: "Collect and track student fee payments",
    action: "Collect Fee",
    stats: [{ label: "Collected Today", value: "₹150", tone: "green" }, { label: "This Month", value: "₹4,800" }, { label: "Pending", value: "₹350", tone: "red" }],
    filters: ["Search student or admission no...", "Class", "Payment Status"],
    columns: ["Receipt", "Student", "Fee Type", "Amount", "Date", "Mode"],
    rows: [["RC-2609-0102", "Rahul Kumar", "Tuition Fee", "₹50", "26 Sep 2026", "Cash"], ["RC-2609-0101", "Rahul Kumar", "Admission Fee", "₹100", "24 Sep 2026", "UPI"]],
  },
  "Quick Fee Collect": {
    subtitle: "Find a student and collect fees instantly",
    action: "New Collection",
    stats: [{ label: "Today's Collections", value: "₹150", tone: "green" }, { label: "Transactions", value: "2" }],
    filters: ["Enter student name, phone or admission no...", "Select Fee Type", "Payment Mode"],
    columns: ["Student", "Class", "Total Due", "Paying Now", "Action"],
    rows: [["Rahul Kumar", "UKG", "₹500", "₹150", "Collect"], ["Ravi Kumar", "UKG", "₹0", "—", "No Due"]],
  },
  "WhatsApp Reminder": {
    subtitle: "Send payment reminders to guardians",
    action: "Send Reminders",
    stats: [{ label: "Pending Contacts", value: "3", tone: "amber" }, { label: "Sent This Month", value: "12", tone: "green" }],
    filters: ["Select Class", "Minimum Due", "Message Template"],
    columns: ["Student", "Guardian", "Phone", "Pending Fee", "Last Reminder", "Select"],
    rows: [["Rahul Kumar", "Raj Kumar", "7310095239", "₹500", "18 Sep 2026", "Selected"], ["Amit Kumar", "Mahima Kumar", "—", "₹200", "Not sent", "—"]],
  },
  "Fee Deletion Log": {
    subtitle: "Audit removed fee transactions",
    stats: [{ label: "Deleted Records", value: "2", tone: "red" }, { label: "Value Removed", value: "₹250", tone: "amber" }],
    filters: ["Search receipt or student...", "Date Range", "Deleted By"],
    columns: ["Receipt", "Student", "Amount", "Deleted By", "Date", "Reason"],
    rows: [["RC-2608-0081", "Rahul Kumar", "₹150", "superadmin", "12 Sep 2026", "Duplicate entry"], ["RC-2608-0063", "Ravi Kumar", "₹100", "admin", "02 Sep 2026", "Wrong fee type"]],
  },
  "Attendance Report": {
    subtitle: "Monthly attendance summary",
    action: "Print Report",
    stats: [{ label: "Total Students", value: "2" }, { label: "75%+ Attendance", value: "0", tone: "green" }, { label: "Below 75%", value: "2", tone: "red" }, { label: "Average", value: "0.0%" }],
    filters: ["Class: UKG", "September 2026", "Current Students"],
    columns: ["Adm. No", "Student", "Present", "Absent", "Total Days", "Attendance"],
    rows: [["ADM-26-1001", "Rahul Kumar", "0", "0", "0", "0%"], ["ADM-26-1023", "Ravi Kumar", "0", "0", "0", "0%"]],
  },
  "Exams": {
    subtitle: "Create examinations and manage terms",
    action: "Create Exam",
    stats: [{ label: "Total Exams", value: "4" }, { label: "Upcoming", value: "1", tone: "amber" }, { label: "Completed", value: "3", tone: "green" }],
    filters: ["Search exams...", "Academic Year", "Status"],
    columns: ["Exam Name", "Term", "Classes", "Start Date", "End Date", "Status"],
    rows: [["Half Yearly Examination", "Term 1", "Class 1–10", "14 Oct 2026", "26 Oct 2026", "Upcoming"], ["Unit Test 1", "Term 1", "Class 1–10", "12 Jul 2026", "16 Jul 2026", "Completed"]],
  },
  "Marks Entry": {
    subtitle: "Enter and update examination marks",
    action: "Save Marks",
    filters: ["Select Exam", "Select Class", "Select Subject"],
    columns: ["Adm. No", "Student", "Maximum Marks", "Marks Obtained", "Grade"],
    rows: [["ADM-26-1001", "Rahul Kumar", "100", "82", "A"], ["ADM-26-1023", "Ravi Kumar", "100", "76", "B+"]],
  },
  "Class Result": {
    subtitle: "Review class performance and publish results",
    action: "Publish Result",
    stats: [{ label: "Students", value: "9" }, { label: "Passed", value: "8", tone: "green" }, { label: "Needs Review", value: "1", tone: "red" }],
    filters: ["Select Exam", "Select Class", "Result Status"],
    columns: ["Rank", "Student", "Total", "Percentage", "Grade", "Result"],
    rows: [["1", "Amit Kumar", "542 / 600", "90.3%", "A+", "Passed"], ["2", "Rahul Kumar", "501 / 600", "83.5%", "A", "Passed"]],
  },
  "Subjects": {
    subtitle: "Manage the academic subject catalog",
    action: "Add Subject",
    stats: [{ label: "Total Subjects", value: "12" }, { label: "Core Subjects", value: "8", tone: "green" }],
    filters: ["Search subjects...", "Subject Type", "Status"],
    columns: ["Code", "Subject Name", "Type", "Classes", "Status", "Action"],
    rows: [["ENG-01", "English", "Core", "UKG–Class 10", "Active", "Edit"], ["MAT-01", "Mathematics", "Core", "Class 1–10", "Active", "Edit"], ["SCI-01", "Science", "Core", "Class 3–10", "Active", "Edit"]],
  },
  "Class-Subject Map": {
    subtitle: "Assign subjects and teachers to classes",
    action: "Save Mapping",
    filters: ["Select Class", "Select Section", "Academic Year"],
    columns: ["Subject", "Subject Code", "Assigned Teacher", "Weekly Periods", "Status"],
    rows: [["English", "ENG-01", "Priya Sharma", "6", "Assigned"], ["Mathematics", "MAT-01", "Ravi Verma", "6", "Assigned"], ["Environmental Studies", "EVS-01", "Neha Singh", "4", "Assigned"]],
  },
  "Exam Schedule": {
    subtitle: "Plan examination dates, rooms and timings",
    action: "Add Schedule",
    filters: ["Select Exam", "Select Class", "Date Range"],
    columns: ["Date", "Subject", "Class", "Time", "Room", "Invigilator"],
    rows: [["14 Oct 2026", "English", "Class 10-A", "09:00–12:00", "Room 10", "Priya Sharma"], ["16 Oct 2026", "Mathematics", "Class 10-A", "09:00–12:00", "Room 10", "Ravi Verma"]],
  },
  "Expenses": {
    subtitle: "Record and monitor school expenses",
    action: "Add Expense",
    stats: [{ label: "This Month", value: "₹9,500", tone: "amber" }, { label: "This Year", value: "₹48,200" }, { label: "Entries", value: "8" }],
    filters: ["Search expenses...", "Category", "Date Range"],
    columns: ["Voucher", "Category", "Description", "Amount", "Date", "Paid By"],
    rows: [["EXP-2609-008", "Maintenance", "Classroom repair", "₹5,000", "21 Sep 2026", "Cash"], ["EXP-2609-007", "Utilities", "Electricity bill", "₹4,500", "18 Sep 2026", "Bank"]],
  },
  "Income vs Expense": {
    subtitle: "Compare monthly income with expenditure",
    action: "Export Report",
    stats: [{ label: "Total Income", value: "₹24,850", tone: "green" }, { label: "Total Expense", value: "₹9,500", tone: "red" }, { label: "Net Balance", value: "₹15,350" }],
    filters: ["Academic Year", "Monthly", "All Accounts"],
    columns: ["Month", "Income", "Expense", "Net", "Trend"],
    rows: [["September 2026", "₹24,850", "₹9,500", "₹15,350", "Positive"], ["August 2026", "₹18,200", "₹7,250", "₹10,950", "Positive"]],
  },
  "Staff Management": {
    subtitle: "Manage staff members",
    action: "Add Staff",
    stats: [{ label: "Total Staff", value: "1" }, { label: "Active Staff", value: "1", tone: "green" }, { label: "Monthly Payroll", value: "₹0", tone: "amber" }],
    filters: ["Name, ID, phone, designation", "Active", "All Departments"],
    columns: ["Staff ID", "Name", "Designation", "Phone", "Basic Salary", "Joining Date", "Status"],
    rows: [["EMP-26-1001", "Raj Kumar", "Principal", "7310095239", "₹0", "01 Sep 2026", "Active"]],
  },
  "Salary Management": {
    subtitle: "Process staff salaries and allowances",
    action: "Generate Payroll",
    stats: [{ label: "Staff on Payroll", value: "1" }, { label: "Gross Payroll", value: "₹25,000" }, { label: "Pending", value: "₹25,000", tone: "red" }],
    filters: ["September 2026", "All Departments", "Payment Status"],
    columns: ["Staff", "Basic", "Allowances", "Deductions", "Net Salary", "Status"],
    rows: [["Raj Kumar", "₹25,000", "₹0", "₹0", "₹25,000", "Pending"]],
  },
  "Salary Report": {
    subtitle: "Payroll history and payment reports",
    action: "Download Report",
    stats: [{ label: "Paid This Year", value: "₹1.75L", tone: "green" }, { label: "Pending", value: "₹25,000", tone: "amber" }],
    filters: ["Academic Year", "Select Month", "All Staff"],
    columns: ["Month", "Employees", "Gross Salary", "Deductions", "Net Paid", "Status"],
    rows: [["August 2026", "1", "₹25,000", "₹0", "₹25,000", "Paid"], ["July 2026", "1", "₹25,000", "₹0", "₹25,000", "Paid"]],
  },
  "Notices": {
    subtitle: "Publish announcements for students and staff",
    action: "Post Notice",
    stats: [{ label: "Published", value: "8" }, { label: "Active", value: "3", tone: "green" }, { label: "Drafts", value: "1", tone: "amber" }],
    filters: ["Search notices...", "Audience", "Published"],
    columns: ["Title", "Audience", "Published On", "Expires", "Status", "Action"],
    rows: [["Leave on Monday", "All", "23 Sep 2026", "26 Sep 2026", "Published", "Edit"], ["Half Yearly Examination", "Students", "18 Sep 2026", "26 Oct 2026", "Published", "Edit"]],
  },
  "User Management": {
    subtitle: "Manage staff accounts and permissions",
    action: "Create User",
    stats: [{ label: "Total Users", value: "3" }, { label: "Active", value: "3", tone: "green" }, { label: "Administrators", value: "2", tone: "amber" }],
    filters: ["Search users...", "All Roles", "Active"],
    columns: ["Username", "Full Name", "Role", "Status", "Last Login", "Action"],
    rows: [["superadmin", "Super Administrator", "Superadmin", "Active", "Today, 11:17", "Manage"], ["admin", "Administrator", "Admin", "Active", "Today, 11:43", "Manage"], ["RAJKUMAR", "Raj Kumar", "Operator", "Active", "17 Sep 2026", "Manage"]],
  },
  "Reports": {
    subtitle: "Financial and academic reports",
    action: "Export Data",
    stats: [{ label: "Available Reports", value: "10" }, { label: "Generated This Month", value: "6", tone: "green" }],
    filters: ["Search report...", "Financial & Academic", "All Formats"],
    columns: ["Report", "Category", "Description", "Format", "Action"],
    rows: [["Class-wise Fee Summary", "Fees", "Collection, pending and percentage", "PDF / CSV", "Generate"], ["Income vs Expense Report", "Finance", "Monthly comparison with charts", "PDF", "Generate"], ["Attendance Report", "Academics", "Monthly class-wise summary", "PDF / CSV", "Generate"], ["Session-wise Student Report", "Students", "Student export by session", "CSV", "Generate"]],
  },
  "Settings": {
    subtitle: "Configure school profile and preferences",
    action: "Save Settings",
    filters: ["School Profile", "Academic Preferences", "Notifications"],
    columns: ["Setting", "Current Value", "Scope", "Updated By", "Action"],
    rows: [["School Name", "PAL IT HUB", "Global", "superadmin", "Edit"], ["Academic Session", "2027–28", "Academic", "superadmin", "Edit"], ["Currency", "Indian Rupee (₹)", "Finance", "admin", "Edit"]],
  },
};

const formFields: Record<string, string[]> = {
  "Admission Enquiry": ["Student Name", "Father's Name", "Mobile Number", "Class Interested In", "Address", "Remarks"],
  "New Admission": ["Student Name", "Date of Birth", "Gender", "Class Applying For", "Father's Name", "Mother's Name", "Mobile Number", "Email", "Address", "Previous School"],
  "Fee Structure": ["Class", "Fee Type", "Amount", "Academic Year", "Frequency"],
  "Attendance": ["Class", "Date", "Section"],
  "Admin Settings": ["Backup Schedule", "Backup Folder", "Email Backup", "Cloud Backup", "Recovery Email"],
  "Add Expense": ["Expense Category", "Description", "Amount", "Date", "Payment Mode", "Reference"],
  "Post Notice": ["Notice Title", "Audience", "Publish Date", "Expiry Date", "Message"],
  "Export Data": ["Data Type", "Academic Year", "Date Range", "File Format"],
};

function StatsRow({ stats }: { stats: ScreenStat[] }) {
  const columns = stats.length >= 4 ? "grid-cols-2 xl:grid-cols-4" : stats.length === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2";
  return <div className={`grid gap-3 ${columns}`}>
    {stats.map((stat) => <div key={stat.label} className={`module-stat module-stat-${stat.tone ?? "teal"}`}><div className="text-xs text-slate-500">{stat.label}</div><div className="mt-1 text-xl font-bold text-slate-950">{stat.value}</div></div>)}
  </div>;
}

function Filters({ items }: { items: string[] }) {
  return <div className="flex flex-col gap-2 border-b border-slate-200 p-3 sm:flex-row">
    {items.map((item, index) => <div key={item} className={`field-control ${index === 0 ? "sm:flex-1" : "sm:w-48"}`}>{index === 0 && item.toLowerCase().includes("search") ? <Icon name="search" className="size-4 text-slate-400" /> : null}<span className="truncate">{item}</span><Icon name="arrow" className="ml-auto size-3 rotate-90 text-slate-400" /></div>)}
    <button className="filter-button"><Icon name="search" className="size-4" />View</button>
  </div>;
}

function DataTable({ config }: { config: ScreenConfig }) {
  return <section className="panel">
    {config.filters && <Filters items={config.filters} />}
    <div className="overflow-x-auto">
      <table className="module-table">
        <thead><tr>{config.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
        <tbody>
          {config.rows?.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex} data-label={config.columns[cellIndex]}><span className={(cell === "Active" || cell === "Paid" || cell === "Passed" || cell === "Positive" || cell === "Published" || cell === "Assigned") ? "status-success" : cell === "Pending" || cell === "Upcoming" ? "status-warning" : ""}>{cell}</span></td>)}</tr>)}
        </tbody>
      </table>
      {!config.rows?.length && <div className="grid min-h-56 place-items-center text-center"><div><Icon name="checklist" className="mx-auto size-10 text-teal-200" /><p className="mt-3 text-sm text-slate-400">{config.empty ?? "No records found"}</p></div></div>}
    </div>
  </section>;
}

function FormModule({ active, fields }: { active: string; fields: string[] }) {
  const isAttendance = active === "Attendance";
  const subtitle = active === "Admission Enquiry" ? "Add and manage admission enquiries" : active === "New Admission" ? "Register a new student" : active === "Fee Structure" ? "Create fee heads and assign them to classes" : active === "Admin Settings" ? "Backup, recovery and system configuration" : active === "Attendance" ? "Mark daily student attendance" : `Manage ${active.toLowerCase()} details`;
  return <div className="min-h-[calc(100vh-3rem)] dashboard-bg pb-16">
    <Header title={active} subtitle={subtitle} action={isAttendance ? "Attendance Report" : undefined} />
    <main className="space-y-4 p-3 sm:p-5 xl:p-6">
      {active === "Admission Enquiry" && <StatsRow stats={[{ label: "Total Enquiries", value: "3" }, { label: "Forms Issued", value: "3", tone: "amber" }, { label: "Admissions", value: "1", tone: "green" }, { label: "Form Collected", value: "₹300" }]} />}
      {active === "Fee Structure" && <StatsRow stats={[{ label: "Fee Types", value: "0" }, { label: "Assigned Classes", value: "0", tone: "amber" }, { label: "Academic Year", value: "2027–28", tone: "green" }]} />}
      <div className={`grid gap-4 ${active === "New Admission" || active === "Admin Settings" ? "" : "lg:grid-cols-[minmax(17rem,.75fr)_1.5fr]"}`}>
        <section className="panel">
          <div className="panel-title"><div className="flex items-center gap-2"><Icon name={active === "Admin Settings" ? "settings" : "admission"} className="size-5 text-teal-600" /><h2>{active === "Admission Enquiry" ? "New Enquiry" : active === "Admin Settings" ? "System Configuration" : active}</h2></div></div>
          <div className={`grid gap-3 p-4 ${active === "New Admission" || active === "Admin Settings" ? "sm:grid-cols-2 lg:grid-cols-3" : ""}`}>
            {fields.map((field) => <label key={field} className={field === "Address" || field === "Remarks" || field === "Message" ? "sm:col-span-2" : ""}><span className="form-label">{field}</span><input className="form-input" placeholder={`Enter ${field.toLowerCase()}`} /></label>)}
          </div>
          <div className="border-t border-slate-100 p-4"><button className="module-primary"><Icon name={isAttendance ? "attendance" : "checklist"} className="size-4" />{isAttendance ? "Load Students" : active === "Admin Settings" ? "Save Configuration" : `Save ${active === "Admission Enquiry" ? "Enquiry" : "Details"}`}</button></div>
        </section>
        {isAttendance ? <section className="panel">
          <div className="panel-title flex-wrap gap-2 py-2"><div className="flex items-center gap-2"><Icon name="attendance" className="size-5 text-teal-600" /><h2>UKG — 25 September 2026</h2></div><div className="flex gap-2"><button className="tiny-green">All Present</button><button className="tiny-red">All Absent</button></div></div>
          <div className="attendance-list overflow-x-auto"><table className="module-table"><thead><tr><th>Adm. No</th><th>Name</th><th>Present</th><th>Absent</th><th>Leave</th></tr></thead><tbody>{["Rahul Kumar", "Ravi Kumar"].map((name, index) => <tr key={name}><td data-label="Admission No.">ADM-26-{index ? "1023" : "1001"}</td><td data-label="Student" className="font-semibold">{name}</td><td data-label="Present"><input type="radio" name={`attendance-${index}`} defaultChecked /></td><td data-label="Absent"><input type="radio" name={`attendance-${index}`} /></td><td data-label="Leave"><input type="radio" name={`attendance-${index}`} /></td></tr>)}</tbody></table></div>
        </section> : active === "Admission Enquiry" ? <DataTable config={{ subtitle: "", filters: ["Search enquiries...", "All Status"], columns: ["Student", "Class", "Mobile", "Form", "Fee", "Action"], rows: [["Karan Kumar", "UKG", "0000002652", "FORM-26-1001", "₹100", "Take Admission"], ["Ravi Kumar", "UKG", "8601XXXXXX", "FORM-26-1003", "₹150", "Take Admission"], ["Rahul Kumar", "UKG", "7310095239", "FORM-26-1004", "₹50", "Take Admission"]] }} /> : active === "Fee Structure" ? <DataTable config={{ subtitle: "", columns: ["Class", "Fee Type", "Amount", "Year", "Frequency", "Action"], empty: "No fee structure defined yet" }} /> : null}
      </div>
    </main>
  </div>;
}

function Panel({ title, icon, action, children }: { title: string; icon: IconName; action?: string; children: ReactNode }) {
  return <section className="panel">
    <div className="panel-title flex-wrap gap-2 py-2"><div className="flex items-center gap-2"><Icon name={icon} className="size-5 text-teal-600" /><h2>{title}</h2></div>{action && <button className="module-primary">{action}</button>}</div>
    {children}
  </section>;
}

function StudentProfile({ onSelect }: { onSelect: (item: string) => void }) {
  const details = [["Adm. No.", "ADM-26-1001"], ["Father", "Hari Prasad"], ["Mother", "Seeta Devi"], ["DOB", "2006-09-19"], ["Phone", "77555678XXXX"], ["PEN No.", "6777"]];
  return <div className="min-h-screen dashboard-bg pb-16"><Header title="Student Profile" subtitle="ADM-26-1001 · Academic session 2027–28" />
    <main className="space-y-4 p-3 sm:p-5">
      <div className="flex gap-2 overflow-x-auto pb-1">{["TC Print", "Character Certificate", "ID Card", "Report Card", "Admit Card", "Fee Slip"].map((item) => <button key={item} onClick={() => item === "ID Card" && onSelect("ID Card Maker")} className="profile-action">{item}</button>)}</div>
      <div className="grid gap-4 xl:grid-cols-[minmax(18rem,.8fr)_1.4fr]">
        <section className="panel p-5">
          <div className="grid size-20 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-3xl font-bold text-white shadow-lg">R</div>
          <h2 className="mt-4 text-xl font-bold text-slate-950">RAHUL KUMAR</h2>
          <div className="mt-2 flex flex-wrap gap-2"><span className="status-info">UKG</span><span className="status-success">Active</span><span className="status-neutral">Male</span><span className="status-danger">B+</span></div>
          <dl className="mt-5 space-y-2 text-xs">{details.map(([label, value]) => <div key={label} className="grid grid-cols-[6rem_1fr]"><dt className="text-slate-400">{label}</dt><dd className="font-medium text-slate-700">{value}</dd></div>)}</dl>
          <div className="mt-5 rounded-xl border border-orange-100 bg-orange-50 p-4"><div className="text-xs font-semibold text-orange-600">Transport Fee</div><div className="mt-3 flex gap-2"><div className="field-control flex-1">₹ &nbsp;500</div><button className="module-primary">Update</button></div></div>
        </section>
        <Panel title="Fee Summary" icon="rupee" action="Quick Fee Collect">
          <div className="grid grid-cols-3 gap-3 p-4">{[["₹500", "Total Fee", "text-violet-600"], ["₹150", "Paid", "text-emerald-600"], ["₹350", "Pending", "text-red-500"]].map(([value, label, color]) => <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center"><div className={`text-xl font-bold ${color}`}>{value}</div><div className="mt-1 text-[0.65rem] uppercase text-slate-400">{label}</div></div>)}</div>
          <div className="border-t border-slate-100 p-4"><div className="mb-3 text-xs font-semibold text-slate-500">Fee-wise breakdown</div><div className="grid grid-cols-4 gap-2 text-xs"><span>Transport Fee</span><span>2027–28</span><span>₹500</span><span className="font-semibold text-emerald-600">₹150</span></div></div>
        </Panel>
      </div>
      <DataTable config={{ subtitle: "", columns: ["Receipt No", "Fee Type", "Month", "Amount", "Paid", "Balance", "Date", "Mode"], rows: [["RC-2609-1002", "Transport Fee", "—", "₹500", "₹50", "₹350", "26 Sep 2026", "Cash"], ["RC-2609-1001", "Transport Fee", "—", "₹500", "₹100", "₹400", "24 Sep 2026", "Cash"]] }} />
      <Panel title="Attendance Summary" icon="attendance"><div className="grid min-h-28 place-items-center text-sm text-slate-400">No attendance recorded yet</div></Panel>
    </main>
  </div>;
}

function ReportsScreen() {
  const reports = [
    ["Class-wise Fee Summary", "Class-wise collection, pending and percentage", "people", "bg-cyan-50 text-cyan-600"],
    ["Income vs Expense Report", "Monthly comparison with charts", "chart", "bg-violet-50 text-violet-600"],
    ["Fees Collected Report", "View all fee collections by date range", "rupee", "bg-amber-50 text-amber-600"],
    ["Day-wise Collection Report", "Daily collection in printable format", "calendar", "bg-orange-50 text-orange-600"],
    ["Fee Defaulters Report", "Students with pending fee dues", "alert", "bg-red-50 text-red-500"],
    ["Session-wise Student Report", "Class, gender and status report", "book", "bg-blue-50 text-blue-600"],
    ["Attendance Report", "Monthly attendance summary", "attendance", "bg-emerald-50 text-emerald-600"],
    ["Export Students CSV", "Download all student data", "download", "bg-cyan-50 text-cyan-600"],
    ["Export Fees CSV", "Download fee transaction data", "report", "bg-amber-50 text-amber-600"],
    ["Expense Report", "View monthly school expenditure", "expense", "bg-rose-50 text-rose-600"],
  ] as [string, string, IconName, string][];
  return <div className="min-h-screen dashboard-bg pb-16"><Header title="Reports" subtitle="Financial and academic reports" /><main className="grid gap-3 p-3 sm:grid-cols-2 sm:p-5 xl:p-6">{reports.map(([title, copy, icon, tone]) => <button key={title} className="report-card"><div className={`grid size-12 shrink-0 place-items-center rounded-xl ${tone}`}><Icon name={icon} /></div><div className="min-w-0 text-left"><div className="text-sm font-bold text-slate-900">{title}</div><div className="mt-1 text-xs leading-5 text-slate-500">{copy}</div></div><span className="ml-auto text-slate-300">+</span></button>)}</main></div>;
}

function AttendanceScreen() {
  return <div className="min-h-screen dashboard-bg pb-16"><Header title="Daily Attendance" subtitle="Mark class attendance" />
    <main className="space-y-4 p-3 sm:p-5">
      <section className="panel grid gap-3 p-4 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end"><label><span className="form-label">Class</span><div className="field-control">UKG <Icon name="arrow" className="ml-auto size-3 rotate-90" /></div></label><label><span className="form-label">Date</span><div className="field-control">09/25/2026 <Icon name="calendar" className="ml-auto size-4" /></div></label><button className="module-primary"><Icon name="search" className="size-4" />Load Students</button><button className="module-secondary"><Icon name="report" className="size-4" />Report</button></section>
      <section className="panel">
        <div className="panel-title flex-wrap gap-3 py-3"><div className="flex items-center gap-2"><Icon name="attendance" className="size-5 text-teal-600" /><h2>UKG — 2026-09-25 <span className="font-normal text-slate-400">(2 students)</span></h2></div><div className="flex gap-2"><button className="tiny-green">All Present</button><button className="tiny-red">All Absent</button></div></div>
        <div className="attendance-list overflow-x-auto"><table className="module-table"><thead><tr><th>#</th><th>Adm. No</th><th>Name</th><th>Present</th><th>Absent</th><th>Leave</th></tr></thead><tbody>{["Rahul Kumar", "Ravi Kumar"].map((name, index) => <tr key={name}><td data-label="#">{index + 1}</td><td data-label="Adm. No" className="text-cyan-600">ADM-26-{index ? "1023" : "1001"}</td><td data-label="Name" className="font-semibold">{name}</td><td data-label="Present"><input type="radio" name={`daily-${index}`} defaultChecked /></td><td data-label="Absent"><input type="radio" name={`daily-${index}`} /></td><td data-label="Leave"><input type="radio" name={`daily-${index}`} /></td></tr>)}</tbody></table></div>
        <div className="border-t border-slate-100 p-4"><button className="module-primary"><Icon name="attendance" className="size-4" />Save Attendance</button></div>
      </section>
    </main>
  </div>;
}

function FeeStructureScreen() {
  return <div className="min-h-screen dashboard-bg pb-16"><Header title="Fee Structure" subtitle="Manage fee heads and assign to students" /><main className="space-y-4 p-3 sm:p-5">
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="panel"><div className="panel-title"><div className="flex items-center gap-2"><Icon name="admission" className="size-5 text-emerald-500" /><h2>Add Fee Type</h2></div></div><div className="grid gap-3 p-4 sm:grid-cols-2">{["Class", "Fee Type", "Amount (₹)", "Academic Year", "Frequency"].map((field) => <label key={field} className={field === "Class" || field === "Fee Type" ? "sm:col-span-2" : ""}><span className="form-label">{field}</span><input className="form-input" placeholder={field === "Academic Year" ? "2027–28" : `Enter ${field.toLowerCase()}`} /></label>)}</div><div className="p-4 pt-0"><button className="module-primary">Add Fee Type</button></div></section>
      <section className="panel"><div className="panel-title"><div className="flex items-center gap-2"><Icon name="people" className="size-5 text-teal-600" /><h2>Assign Fees to Students</h2></div></div><div className="p-4"><p className="text-xs leading-5 text-slate-500">Assign fee structure to all active students of a class. Already-assigned fees won't be duplicated.</p><label className="mt-4 block"><span className="form-label">Select Class</span><input className="form-input" placeholder="Select Class" /></label><label className="mt-3 block"><span className="form-label">Academic Year</span><input className="form-input" value="2027–28" readOnly /></label><button className="mt-4 rounded-lg bg-orange-500 px-4 py-3 text-xs font-semibold text-white">Assign to All Students</button></div></section>
    </div>
    <section className="panel p-4"><div className="flex items-center gap-2"><Icon name="report" className="size-5 text-teal-600" /><h2 className="text-sm font-bold text-slate-900">Copy to Next Year</h2></div><p className="mt-3 text-xs text-slate-500">Copy the entire fee structure from one academic year to another without re-entering each entry.</p><div className="mt-4 flex flex-col gap-3 sm:flex-row"><div className="field-control flex-1">From Year: Select...</div><div className="field-control flex-1">To Year: 2027–28</div><button className="module-primary">Copy Structure</button></div></section>
    <DataTable config={{ subtitle: "", columns: ["#", "Class", "Fee Type", "Amount", "Year", "Frequency", "Actions"], empty: "No fee structure defined yet" }} />
  </main></div>;
}

function AdmissionEnquiryScreen() {
  const fields = ["Student Name", "Father's Name", "Mobile Number", "Class Interested In", "Address", "Remarks"];
  return <div className="min-h-screen dashboard-bg pb-16"><Header title="Admission Enquiry" subtitle="3 enquiries" /><main className="space-y-4 p-3 sm:p-5">
    <StatsRow stats={[{ label: "Total Enquiries", value: "3" }, { label: "Forms Issued", value: "3", tone: "amber" }, { label: "Admissions", value: "1", tone: "green" }, { label: "Form Collected", value: "₹300" }]} />
    <div className="grid gap-4 lg:grid-cols-[minmax(17rem,.8fr)_1.5fr]">
      <div className="space-y-4"><section className="panel"><div className="panel-title"><div className="flex items-center gap-2"><Icon name="admission" className="size-5 text-teal-600" /><h2>New Enquiry</h2></div></div><div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">{fields.map((field) => <label key={field} className={field === "Address" || field === "Remarks" ? "sm:col-span-2 lg:col-span-1 xl:col-span-2" : ""}><span className="form-label">{field}</span><input className="form-input" placeholder={field} /></label>)}</div><div className="p-4 pt-0"><button className="module-primary">Save Enquiry</button></div></section>
      <section className="panel p-4"><div className="flex items-center gap-2"><Icon name="fee" className="size-5 text-orange-500" /><h2 className="text-sm font-bold">Admission Form Price</h2></div><label className="mt-4 block"><span className="form-label">Price charged per admission form</span><input className="form-input" value="150.0" readOnly /></label><button className="mt-3 rounded-lg bg-orange-500 px-4 py-2.5 text-xs font-semibold text-white">Update Price</button></section></div>
      <section className="panel"><div className="panel-title"><div className="flex items-center gap-2"><Icon name="checklist" className="size-5 text-teal-600" /><h2>Enquiry List</h2></div></div><Filters items={["Search name...", "All Status"]} /><div className="divide-y divide-slate-100">{[["Karan Kumar", "000000002652", "UKG", "FORM-26-1003", "₹150"], ["Ravi Kumar", "8601XXXXXX", "UKG", "Admitted · ADM-26-1023", "₹150"], ["Rahul Kumar", "7CXXXXXXXXX", "Nursery", "FORM-26-1004", "₹50"]].map((row) => <div key={row[0]} className="p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start"><div className="flex-1"><div className="font-bold text-slate-900">{row[0]}</div><div className="mt-1 text-xs text-slate-500">{row[1]} · {row[2]}</div><div className="mt-2 inline-flex rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">{row[3]}</div><div className="mt-2 text-xs text-slate-400">Fee: {row[4]}</div></div><div className="flex gap-2"><button className="module-secondary">Print Form</button><button className="module-primary">Take Admission</button></div></div></div>)}</div></section>
    </div>
  </main></div>;
}

function NewAdmissionScreen() {
  const sections = [
    ["Basic Information", "person", ["Admission No", "Admission Form No", "Full Name", "Father's Name", "Mother's Name", "Date of Birth", "Gender", "Blood Group", "Aadhaar No", "PEN No"]],
    ["Class & Admission", "book", ["Class", "Section", "Status", "Admission Date", "Category", "Religion", "Nationality"]],
    ["Contact Details", "whatsapp", ["Mobile No", "Alternate Mobile", "Email", "Address", "Pin Code", "District", "State"]],
    ["Transport Fee", "expense", ["Transport Fee Amount (Yearly Total)"]],
  ] as [string, IconName, string[]][];
  return <div className="min-h-screen dashboard-bg pb-16"><Header title="New Admission" subtitle="Register a new student" action="Back to Students" /><main className="space-y-4 p-3 sm:p-5">{sections.map(([title, icon, fields]) => <section key={title} className="panel"><div className="panel-title"><div className="flex items-center gap-2"><Icon name={icon} className="size-5 text-teal-600" /><h2>{title}</h2></div></div><div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">{fields.map((field) => <label key={field} className={field === "Full Name" || field === "Address" ? "sm:col-span-2" : ""}><span className="form-label">{field}</span><input className="form-input" placeholder={`Enter ${field.toLowerCase()}`} /></label>)}</div></section>)}
    <div className="grid gap-4 sm:grid-cols-2"><section className="panel p-4"><h2 className="text-sm font-bold text-slate-900">Student Photo</h2><button className="module-secondary mt-4 w-full">Choose Photo</button></section><section className="panel p-4"><h2 className="text-sm font-bold text-slate-900">Remarks</h2><input className="form-input mt-4" placeholder="Any special notes..." /></section></div><div className="flex gap-3"><button className="module-primary">Register Student</button><button className="module-secondary">Cancel</button></div>
  </main></div>;
}

function IDCardMaker() {
  return <div className="min-h-screen bg-slate-100 pb-16"><Header title="ID Card Maker" subtitle="Design and preview student or staff identity cards" action="Export Cards" /><main className="grid gap-4 p-3 sm:p-5 xl:grid-cols-[23rem_1fr]">
    <section className="panel"><div className="panel-title"><h2>Template & Design</h2></div><div className="space-y-4 p-4">{["Template", "Theme", "Front Background", "Back Background", "Header Color", "Accent Color", "Corner Radius", "Photo Shape"].map((field) => <label key={field}><span className="form-label">{field}</span><div className="field-control">{field === "Template" ? "PID-2" : field === "Theme" ? "Forest" : `Configure ${field}`}<Icon name="arrow" className="ml-auto size-3 rotate-90" /></div></label>)}<div className="grid grid-cols-2 gap-2"><button className="module-primary">Save Template</button><button className="module-secondary">Quick Load</button></div></div></section>
    <section className="panel"><div className="panel-title"><h2>Live Preview</h2><div className="flex gap-2"><button className="module-secondary">Both Sides</button><button className="module-secondary">70%</button></div></div><div className="grid min-h-[34rem] place-items-center gap-6 bg-slate-200 p-5 md:grid-cols-2">
      <article className="id-card"><div className="id-card-head"><div className="text-lg font-bold">PAL IT HUB</div><div className="text-xs">Knowledge for a Better Future</div></div><div className="mx-auto -mt-8 grid size-24 place-items-center rounded-full border-4 border-white bg-slate-200 text-slate-400"><Icon name="person" className="size-10" /></div><div className="p-5"><h2 className="text-center text-xl font-bold text-slate-900">RAHUL KUMAR</h2><dl className="mt-6 space-y-3 text-xs">{[["Class", "UKG"], ["Admission No.", "ADM-26-1001"], ["Date of Birth", "19 Sep 2006"], ["Phone", "77555678XXXX"]].map(([k,v]) => <div key={k} className="flex justify-between"><dt className="font-semibold text-slate-500">{k}</dt><dd className="font-bold text-teal-700">{v}</dd></div>)}</dl></div></article>
      <article className="id-card"><div className="id-card-head"><div className="text-lg font-bold">TERMS & CONDITIONS</div></div><ol className="list-decimal space-y-2 p-8 text-xs leading-5 text-slate-600"><li>This card is the property of the school.</li><li>It is not transferable.</li><li>Report loss immediately.</li><li>Valid only with photo and signature.</li><li>For official use only.</li></ol><div className="mx-auto grid size-24 place-items-center bg-slate-900 text-xs text-white">QR CODE</div><div className="mt-5 text-center text-xs font-semibold">www.pal.education</div></article>
    </div></section>
  </main></div>;
}

function ModulePage({ active, onSelect }: { active: string; onSelect: (item: string) => void }) {
  const DedicatedScreen = menuScreens[active];
  if (DedicatedScreen) return <DedicatedScreen />;
  if (active === "All Students") return <StudentProfile onSelect={onSelect} />;
  if (active === "ID Card Maker") return <IDCardMaker />;
  if (active === "Attendance") return <AttendanceScreen />;
  if (active === "Fee Structure") return <FeeStructureScreen />;
  if (active === "Admission Enquiry") return <AdmissionEnquiryScreen />;
  if (active === "New Admission") return <NewAdmissionScreen />;
  if (active === "Reports") return <ReportsScreen />;
  if (active === "Admin Settings") return <AdminSettings />;
  if (formFields[active]) return <FormModule active={active} fields={formFields[active]} />;
  const config = screenConfigs[active] ?? {
    subtitle: `Manage ${active.toLowerCase()} records`,
    action: `Add ${active}`,
    filters: [`Search ${active.toLowerCase()}...`, "All Status", "Academic Year"],
    columns: ["Reference", "Title", "Category", "Date", "Status", "Action"],
    rows: [["DC-2026-001", active, "School Record", "25 Sep 2026", "Active", "View"]],
  };
  return <div className="min-h-[calc(100vh-3rem)] dashboard-bg pb-16">
    <Header title={active} subtitle={config.subtitle} action={config.action} />
    <main className="space-y-4 p-3 sm:p-5 xl:p-6">
      {config.stats && <StatsRow stats={config.stats} />}
      <DataTable config={config} />
    </main>
  </div>;
}

function AppContent() {
  const { activeScreen, appLoading, authenticated, closeSidebar, login, logout, navigate, openSidebar, sidebarOpen } = useAppController();
  const [passwordChangeOpen, setPasswordChangeOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const confirmSignOut = () => {
    setSignOutOpen(false);
    logout();
  };
  const selectScreen = (screen: string) => {
    if (screen === "Password Change") {
      closeSidebar();
      setPasswordChangeOpen(true);
      return;
    }
    if (screen === "Logout") {
      closeSidebar();
      setSignOutOpen(true);
      return;
    }
    navigate(screen);
  };

  return <div className={`${authenticated ? "fixed inset-0 overflow-hidden" : "min-h-screen"} w-full min-w-0 max-w-full overflow-x-clip bg-slate-50`}>
      {!authenticated ? <Login onLogin={login} /> : appLoading ? <AppSkeleton /> : <>
      <Sidebar open={sidebarOpen} active={activeScreen} onSelect={selectScreen} onClose={closeSidebar} />
      <div className="flex h-full w-full min-w-0 max-w-full flex-col overflow-hidden lg:pl-64">
        <div className="app-scroll min-h-0 flex-1 overscroll-contain overflow-x-clip overflow-y-auto">
          <button className="mobile-menu fixed left-4 top-3 z-30 grid size-10 place-items-center rounded-xl border border-white/80 text-white shadow-lg shadow-slate-900/10 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl active:scale-95 sm:top-5 lg:hidden" aria-label="Open navigation" onClick={openSidebar}><Icon name="menu" /></button>
          {activeScreen === "Dashboard" ? <Dashboard onSelect={navigate} /> : <ModulePage active={activeScreen} onSelect={navigate} />}
        </div>
        <Footer />
      </div>
      <PasswordChangePopup open={passwordChangeOpen} onClose={() => setPasswordChangeOpen(false)} />
      <SignOutPopup open={signOutOpen} onClose={() => setSignOutOpen(false)} onCancel={() => setSignOutOpen(false)} onConfirm={confirmSignOut} />
      </>}
    </div>;
}

export default function AppShell() {
  return <ThemeProvider><ToastProvider><AppContent /></ToastProvider></ThemeProvider>;
}
