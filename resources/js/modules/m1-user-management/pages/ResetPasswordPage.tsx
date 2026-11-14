import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "@/lib/router"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/shadcn/button"
import { errorMessage } from "@/lib/format"
import { AuthAlert, AuthLayout, PasswordField } from "../components/AuthLayout"
import { authService, passwordStrength } from "../services/authService"

/**
 * Landing page for the reset link in the email. Laravel puts the signed token in the
 * URL (/reset-password/{token}?email=...) and the controller passes both as props.
 */
export default function ResetPasswordPage({ token, email }: { token?: string; email?: string }) {
  const navigate = useNavigate()
  const ready: "ok" | "invalid" = token && email ? "ok" : "invalid"
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (password.length < 8) return setError("Password must be at least 8 characters.")
    if (password !== confirm) return setError("Passwords do not match.")
    setSubmitting(true)
    try {
      await authService.resetPassword(token!, email!, password)
      setDone(true)
      window.setTimeout(() => navigate("/login", { replace: true }), 1500)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Choose a new password" subtitle="Your new password must be at least 8 characters long.">
      {ready === "invalid" && (
        <>
          <AuthAlert tone="error">This reset link is invalid or has expired. Please request a new one.</AuthAlert>
          <Button asChild className="h-11 w-full">
            <Link to="/forgot-password">Request a new link</Link>
          </Button>
        </>
      )}
      {ready === "ok" && (
        <>
          {error && <AuthAlert tone="error">{error}</AuthAlert>}
          {done ? (
            <AuthAlert tone="success">Password updated. Taking you to sign in…</AuthAlert>
          ) : (
            <form className="space-y-3" onSubmit={submit} noValidate>
              <PasswordField label="New password" value={password} onChange={setPassword} autoComplete="new-password" />
              {password && <p className="text-xs text-muted-foreground">Strength: {passwordStrength(password).label}</p>}
              <PasswordField label="Confirm new password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
              <Button type="submit" className="h-11 w-full" disabled={submitting}>
                {submitting && <Loader2 className="animate-spin" aria-hidden="true" />}
                {submitting ? "Saving…" : "Update password"}
              </Button>
            </form>
          )}
        </>
      )}
    </AuthLayout>
  )
}
