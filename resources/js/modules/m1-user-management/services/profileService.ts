import { api } from "@/lib/api"
import type { UserProfile } from "@/lib/types"

/** Only full_name is user-editable; email comes from the sign-in account, role/status are admin-managed. */
export type ProfileUpdate = Partial<Pick<UserProfile, "full_name">>

export const profileService = {
  async getProfile(_userId: string): Promise<UserProfile | null> {
    return api.get<UserProfile>("/api/profile")
  },

  /** The users row is created by the backend on registration; kept for API compatibility. */
  async ensureProfile(_userId: string, _email: string, _fullName: string): Promise<UserProfile> {
    return api.get<UserProfile>("/api/profile")
  },

  async updateProfile(_userId: string, update: ProfileUpdate): Promise<UserProfile> {
    return api.put<UserProfile>("/api/profile", update)
  },
} 