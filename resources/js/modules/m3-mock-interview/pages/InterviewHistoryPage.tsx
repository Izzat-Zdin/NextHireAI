import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "@/lib/router"
import { Award, MessageSquareText, Mic, Play, Trash2, TrendingUp } from "lucide-react"
import { Alert, Badge, Button, Card, EmptyState, LoadingState, Modal, PageIntro, StatCard, TrendChart } from "@/components/ui"
import { average, errorMessage, formatDate, formatDateTime, scoreTone } from "@/lib/format"
import { completedSessions, fetchSessions } from "@/lib/insights"
import type { InterviewSessionSummary, InterviewTypeDb, SessionStatus } from "@/lib/types"
import { useAuth } from "@/modules/m1-user-management/context/AuthContext"
import { deleteSession } from "../services/interviewService"
import { INTERVIEW_TYPE_LABEL, SESSION_STATUS_BADGE } from "../labels"
import { Button as UiButton } from "@/components/shadcn/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table"
import { cn } from "@/lib/utils"
import { moduleLabel } from "@/components/navigation"

export default function InterviewHistoryPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<InterviewSessionSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<"completed" | "all">("completed")
  const [confirmDelete, setConfirmDelete] = useState<InterviewSessionSummary | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!profile) return
    fetchSessions(profile.user_id)
      .then(setSessions)
      .catch((err) => setError(errorMessage(err)))
  }, [profile])

  const done = useMemo(() => completedSessions(sessions ?? []), [sessions])
  const finished = useMemo(() => (sessions ?? []).filter((s) => s.status === "Finish"), [sessions])
  const chronological = [...done].reverse().slice(-10)
  const best = done.reduce((max, s) => Math.max(max, Number(s.average_score)), 0)
  const visible = filter === "completed" ? (sessions ?? []).filter((s) => s.status === "Finish") : sessions ?? []

  const remove = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      await deleteSession(confirmDelete.session_id)
      setSessions((current) => current?.filter((s) => s.session_id !== confirmDelete.session_id) ?? null)
      setConfirmDelete(null)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  if (!sessions && !error) return <LoadingState label="Loading interview history…" />

  const scoreBadge = (session: InterviewSessionSummary) =>
    session.average_score !== null ? (
      <Badge tone={scoreTone(Number(session.average_score))}>{Math.round(Number(session.average_score))}/100</Badge>
    ) : (
      "—"
    )

  /** Paused or interrupted sessions keep their saved answers and can be continued. */
  const canContinue = (session: InterviewSessionSummary) =>
    (session.status === "Pause" || session.status === "Active") && session.answered_count < session.question_count
  const continueButton = (session: InterviewSessionSummary) =>
    canContinue(session) ? (
      <Button size="sm" variant="secondary" onClick={() => navigate(`/interview?continue=${session.session_id}`)}>
        <Play size={14} /> Continue
      </Button>
    ) : null

  const deleteButton = (session: InterviewSessionSummary) => (
    <Button
      size="icon"
      variant="ghost"
      title="Delete session"
      ariaLabel={`Delete ${session.role} session`}
      onClick={() => setConfirmDelete(session)}
    >
      <Trash2 size={15} />
    </Button>
  )

  return (
    <>
      <PageIntro
        eyebrow={moduleLabel(3)}
        title="Interview history"
        description="Review every practice session, revisit feedback and watch your scores improve over time."
        action={
          <Button onClick={() => navigate("/interview")}>
            <Play size={16} /> New mock interview
          </Button>
        }
      />
      {error && <Alert tone="error">{error}</Alert>}

      <div className="mb-6 grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Mic} label="Sessions finished" value={String(finished.length)} meta={`${done.length} scored · ${(sessions ?? []).length} started`} />
        <StatCard icon={TrendingUp} label="Average score" value={done.length ? `${average(done.map((s) => Number(s.average_score)))}/100` : "—"} meta="Across completed sessions" tone="violet" />
        <StatCard icon={Award} label="Best score" value={done.length ? `${Math.round(best)}/100` : "—"} meta="Personal best" tone="green" />
        <StatCard icon={MessageSquareText} label="Latest session" value={done[0] ? `${Math.round(Number(done[0].average_score))}/100` : "—"} meta={done[0] ? formatDate(done[0].completed_at ?? done[0].created_at) : "No sessions yet"} tone="amber" />
      </div>

      <div className="flex flex-col gap-6">
        <Card title="Score trend (last 10 sessions)">
          <TrendChart values={chronological.map((s) => Number(s.average_score))} labels={chronological.map((s) => formatDate(s.completed_at ?? s.created_at, { day: "numeric", month: "short" }))} />
        </Card>

        <Card
          title="Sessions"
          action={
            <div className="inline-flex rounded-lg border bg-muted p-1" role="group" aria-label="Filter sessions">
              {(
                [
                  ["completed", "Completed"],
                  ["all", "All"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={filter === value}
                  onClick={() => setFilter(value)}
                  className={cn(
                    "h-7 rounded-md px-3 text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:h-10",
                    filter === value && "bg-background text-foreground shadow-sm dark:bg-input/50",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          }
        >
          {visible.length === 0 ? (
            <EmptyState
              icon={MessageSquareText}
              title="No interview sessions yet"
              text="Complete your first mock interview to see it here."
              action={
                <UiButton asChild className="pointer-coarse:min-h-11">
                  <Link to="/interview">Start practising</Link>
                </UiButton>
              }
            />
          ) : (
            <>
              {/* Phones: stacked rows */}
              <ul className="-mx-1 flex flex-col divide-y md:hidden">
                {visible.map((session) => (
                  <li
                    key={session.session_id}
                    className={cn("flex items-start gap-3 rounded-md px-1 py-3", session.status === "Finish" && "cursor-pointer hover:bg-muted/50")}
                    onClick={() => session.status === "Finish" && navigate(`/interview/${session.session_id}`)}
                  >
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="min-w-0 text-sm font-semibold [overflow-wrap:anywhere]">{session.role}</strong>
                        <Badge tone={SESSION_STATUS_BADGE[session.status].tone}>{SESSION_STATUS_BADGE[session.status].label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {INTERVIEW_TYPE_LABEL[session.interview_type]} · {session.question_count} questions · {formatDateTime(session.created_at)}
                      </p>
                      <div className="text-sm">{scoreBadge(session)}</div>
                    </div>
                    <div className="-mr-1 flex shrink-0 items-center gap-1" onClick={(event) => event.stopPropagation()}>
                      {continueButton(session)}
                      {deleteButton(session)}
                    </div>
                  </li>
                ))}
              </ul>

              {/* Tablet and desktop: table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Role</TableHead>
                      <TableHead className="text-muted-foreground">Type</TableHead>
                      <TableHead className="text-muted-foreground">Questions</TableHead>
                      <TableHead className="text-muted-foreground">Score</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                      <TableHead className="text-muted-foreground">Date</TableHead>
                      <TableHead>
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visible.map((session) => (
                      <TableRow
                        key={session.session_id}
                        className={session.status === "Finish" ? "cursor-pointer" : ""}
                        onClick={() => session.status === "Finish" && navigate(`/interview/${session.session_id}`)}
                      >
                        <TableCell className="max-w-56 whitespace-normal">
                          <strong className="font-medium">{session.role}</strong>
                        </TableCell>
                        <TableCell>{INTERVIEW_TYPE_LABEL[session.interview_type]}</TableCell>
                        <TableCell className="tabular-nums">{session.question_count}</TableCell>
                        <TableCell>{scoreBadge(session)}</TableCell>
                        <TableCell>
                          <Badge tone={SESSION_STATUS_BADGE[session.status].tone}>{SESSION_STATUS_BADGE[session.status].label}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatDateTime(session.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
                            {continueButton(session)}
                            {deleteButton(session)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </Card>
      </div>

      {confirmDelete && (
        <Modal
          title="Delete interview session?"
          onClose={() => setConfirmDelete(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={remove} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete"}
              </Button>
            </>
          }
        >
          <p className="text-sm leading-relaxed text-muted-foreground">
            This permanently removes the <strong className="text-foreground">{confirmDelete.role}</strong> session from {formatDate(confirmDelete.created_at)}, including
            all answers and feedback. This cannot be undone.
          </p>
        </Modal>
      )}
    </>
  )
}
