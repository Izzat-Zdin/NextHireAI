// JSON calls to the Laravel backend (same-origin, session cookie + CSRF token).
// Replaces the direct Supabase client of the original app: every data read/write
// goes through a Laravel controller that enforces ownership with Policies.

export class ApiError extends Error {
  status: number
  errors?: Record<string, string[]>
  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

/**
 * Laravel refreshes the XSRF-TOKEN cookie on every response, so it stays valid after a
 * logout → login in the same tab (Inertia never reloads the page, so the <meta> tag would
 * keep the first token and every later write would fail with 419). Fall back to the meta tag.
 */
function csrfHeaders(): Record<string, string> {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/)
  if (match?.[1]) return { "X-XSRF-TOKEN": decodeURIComponent(match[1]) }
  const meta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
  return meta?.content ? { "X-CSRF-TOKEN": meta.content } : {}
}

async function request<T>(method: string, url: string, body?: unknown, init?: { form?: FormData }): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
    ...csrfHeaders(),
  }
  let payload: BodyInit | undefined
  if (init?.form) {
    payload = init.form
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json"
    payload = JSON.stringify(body)
  }
  const response = await fetch(url, { method, headers, body: payload, credentials: "same-origin" })
  if (response.status === 204) return undefined as T
  const text = await response.text()
  let data: unknown = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }
  if (!response.ok) {
    if (response.status === 401 || response.status === 419) {
      // Session expired: go back to the login page like the original ProtectedRoute did.
      window.location.href = "/login"
    }
    const message =
      (data as { message?: string } | null)?.message ||
      (response.status === 403 ? "You do not have permission to do that." : `Request failed (${response.status}).`)
    throw new ApiError(message, response.status, (data as { errors?: Record<string, string[]> } | null)?.errors)
  }
  return data as T
}

export const api = {
  get: <T>(url: string) => request<T>("GET", url),
  /** Like `get`, but a 404 resolves to `null` (the pages' "not found" state, as Supabase `maybeSingle()` did). */
  getOrNull: async <T>(url: string): Promise<T | null> => {
    try {
      return await request<T>("GET", url)
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null
      throw error
    }
  },
  post: <T>(url: string, body?: unknown) => request<T>("POST", url, body),
  postForm: <T>(url: string, form: FormData) => request<T>("POST", url, undefined, { form }),
  put: <T>(url: string, body?: unknown) => request<T>("PUT", url, body),
  patch: <T>(url: string, body?: unknown) => request<T>("PATCH", url, body),
  delete: <T>(url: string) => request<T>("DELETE", url),
}

/** Builds a query string, skipping empty values. */
export function qs(params: Record<string, string | number | boolean | null | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue
    search.set(key, String(value))
  }
  const out = search.toString()
  return out ? `?${out}` : ""
}
