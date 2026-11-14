
const LOCAL_API_URL = "http://localhost:5000/api"
const LOCAL_SOCKET_URL = "http://localhost:5000"
const PRODUCTION_API_URL = "https://school-management-system-1mmw.onrender.com/api"
const PRODUCTION_SOCKET_URL = "https://school-management-system-1mmw.onrender.com"

function normalizeUrl(url: string) {
  return url.replace(/\/+$/, "")
}

function isLocalhostUrl(url: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(url)
}

function isLocalFrontend() {
  if (typeof window === "undefined") return false
  return /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname)
}

function resolveUrl(envUrl: string | undefined, productionUrl: string) {
  if (!envUrl) return productionUrl

  const normalizedUrl = normalizeUrl(envUrl)
  if (import.meta.env.PROD && isLocalhostUrl(normalizedUrl)) {
    return productionUrl
  }

  return normalizedUrl
}

export const API_BASE = resolveUrl(import.meta.env.VITE_API_URL, isLocalFrontend() ? LOCAL_API_URL : PRODUCTION_API_URL)

export const SOCKET_URL = resolveUrl(
  import.meta.env.VITE_SOCKET_URL,
  isLocalFrontend() ? LOCAL_SOCKET_URL : PRODUCTION_SOCKET_URL,
)

export const API_ENDPOINTS = {
  SYSTEM_HEALTH: "/health",
  NOTIFICATIONS: "/notifications",

  LOGIN: "/users/login",
  CHANGE_PASSWORD: "/users/change-password",
  FORGOT_PASSWORD: "/users/forgot-password",
  SESSIONS: "/sessions",
  ROLES: "/roles",
  SETTINGS: "/settings",
  SETTINGS_LOGO: "/settings/logo",
  USER: "/users",
  
  RESET_PASSWORD: "/users/reset-password",
  STUDENTS: "/students",
  ADMISSIONS: "/admissions",
  ADMISSION_ENQUIRIES: "/admission-enquiries",
  ATTENDANCE: "/attendance",
  EXAMS: "/exams",
  EXAM_SCHEDULES: "/exam-schedules",
  MARKS: "/marks",
  CLASS_RESULTS: "/class-results",
  SUBJECTS: "/subjects",
  CLASS_SUBJECT_MAPS: "/class-subject-maps",
  FEES: "/fees",
  FEE_COLLECTIONS: "/fee-collections",
  EXPENSES: "/expenses",
  REPORTS: "/reports",
  STAFF: "/staff",
  SALARY: "/salary",
  
  ADMIN_SETTINGS: "/admin-settings",
  BACKUP: "/backup",
  DOCUMENTS: "/documents",
} 
