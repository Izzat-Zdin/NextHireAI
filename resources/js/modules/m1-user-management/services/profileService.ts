import type { UserProfile } from "@/lib/types"

/** Only full_name is user-editable; email comes from the sign-in account, role/status are admin-managed. */
export type ProfileUpdate = Partial<Pick<UserProfile, "full_name">>

export const profileService = {
  async getProfile(_userId: string): Promise<UserProfile | null> {
    // TODO (Nada): GET /api/profile → pulangkan UserProfile pengguna yang log masuk.
    //   return api.get<UserProfile>("/api/profile")      (import { api } from "@/lib/api")
    //   (_userId tidak digunakan — backend guna sesi; parameter dikekalkan untuk keserasian.)
    return Promise.resolve(null)
  },

  /** The users row is created by the backend on registration; kept for API compatibility. */
  async ensureProfile(_userId: string, _email: string, _fullName: string): Promise<UserProfile> {
    // TODO (Nada): Baris users dicipta oleh backend semasa register, jadi fungsi ini hanya
    //   membaca profil: return api.get<UserProfile>("/api/profile")
    throw new Error("Belum dibina (TODO)")
  },

  async updateProfile(_userId: string, update: ProfileUpdate): Promise<UserProfile> {
    // TODO (Nada): PUT /api/profile dengan body { full_name } (objek `update` terus) →
    //   pulangkan UserProfile yang dikemas kini dari server:
    //   return api.put<UserProfile>("/api/profile", update)
    //   (Ralat 422 dilempar oleh api sebagai ApiError — ProfilePage tunjuk mesejnya.)
    void update
    throw new Error("Belum dibina (TODO)")
  },
}
