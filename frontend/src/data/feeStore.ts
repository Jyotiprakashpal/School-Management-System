import { useSyncExternalStore } from "react";

export type FeeHead = { id: number; name: string; amount: number; paid: number; selected: boolean };
export type Student = { id: number; name: string; adm: string; className: string; father: string; phone: string; fees: FeeHead[] };
export type Transaction = { receipt: string; studentId: number; heads: string; amount: number; date: string; mode: string; reference: string; remarks: string };
export type DeletionRecord = { amount: number; date: string; deletedBy: string; feeType: string; ipAddress: string; reason: string; receipt: string; student: string; studentId: string; mode: string };
export type FeeItem = { amount: string; className: string; frequency: string; id: number; name: string; year: string };

const head = (id: number, name: string, amount: number, paid: number): FeeHead => ({ id, name, amount, paid, selected: false });

const initialStudents: Student[] = [
  { id: 1, name: "Rahul Kumar", adm: "ADM-26-1001", className: "UKG-A", father: "Hari Prasad", phone: "9827142339", fees: [head(1, "Transport Fee", 500, 150), head(2, "Tuition Fee", 1200, 1200), head(3, "Examination Fee", 300, 300)] },
  { id: 2, name: "Ananya Sharma", adm: "ADM-26-1002", className: "Class 1-A", father: "Rakesh Sharma", phone: "9876501234", fees: [head(1, "Tuition Fee", 1400, 700), head(2, "Transport Fee", 600, 0), head(3, "Activity Fee", 250, 250)] },
  { id: 3, name: "Mohit Verma", adm: "ADM-26-1003", className: "Class 3-B", father: "Sunil Verma", phone: "9123456780", fees: [head(1, "Tuition Fee", 1600, 1600), head(2, "Examination Fee", 350, 350)] },
  { id: 4, name: "Priya Singh", adm: "ADM-26-1004", className: "Class 2-A", father: "Dinesh Singh", phone: "8800112233", fees: [head(1, "Tuition Fee", 1500, 500), head(2, "Library Fee", 200, 0), head(3, "Computer Lab Fee", 400, 100)] },
  { id: 5, name: "Aarav Gupta", adm: "ADM-26-1005", className: "Nursery-A", father: "Manoj Gupta", phone: "7007788990", fees: [head(1, "Tuition Fee", 1000, 1000), head(2, "Admission Fee", 800, 800)] },
  { id: 6, name: "Sneha Yadav", adm: "ADM-26-1006", className: "Class 4-A", father: "Ramesh Yadav", phone: "9455123456", fees: [head(1, "Tuition Fee", 1700, 850), head(2, "Transport Fee", 650, 650), head(3, "Examination Fee", 350, 0)] },
];

const initialTransactions: Transaction[] = [
  { receipt: "RC-2610-0105", studentId: 4, heads: "Computer Lab Fee", amount: 100, date: "2026-10-07", mode: "UPI", reference: "UPI-48213377", remarks: "" },
  { receipt: "RC-2610-0104", studentId: 6, heads: "Tuition Fee", amount: 850, date: "2026-10-05", mode: "Cash", reference: "", remarks: "First instalment" },
  { receipt: "RC-2609-0103", studentId: 2, heads: "Tuition Fee", amount: 700, date: "2026-09-29", mode: "Bank Transfer", reference: "NEFT-99120", remarks: "" },
  { receipt: "RC-2609-0102", studentId: 1, heads: "Transport Fee", amount: 50, date: "2026-09-26", mode: "Cash", reference: "", remarks: "" },
  { receipt: "RC-2609-0101", studentId: 1, heads: "Transport Fee", amount: 100, date: "2026-09-24", mode: "UPI", reference: "UPI-11872345", remarks: "" },
];

const initialStructure: FeeItem[] = [
  { id: 1, className: "UKG", name: "Tuition Fee", amount: "1200", year: "2027–28", frequency: "Monthly" },
  { id: 2, className: "UKG", name: "Transport Fee", amount: "5000", year: "2027–28", frequency: "Yearly" },
  { id: 3, className: "Class 1", name: "Tuition Fee", amount: "1500", year: "2027–28", frequency: "Monthly" },
  { id: 4, className: "Class 1", name: "Computer Fee", amount: "1800", year: "2027–28", frequency: "Half Yearly" },
  { id: 5, className: "LKG", name: "Tuition Fee", amount: "1000", year: "2027–28", frequency: "Monthly" },
  { id: 6, className: "LKG", name: "Admission Fee", amount: "2500", year: "2027–28", frequency: "One Time" },
  { id: 7, className: "Class 2", name: "Tuition Fee", amount: "1700", year: "2027–28", frequency: "Monthly" },
  { id: 8, className: "UKG", name: "Tuition Fee", amount: "1100", year: "2026–27", frequency: "Monthly" },
  { id: 9, className: "UKG", name: "Annual Fee", amount: "3000", year: "2026–27", frequency: "Yearly" },
  { id: 10, className: "Class 1", name: "Tuition Fee", amount: "1400", year: "2026–27", frequency: "Monthly" },
];

const initialDeletions: DeletionRecord[] = [
  { receipt: "RC-2609-0081", student: "Rahul Kumar", studentId: "ADM-26-1001", feeType: "Transport Fee", amount: 150, deletedBy: "superadmin", date: "2026-09-12T11:42:00", reason: "Duplicate payment entry", ipAddress: "192.168.1.24", mode: "Cash" },
  { receipt: "RC-2609-0063", student: "Mohit Verma", studentId: "ADM-26-1003", feeType: "Admission Fee", amount: 100, deletedBy: "admin", date: "2026-09-02T16:18:00", reason: "Incorrect fee type selected", ipAddress: "192.168.1.18", mode: "UPI" },
  { receipt: "RC-2608-0049", student: "Priya Singh", studentId: "ADM-26-1004", feeType: "Tuition Fee", amount: 500, deletedBy: "superadmin", date: "2026-08-28T09:32:00", reason: "Payment reversed after bank failure", ipAddress: "192.168.1.24", mode: "Bank Transfer" },
  { receipt: "RC-2608-0035", student: "Aarav Gupta", studentId: "ADM-26-1005", feeType: "Examination Fee", amount: 300, deletedBy: "accountant", date: "2026-08-16T13:07:00", reason: "Receipt generated against wrong student", ipAddress: "192.168.1.31", mode: "Cheque" },
];

type State = { students: Student[]; transactions: Transaction[]; structure: FeeItem[]; deletions: DeletionRecord[] };
let state: State = { students: initialStudents, transactions: initialTransactions, structure: initialStructure, deletions: initialDeletions };
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };

function makeHook<K extends keyof State>(key: K) {
  type Value = State[K];
  const setter = (next: Value | ((current: Value) => Value)) => {
    const value = typeof next === "function" ? (next as (current: Value) => Value)(state[key]) : next;
    state = { ...state, [key]: value };
    listeners.forEach((listener) => listener());
  };
  return (): [Value, typeof setter] => [useSyncExternalStore(subscribe, () => state[key]), setter];
}

export const useStudents = makeHook("students");
export const useTransactions = makeHook("transactions");
export const useStructure = makeHook("structure");
export const useDeletions = makeHook("deletions");

export const classBase = (className: string) => className.split("-")[0].trim();
export const feeBalance = (fee: FeeHead) => fee.amount - fee.paid;
export const studentPending = (student: Student) => student.fees.reduce((sum, fee) => sum + feeBalance(fee), 0);
export const nextReceiptNumber = (count: number) => {
  const now = new Date().toISOString();
  return `RC-${now.slice(2, 4)}${now.slice(5, 7)}-${String(101 + count).padStart(4, "0")}`;
};
