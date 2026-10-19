import type { ReactNode } from "react";
import { Button } from "../components";
import Header from "../ui/header";

type DashboardIconName = "admission" | "alert" | "arrow" | "attendance" | "calendar" | "chart" | "check" | "checklist" | "clock" | "download" | "expense" | "notice" | "people" | "rupee" | "trend" | "user" | "wallet" | "zap";

const iconPaths: Record<DashboardIconName, ReactNode> = {
  admission: <><path d="M12 3v18M3 12h18" /><circle cx="12" cy="12" r="9" /></>,
  alert: <><path d="m12 3 10 18H2L12 3Z" /><path d="M12 9v5M12 18h.01" /></>,
  arrow: <path d="m9 18 6-6-6-6" />,
  attendance: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18m-13 5 2 2 5-5" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
  chart: <path d="M4 19V9M10 19V5M16 19v-7M22 19V3" />,
  check: <path d="m5 12 4 4L19 6" />,
  checklist: <><path d="m4 6 1.5 1.5L8 5M4 12l1.5 1.5L8 11M4 18l1.5 1.5L8 17" /><path d="M11 6h9M11 12h9M11 18h9" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  download: <><path d="M12 3v13M7 11l5 5 5-5" /><path d="M4 21h16" /></>,
  expense: <><path d="M7 3h10v18H7z" /><path d="M9.5 7h5M9.5 11h5M9.5 15h3" /></>,
  notice: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
  people: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9" /></>,
  rupee: <><path d="M6 5h12M6 9h12" /><path d="M7 5c7 0 7 8 0 8l8 7" /></>,
  trend: <><path d="m3 17 6-6 4 4 8-9" /><path d="M15 6h6v6" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  wallet: <><path d="M4 6h14a2 2 0 0 1 2 2v11H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h13" /><path d="M16 11h6v5h-6a2.5 2.5 0 0 1 0-5Z" /></>,
  zap: <path d="m13 2-9 12h8l-1 8 9-13h-8l1-7Z" />,
};

function DashboardIcon({ name, className = "size-5" }: { name: DashboardIconName; className?: string }) {
  return <svg className={className} aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{iconPaths[name]}</svg>;
}

const stats = [
  { value: "1,248", label: "Active Students", helper: "+38 this academic year", icon: "people" as DashboardIconName, color: "teal", trend: "+3.1%" },
  { value: "92.4%", label: "Today's Attendance", helper: "1,153 students present", icon: "attendance" as DashboardIconName, color: "green", trend: "+1.8%" },
  { value: "₹8.42L", label: "Fees Collected", helper: "82% of monthly target", icon: "rupee" as DashboardIconName, color: "amber", trend: "+12.6%" },
  { value: "₹1.26L", label: "Pending Fees", helper: "86 students have dues", icon: "alert" as DashboardIconName, color: "red", trend: "-8.4%" },
];

const actions = [
  { label: "New Admission", destination: "New Admission", icon: "admission" as DashboardIconName, color: "bg-teal-50 text-teal-600" },
  { label: "Collect Fee", destination: "Quick Fee Collect", icon: "zap" as DashboardIconName, color: "bg-emerald-50 text-emerald-600" },
  { label: "Mark Attendance", destination: "Attendance", icon: "attendance" as DashboardIconName, color: "bg-blue-50 text-blue-600" },
  { label: "Manage Expenses", destination: "Expenses", icon: "expense" as DashboardIconName, color: "bg-amber-50 text-amber-600" },
  { label: "Examinations", destination: "Exams", icon: "checklist" as DashboardIconName, color: "bg-violet-50 text-violet-600" },
  { label: "Manage Notices", destination: "Notices", icon: "notice" as DashboardIconName, color: "bg-rose-50 text-rose-600" },
  { label: "View Reports", destination: "Reports", icon: "chart" as DashboardIconName, color: "bg-fuchsia-50 text-fuchsia-600" },
  { label: "Fee Reminder", destination: "WhatsApp Reminder", icon: "notice" as DashboardIconName, color: "bg-emerald-50 text-emerald-600" },
];

const feeMonths = [
  { month: "Apr", value: "₹6.1L", height: "h-3/5" },
  { month: "May", value: "₹6.8L", height: "h-2/3" },
  { month: "Jun", value: "₹5.7L", height: "h-1/2" },
  { month: "Jul", value: "₹7.5L", height: "h-3/4" },
  { month: "Aug", value: "₹7.9L", height: "h-3/4" },
  { month: "Sep", value: "₹8.4L", height: "h-4/5" },
  { month: "Oct", value: "₹7.2L", height: "h-2/3" },
  { month: "Nov", value: "₹8.9L", height: "h-5/6" },
];

const classData = [
  { name: "Nursery–UKG", students: 184, share: "w-1/2", color: "bg-cyan-500" },
  { name: "Classes 1–3", students: 286, share: "w-4/5", color: "bg-teal-500" },
  { name: "Classes 4–6", students: 312, share: "w-11/12", color: "bg-violet-500" },
  { name: "Classes 7–8", students: 238, share: "w-3/4", color: "bg-amber-500" },
  { name: "Classes 9–10", students: 228, share: "w-2/3", color: "bg-blue-500" },
];

const payments = [
  { receipt: "RC-2711-1088", name: "Ananya Sharma", className: "Class 8-A", mode: "UPI", amount: "₹12,500", time: "10 min ago", initials: "AS" },
  { receipt: "RC-2711-1087", name: "Aarav Singh", className: "Class 5-B", mode: "Cash", amount: "₹8,200", time: "24 min ago", initials: "AS" },
  { receipt: "RC-2711-1086", name: "Meera Patel", className: "Class 10-A", mode: "Card", amount: "₹15,000", time: "42 min ago", initials: "MP" },
  { receipt: "RC-2711-1085", name: "Kabir Verma", className: "Class 2-A", mode: "UPI", amount: "₹6,800", time: "1 hr ago", initials: "KV" },
];

const defaulters = [
  { name: "Rohan Gupta", className: "Class 9-B", due: "₹18,400", days: "48 days", initials: "RG" },
  { name: "Ishita Khan", className: "Class 7-A", due: "₹14,200", days: "35 days", initials: "IK" },
  { name: "Vivaan Das", className: "Class 10-B", due: "₹12,750", days: "29 days", initials: "VD" },
];

function Panel({ title, subtitle, icon, action, actionClassName = "", actionIcon = true, actionIconName, onAction, children }: { title: string; subtitle?: string; icon: DashboardIconName; action?: string; actionClassName?: string; actionIcon?: boolean; actionIconName?: DashboardIconName; onAction?: () => void; children: ReactNode }) {
  return <section className="panel w-full min-w-0">
    <div className="flex min-h-16 items-center justify-between gap-3 border-b border-slate-100 px-4 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-600"><DashboardIcon name={icon} className="size-4" /></span>
        <div className="min-w-0"><div className="font-display text-sm font-bold text-slate-900">{title}</div>{subtitle && <p className="mt-0.5 truncate text-xs text-slate-400">{subtitle}</p>}</div>
      </div>
      {action && <Button variant="outline" className={`shrink-0 px-3 py-2 shadow-none ${actionIconName ? actionClassName : "border-0 bg-transparent px-2"} `} onClick={onAction}>
        {actionIconName && <DashboardIcon name={actionIconName} className="size-3.5" />}{action}{actionIcon && !actionIconName && <DashboardIcon name="arrow" className="size-3" />}
      </Button>}
    </div>
    {children}
  </section>;
}

type DashboardProps = {
  onSelect: (item: string) => void;
};

export default function Dashboard({ onSelect }: DashboardProps) {
  const today = new Date();
  const currentISTHour = Number(new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Kolkata",
  }).format(today));
  const greeting = currentISTHour < 12 ? "Good morning" : currentISTHour < 17 ? "Good afternoon" : "Good evening";
  const currentDate = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(today);
  return <div className="min-h-screen">
    <Header title="Dashboard" subtitle={`${greeting}, Super Administrator — here is today's school overview`} />

    <main className="dashboard-bg space-y-5 p-3 pb-20 sm:p-6 sm:pb-20 xl:p-8">
      <section className="dashboard-welcome relative overflow-hidden rounded-2xl">
        <div className="absolute -right-10 -top-20 size-52 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 right-1/3 size-44 rounded-full bg-white/5 blur-2xl" />
        <div className="relative grid gap-5 p-5 sm:p-6 md:grid-cols-[1fr_auto] md:items-center">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/15 text-white ring-1 ring-inset ring-white/20"><DashboardIcon name="trend" className="size-5" /></span>
              <div className="min-w-0">
                <div className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl">{greeting}, Admin</div>
                <div className="mt-1 truncate text-xs font-medium text-white/70 sm:text-sm">{currentDate}</div>
              </div>
            </div>
            <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-100"><span className="size-1.5 rounded-full bg-emerald-300 shadow-sm" />All systems operational</span>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { value: "74", label: "Staff present", icon: "user" as DashboardIconName, tone: "text-cyan-200" },
              { value: "12", label: "Enquiries", icon: "admission" as DashboardIconName, tone: "text-violet-200" },
              { value: "3", label: "Attention", icon: "alert" as DashboardIconName, tone: "text-amber-200" },
            ].map((item) => <div key={item.label} className="min-w-0 rounded-xl border border-white/10 bg-white/10 px-2 py-3 text-center shadow-sm backdrop-blur-sm sm:min-w-28 sm:px-3">
              <DashboardIcon name={item.icon} className={`mx-auto mb-1.5 size-4 ${item.tone}`} />
              <div className="font-display text-lg font-bold text-white">{item.value}</div>
              <div className="mt-0.5 text-xs leading-4 text-white/65">{item.label}</div>
            </div>)}
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => <article key={stat.label} className={`metric metric-${stat.color} min-w-0 sm:gap-3 sm:px-4 sm:py-4`}>
          <span className={`absolute right-3 top-3 z-10 rounded-full px-2 py-1 text-xs font-bold ${stat.trend.startsWith("+") ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"}`}>{stat.trend}</span>
          <div className={`metric-icon metric-icon-${stat.color} size-11 sm:size-12`}><DashboardIcon name={stat.icon} className="size-5 sm:size-6" /></div>
          <div className="min-w-0 flex-1 pr-1">
            <div className="pr-10 font-display text-xl font-bold leading-tight text-slate-950 sm:text-2xl xl:pr-8 xl:text-xl 2xl:text-2xl">{stat.value}</div>
            <div className="mt-1 text-sm font-semibold text-slate-800">{stat.label}</div>
            <div className="mt-1 text-xs leading-4 text-slate-500">{stat.helper}</div>
          </div>
        </article>)}
      </div>

      <Panel title="Quick Actions" icon="zap">
        <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4 lg:grid-cols-8">
          {actions.map((action) => <Button key={action.label} variant="outline" onClick={() => onSelect(action.destination)} className="flex min-h-24 flex-col items-center justify-center gap-2 border-slate-100 bg-white p-2 text-center shadow-none hover:-translate-y-0.5 hover:border-teal-200 hover:bg-teal-50/50 hover:shadow-md">
            <span className={`grid size-10 place-items-center rounded-xl ${action.color}`}><DashboardIcon name={action.icon} className="size-5" /></span>
            <span className="text-xs font-semibold text-slate-700">{action.label}</span>
          </Button>)}
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2"><Panel title="Fee Collection Overview" subtitle="Monthly collections for academic year 2027–28" icon="chart" action="View report" actionIconName="chart" actionClassName="border-violet-100 bg-violet-50 text-violet-700 hover:border-violet-200 hover:bg-violet-100" onAction={() => onSelect("Reports")}>
          <div className="p-4 sm:p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div><div className="font-display text-2xl font-bold text-slate-950">₹58.5 lakh</div><div className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600"><DashboardIcon name="trend" className="size-3.5" />12.6% higher than last year</div></div>
              <div className="flex gap-4 text-xs text-slate-500"><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-teal-500" />Collected</span><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-slate-200" />Target</span></div>
            </div>
            <div className="nav-scroll mt-5 overflow-x-auto pb-2">
              <div className="flex h-56 min-w-2xl items-end justify-between gap-4 border-b border-slate-200 px-1">
                {feeMonths.map((item, index) => <div key={item.month} className="flex h-full min-w-16 flex-1 flex-col items-center justify-end">
                  <div className="mb-2 text-xs font-semibold text-slate-600">{item.value}</div>
                  <div className={`dashboard-fee-bar group relative w-10 rounded-t-lg transition ${item.height} ${index === feeMonths.length - 1 ? "dashboard-fee-bar-active shadow-lg" : ""}`}>
                    <span className="absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white group-hover:block">{item.value}</span>
                  </div>
                  <div className="py-2 text-xs font-medium text-slate-500">{item.month}</div>
                </div>)}
              </div>
            </div>
            <p className="mt-2 flex items-center gap-1 text-xs text-slate-400 sm:hidden"><DashboardIcon name="arrow" className="size-3 rotate-180" />Swipe to view all months<DashboardIcon name="arrow" className="size-3" /></p>
          </div>
        </Panel></div>

        <Panel title="Attendance Health" subtitle="Today across all classes" icon="attendance" action="Details" actionIconName="attendance" actionClassName="border-teal-100 bg-teal-50 text-teal-700 hover:border-teal-200 hover:bg-teal-100" onAction={() => onSelect("Attendance Report")}>
          <div className="min-w-0 p-4 sm:p-5">
            <div className="dashboard-attendance-ring mx-auto grid size-32 place-items-center rounded-full p-2.5 shadow-xl sm:size-40 sm:p-3">
              <div className="grid size-full place-items-center rounded-full bg-white text-center"><div><div className="font-display text-2xl font-extrabold leading-none text-slate-950 sm:text-3xl">92.4%</div><div className="mx-auto mt-1 w-20 text-center text-xs leading-4 text-slate-400">Overall attendance</div></div></div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-1.5 text-center sm:mt-6 sm:gap-2">
              <div className="min-w-0 rounded-xl bg-emerald-50 px-1 py-3 sm:p-3"><div className="font-display text-sm font-bold text-emerald-600 sm:text-base">1,153</div><div className="mt-1 text-xs text-slate-500">Present</div></div>
              <div className="min-w-0 rounded-xl bg-red-50 px-1 py-3 sm:p-3"><div className="font-display text-sm font-bold text-red-500 sm:text-base">71</div><div className="mt-1 text-xs text-slate-500">Absent</div></div>
              <div className="min-w-0 rounded-xl bg-amber-50 px-1 py-3 sm:p-3"><div className="font-display text-sm font-bold text-amber-600 sm:text-base">24</div><div className="mt-1 text-xs text-slate-500">Leave</div></div>
            </div>
            <div className="mt-4 flex flex-col gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs sm:flex-row sm:items-center sm:justify-between"><span className="text-amber-800">4 classes not submitted</span><Button variant="outline" className="w-full border-amber-200 bg-white px-2 py-1.5 text-amber-700 sm:w-auto" onClick={() => onSelect("Attendance")}>Review</Button></div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Students by Level" subtitle="1,248 active students across 28 sections" icon="people" action="All students" actionIconName="people" actionClassName="border-teal-100 bg-teal-50 text-teal-700 hover:border-teal-200 hover:bg-teal-100" onAction={() => onSelect("All Students")}>
          <div className="space-y-4 p-5">
            {classData.map((item) => <div key={item.name}>
              <div className="flex items-center justify-between gap-3 text-xs"><span className="font-semibold text-slate-700">{item.name}</span><span className="text-slate-500">{item.students} students</span></div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${item.share} ${item.color}`} /></div>
            </div>)}
            <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center">
              <div><div className="font-display text-base font-bold text-slate-900">28</div><div className="text-xs text-slate-400">Sections</div></div>
              <div><div className="font-display text-base font-bold text-slate-900">44.6</div><div className="text-xs text-slate-400">Avg. class size</div></div>
              <div><div className="font-display text-base font-bold text-emerald-600">98.7%</div><div className="text-xs text-slate-400">Active</div></div>
            </div>
          </div>
        </Panel>

        <Panel title="Recent Payments" subtitle="Latest fee transactions received today" icon="wallet" action="View all" actionIconName="wallet" actionClassName="border-emerald-100 bg-emerald-50 text-emerald-700 hover:border-emerald-200 hover:bg-emerald-100" onAction={() => onSelect("Fee Collection")}>
          <div className="divide-y divide-slate-100">
            {payments.map((payment) => <div key={payment.receipt} className="flex items-center gap-3 p-4 sm:px-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-xs font-bold text-teal-700">{payment.initials}</span>
              <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-slate-800">{payment.name}</div><div className="mt-1 flex flex-wrap gap-x-2 text-xs text-slate-400"><span>{payment.className}</span><span>{payment.receipt}</span><span>{payment.mode}</span></div></div>
              <div className="text-right"><div className="text-sm font-bold text-emerald-600">{payment.amount}</div><div className="mt-1 text-xs text-slate-400">{payment.time}</div></div>
            </div>)}
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-5 py-3 text-xs"><span className="text-slate-500">Today's total · 46 payments</span><strong className="text-slate-800">₹2,84,600</strong></div>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Fee Follow-up" subtitle="Students with the highest outstanding balances" icon="alert" action="Manage dues" actionIconName="alert" actionClassName="border-amber-100 bg-amber-50 text-amber-700 hover:border-amber-200 hover:bg-amber-100" onAction={() => onSelect("WhatsApp Reminder")}>
          <div className="divide-y divide-slate-100">
            {defaulters.map((student, index) => <div key={student.name} className="flex items-center gap-3 p-4 sm:px-5">
              <span className={`grid size-10 shrink-0 place-items-center rounded-xl text-xs font-bold ${index === 0 ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`}>{student.initials}</span>
              <div className="min-w-0 flex-1"><div className="text-sm font-semibold text-slate-800">{student.name}</div><div className="mt-1 text-xs text-slate-400">{student.className} · overdue {student.days}</div></div>
              <div className="text-right"><div className="text-sm font-bold text-red-500">{student.due}</div><Button variant="outline" className="mt-1 border-0 bg-transparent p-0 text-xs text-teal-600 shadow-none" onClick={() => onSelect("Quick Fee Collect")}>Collect now</Button></div>
            </div>)}
          </div>
          <div className="border-t border-slate-100 bg-red-50/50 px-5 py-3 text-xs text-red-700">86 students have a combined outstanding balance of <strong>₹1,26,400</strong>.</div>
        </Panel>

        <Panel title="Upcoming Schedule" subtitle="Next events and academic deadlines" icon="calendar" action="Calendar" actionIconName="calendar" actionClassName="border-blue-100 bg-blue-50 text-blue-700 hover:border-blue-200 hover:bg-blue-100" onAction={() => onSelect("Exam Schedule")}>
          <div className="space-y-1 p-4">
            {[
              { date: "28", month: "NOV", title: "Class 10 Pre-board Meeting", copy: "Conference Hall · 10:30 AM", color: "bg-violet-50 text-violet-600" },
              { date: "30", month: "NOV", title: "Fee payment deadline", copy: "Second term installment", color: "bg-red-50 text-red-600" },
              { date: "04", month: "DEC", title: "Unit Test II begins", copy: "Classes 6 to 10", color: "bg-blue-50 text-blue-600" },
              { date: "09", month: "DEC", title: "Parent–Teacher Meeting", copy: "All classes · 9:00 AM", color: "bg-emerald-50 text-emerald-600" },
            ].map((event) => <div key={`${event.date}-${event.title}`} className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-slate-50">
              <span className={`grid size-11 shrink-0 place-items-center rounded-xl text-center ${event.color}`}><span><span className="block font-display text-sm font-bold leading-none">{event.date}</span><span className="mt-1 block text-xs font-bold">{event.month}</span></span></span>
              <div><div className="text-xs font-bold text-slate-800">{event.title}</div><div className="mt-1 text-xs text-slate-400">{event.copy}</div></div>
            </div>)}
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Recent Activity" subtitle="Latest updates from your team" icon="clock">
          <div className="space-y-0 p-5">
            {[
              { title: "34 attendance records submitted", user: "Priya Mehta · Class 8-A", time: "8 minutes ago", icon: "attendance" as DashboardIconName, color: "bg-emerald-50 text-emerald-600" },
              { title: "New student admission completed", user: "Ayaan Qureshi · Class 4-B", time: "35 minutes ago", icon: "admission" as DashboardIconName, color: "bg-teal-50 text-teal-600" },
              { title: "Salary report generated", user: "Administrator · November 2027", time: "1 hour ago", icon: "download" as DashboardIconName, color: "bg-violet-50 text-violet-600" },
              { title: "School holiday notice published", user: "Super Administrator · All users", time: "2 hours ago", icon: "notice" as DashboardIconName, color: "bg-amber-50 text-amber-600" },
            ].map((activity, index, list) => <div key={activity.title} className="flex gap-3">
              <div className="flex flex-col items-center"><span className={`grid size-9 shrink-0 place-items-center rounded-xl ${activity.color}`}><DashboardIcon name={activity.icon} className="size-4" /></span>{index < list.length - 1 && <span className="my-1 h-8 w-px bg-slate-200" />}</div>
              <div className="flex-1 pb-4"><div className="text-xs font-bold text-slate-800">{activity.title}</div><div className="mt-1 text-xs text-slate-400">{activity.user}</div></div>
              <span className="whitespace-nowrap text-xs text-slate-400">{activity.time}</span>
            </div>)}
          </div>
        </Panel>

        <Panel title="Latest Notices" subtitle="Announcements visible to your school community" icon="notice" action="Manage" actionIcon={false} actionIconName="notice" actionClassName="border-rose-100 bg-rose-50 text-rose-700 hover:border-rose-200 hover:bg-rose-100" onAction={() => onSelect("Notices")}>
          <div className="divide-y divide-slate-100">
            {[
              { title: "Winter uniform guidelines", audience: "Students & Parents", date: "27 Nov", tone: "bg-blue-500" },
              { title: "School closed for Guru Nanak Jayanti", audience: "Everyone", date: "25 Nov", tone: "bg-amber-500" },
              { title: "Pre-board examination timetable", audience: "Classes 10-A & 10-B", date: "23 Nov", tone: "bg-violet-500" },
              { title: "December transport fee reminder", audience: "Transport students", date: "21 Nov", tone: "bg-emerald-500" },
            ].map((notice) => <div key={notice.title} className="flex items-center gap-3 px-5 py-4">
              <span className={`size-2.5 shrink-0 rounded-full ${notice.tone}`} />
              <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-slate-800">{notice.title}</div><div className="mt-1 text-xs text-slate-400">{notice.audience}</div></div>
              <span className="text-xs text-slate-400">{notice.date}</span>
            </div>)}
          </div>
        </Panel>
      </div>
    </main>
  </div>;
}
