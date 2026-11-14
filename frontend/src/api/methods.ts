export type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

const getErrorMessage = (payload: unknown, fallback: string) => {
  if (typeof payload === "object" && payload !== null && "error" in payload) {
    const error = (payload as { error?: unknown }).error
    if (typeof error === "string") return error
  }
  if (typeof payload === "object" && payload !== null && "message" in payload) {
    const message = (payload as { message?: unknown }).message
    if (typeof message === "string") return message
  }
  return fallback
}

export async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...init } = options
  const token =
    window.localStorage.getItem("pal-auth-token") ??
    window.sessionStorage.getItem("pal-auth-token")
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })

  const contentType = response.headers.get("content-type")
  const payload = contentType?.includes("application/json")
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(payload, `Request failed with status ${response.status}`),
      response.status,
    )
  }

  return payload as T
}

export const get = <T>(url: string, options?: Omit<RequestOptions, "method" | "body">) =>
  request<T>(url, { ...options, method: "GET" })

export const post = <T>(url: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
  request<T>(url, { ...options, method: "POST", body })

export async function upload<T>(url: string, body: FormData): Promise<T> {
  const token =
    window.localStorage.getItem("pal-auth-token") ??
    window.sessionStorage.getItem("pal-auth-token")
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body,
  })
  const contentType = response.headers.get("content-type")
  const payload = contentType?.includes("application/json")
    ? await response.json()
    : await response.text()
  if (!response.ok) {
    throw new ApiError(getErrorMessage(payload, `Request failed with status ${response.status}`), response.status)
  }
  return payload as T
}

export const put = <T>(url: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
  request<T>(url, { ...options, method: "PUT", body })

export const del = <T>(url: string, options?: Omit<RequestOptions, "method" | "body">) =>
  request<T>(url, { ...options, method: "DELETE" })

export { del as delete }
