// Auth state for the Inertia version: the signed-in user comes from the shared
// Inertia props (`auth.user`, set in app/Http/Middleware/HandleInertiaRequests.php).
// The hook keeps the same shape the pages were written against (profile, user,
// isAdmin, signOut, setProfile, authNotice), so no page had to change.
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"
import { router, usePage } from "@inertiajs/react"
import type { UserProfile } from "@/lib/types"

/** Minimal stand-in for the Supabase `User` object the pages read a few fields from. */
export interface AuthUser {
  id: string
  email: string | null
  user_metadata: { avatar_url?: string | null; full_name?: string | null }
  app_metadata: { provider: "google" | "email" }
}

export interface SharedAuthProps {
  [key: string]: unknown
  auth: {
    user: (UserProfile & { avatar_url?: string | null; google_id?: string | null }) | null
  }
  authNotice?: string | null
  pausedSessionCount?: number
  testAccounts?: { id: "user" | "admin"; name: string; email: string }[]
}

interface AuthContextValue {
  session: { user: AuthUser } | null
  user: AuthUser | null
  profile: UserProfile | null
  loading: boolean
  isAdmin: boolean
  /** Message shown on the login page (e.g. account deactivated). */
  authNotice: string | null
  setAuthNotice: (message: string | null) => void
  refreshProfile: () => Promise<void>
  setProfile: (profile: UserProfile) => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { props } = usePage<SharedAuthProps>()
  const [override, setOverride] = useState<UserProfile | null>(null)
  const [notice, setNotice] = useState<string | null | undefined>(undefined)

  const row = props.auth?.user ?? null
  // A local override (after "Edit name") wins until the next server round-trip replaces it.
  const profile: UserProfile | null = row
    ? override && override.user_id === row.user_id && override.updated_at !== row.updated_at
      ? override
      : row
    : null

  const user: AuthUser | null = row
    ? {
        id: row.user_id,
        email: row.email,
        user_metadata: { avatar_url: row.avatar_url ?? null, full_name: row.full_name },
        app_metadata: { provider: row.google_id ? "google" : "email" },
      }
    : null

  const authNotice = notice === undefined ? (props.authNotice ?? null) : notice

  const refreshProfile = useCallback(async () => {
    router.reload({ only: ["auth"] })
  }, [])

  const signOut = useCallback(async () => {
    await new Promise<void>((resolve) => router.post("/logout", {}, { onFinish: () => resolve() }))
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session: user ? { user } : null,
      user,
      profile,
      loading: false,
      isAdmin: profile?.role === "admin",
      authNotice,
      setAuthNotice: setNotice,
      refreshProfile,
      setProfile: setOverride,
      signOut,
    }),
    [user, profile, authNotice, refreshProfile, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>")
  return context
}

/** Convenience hook for pages that are only rendered behind the `auth` middleware. */
export function useCurrentUser() {
  const { user, profile } = useAuth()
  if (!user || !profile) throw new Error("useCurrentUser used outside an authenticated page")
  return { user, profile }
}
