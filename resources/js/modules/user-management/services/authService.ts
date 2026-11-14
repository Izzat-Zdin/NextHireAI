// Authentication via Laravel (session cookie). Register / login / forgot / reset are
// plain POSTs to the auth routes in routes/auth.php; Google goes through Laravel Socialite.
import { router, usePage } from "@inertiajs/react"
import { api } from "@/lib/api"

/**
 * Optional one-click test accounts on the login page (development convenience).
 * Configured in the Laravel .env (TEST_ACCOUNT_* / TEST_ADMIN_*) and exposed by
 * HandleInertiaRequests only when APP_ENV=local (or TEST_ACCOUNTS_IN_PRODUCTION=true).
 * The password never reaches the browser: the backend signs the account in.
 */
export interface TestAccount {
  id: "user" | "admin"
  name: string
  email?: string
  readonly enabled: boolean
  /** Query string for /register that pre-fills this account. */
  registerQuery: string
}

interface SharedTestAccount {
  id: "user" | "admin"
  name: string
  email: string
}

let shared: SharedTestAccount[] = []

/** Called once by app.tsx with the shared Inertia props. */
export function setTestAccounts(accounts: SharedTestAccount[] | undefined) {
  shared = accounts ?? []
}

function make(id: "user" | "admin", fallbackName: string): TestAccount {
  return {
    id,
    get name() {
      return shared.find((a) => a.id === id)?.name ?? fallbackName
    },
    get email() {
      return shared.find((a) => a.id === id)?.email
    },
    get enabled() {
      return shared.some((a) => a.id === id)
    },
    registerQuery: id === "admin" ? "test=admin" : "test=1",
  }
}

export const testAccount: TestAccount = make("user", "Ali Test")
export const adminTestAccount: TestAccount = make("admin", "Admin Test")
export const testAccounts: TestAccount[] = [testAccount, adminTestAccount]

/** True for any configured test account (used for demo-only helpers such as suggested answers). */
export const isTestAccountEmail = (email: string | null | undefined) =>
  Boolean(email) && testAccounts.some((account) => account.enabled && account.email?.toLowerCase() === email!.toLowerCase())

/** React hook variant for components that render before setTestAccounts ran. */
export function useTestAccounts(): TestAccount[] {
  const { props } = usePage<{ testAccounts?: SharedTestAccount[] }>()
  setTestAccounts(props.testAccounts)
  return testAccounts
}

/** Runs an Inertia form post and resolves on success or rejects with the first validation message. */
function post(url: string, data: Record<string, string | number | boolean>): Promise<void> {
  return new Promise((resolve, reject) => {
    router.post(url, data, {
      preserveScroll: true,
      onSuccess: () => resolve(),
      onError: (errors) => {
        const first = Object.values(errors)[0]
        reject(new Error(friendlyAuthError(Array.isArray(first) ? first[0] : String(first ?? "Something went wrong."))))
      },
    })
  })
}

export const authService = {
  /** Registers and signs in. Email verification is required before protected pages open. */
  async signUp(fullName: string, email: string, password: string) {
    const result = await api.post<{ needsConfirmation: boolean }>("/register", {
      full_name: fullName,
      email,
      password,
      password_confirmation: password,
    }).catch((error: Error & { errors?: Record<string, string[]> }) => {
      const first = error.errors ? Object.values(error.errors)[0]?.[0] : undefined
      throw new Error(friendlyAuthError(first ?? error.message))
    })
    if (!result.needsConfirmation) router.visit("/", { replace: true })
    return { needsConfirmation: result.needsConfirmation, user: null }
  },

  async signIn(email: string, password: string) {
    await post("/login", { email, password, remember: true })
  },

  async signInAsTestAccount(account: TestAccount = testAccount) {
    if (!account.enabled) throw new Error(`The ${account.name} account is not configured in .env.`)
    await post("/login/test-account", { account: account.id })
  },

  async signInWithGoogle() {
    window.location.href = "/auth/google"
  },

  async sendPasswordReset(email: string) {
    // TODO (Nada): Hantar permintaan pautan reset (Inertia form post, bukan fetch JSON):
    //   await post("/forgot-password", { email })
    //   `post` (fungsi di atas) resolve bila berjaya; reject dengan mesej validation pertama
    //   (melalui friendlyAuthError) bila gagal. Backend redirect back dengan flash `status`.
    void email
    throw new Error("Belum dibina (TODO)")
  },

  /** Signed-in user changing their password (profile page). */
  async updatePassword(password: string) {
    // TODO (Nada): PUT /api/profile/password (JSON, guna `api`) dengan body
    //   { password, password_confirmation: password }  (page sudah semak kedua-dua input sama).
    //   Bila gagal: ambil mesej validation pertama → error.errors ? Object.values(error.errors)[0]?.[0] : undefined,
    //   kemudian throw new Error(friendlyAuthError(first ?? error.message)).
    void password
    throw new Error("Belum dibina (TODO)")
  },

  /** Reset from the emailed link (token + email come from the URL). */
  async resetPassword(token: string, email: string, password: string) {
    // TODO (Nada): Inertia form post ke /reset-password:
    //   await post("/reset-password", { token, email, password, password_confirmation: password })
    //   Bila berjaya backend redirect ke /login dengan flash status "Your password has been reset.".
    void token
    void email
    void password
    throw new Error("Belum dibina (TODO)")
  },

  async signOut() {
    await new Promise<void>((resolve) => router.post("/logout", {}, { onFinish: () => resolve() }))
  },
}

export function friendlyAuthError(message: string) {
  const lower = message.toLowerCase()
  if (lower.includes("these credentials do not match") || lower.includes("invalid login credentials")) return "Incorrect email or password."
  if (lower.includes("not verified") || lower.includes("email not confirmed"))
    return "Please confirm your email address first — check your inbox for the confirmation link."
  if (lower.includes("has already been taken") || lower.includes("already registered"))
    return "An account with this email already exists. Try signing in instead."
  if (lower.includes("at least 8")) return "Password must be at least 8 characters."
  if (lower.includes("too many")) return "Too many attempts. Please wait a minute and try again."
  if (lower.includes("failed to fetch")) return "Cannot reach the server. Check that the Laravel app is running."
  return message
}

export function passwordStrength(password: string) {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password) || password.length >= 12) score++
  const labels = ["Too short", "Weak", "Fair", "Good", "Strong"]
  return { score, label: labels[score] }
}
