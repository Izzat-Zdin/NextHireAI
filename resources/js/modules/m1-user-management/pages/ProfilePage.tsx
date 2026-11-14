import { useEffect, useState, type ReactNode } from "react"
import { Link, useLocation } from "@/lib/router"
import { BookOpen, ChevronRight, FileText, KeyRound, Mail, MessageSquareText, Pencil, Save, X, type LucideIcon } from "lucide-react"
import { Avatar } from "@/components/AppShell"
import { buttonVariants } from "@/components/shadcn/button"
import { Separator } from "@/components/shadcn/separator"
import { Alert, Badge, Button, Card, Field, PageIntro, Spinner, useFlash } from "@/components/ui"
import { errorMessage, formatDate } from "@/lib/format"
import { fetchLearningProgress, fetchResumes, fetchSessions } from "@/lib/insights"
import { cn } from "@/lib/utils"
import { PasswordField } from "../components/AuthLayout"
import { useAuth } from "../context/AuthContext"
import { authService } from "../services/authService"
import { profileService } from "../services/profileService"
import { moduleLabel } from "@/components/navigation"

interface ActivityCounts {
  resumes: number
  interviews: number
  learning: number
}

/** "Settings" in the user menu links to /profile#settings: scroll to the password section once the page is in. */
function ScrollToHash() {
  const { hash } = useLocation()
  useEffect(() => {
    if (!hash) return
    const target = document.getElementById(hash.slice(1))
    target?.scrollIntoView({ block: "start" })
    ;(target?.querySelector("h2, h3") as HTMLElement | null)?.focus?.()
  }, [hash])
  return null
}

function GoogleMark() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
    </svg>
  )
}

function ActivityRow({
  icon: Icon,
  label,
  value,
  to,
  linkLabel,
}: {
  icon: LucideIcon
  label: string
  value: string
  to: string
  linkLabel: string
}) {
  return (
    <li className="flex min-w-0 items-center gap-3 rounded-lg border p-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-md border bg-muted text-foreground">
        <Icon className="size-[18px]" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <strong className="block font-heading text-xl font-bold leading-tight tabular-nums">{value}</strong>
        <p className="text-sm leading-snug text-muted-foreground">{label}</p>
      </div>
      <Link
        to={to}
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "shrink-0 gap-1 px-2 text-muted-foreground hover:text-foreground has-[>svg]:px-2 pointer-coarse:min-h-11",
        )}
        aria-label={`${linkLabel}: ${label}`}
      >
        {linkLabel} <ChevronRight aria-hidden="true" />
      </Link>
    </li>
  )
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-4 py-3 text-sm">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right font-medium [overflow-wrap:anywhere]">{children}</dd>
    </div>
  )
}

export default function ProfilePage() {
  const { profile, setProfile, user } = useAuth()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(profile?.full_name ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useFlash()
  const [pw, setPw] = useState({ next: "", confirm: "" })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [activity, setActivity] = useState<ActivityCounts | null>(null)
  const [activityError, setActivityError] = useState(false)
  const userId = profile?.user_id

  useEffect(() => {
    if (profile && !editing) setName(profile.full_name)
  }, [profile, editing])

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    Promise.all([fetchResumes(userId, 500), fetchSessions(userId, 500), fetchLearningProgress(userId)])
      .then(([resumes, sessions, progress]) => {
        if (cancelled) return
        setActivity({
          resumes: resumes.length,
          interviews: sessions.filter((session) => session.status === "Finish").length,
          learning: progress.filter((item) => item.status === "Completed").length,
        })
      })
      .catch(() => {
        if (!cancelled) setActivityError(true)
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  if (!profile) return null

  const provider = user?.app_metadata?.provider
  const isGoogle = provider === "google"
  // The ERD users table has no avatar column; Google supplies one through Auth metadata.
  const avatarUrl = (user?.user_metadata?.avatar_url as string | undefined) ?? null
  const displayName = profile.full_name || profile.email

  const cancelEdit = () => {
    setEditing(false)
    setError(null)
    setName(profile.full_name)
  }

  const save = async () => {
    setError(null)
    const fullName = name.trim().replace(/\s+/g, " ")
    if (!fullName) return setError("Full name is required.")
    if (fullName.length > 120) return setError("Full name must be 120 characters or fewer.")
    if (fullName === profile.full_name) return setEditing(false)
    setSaving(true)
    try {
      const updated = await profileService.updateProfile(profile.user_id, { full_name: fullName })
      setProfile(updated)
      setEditing(false)
      setFlash("Name updated.")
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async () => {
    setPwError(null)
    if (pw.next.length < 8) return setPwError("Password must be at least 8 characters.")
    if (pw.next !== pw.confirm) return setPwError("Passwords do not match.")
    setPwSaving(true)
    try {
      await authService.updatePassword(pw.next)
      setPw({ next: "", confirm: "" })
      setFlash("Password updated.")
    } catch (err) {
      setPwError(errorMessage(err))
    } finally {
      setPwSaving(false)
    }
  }

  const count = (value: number | undefined) => (activityError ? "—" : value === undefined ? "…" : String(value))

  return (
    <>
      <ScrollToHash />
      <PageIntro
        eyebrow={moduleLabel(1)}
        title="Your account"
        description="Manage your name, sign-in details and password. Your resume, interview and learning activity is summarised here too."
      />
      {flash && <Alert tone="success" onClose={() => setFlash(null)}>{flash}</Alert>}

      <Card className="mb-6">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar name={displayName} url={avatarUrl} large />
          <div className="min-w-0 flex-1">
            <h2 className="font-heading text-lg font-semibold leading-tight tracking-tight break-words sm:text-xl">
              {profile.full_name || "Unnamed user"}
            </h2>
            <p className="mt-1 flex flex-col gap-x-2 gap-y-0.5 text-sm text-muted-foreground sm:flex-row sm:flex-wrap">
              <span className="min-w-0 [overflow-wrap:anywhere]">{profile.email}</span>
              <span className="hidden sm:inline" aria-hidden="true">·</span>
              <span className="whitespace-nowrap">Joined {formatDate(profile.created_at)}</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone={profile.role === "admin" ? "violet" : "slate"}>{profile.role === "admin" ? "Administrator" : "User"}</Badge>
              <Badge tone={profile.status === "active" ? "green" : "red"}>{profile.status === "active" ? "Active" : "Inactive"}</Badge>
              <Badge tone="slate">{isGoogle ? "Google sign-in" : "Email sign-in"}</Badge>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card
            className="@container"
            title="Account details"
            action={
              editing ? (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={cancelEdit} disabled={saving}>
                    <X /> Cancel
                  </Button>
                  <Button size="sm" onClick={() => void save()} disabled={saving}>
                    {saving ? <Spinner label="Saving…" /> : <><Save /> Save</>}
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
                  <Pencil /> Edit name
                </Button>
              )
            }
          >
            {error && <Alert tone="error" onClose={() => setError(null)}>{error}</Alert>}
            <div className="grid min-w-0 gap-4 @md:grid-cols-2">
              <Field label="Full name" value={editing ? name : profile.full_name} onChange={setName} disabled={!editing} required autoComplete="name" />
              <Field label="Email address" value={profile.email} disabled hint="Email is managed by your sign-in account." />
            </div>
            <Separator className="mt-6" />
            <dl className="divide-y">
              <DetailRow label="Sign-in method">
                <span className="inline-flex items-center gap-1.5">
                  {isGoogle ? <GoogleMark /> : <Mail className="size-3.5 text-muted-foreground" aria-hidden="true" />}
                  {isGoogle ? "Google" : "Email and password"}
                </span>
              </DetailRow>
              <DetailRow label="Role">{profile.role === "admin" ? "Administrator" : "User"}</DetailRow>
              <DetailRow label="Status">{profile.status === "active" ? "Active" : "Inactive"}</DetailRow>
              <DetailRow label="Joined">{formatDate(profile.created_at)}</DetailRow>
              <DetailRow label="Last updated">{formatDate(profile.updated_at)}</DetailRow>
            </dl>
          </Card>

          <div id="settings" className="scroll-mt-20" aria-hidden="true" />
          {isGoogle ? (
            <Card title="Password">
              <p className="text-sm leading-relaxed text-muted-foreground">
                You sign in with Google, so there is no NextHire password to change. Manage your password and security in your Google account.
              </p>
            </Card>
          ) : (
            <Card className="@container" title="Change password">
              {pwError && <Alert tone="error">{pwError}</Alert>}
              <div className="grid min-w-0 gap-4 @md:grid-cols-2">
                <PasswordField label="New password" value={pw.next} onChange={(v) => setPw({ ...pw, next: v })} autoComplete="new-password" />
                <PasswordField label="Confirm new password" value={pw.confirm} onChange={(v) => setPw({ ...pw, confirm: v })} autoComplete="new-password" />
              </div>
              <div className="mt-5 flex">
                <Button className="max-sm:w-full" onClick={() => void changePassword()} disabled={pwSaving || !pw.next}>
                  {pwSaving ? <Spinner label="Updating…" /> : <><KeyRound /> Update password</>}
                </Button>
              </div>
            </Card>
          )}
        </div>

        <Card title="Your activity">
          {activityError && <p className="mb-3 text-sm text-muted-foreground">Activity could not be loaded right now.</p>}
          <ul className="flex flex-col gap-3">
            <ActivityRow icon={FileText} label="Resumes analysed" value={count(activity?.resumes)} to="/resume/history" linkLabel="History" />
            <ActivityRow icon={MessageSquareText} label="Interviews finished" value={count(activity?.interviews)} to="/interview/history" linkLabel="History" />
            <ActivityRow icon={BookOpen} label="Learning completed" value={count(activity?.learning)} to="/progress" linkLabel="Progress" />
          </ul>
        </Card>
      </div>
    </>
  )
}
