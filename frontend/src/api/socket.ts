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

const socket = io(SOCKET_URL, { autoConnect: true })
socket.on("connect", () => {
  socket.emit("join", "settings")
  socket.emit("join", "roles")
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
