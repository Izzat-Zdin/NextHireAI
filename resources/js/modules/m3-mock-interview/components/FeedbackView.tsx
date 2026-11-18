import { useEffect, useRef, useState } from "react"
import { ArrowLeft, ArrowRight, Minus, Plus, Sparkles } from "lucide-react"
import type { AnswerRecord, SetupConfig } from "../types"
import { getInterviewStrings } from "../i18n/interviewStrings"
import { isSkippedAnswer } from "../services/answerStatus"
import { FlowBar, PageHeading, formatClock, improvementPoints, scoreTextClass } from "./room/RoomParts"
import { TranscriptText } from "./room/TranscriptText"
import { Button } from "@/components/shadcn/button"
import { moduleLabel } from "@/components/navigation"
import { cn } from "@/lib/utils"

interface FeedbackViewProps {
  config: SetupConfig
  answers: Record<string, AnswerRecord>
  /** Question shown first (0-based), e.g. when opened from the report. */
  initialIndex?: number
  onContinue: () => void
}

function PointList({ title, items, tone }: { title: string; items: string[]; tone: "good" | "improve" }) {
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

/** Step 3 of the flow: every answer's score and feedback, one question at a time, before the report. */
export function FeedbackView({ config, answers, initialIndex = 0, onContinue }: FeedbackViewProps) {
  const s = getInterviewStrings(config.language)
  const r = s.report
  const list = Object.values(answers).sort((a, b) => a.questionNumber - b.questionNumber)
  const total = list.length
  const answered = list.filter((a) => !isSkippedAnswer(a)).length
  const scores = list.map((a) => (isSkippedAnswer(a) ? null : (a.evaluation?.overallScore ?? null)))
  const scored = scores.filter((n): n is number => n !== null)
  const average = scored.length ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : null

  const [selected, setSelected] = useState(Math.min(Math.max(0, initialIndex), Math.max(0, total - 1)))
  const detailRef = useRef<HTMLHeadingElement | null>(null)
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    detailRef.current?.focus()
  }, [selected])

  const item = list[selected]
  if (!item) return null
  const skipped = isSkippedAnswer(item)
  const ev = skipped ? null : (item.evaluation ?? null)
  const metrics = ev?.speechMetrics
  const meta = [
    item.durationSeconds > 0 ? formatClock(item.durationSeconds) : null,
    metrics?.speakingRateWordsPerMinute ? s.wpm(metrics.speakingRateWordsPerMinute) : null,
    metrics ? s.fillers(metrics.fillerAnalysis.total) : null,
  ]
    .filter(Boolean)
    .join(" · ")
  const subScores = ev
    ? [
        { label: r.relevance, value: ev.scores.relevance },
        { label: r.clarity, value: ev.scores.clarity },
        { label: r.specificity, value: ev.scores.specificity },
        { label: r.technical, value: ev.scores.technicalAccuracy },
      ]
    : []
  const summary = ev ? ev.summary || ev.strengths[0] || "" : ""

  return (
    <div className="interview-theme mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-4 sm:gap-5" lang={config.language === "ms-MY" ? "ms" : "en"}>
      <PageHeading eyebrow={moduleLabel(3)} title={s.feedbackTitle} subtitle={s.feedbackSub(answered, total)}>
        <Button type="button" className="min-h-10 font-semibold" onClick={onContinue}>
          {s.continueReport} <ArrowRight aria-hidden="true" />
        </Button>
      </PageHeading>

      <FlowBar step="feedback" s={s} />

      <div className="grid min-w-0 items-start gap-4 sm:gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* Question list: tabs on small screens, a list on large screens */}
        <nav aria-label={s.questionsTitle} className="min-w-0 lg:sticky lg:top-6">
          <div className="grid grid-cols-5 gap-1.5 lg:hidden">
            {list.map((a, i) => {
              const score = scores[i]
              const active = i === selected
              return (
                <button
                  key={a.questionId}
                  type="button"
                  aria-current={active ? "true" : undefined}
                  onClick={() => setSelected(i)}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center rounded-xl border text-center outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    active ? "border-primary bg-primary text-primary-foreground" : "bg-card",
                  )}
                >
                  <span className={cn("text-[11px] font-medium", active ? "text-primary-foreground/80" : "text-muted-foreground")}>Q{i + 1}</span>
                  <span className={cn("text-base font-bold tabular-nums", !active && (score === null ? "text-muted-foreground" : scoreTextClass(score)))}>
                    {score ?? "–"}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="overflow-hidden rounded-2xl border bg-card text-card-foreground max-lg:hidden">
            <div className="flex items-center justify-between gap-2 border-b px-4 py-3.5">
              <h2 className="text-[15px] font-semibold">{s.questionsTitle}</h2>
              {average !== null && (
                <span className="text-xs text-muted-foreground">
                  {s.average} <strong className={cn("text-sm", scoreTextClass(average))}>{average}</strong>
                </span>
              )}
            </div>
            <ol>
              {list.map((a, i) => {
                const score = scores[i]
                const active = i === selected
                return (
                  <li key={a.questionId} className="border-b last:border-b-0">
                    <button
                      type="button"
                      aria-current={active ? "true" : undefined}
                      onClick={() => setSelected(i)}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-3 text-left outline-none hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset",
                        active && "bg-[var(--iv-selected)] shadow-[inset_3px_0_0_var(--primary)] hover:bg-[var(--iv-selected)]",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold",
                          active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {i + 1}
                      </span>
                      <span className={cn("min-w-0 flex-1 text-[13px] leading-snug", active ? "font-semibold text-primary" : "font-medium")}>{a.questionText}</span>
                      <span className={cn("shrink-0 text-sm font-semibold tabular-nums", score === null ? "text-muted-foreground" : scoreTextClass(score))}>
                        {score ?? "–"}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </div>
        </nav>

        {/* Selected question */}
        <section aria-labelledby="feedback-detail" className="flex min-w-0 flex-col gap-5 rounded-2xl border bg-card p-4 text-card-foreground sm:p-6">
          <div className="flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-primary">{s.questionXofY(selected + 1, total)}</p>
              <h2 id="feedback-detail" ref={detailRef} tabIndex={-1} className="mt-1 font-heading text-base leading-snug font-semibold outline-none sm:text-lg">
                {item.questionText}
              </h2>
            </div>
            {ev && (
              <span
                className={cn(
                  "grid size-16 shrink-0 place-items-center rounded-full text-center",
                  ev.overallScore >= 80 ? "bg-[var(--iv-selected)]" : "bg-[var(--iv-warn-bg)]",
                )}
                aria-label={`${r.scoreLabel}: ${ev.overallScore} / 100`}
              >
                <span className={cn("leading-none", scoreTextClass(ev.overallScore))}>
                  <span className="block font-heading text-2xl font-bold">{ev.overallScore}</span>
                  <span className="block text-[10px] font-medium">{s.outOf100}</span>
                </span>
              </span>
            )}
          </div>

          {skipped ? (
            <p className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">{r.skippedNote}</p>
          ) : !ev ? (
            <p className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">{r.notScored}</p>
          ) : (
            <>
              <dl className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-0 sm:divide-x">
                {subScores.map((sub) => (
                  <div key={sub.label} className="rounded-lg bg-muted/40 px-3 py-2 sm:rounded-none sm:bg-transparent sm:px-5 sm:py-0 sm:first:pl-0">
                    <dd className={cn("text-lg font-semibold tabular-nums", sub.value < 8 && "text-[var(--iv-warn-fg)]")}>
                      {sub.value}
                      <span className="text-xs font-normal text-muted-foreground">/10</span>
                    </dd>
                    <dt className="text-xs text-muted-foreground">{sub.label}</dt>
                  </div>
                ))}
              </dl>

              {summary && (
                <p className="flex items-start gap-2.5 border-t pt-4 text-[15px] leading-relaxed">
                  <Sparkles className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
                  {summary}
                </p>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <PointList title={s.wentWell} items={ev.strengths} tone="good" />
                <PointList title={s.improveNext} items={improvementPoints(ev)} tone="improve" />
              </div>
            </>
          )}

          {!skipped && (
            <div className="flex flex-col gap-2 border-t pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-muted-foreground">{s.answerMeta}</h3>
                {meta && <span className="text-xs text-muted-foreground tabular-nums">{meta}</span>}
              </div>
              <TranscriptText text={item.answerText} empty="" className="min-h-0 border-0 bg-muted/40 text-sm" />
            </div>
          )}

          <div className="flex gap-2 border-t pt-4 sm:justify-end [&>*]:max-sm:flex-1">
            <Button type="button" variant="outline" className="min-h-11" onClick={() => setSelected((i) => i - 1)} disabled={selected === 0}>
              <ArrowLeft aria-hidden="true" /> {s.previous}
            </Button>
            {selected < total - 1 ? (
              <Button type="button" variant="outline" className="min-h-11" onClick={() => setSelected((i) => i + 1)}>
                {s.next} <ArrowRight aria-hidden="true" />
              </Button>
            ) : (
              <Button type="button" className="min-h-11 font-semibold" onClick={onContinue}>
                {s.continueReport} <ArrowRight aria-hidden="true" />
              </Button>
            )}
          </div>
        </section>
      </div>
      <p className="text-xs text-muted-foreground">{s.ruleBased}</p>
    </div>
  )
}
