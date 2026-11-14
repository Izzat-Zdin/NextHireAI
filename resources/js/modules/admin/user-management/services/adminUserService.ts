// Admin · User Management via the Laravel API (admin middleware).
// The backend refuses an admin changing their OWN role/status, like the original DB trigger did.
import type { InterviewSessionSummary, UserProfile, UserRole, UserStatus } from "@/lib/types"

export interface ListUsersParams {
  search?: string
  role?: UserRole | "all"
  status?: UserStatus | "all"
  page?: number
  pageSize?: number
}

export interface ListUsersResult {
  rows: UserProfile[]
  total: number
  page: number
  pageSize: number
}

/** Collapses whitespace; the backend escapes LIKE wildcards itself. */
export function escapeSearch(raw: string) {
  // TODO (Nada): Tukar semua whitespace berturut-turut kepada satu ruang dan trim:
  //   return raw.replace(/\s+/g, " ").trim()
  return raw
}

export async function listUsers({ search = "", role = "all", status = "all", page = 1, pageSize = 20 }: ListUsersParams = {}): Promise<ListUsersResult> {
  // TODO (Nada): GET /api/admin/users dengan query string (import { api, qs } from "@/lib/api"):
  //   return api.get<ListUsersResult>(
  //     `/api/admin/users${qs({ search: escapeSearch(search), role: role === "all" ? "" : role, status: status === "all" ? "" : status, page, pageSize })}`,
  //   )
  //   ("all" dihantar sebagai "" supaya qs() buang parameter itu → backend tidak menapis.)
  void search
  void role
  void status
  return Promise.resolve({ rows: [], total: 0, page, pageSize })
}

export interface UserStats {
  total: number
  active: number
  inactive: number
  admins: number
  newThisWeek: number
}

export async function getUserStats(): Promise<UserStats> {
  // TODO (Nada): return api.get<UserStats>("/api/admin/users/stats")
  return Promise.resolve({ total: 0, active: 0, inactive: 0, admins: 0, newThisWeek: 0 })
}

export async function getUser(userId: string): Promise<UserProfile | null> {
  // TODO (Nada): return api.getOrNull<UserProfile>(`/api/admin/users/${userId}`)
  //   (getOrNull: 404 → null, supaya page tunjuk keadaan "user not found".)
  void userId
  return Promise.resolve(null)
}

export interface UserActivity {
  resumes: { count: number; latestScore: number | null; latestAt: string | null }
  interviews: { total: number; finished: number; averageScore: number | null; latestAt: string | null }
  learning: { completed: number; inProgress: number; notStarted: number }
  recentSessions: InterviewSessionSummary[]
}

export async function getUserActivity(userId: string): Promise<UserActivity> {
  // TODO (Nada): return api.get<UserActivity>(`/api/admin/users/${userId}/activity`)
  void userId
  return Promise.resolve({
    resumes: { count: 0, latestScore: null, latestAt: null },
    interviews: { total: 0, finished: 0, averageScore: null, latestAt: null },
    learning: { completed: 0, inProgress: 0, notStarted: 0 },
    recentSessions: [],
  })
}

export function setStatus(userId: string, status: UserStatus): Promise<UserProfile> {
  // TODO (Nada): PATCH /api/admin/users/{userId}/status dengan body { status } → UserProfile terkini:
  //   return api.patch<UserProfile>(`/api/admin/users/${userId}/status`, { status })
  //   (422 bila admin cuba tukar status sendiri — ApiError.message dipaparkan oleh page.)
  void userId
  void status
  return Promise.reject(new Error("Belum dibina (TODO)"))
}

export function setRole(userId: string, role: UserRole): Promise<UserProfile> {
  // TODO (Nada): PATCH /api/admin/users/{userId}/role dengan body { role } → UserProfile terkini:
  //   return api.patch<UserProfile>(`/api/admin/users/${userId}/role`, { role })
  void userId
  void role
  return Promise.reject(new Error("Belum dibina (TODO)"))
}
