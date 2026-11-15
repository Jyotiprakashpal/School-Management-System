import { io } from "socket.io-client"
import { SOCKET_URL } from "./endpoints"

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
})

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
