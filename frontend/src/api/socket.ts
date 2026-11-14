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

const socket = io(SOCKET_URL, { autoConnect: true })
socket.on("connect", () => socket.emit("join", "settings"))

export function onSettingsUpdated(listener: (settings: SettingsUpdated) => void) {
  socket.on("settings:updated", listener)
  return () => {
    socket.off("settings:updated", listener)
  }
}
