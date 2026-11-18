import { useState } from "react"
import { Check, ChevronDown, Clock, Lock } from "lucide-react"
import type { AnswerRecord, QuestionItem } from "../../types"
import type { InterviewStrings } from "../../i18n/interviewStrings"
import { isSkippedAnswer } from "../../services/answerStatus"
import { formatClock } from "./RoomParts"
import { cn } from "@/lib/utils"

interface QuestionPanelProps {
  s: InterviewStrings
  questions: QuestionItem[]
  answers: Record<string, AnswerRecord>
  index: number
  /** Answer time of the question being answered. */
  seconds: number
  recording: boolean
}

function Segments({ questions, answers, index }: Pick<QuestionPanelProps, "questions" | "answers" | "index">) {
  return (
    <div className="flex gap-1" aria-hidden="true">
      {questions.map((q, i) => (
        <span
          key={q.id}
          className={cn("h-1.5 flex-1 rounded-full", answers[q.id] ? "bg-primary" : i === index ? "bg-[var(--iv-meter)]" : "bg-muted")}
        />
      ))}
    </div>
  )
}

function QuestionList({ s, questions, answers, index, seconds, recording }: QuestionPanelProps) {
  return (
    <ol className="flex flex-col gap-2">
      {questions.map((q, i) => {
        const answer = answers[q.id]
        const done = Boolean(answer) && i !== index
        const current = i === index
        return (
          <li
            key={q.id}
            aria-current={current ? "step" : undefined}
            className={cn("flex items-start gap-3 rounded-xl border p-3", current ? "border-primary bg-[var(--iv-selected)]" : "bg-card")}
          >
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold tabular-nums",
                done ? "bg-primary text-primary-foreground" : current ? "bg-card text-primary ring-1 ring-primary/30" : "bg-muted text-muted-foreground",
              )}
            >
              {done ? <Check className="size-3.5" strokeWidth={2.6} aria-hidden="true" /> : String(i + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn("text-[13px] leading-snug font-medium [overflow-wrap:anywhere]", !done && !current && "text-muted-foreground")}>{q.text}</p>
              {done ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" aria-hidden="true" />
                  {isSkippedAnswer(answer) ? s.report.skipped : answer.durationSeconds > 0 ? s.answeredAt(formatClock(answer.durationSeconds)) : s.answeredAt()}
                </p>
              ) : current ? (
                <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-card px-2 py-0.5 text-xs font-medium text-primary">
                  <span aria-hidden="true" className={cn("size-1.5 rounded-full", recording ? "bg-[#b42318]" : "bg-primary")} />
                  {s.answeringNow}
                  {recording && ` · ${formatClock(seconds)}`}
                </p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">{s.upNext}</p>
              )}
            </div>
            {done && (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                <Lock className="size-3" aria-hidden="true" />
                {s.scoreHidden}
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}

/** Desktop: the list of questions next to the stage. Scores stay locked until the last question. */
export function QuestionPanel(props: QuestionPanelProps) {
  const { s, questions, answers } = props
  const answered = questions.filter((q) => answers[q.id]).length
  return (
    <aside aria-label={s.yourQuestions} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground">
      <div className="flex flex-col gap-2.5 border-b p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[15px] font-semibold">{s.yourQuestions}</h2>
          <span className="text-xs font-medium text-muted-foreground">{s.answeredOf(answered, questions.length)}</span>
        </div>
        <Segments {...props} />
      </div>
      <div className="p-3">
        <QuestionList {...props} />
      </div>
      <p className="flex items-start gap-2 bg-[var(--iv-selected)] px-4 py-3 text-xs leading-relaxed text-primary">
        <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        {s.scoresAfter(questions.length)}
      </p>
    </aside>
  )
}

/** Mobile and tablet: a compact progress card that opens the same list. */
export function QuestionProgress(props: QuestionPanelProps) {
  const { s, questions, answers, index } = props
  const [open, setOpen] = useState(false)
  const answered = questions.filter((q) => answers[q.id]).length
  return (
    <section aria-label={s.yourQuestions} className="flex flex-col gap-2.5 rounded-2xl border bg-card p-3.5 text-card-foreground">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-8 items-center gap-2 rounded-md text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <span className="text-sm font-semibold">{s.questionXofY(index + 1, questions.length)}</span>
        <span className="flex-1 text-xs text-muted-foreground">· {s.answeredOf(answered, questions.length)}</span>
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>
      <Segments {...props} />
      {open && <QuestionList {...props} />}
      <p className="flex items-center gap-1.5 text-xs text-primary">
        <Lock className="size-3 shrink-0" aria-hidden="true" />
        {s.scoresHiddenNote}
      </p>
    </section>
  )
}
