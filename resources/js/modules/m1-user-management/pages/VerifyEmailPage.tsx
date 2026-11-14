import { useState } from "react"
import { router } from "@inertiajs/react"
import { Loader2, MailCheck } from "lucide-react"
import { Button } from "@/components/shadcn/button"
import { AuthAlert, AuthLayout } from "../components/AuthLayout"
import { useAuth } from "../context/AuthContext"

/** Shown by the `verified` middleware when email verification is switched on and the link has not been clicked yet. */
export default function VerifyEmailPage({ status }: { status?: string }) {
  const { profile, signOut } = useAuth()
  const [sending, setSending] = useState(false)

  const resend = () => {
    setSending(true)
    router.post("/email/verification-notification", {}, { onFinish: () => setSending(false) })
  }

  return (
    <AuthLayout title="Check your inbox" subtitle="One more step to activate your account.">
      {status === "verification-link-sent" && <AuthAlert tone="success">A new confirmation link has been sent to your email address.</AuthAlert>}
      <div className="space-y-4 rounded-lg border bg-background p-6 text-center">
        <MailCheck className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
        <h2 className="font-heading text-lg font-bold">Confirmation email sent</h2>
        <p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">
          We sent a confirmation link to <strong className="text-foreground">{profile?.email}</strong>. Click it to activate your account.
        </p>
        <Button className="h-11 w-full" onClick={resend} disabled={sending}>
          {sending && <Loader2 className="animate-spin" aria-hidden="true" />}
          Resend confirmation email
        </Button>
        <Button variant="ghost" className="h-11 w-full" onClick={() => void signOut()}>
          Sign out
        </Button>
      </div>
    </AuthLayout>
  )
}
