import type { ComponentType } from "react";
import AdmissionEnquiry from "./admission-enquiry";
import AllStudents from "./all-students";
import Attendance from "./attendance";
import AttendanceReport from "./attendance-report";
import ClassResult from "./class-result";
import ClassSubjectMap from "./class-subject-map";
import ExamSchedule from "./exam-schedule";
import Exams from "./exams";
import Expenses from "./expenses";
import FeeCollection from "./fee-collection";
import FeeDeletionLog from "./fee-deletion-log";
import FeeStructure from "./fee-structure";
import IncomeVsExpense from "./income-vs-expense";
import MarksEntry from "./marks-entry";
import NewAdmission from "./new-admission";
import Notices from "./notices";
import PassedOutArchive from "./passed-out-archive";
import Promotion from "./promotion";
import QuickFeeCollect from "./quick-fee-collect";
import Reports from "./reports";
import SalaryManagement from "./salary-management";
import SalaryReport from "./salary-report";
import Settings from "./settings";
import Sessions from "./sessions";
import StaffManagement from "./staff-management";
import Subjects from "./subjects";
import UserManagement from "./user-management";
import WhatsAppReminder from "./whatsapp-reminder";

export const menuScreens: Record<string, ComponentType> = {
  "Admission Enquiry": AdmissionEnquiry,
  "All Students": AllStudents,
  "New Admission": NewAdmission,
  "Passed Out Archive": PassedOutArchive,
  "Promotion": Promotion,
  "Fee Structure": FeeStructure,
  "Fee Collection": FeeCollection,
  "Quick Fee Collect": QuickFeeCollect,
  "WhatsApp Reminder": WhatsAppReminder,
  "Fee Deletion Log": FeeDeletionLog,
  "Attendance": Attendance,
  "Attendance Report": AttendanceReport,
  "Exams": Exams,
  "Marks Entry": MarksEntry,
  "Class Result": ClassResult,
  "Subjects": Subjects,
  "Class-Subject Map": ClassSubjectMap,
  "Exam Schedule": ExamSchedule,
  "Expenses": Expenses,
  "Reports": Reports,
  "Income vs Expense": IncomeVsExpense,
  "Staff Management": StaffManagement,
  "Salary Management": SalaryManagement,
  "Salary Report": SalaryReport,
  "Settings": Settings,
  "Sessions": Sessions,
  "Notices": Notices,
  "User Management": UserManagement,
};
