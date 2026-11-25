import { useEffect, useState } from "react"
import { moduleLabel } from "@/components/navigation"
import { Link, useNavigate, useParams } from "@/lib/router"
import { ArrowLeft, ChevronDown, Download, MessageSquareText, Minus, Plus, RotateCcw, Sparkles, Trash2 } from "lucide-react"
import { Alert, Button, Card, EmptyState, LoadingState, Modal } from "@/components/ui"
import { errorMessage, formatDateTime, scoreLabel } from "@/lib/format"
import type { InterviewLanguageDb, InterviewTypeDb } from "@/lib/types"
import { deleteSession, getSessionDetail, type SessionDetail } from "../services/interviewService"
import { personaInfo } from "../services/personas"
import { scoreBarClass, scoreTextClass } from "../components/room/RoomParts"
import { Button as UiButton } from "@/components/shadcn/button"
import { cn } from "@/lib/utils"

const TYPE_LABEL: Record<InterviewTypeDb, string> = { HR: "HR", Tech: "Technical", Behaviour: "Behavioural" }
const LANGUAGE_LABEL: Record<InterviewLanguageDb, string> = { BI: "English", Malay: "Malay" }
const lines = (value?: string | null) => (value ? value.split("\n").filter(Boolean) : [])

function Points({ title, items, tone }: { title: string; items: string[]; tone: "good" | "improve" }) {
  if (!items.length) return null
  const Icon = tone === "good" ? Plus : Minus
  return (
    <div className="min-w-0">
      <h4 className={cn("mb-2 text-sm font-semibold", tone === "good" ? "text-emerald-700 dark:text-emerald-400" : "text-[var(--iv-warn-fg)]")}>{title}</h4>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed">
            <span
              aria-hidden="true"
              className={cn(
                "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full",
                tone === "good" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" : "bg-[var(--iv-warn-bg)] text-[var(--iv-warn-fg)]",
              )}
            >
              <Icon className="size-3" strokeWidth={2.6} />
            </span>
            <span className="min-w-0">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** History · one finished (or paused) session: overall result and every question with its feedback. */
export default function InterviewSessionPage() {
  const { sessionId = "" } = useParams()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<SessionDetail | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState<number | null>(1)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    getSessionDetail(sessionId)
      .then(setDetail)
      .catch((err) => {
        setError(errorMessage(err))
        setDetail(null)
      })
  }, [sessionId])

  if (detail === undefined) return <LoadingState label="Loading session report…" />
  if (!detail)
    return (
      <Card>
        {error && <Alert tone="error">{error}</Alert>}
        <EmptyState
          icon={MessageSquareText}
          title="Session not found"
          text="It may have been deleted."
          action={
            <UiButton asChild className="pointer-coarse:min-h-11">
              <Link to="/interview/history">Back to history</Link>
            </UiButton>
          }
        />
      </Card>
    )

  const { session, report, items } = detail
  const hasScore = session.average_score !== null
  const score = Math.round(Number(session.average_score ?? 0))
  const strengths = lines(report?.strengths_summary)
  const weaknesses = lines(report?.weaknesses_summary)
  const finished = session.status === "Finish"
  const rates = items.map((i) => Number(i.audio?.speaking_rate ?? 0)).filter((n) => n > 0)
  const avgRate = rates.length ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : null
  const fillers = items.reduce((sum, i) => sum + Number(i.audio?.filler_total ?? 0), 0)
  const metrics = [
    { label: "Answered", value: `${session.answered_count}/${session.question_count}` },
    { label: "Speaking rate", value: avgRate !== null ? `${avgRate} wpm` : "–" },
    { label: "Filler words", value: String(fillers) },
  ]

  const remove = async () => {
    setDeleting(true)
    try {
      await deleteSession(session.session_id)
      navigate("/interview/history")
    } catch (err) {
      setError(errorMessage(err))
      setConfirmDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="interview-theme flex w-full min-w-0 flex-col gap-4 sm:gap-5">
      {error && <Alert tone="error">{error}</Alert>}

      <header className="flex flex-wrap items-start gap-3">
        <UiButton asChild variant="outline" size="icon" className="no-print size-10 shrink-0" aria-label="Back to history">
          <Link to="/interview/history">
            <ArrowLeft aria-hidden="true" />
          </Link>
        </UiButton>
        <div className="min-w-0 flex-1 basis-60">
          <p className="text-xs font-medium text-muted-foreground">{moduleLabel(3)} · History</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-xl font-bold tracking-tight [overflow-wrap:anywhere] sm:text-2xl">
              {session.role} · {TYPE_LABEL[session.interview_type]}
            </h1>
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                finished ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-muted text-muted-foreground",
              )}
            >
              <span aria-hidden="true" className={cn("size-1.5 rounded-full", finished ? "bg-emerald-500" : "bg-muted-foreground")} />
              {finished ? "Finished" : session.status === "Pause" ? "Paused" : session.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDateTime(session.completed_at ?? session.created_at)} · {personaInfo(session.persona).name} · {session.question_count} questions ·{" "}
            {LANGUAGE_LABEL[session.language]}
          </p>
        </div>
        <div className="no-print flex gap-2 max-sm:w-full [&>*]:max-sm:flex-1">
          <UiButton type="button" variant="outline" className="min-h-10" onClick={() => window.print()}>
            <Download aria-hidden="true" /> Report PDF
          </UiButton>
          <UiButton
            type="button"
            variant="outline"
            className="min-h-10 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 aria-hidden="true" /> Delete
          </UiButton>
        </div>
      </header>

      {/* Summary */}
      <section className="flex min-w-0 flex-col items-center gap-5 rounded-2xl border bg-card p-5 text-center text-card-foreground sm:flex-row sm:p-6 sm:text-left">
        <div
          className="relative grid size-24 shrink-0 place-items-center rounded-full"
          style={{ background: `conic-gradient(var(--primary) ${(hasScore ? score : 0) * 3.6}deg, var(--muted) 0)` }}
          role="img"
          aria-label={hasScore ? `Overall score: ${score} out of 100` : "Not scored"}
        >
          <div className="absolute inset-[8px] rounded-full bg-card" />
          <strong className="relative font-heading text-3xl font-bold text-primary">{hasScore ? score : "–"}</strong>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div>
            <h2 className="font-heading text-lg font-bold">{hasScore ? `Overall · ${scoreLabel(score)}` : "Not scored"}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Scores use a rule-based rubric and are guidance for practice, not a hiring decision.</p>
          </div>
          <dl className="grid grid-cols-3 gap-2 sm:flex sm:gap-0 sm:divide-x">
            {metrics.map((m) => (
              <div key={m.label} className="rounded-lg bg-muted/40 px-3 py-2 text-left sm:rounded-none sm:bg-transparent sm:px-5 sm:py-0 sm:first:pl-0">
                <dd className="text-lg font-semibold tabular-nums">{m.value}</dd>
                <dt className="text-xs text-muted-foreground">{m.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {(strengths.length > 0 || weaknesses.length > 0) && (
        <section className="grid gap-5 rounded-2xl border bg-card p-5 text-card-foreground sm:grid-cols-2">
          <Points title="Strengths" items={strengths} tone="good" />
          <Points title="Work on" items={weaknesses} tone="improve" />
        </section>
      )}

      {/* Questions and answers */}
      <section aria-labelledby="session-questions" className="min-w-0 overflow-hidden rounded-2xl border bg-card text-card-foreground">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3.5 sm:px-5">
          <h2 id="session-questions" className="text-[15px] font-semibold">
            Questions & answers
          </h2>
          <span className="text-xs text-muted-foreground">Transcript, score and feedback for every question</span>
        </div>
        <ol>
          {items.map((item) => {
            const ev = item.evaluation
            const isOpen = open === item.questionNo
            const questionScore = ev ? Math.round(Number(ev.overall_score)) : null
            const meta = [
              item.audio?.word_count !== null && item.audio?.word_count !== undefined ? `${item.audio.word_count} words` : null,
              item.audio?.speaking_rate ? `${Math.round(Number(item.audio.speaking_rate))} wpm` : null,
              item.audio?.filler_total !== null && item.audio?.filler_total !== undefined
                ? `${item.audio.filler_total} filler ${Number(item.audio.filler_total) === 1 ? "word" : "words"}`
                : null,
            ].filter(Boolean)
            return (
              <li key={item.questionNo} className={cn("border-b last:border-b-0", isOpen && "bg-muted/30")}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left outline-none hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset sm:px-5"
                  onClick={() => setOpen(isOpen ? null : item.questionNo)}
                  aria-expanded={isOpen}
                >
                  <span
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold",
                      isOpen ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {item.questionNo}
                  </span>
                  <span className={cn("min-w-0 flex-1 text-sm leading-snug [overflow-wrap:anywhere]", isOpen && "font-semibold")}>{item.question}</span>
                  <span className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-muted max-sm:hidden" aria-hidden="true">
                    {questionScore !== null && <span className={cn("block h-full rounded-full", scoreBarClass(questionScore))} style={{ width: `${questionScore}%` }} />}
                  </span>
                  <span className={cn("w-8 shrink-0 text-right text-sm font-semibold tabular-nums", questionScore === null ? "text-muted-foreground" : scoreTextClass(questionScore))}>
                    {questionScore ?? "–"}
                  </span>
                  <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} aria-hidden="true" />
                </button>
                {isOpen && (
                  <div className="flex flex-col gap-4 px-4 pb-5 sm:pr-5 sm:pl-14">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-muted-foreground">Your answer</span>
                        {meta.length > 0 && <span className="text-xs text-muted-foreground tabular-nums">{meta.join(" · ")}</span>}
                      </div>
                      <p className="rounded-xl bg-card p-3.5 text-sm leading-relaxed [overflow-wrap:anywhere]">{item.answer || "No answer recorded."}</p>
                    </div>
                    {ev ? (
                      <>
                        {lines(ev.improvements)[0] && (
                          <p className="flex items-start gap-2 rounded-xl bg-[var(--iv-selected)] px-3.5 py-2.5 text-sm text-primary">
                            <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                            {lines(ev.improvements)[0]}
                          </p>
                        )}
                        <div className="grid gap-5 sm:grid-cols-2">
                          <Points title="What went well" items={lines(ev.strengths)} tone="good" />
                          <Points title="To improve" items={lines(ev.weaknesses)} tone="improve" />
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">{item.answer ? "Not evaluated." : "Skipped."}</p>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      </section>

      <div className="no-print flex justify-end">
        <UiButton asChild className="min-h-11 font-semibold max-sm:w-full">
          <Link to="/interview">
            <RotateCcw aria-hidden="true" /> Practice this role again
          </Link>
        </UiButton>
      </div>

      {confirmDelete && (
        <Modal
          title="Delete interview session?"
          onClose={() => setConfirmDelete(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={remove} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete"}
              </Button>
            </>
          }
        >
          <p className="text-sm text-muted-foreground">This removes the session, its answers and its report from your history. This cannot be undone.</p>
        </Modal>
      )}
    </div>
  )
}
