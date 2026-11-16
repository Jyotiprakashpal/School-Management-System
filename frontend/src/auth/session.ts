export type AuthUser = {
  id: number
  username: string
  name: string
  role: string
  email?: string | null
  status?: string
}

const AUTH_USER_KEY = "pal-auth-user"
const AUTH_USER_CHANGED_EVENT = "pal-auth-user-changed"

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem("pal-auth-token")
    ? window.localStorage
    : window.sessionStorage.getItem("pal-auth-token")
      ? window.sessionStorage
      : null
}

export function getAuthUser(): AuthUser | null {
  const storage = getStorage()
  if (!storage) return null
  const value = storage.getItem(AUTH_USER_KEY)
  if (!value) return null
  try {
    return JSON.parse(value) as AuthUser
  } catch {
    return null
  }
}

export function storeAuthUser(user: AuthUser, rememberMe: boolean): void {
  const storage = rememberMe ? window.localStorage : window.sessionStorage
  const otherStorage = rememberMe ? window.sessionStorage : window.localStorage
  storage.setItem(AUTH_USER_KEY, JSON.stringify(user))
  otherStorage.removeItem(AUTH_USER_KEY)
  window.dispatchEvent(new Event(AUTH_USER_CHANGED_EVENT))
}

export function clearAuthSession(): void {
  window.localStorage.removeItem("pal-auth-token")
  window.sessionStorage.removeItem("pal-auth-token")
  window.localStorage.removeItem(AUTH_USER_KEY)
  window.sessionStorage.removeItem(AUTH_USER_KEY)
  window.dispatchEvent(new Event(AUTH_USER_CHANGED_EVENT))
}

export function onAuthUserChanged(listener: () => void): () => void {
  window.addEventListener(AUTH_USER_CHANGED_EVENT, listener)
  window.addEventListener("storage", listener)
  return () => {
    window.removeEventListener(AUTH_USER_CHANGED_EVENT, listener)
    window.removeEventListener("storage", listener)
  }
}
