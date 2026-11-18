import { io } from "socket.io-client"
import { SOCKET_URL } from "./endpoints"
import { getAuthUser, storeAuthUser, type AuthUser } from "../auth/session"

export type SettingsUpdated = {
  schoolName: string
  schoolPhone: string
  schoolWebsite: string
  logo: string | null
  academicYear: string
  [key: string]: unknown
}

export type RoleRealtime = {
  roleId: string
  roleName: string
  permissions: Record<string, boolean>
  [key: string]: unknown
}

export type NoticeRealtime = {
  id: number
  title: string
  body: string
  audience: string
  createdBy: string | null
  publishedOn: string | null
  expiresOn: string
  status: "Draft" | "Published" | "Scheduled"
  priority: "High" | "Normal"
  createdAt: string
  updatedAt: string
}

const socket = io(SOCKET_URL, { autoConnect: true })
socket.on("connect", () => {
  socket.emit("join", "settings")
  socket.emit("join", "roles")
  socket.emit("join", "notices")
  socket.emit("join", "users")
  socket.emit("join", "staff")
  socket.emit("join", "salary")
  socket.emit("join", "sessions")
})

export function onCurrentUserUpdated(listener: (user: AuthUser) => void) {
  const handleUpdate = (user: AuthUser) => {
    if (getAuthUser()?.id !== user.id) return
    storeAuthUser(user, Boolean(window.localStorage.getItem("pal-auth-token")))
    listener(user)
  }
  socket.on("user:updated", handleUpdate)
  return () => {
    socket.off("user:updated", handleUpdate)
  }
}

export function onSessionTerminated(listener: (payload: { id: number; token: string }) => void) {
  socket.on("user:session_terminated", listener)
  return () => {
    socket.off("user:session_terminated", listener)
  }
}

export type AcademicSessionRealtime = { id: number; name: string; current: boolean; [key: string]: unknown }

export function onAcademicSessionChanged(listener: (session: AcademicSessionRealtime) => void) {
  socket.on("session:current_changed", listener)
  socket.on("session:updated", listener)
  return () => {
    socket.off("session:current_changed", listener)
    socket.off("session:updated", listener)
  }
}

export function onSettingsUpdated(listener: (settings: SettingsUpdated) => void) {
  socket.on("settings:updated", listener)
  return () => {
    socket.off("settings:updated", listener)
  }
}

export function onRoleCreated(listener: (role: RoleRealtime) => void) {
  socket.on("role:created", listener)
  return () => socket.off("role:created", listener)
}

export function onRoleUpdated(listener: (role: RoleRealtime) => void) {
  socket.on("role:updated", listener)
  return () => socket.off("role:updated", listener)
}

export function onRoleDeleted(listener: (payload: { roleId: string }) => void) {
  socket.on("role:deleted", listener)
  return () => socket.off("role:deleted", listener)
}

export function onNoticeCreated(listener: (notice: NoticeRealtime) => void) {
  socket.on("notice:created", listener)
  return () => socket.off("notice:created", listener)
}

export function onNoticeUpdated(listener: (notice: NoticeRealtime) => void) {
  socket.on("notice:updated", listener)
  return () => socket.off("notice:updated", listener)
}

export function onNoticeDeleted(listener: (payload: { id: number }) => void) {
  socket.on("notice:deleted", listener)
  return () => socket.off("notice:deleted", listener)
}

export type StaffRealtime = {
  id: number
  [key: string]: unknown
}

export type PayrollRealtime = {
  id: number
  employeeId: string
  name: string
  designation: string
  department: string
  basic: number
  allowances: number
  deductions: number
  status: "Pending" | "Processed" | "Paid"
  month: string
  year: number
  [key: string]: unknown
}

export function onStaffCreated(listener: (staff: StaffRealtime) => void) {
  socket.on("staff:created", listener)
  return () => socket.off("staff:created", listener)
}

export function onStaffUpdated(listener: (staff: StaffRealtime) => void) {
  socket.on("staff:updated", listener)
  return () => socket.off("staff:updated", listener)
}

export function onStaffStatusChanged(listener: (staff: StaffRealtime) => void) {
  socket.on("staff:status_changed", listener)
  return () => socket.off("staff:status_changed", listener)
}

export function onStaffDeleted(listener: (payload: { id: number }) => void) {
  socket.on("staff:deleted", listener)
  return () => socket.off("staff:deleted", listener)
}

export function onPayrollCreated(listener: (payroll: PayrollRealtime) => void) {
  socket.on("payroll:created", listener)
  return () => socket.off("payroll:created", listener)
}

export function onPayrollUpdated(listener: (payroll: PayrollRealtime) => void) {
  socket.on("payroll:updated", listener)
  return () => socket.off("payroll:updated", listener)
}

export function onPayrollStatusChanged(listener: (payroll: PayrollRealtime) => void) {
  socket.on("payroll:status_changed", listener)
  return () => socket.off("payroll:status_changed", listener)
}

export function onPayrollDeleted(listener: (payload: { id: number }) => void) {
  socket.on("payroll:deleted", listener)
  return () => socket.off("payroll:deleted", listener)
}
