export type NavigationIconName =
  | "admission" | "arrow" | "attendance" | "book" | "calendar"
  | "chart" | "checklist" | "dashboard" | "expense" | "fee"
  | "notice" | "people" | "person" | "report" | "settings"
  | "wallet" | "whatsapp" | "zap";

export type NavigationItem = {
  label: string;
  icon: NavigationIconName;
  accent?: "green" | "red" | "purple";
};

export type NavigationSection = {
  title: string;
  items: NavigationItem[];
};

export const navigation: NavigationSection[] = [
  { title: "Main", items: [{ label: "Dashboard", icon: "dashboard" }] },
  { title: "Students", items: [
    { label: "Admission Enquiry", icon: "admission" },
    { label: "New Admission", icon: "person" },
    { label: "All Students", icon: "people" },
    { label: "Passed Out Archive", icon: "book" },
    { label: "Promotion", icon: "report" },
  ] },
  { title: "Fees", items: [
    { label: "Fee Structure", icon: "checklist" },
    { label: "Fee Collection", icon: "wallet" },
    { label: "Quick Fee Collect", icon: "zap", accent: "green" },
    { label: "WhatsApp Reminder", icon: "whatsapp", accent: "green" },
    { label: "Fee Deletion Log", icon: "expense", accent: "red" },
  ] },
  { title: "Academics", items: [
    { label: "Attendance", icon: "attendance" },
    { label: "Attendance Report", icon: "chart" },
    { label: "Exams", icon: "report" },
    { label: "Marks Entry", icon: "admission" },
    { label: "Class Result", icon: "chart" },
    { label: "Subjects", icon: "book" },
    { label: "Class-Subject Map", icon: "people" },
    { label: "Exam Schedule", icon: "calendar" },
  ] },
  { title: "Finance", items: [
    { label: "Expenses", icon: "expense" },
    { label: "Reports", icon: "chart" },
    { label: "Income vs Expense", icon: "wallet", accent: "purple" },
  ] },
  { title: "Staff / Payroll", items: [
    { label: "Staff Management", icon: "person" },
    { label: "Salary Management", icon: "fee" },
    { label: "Salary Report", icon: "chart" },
  ] },
  { title: "Communication", items: [{ label: "Notices", icon: "notice" }] },
  { title: "Admin", items: [
    { label: "Admin Settings", icon: "settings" },
    { label: "User Management", icon: "people" },
    { label: "Sessions", icon: "calendar" },
    { label: "Settings", icon: "settings" },
  ] },
  { title: "Account", items: [
    { label: "Password Change", icon: "settings" },
    { label: "Logout", icon: "arrow", accent: "red" },
  ] },
];
