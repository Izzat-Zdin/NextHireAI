import { useState, type FormEvent } from "react"
import { Link } from "@/lib/router"
import { ArrowLeft, AtSign, Loader2 } from "lucide-react"
import { Button } from "@/components/shadcn/button"
import { errorMessage } from "@/lib/format"
import { AuthAlert, AuthField, AuthLayout } from "../components/AuthLayout"
import { authService } from "../services/authService"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!email.includes("@")) return setError("Enter a valid email address.")
    setSubmitting(true)
    try {
      await authService.sendPasswordReset(email.trim())
      setSent(true)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Reset your password" subtitle="Enter your account email and we'll send you a secure reset link.">
      {error && <AuthAlert tone="error">{error}</AuthAlert>}
      {sent ? (
        <AuthAlert tone="success">
          If an account exists for <strong>{email}</strong>, a password reset link is on its way. The link opens a page
          where you can choose a new password.
        </AuthAlert>
      ) : (
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
          <Button type="submit" className="h-11 w-full" disabled={submitting}>
            {submitting && <Loader2 className="animate-spin" aria-hidden="true" />}
            {submitting ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
      <Button asChild variant="ghost" className="h-11 px-2">
        <Link to="/login">
          <ArrowLeft aria-hidden="true" /> Back to sign in
        </Link>
      </Button>
    </AuthLayout>
  )
}
