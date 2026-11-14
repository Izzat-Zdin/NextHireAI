import { useState, type FormEvent } from "react"
import { Link } from "@/lib/router"
import { AtSign, FlaskConical, Loader2, ShieldCheck } from "lucide-react"
import { Button } from "@/components/shadcn/button"
import { errorMessage } from "@/lib/format"
import { AuthAlert, AuthDivider, AuthField, AuthLayout, GoogleIcon, PasswordField } from "../components/AuthLayout"
import { useAuth } from "../context/AuthContext"
import { authService, testAccounts, type TestAccount } from "../services/authService"

export default function LoginPage() {
  const { authNotice, setAuthNotice } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [testLoading, setTestLoading] = useState<TestAccount["id"] | null>(null)
  const [failedTest, setFailedTest] = useState<TestAccount | null>(null)
  const enabledTestAccounts = testAccounts.filter((account) => account.enabled)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setAuthNotice(null)
    if (!email.includes("@")) return setError("Enter a valid email address.")
    if (!password) return setError("Enter your password.")
    setSubmitting(true)
    try {
      await authService.signIn(email.trim(), password)
      // GuestRoute redirects once the profile is loaded.
    } catch (err) {
      setError(errorMessage(err))
      setSubmitting(false)
    }
  }

  const google = async () => {
    setError(null)
    setGoogleLoading(true)
    try {
      await authService.signInWithGoogle()
    } catch (err) {
      setError(errorMessage(err))
      setGoogleLoading(false)
    }
  }

  const testLogin = async (account: TestAccount) => {
    setError(null)
    setAuthNotice(null)
    setFailedTest(null)
    setTestLoading(account.id)
    try {
      await authService.signInAsTestAccount(account)
    } catch (err) {
      setError(errorMessage(err))
      setFailedTest(account)
      setTestLoading(null)
    }
  }

  const busy = submitting || googleLoading || testLoading !== null

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue your interview and career preparation.">
      {authNotice && <AuthAlert tone="error">{authNotice}</AuthAlert>}
      {error && <AuthAlert tone="error">{error}</AuthAlert>}

      <div className="space-y-2">
        <Button className="h-11 w-full" onClick={google} disabled={busy}>
          {googleLoading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <GoogleIcon aria-hidden="true" />}
          Continue with Google
        </Button>

        {enabledTestAccounts.length > 0 && (
          <div className="space-y-1.5">
            {enabledTestAccounts.map((account) => {
              const loading = testLoading === account.id
              const Icon = account.id === "admin" ? ShieldCheck : FlaskConical
              return (
                <Button key={account.id} variant="outline" className="h-11 w-full" onClick={() => void testLogin(account)} disabled={busy}>
                  {loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Icon aria-hidden="true" />}
                  {loading ? "Signing in…" : `Continue as ${account.name}`}
                </Button>
              )
            })}
            <p className="text-center text-xs text-muted-foreground">
              {enabledTestAccounts.length > 1 ? "Quick test access with the shared test accounts." : "Quick test access with the shared test account."}
            </p>
            {failedTest && error?.includes("does not exist yet") && (
              <p className="text-center text-sm">
                <Link to={`/register?${failedTest.registerQuery}`} className="inline-flex min-h-11 items-center font-medium underline underline-offset-4">
                  Register the {failedTest.name} account now
                </Link>
              </p>
            )}
          </div>
        )}
      </div>

      <AuthDivider>OR</AuthDivider>

      <form className="space-y-3" onSubmit={submit} noValidate>
        <AuthField
          label="Email address"
          icon={<AtSign />}
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          placeholder="your.email@example.com"
        />
        <PasswordField label="Password" value={password} onChange={setPassword} autoComplete="current-password" placeholder="Your password" />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="inline-flex min-h-11 items-center text-sm underline-offset-4 hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="h-11 w-full" disabled={busy}>
          {submitting && <Loader2 className="animate-spin" aria-hidden="true" />}
          {submitting ? "Signing in…" : "Sign in with email"}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        New to NextHire?{" "}
        <Link to="/register" className="inline-flex min-h-11 items-center font-medium text-foreground underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  )
}
