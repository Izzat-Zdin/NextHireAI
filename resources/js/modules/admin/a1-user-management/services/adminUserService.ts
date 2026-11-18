// Admin · User Management via the Laravel API (admin middleware).
// The backend refuses an admin changing their OWN role/status, like the original DB trigger did.
import { api, qs } from "@/lib/api"
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
  return raw.replace(/\s+/g, " ").trim()
}

export async function listUsers({ search = "", role = "all", status = "all", page = 1, pageSize = 20 }: ListUsersParams = {}): Promise<ListUsersResult> {
  return api.get<ListUsersResult>(
    `/api/admin/users${qs({ search: escapeSearch(search), role: role === "all" ? "" : role, status: status === "all" ? "" : status, page, pageSize })}`,
  )
}

export interface UserStats {
  total: number
  active: number
  inactive: number
  admins: number
  newThisWeek: number
}

export async function getUserStats(): Promise<UserStats> {
  return api.get<UserStats>("/api/admin/users/stats")
}

export async function getUser(userId: string): Promise<UserProfile | null> {
  return api.getOrNull<UserProfile>(`/api/admin/users/${userId}`)
}

export interface UserActivity {
  resumes: { count: number; latestScore: number | null; latestAt: string | null }
  interviews: { total: number; finished: number; averageScore: number | null; latestAt: string | null }
  learning: { completed: number; inProgress: number; notStarted: number }
  recentSessions: InterviewSessionSummary[]
}

export async function getUserActivity(userId: string): Promise<UserActivity> {
  return api.get<UserActivity>(`/api/admin/users/${userId}/activity`)
}

export function setStatus(userId: string, status: UserStatus): Promise<UserProfile> {
  return api.patch<UserProfile>(`/api/admin/users/${userId}/status`, { status })
}

export function setRole(userId: string, role: UserRole): Promise<UserProfile> {
  return api.patch<UserProfile>(`/api/admin/users/${userId}/role`, { role })
}