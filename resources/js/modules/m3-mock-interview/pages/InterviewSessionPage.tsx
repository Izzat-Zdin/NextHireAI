import { useEffect, useState } from "react"
import { moduleLabel } from "@/components/navigation"
import { Link, useParams } from "@/lib/router"
import { ArrowLeft, CheckCircle2, ChevronDown, MessageSquareText, Printer, Zap } from "lucide-react"
import { Alert, Badge, Button, Card, EmptyState, LoadingState, ScoreRing } from "@/components/ui"
import { errorMessage, formatDateTime, scoreLabel, scoreTone } from "@/lib/format"
import type { InterviewLanguageDb, InterviewTypeDb } from "@/lib/types"
import { getSessionDetail, type SessionDetail } from "../services/interviewService"
import { Button as UiButton } from "@/components/shadcn/button"
import { Card as UiCard } from "@/components/shadcn/card"
import { cn } from "@/lib/utils"

const TYPE_LABEL: Record<InterviewTypeDb, string> = { HR: "HR", Tech: "Technical", Behaviour: "Behavioural" }
const LANGUAGE_LABEL: Record<InterviewLanguageDb, string> = { BI: "English", Malay: "Malay" }
const lines = (value?: string | null) => (value ? value.split("\n").filter(Boolean) : [])

export default function InterviewSessionPage() {
  const { sessionId = "" } = useParams()
  const [detail, setDetail] = useState<SessionDetail | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState<number | null>(1)

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

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-2">
        <UiButton asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground hover:text-foreground pointer-coarse:min-h-11">
          <Link to="/interview/history">
            <ArrowLeft size={14} /> Back to history
          </Link>
        </UiButton>
        <Button variant="secondary" onClick={() => window.print()}>
          <Printer size={15} /> Print / save PDF
        </Button>
      </div>
      <p className="-mb-2 text-sm font-medium text-muted-foreground">{moduleLabel(3)}</p>

      {/* Summary */}
      <UiCard className="min-w-0 gap-0 p-5 sm:p-6">
        <div className="grid min-w-0 grid-cols-1 items-center gap-5 sm:grid-cols-[auto_minmax(0,1fr)] lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-6">
          <div className="flex justify-center sm:block">
            <ScoreRing value={score} label="Overall" color="violet" />
          </div>
          <div className="min-w-0 space-y-2 text-center sm:text-left">
            {hasScore ? <Badge tone={scoreTone(score)}>{scoreLabel(score)}</Badge> : <Badge tone="slate">Not scored</Badge>}
            <h1 className="font-heading text-lg leading-snug font-bold tracking-tight sm:text-xl">
              {hasScore
                ? `You answered ${session.answered_count} of ${session.question_count} questions with an average score of ${score}/100.`
                : `You answered ${session.answered_count} of ${session.question_count} questions.`}
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Scores use a rule-based rubric and are guidance for practice, not a hiring decision.
            </p>
          </div>
          <div className="flex min-w-0 flex-col items-center gap-0.5 border-t pt-4 text-center sm:col-span-2 sm:items-start sm:text-left lg:col-span-1 lg:min-w-44 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
            <span className="text-xs text-muted-foreground">
              {TYPE_LABEL[session.interview_type]} · {LANGUAGE_LABEL[session.language]}
            </span>
            <strong className="font-heading text-base font-semibold [overflow-wrap:anywhere]">{session.role}</strong>
            <small className="text-xs text-muted-foreground">{formatDateTime(session.completed_at ?? session.created_at)}</small>
          </div>
        </div>
      </UiCard>

      {(strengths.length > 0 || weaknesses.length > 0) && (
        <div className="grid min-w-0 gap-6 lg:grid-cols-2">
          <Card title="What stood out">
            {strengths.length ? (
              <ul className="flex flex-col gap-3">
                {strengths.map((text) => (
                  <li key={text} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                    <strong className="min-w-0 font-medium">{text}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No recurring strengths were recorded for this session.</p>
            )}
          </Card>
          <Card title="Focus next">
            {weaknesses.length ? (
              <ul className="flex flex-col gap-3">
                {weaknesses.map((text) => (
                  <li key={text} className="flex items-start gap-2.5 text-sm">
                    <Zap className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                    <strong className="min-w-0 font-medium">{text}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No recurring weaknesses were recorded for this session.</p>
            )}
          </Card>
        </div>
      )}

      <div className="flex min-w-0 flex-col gap-3">
        {items.map((item) => {
          const ev = item.evaluation
          const isOpen = open === item.questionNo
          const questionScore = ev ? Math.round(Number(ev.overall_score)) : null
          const words = Number(item.audio?.word_count ?? 0)
          const fillers = Number(item.audio?.filler_total ?? 0)
          const fillerRate = words ? (fillers / words) * 100 : 0
          return (
            <UiCard key={item.questionNo} className="min-w-0 gap-0 overflow-hidden py-0">
              <button
                type="button"
                className="flex w-full items-start gap-3 p-4 text-left outline-none hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset sm:items-center sm:p-5"
                onClick={() => setOpen(isOpen ? null : item.questionNo)}
                aria-expanded={isOpen}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-md border bg-muted text-xs font-bold tabular-nums">Q{item.questionNo}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm leading-snug font-semibold [overflow-wrap:anywhere] sm:text-base">{item.question}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {questionScore !== null ? scoreLabel(questionScore) : item.answer ? "Not evaluated" : "Skipped"}
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-2">
                  {questionScore !== null ? <Badge tone={scoreTone(questionScore)}>{questionScore}/100</Badge> : <Badge tone="slate">—</Badge>}
                  <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} aria-hidden="true" />
                </span>
              </button>
              {isOpen && (
                <div className="flex flex-col gap-4 border-t p-4 sm:p-5">
                  <div className="rounded-lg border bg-muted/40 p-4">
                    <span className="text-xs font-medium text-muted-foreground">Your answer</span>
                    <p className="mt-1 text-sm leading-relaxed [overflow-wrap:anywhere]">{item.answer || "No answer recorded."}</p>
                  </div>
                  {item.audio && (
                    <div className="flex flex-wrap gap-2">
                      {item.audio.word_count !== null && <Badge tone="slate">{item.audio.word_count} words</Badge>}
                      {item.audio.speaking_rate !== null && item.audio.speaking_rate > 0 && (
                        <Badge tone="slate">{Math.round(Number(item.audio.speaking_rate))} WPM</Badge>
                      )}
                      {item.audio.filler_total !== null && (
                        <Badge tone={fillerRate > 5 ? "amber" : "green"}>
                          {fillers} filler {fillers === 1 ? "word" : "words"}
                        </Badge>
                      )}
                    </div>
                  )}
                  {ev && (
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-4">
                        <FeedbackLines label="Strengths" items={lines(ev.strengths)} />
                        <FeedbackLines label="Weaknesses" items={lines(ev.weaknesses)} />
                      </div>
                      <FeedbackLines label="How to improve" items={lines(ev.improvements)} />
                    </div>
                  )}
                </div>
              )}
            </UiCard>
          )
        })}
      </div>
    </div>
  )
}

function FeedbackLines({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <ul className="list-disc space-y-1 pl-4 text-sm leading-relaxed marker:text-muted-foreground/60">
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </div>
  )
}
