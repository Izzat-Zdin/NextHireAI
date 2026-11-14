import { useCallback, useEffect, useState } from "react"
import { Link, useParams } from "@/lib/router"
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Info,
  MessageSquareText,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  UserCheck,
  UserX,
} from "lucide-react"
import { Alert, Badge, Button, Card, EmptyState, LoadingState, Modal, Spinner, StatCard, useFlash, type Tone } from "@/components/ui"
import { Avatar } from "@/components/AppShell"
import { Button as UiButton } from "@/components/shadcn/button"
import { Separator } from "@/components/shadcn/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table"
import { errorMessage, formatDate, scoreTone } from "@/lib/format"
import type { InterviewTypeDb, SessionStatus, UserProfile, UserRole, UserStatus } from "@/lib/types"
import { useAuth } from "@/modules/m1-user-management/context/AuthContext"
import { UserRoleBadge, UserStatusBadge } from "../components/UserStatusBadge"
import { getUser, getUserActivity, setRole, setStatus, type UserActivity } from "../services/adminUserService"
import { INTERVIEW_TYPE_LABEL, SESSION_STATUS_BADGE } from "@/modules/m3-mock-interview/labels"

type PendingAction = { kind: "status"; next: UserStatus } | { kind: "role"; next: UserRole }

function actionCopy(action: PendingAction, name: string) {
  if (action.kind === "status") {
    return action.next === "inactive"
      ? {
          title: "Deactivate account?",
          body: `${name} will lose access to NextHire. They will be signed out the next time the app loads their profile, and cannot sign in again until reactivated.`,
          confirm: "Deactivate",
          danger: true,
        }
      : {
          title: "Activate account?",
          body: `${name} will be able to sign in and use NextHire again.`,
          confirm: "Activate",
          danger: false,
        }
  }
  return action.next === "admin"
    ? {
        title: "Promote to admin?",
        body: `${name} will be able to view every user's data, manage accounts and edit learning resources.`,
        confirm: "Promote to admin",
        danger: false,
      }
    : {
        title: "Demote to user?",
        body: `${name} will lose access to all admin pages and only see their own data.`,
        confirm: "Demote to user",
        danger: true,
      }
}

export default function AdminUserDetailPage() {
  const { userId = "" } = useParams<{ userId: string }>()
  const { user: currentUser } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [activity, setActivity] = useState<UserActivity | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<PendingAction | null>(null)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [deactivatedNote, setDeactivatedNote] = useState(false)
  const [flash, setFlash] = useFlash(4000)
  const isSelf = currentUser?.id === userId

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const [row, stats] = await Promise.all([getUser(userId), getUserActivity(userId)])
      setProfile(row)
      setActivity(stats)
    } catch (err) {
      setError(errorMessage(err, "Could not load this user."))
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void load()
  }, [load])

  const ask = (action: PendingAction) => {
    setActionError(null)
    setPending(action)
  }

  const confirm = async () => {
    if (!pending || !profile) return
    setSaving(true)
    setActionError(null)
    try {
      const updated = pending.kind === "status" ? await setStatus(profile.user_id, pending.next) : await setRole(profile.user_id, pending.next)
      setProfile(updated)
      if (pending.kind === "status") {
        setDeactivatedNote(pending.next === "inactive")
        setFlash(pending.next === "inactive" ? "Account deactivated." : "Account activated.")
      } else {
        setFlash(pending.next === "admin" ? "User promoted to admin." : "Admin demoted to user.")
      }
      setPending(null)
    } catch (err) {
      setActionError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const back = (
    <UiButton asChild variant="ghost" size="sm" className="mb-3 -ml-2 text-muted-foreground pointer-coarse:min-h-11">
      <Link to="/admin/users">
        <ArrowLeft /> Back to users
      </Link>
    </UiButton>
  )

  if (loading && !profile) {
    return (
      <>
        {back}
        <LoadingState label="Loading user…" />
      </>
    )
  }

  if (error) {
    return (
      <>
        {back}
        <Alert tone="error">{error}</Alert>
        <Button variant="secondary" onClick={() => void load()}>
          <RefreshCw /> Try again
        </Button>
      </>
    )
  }

  if (!profile || !activity) {
    return (
      <>
        {back}
        <Card>
          <EmptyState icon={UserX} title="User not found" text="This account doesn't exist or may have been deleted." />
        </Card>
      </>
    )
  }

  const name = profile.full_name || profile.email
  const copy = pending ? actionCopy(pending, name) : null
  const isActive = profile.status === "active"
  const isAdminUser = profile.role === "admin"

  const details: [string, string][] = [
    ["Joined", formatDate(profile.created_at)],
    ["Last updated", formatDate(profile.updated_at)],
    ["Role", isAdminUser ? "Administrator" : "User"],
    ["Account status", isActive ? "Active — can sign in" : "Inactive — access blocked"],
  ]

  return (
    <div className="@container/page">
      {back}

      {flash && <Alert tone="success" onClose={() => setFlash(null)}>{flash}</Alert>}
      {deactivatedNote && !isActive && (
        <Alert tone="success" onClose={() => setDeactivatedNote(false)}>
          {name} has been deactivated and will be signed out the next time the app loads their profile.
        </Alert>
      )}

      <div className="mb-4 grid items-start gap-4 @4xl/page:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <Avatar name={name} large />
            <div className="min-w-0 flex-1">
              <h1 className="font-heading text-2xl font-bold tracking-tight [overflow-wrap:anywhere]">{profile.full_name || "Unnamed user"}</h1>
              <p className="mt-1 text-sm text-muted-foreground [overflow-wrap:anywhere]">{profile.email}</p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <UserRoleBadge role={profile.role} />
                <UserStatusBadge status={profile.status} />
                {isSelf && <Badge tone="blue">You</Badge>}
              </div>
            </div>
          </div>
          <dl className="mt-5 grid grid-cols-2 overflow-hidden rounded-lg border text-sm">
            {details.map(([label, value]) => (
              <div key={label} className="flex min-w-0 flex-col gap-0.5 border-b px-4 py-3 odd:border-r [&:nth-last-child(-n+2)]:border-b-0">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card title="Account actions">
          <div className="flex flex-col gap-2">
            {isActive ? (
              <Button variant="danger" disabled={isSelf} onClick={() => ask({ kind: "status", next: "inactive" })}>
                <UserX /> Deactivate account
              </Button>
            ) : (
              <Button disabled={isSelf} onClick={() => ask({ kind: "status", next: "active" })}>
                <UserCheck /> Activate account
              </Button>
            )}
            {isAdminUser ? (
              <Button variant="secondary" disabled={isSelf} onClick={() => ask({ kind: "role", next: "user" })}>
                <ShieldOff /> Demote to user
              </Button>
            ) : (
              <Button variant="secondary" disabled={isSelf} onClick={() => ask({ kind: "role", next: "admin" })}>
                <ShieldCheck /> Promote to admin
              </Button>
            )}
            <Separator className="my-2" />
            {isSelf ? (
              <p className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                You are viewing your own account. To avoid locking everyone out, admins cannot change their own role or
                status. Ask another admin.
              </p>
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Deactivated users are signed out the next time the app loads their profile. Admins can view all user data.
              </p>
            )}
          </div>
        </Card>
      </div>

      <div className="mb-4 grid gap-3 @3xl/page:grid-cols-3">
        <StatCard
          icon={FileText}
          label="Resumes analysed"
          value={String(activity.resumes.count)}
          meta={
            activity.resumes.latestScore !== null
              ? `Latest score ${activity.resumes.latestScore}/100 · ${formatDate(activity.resumes.latestAt)}`
              : "No resumes yet"
          }
        />
        <StatCard
          icon={MessageSquareText}
          tone="violet"
          label="Interviews finished"
          value={String(activity.interviews.finished)}
          meta={
            activity.interviews.averageScore !== null
              ? `Average score ${activity.interviews.averageScore}/100`
              : activity.interviews.total
                ? `${activity.interviews.total} started · no scores yet`
                : "No sessions yet"
          }
        />
        <StatCard
          icon={BookOpen}
          tone="green"
          label="Learning completed"
          value={String(activity.learning.completed)}
          meta={`${activity.learning.inProgress} in progress · ${activity.learning.notStarted} not started`}
        />
      </div>

      <Card title="Recent interview sessions">
        {activity.recentSessions.length ? (
          <>
            {/* Phones: stacked rows. */}
            <ul className="-my-3 divide-y @3xl/page:hidden">
              {activity.recentSessions.map((session) => {
                const status = SESSION_STATUS_BADGE[session.status] ?? { label: session.status, tone: "slate" as Tone }
                const score = session.average_score !== null ? Math.round(Number(session.average_score)) : null
                return (
                  <li key={session.session_id} className="flex flex-col gap-1.5 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 text-sm font-medium [overflow-wrap:anywhere]">{session.role}</p>
                      {score !== null ? <Badge tone={scoreTone(score)}>{score}</Badge> : <span className="text-sm text-muted-foreground">—</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                      <Badge tone={status.tone}>{status.label}</Badge>
                      <span>{INTERVIEW_TYPE_LABEL[session.interview_type] ?? session.interview_type}</span>
                      <span>
                        {session.answered_count}/{session.question_count} answered
                      </span>
                      <span>{formatDate(session.completed_at ?? session.created_at)}</span>
                    </div>
                  </li>
                )
              })}
            </ul>

            {/* Tablet and desktop: table. */}
            <Table className="hidden @3xl/page:table">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Role</TableHead>
                  <TableHead className="text-muted-foreground">Type</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Answered</TableHead>
                  <TableHead className="text-muted-foreground">Score</TableHead>
                  <TableHead className="text-muted-foreground">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activity.recentSessions.map((session) => {
                  const status = SESSION_STATUS_BADGE[session.status] ?? { label: session.status, tone: "slate" as Tone }
                  const score = session.average_score !== null ? Math.round(Number(session.average_score)) : null
                  return (
                    <TableRow key={session.session_id}>
                      <TableCell className="font-medium">{session.role}</TableCell>
                      <TableCell>{INTERVIEW_TYPE_LABEL[session.interview_type] ?? session.interview_type}</TableCell>
                      <TableCell>
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {session.answered_count}/{session.question_count}
                      </TableCell>
                      <TableCell>{score !== null ? <Badge tone={scoreTone(score)}>{score}</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(session.completed_at ?? session.created_at)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </>
        ) : (
          <EmptyState icon={MessageSquareText} title="No interview sessions" text="This user hasn't started a mock interview yet." />
        )}
      </Card>

      {pending && copy && (
        <Modal
          title={copy.title}
          onClose={() => !saving && setPending(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setPending(null)} disabled={saving}>
                Cancel
              </Button>
              <Button variant={copy.danger ? "danger" : "primary"} onClick={() => void confirm()} disabled={saving}>
                {saving ? <Spinner label="Saving…" /> : copy.confirm}
              </Button>
            </>
          }
        >
          {actionError && <Alert tone="error">{actionError}</Alert>}
          <p className="text-sm leading-relaxed text-muted-foreground">{copy.body}</p>
        </Modal>
      )}
    </div>
  )
}
