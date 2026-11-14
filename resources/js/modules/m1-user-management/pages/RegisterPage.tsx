import { useState, type FormEvent } from "react"
import { Link, useSearchParams } from "@/lib/router"
import { AtSign, Loader2, MailCheck, UserRound } from "lucide-react"
import { Button } from "@/components/shadcn/button"
import { errorMessage } from "@/lib/format"
import { AuthAlert, AuthDivider, AuthField, AuthLayout, GoogleIcon, PasswordField } from "../components/AuthLayout"
import { adminTestAccount, authService, passwordStrength, testAccount } from "../services/authService"

const STRENGTH_BAR = ["bg-red-500", "bg-red-500", "bg-amber-500", "bg-emerald-500", "bg-emerald-600"]

export default function RegisterPage() {
  const [params] = useSearchParams()
  // /register?test=1 pre-fills the shared test account, /register?test=admin the admin test account (both from .env)
  const testParam = params.get("test")
  const prefill = testParam === "admin" ? adminTestAccount : testParam === "1" ? testAccount : null
  const prefillTest = Boolean(prefill?.enabled)
  const [fullName, setFullName] = useState(prefillTest ? prefill!.name : "")
  const [email, setEmail] = useState(prefillTest ? prefill!.email! : "")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [agree, setAgree] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmationSentTo, setConfirmationSentTo] = useState<string | null>(null)
  const strength = passwordStrength(password)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (fullName.trim().length < 2) return setError("Enter your full name.")
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Enter a valid email address.")
    if (password.length < 8) return setError("Password must be at least 8 characters.")
    if (password !== confirm) return setError("Passwords do not match.")
    if (!agree) return setError("Please accept the terms to continue.")
    setSubmitting(true)
    try {
      const result = await authService.signUp(fullName.trim(), email.trim(), password)
      if (result.needsConfirmation) setConfirmationSentTo(email.trim())
      // Otherwise the session is active and GuestRoute redirects to the dashboard.
    } catch (err) {
      setError(errorMessage(err))
    } finally {
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

  if (confirmationSentTo) {
    return (
      <AuthLayout title="Check your inbox" subtitle="One more step to activate your account.">
        <div className="space-y-4 rounded-lg border bg-background p-6 text-center">
          <MailCheck className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
          <h2 className="font-heading text-lg font-bold">Confirmation email sent</h2>
          <p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">
            We sent a confirmation link to <strong className="text-foreground">{confirmationSentTo}</strong>. Click it to
            activate your account, then sign in.
          </p>
          <Button asChild className="h-11 w-full">
            <Link to="/login">Back to sign in</Link>
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Create your account" subtitle="Start building interview confidence in minutes. It's free.">
      {error && <AuthAlert tone="error">{error}</AuthAlert>}

      <Button className="h-11 w-full" onClick={google} disabled={googleLoading || submitting}>
        {googleLoading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <GoogleIcon aria-hidden="true" />}
        Sign up with Google
      </Button>

      <AuthDivider>OR</AuthDivider>

      <form className="space-y-3" onSubmit={submit} noValidate>
        <AuthField
          label="Full name"
          icon={<UserRound />}
          value={fullName}
          onChange={setFullName}
          autoComplete="name"
          placeholder="e.g. Nur Aisyah binti Ahmad"
        />
        <AuthField
          label="Email address"
          icon={<AtSign />}
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          placeholder="your.email@example.com"
        />
        <div className="space-y-1.5">
          <PasswordField label="Password" value={password} onChange={setPassword} autoComplete="new-password" placeholder="At least 8 characters" />
          {password && (
            <>
              <div className="flex gap-1" aria-hidden="true">
                {[1, 2, 3, 4].map((step) => (
                  <span key={step} className={`h-1 flex-1 rounded-full ${strength.score >= step ? STRENGTH_BAR[strength.score] : "bg-neutral-200 dark:bg-neutral-700"}`} />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Password strength: {strength.label}</p>
            </>
          )}
        </div>
        <PasswordField label="Confirm password" value={confirm} onChange={setConfirm} autoComplete="new-password" placeholder="Re-enter password" />
        <label className="flex min-h-11 cursor-pointer items-start gap-3 py-1 text-sm leading-relaxed text-muted-foreground">
          <input
            type="checkbox"
            checked={agree}
            onChange={(event) => setAgree(event.target.checked)}
            className="mt-0.5 size-5 shrink-0 cursor-pointer accent-neutral-900 dark:accent-neutral-100"
          />
          I agree that NextHire may store my profile, resume and interview data to provide personalised feedback.
        </label>
        <Button type="submit" className="h-11 w-full" disabled={submitting || googleLoading}>
          {submitting && <Loader2 className="animate-spin" aria-hidden="true" />}
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="inline-flex min-h-11 items-center font-medium text-foreground underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
