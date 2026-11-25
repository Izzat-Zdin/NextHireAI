import React from "react"
import { ArrowLeft, ChevronRight, Download, FileText, Minus, Plus, RotateCcw } from "lucide-react"
import type { AnswerRecord, SetupConfig } from "../types"
import { getInterviewStrings } from "../i18n/interviewStrings"
import { isSkippedAnswer } from "../services/answerStatus"
import { checkStar } from "../services/starCheck"
import { personaInfo } from "../services/personas"
import { FlowBar, PageHeading, formatClock, improvementPoints, scoreBarClass, scoreTextClass } from "./room/RoomParts"
import { Button } from "@/components/shadcn/button"
import { moduleLabel } from "@/components/navigation"
import { cn } from "@/lib/utils"

interface ReportViewProps {
  config: SetupConfig
  answers: Record<string, AnswerRecord>
  overallScore: number
  /** Whole session time, from the room. */
  sessionSeconds?: number
  onPracticeAgain: () => void
  onBackToFeedback: () => void
  /** Opens the feedback page at this question (0-based). */
  onOpenQuestion: (index: number) => void
}

/** The most common points across answers, most frequent first. */
function topPoints(lists: string[][], limit = 3) {
  const counts = new Map<string, number>()
  for (const list of lists) for (const point of list) counts.set(point, (counts.get(point) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([point]) => point)
}

function Points({ title, items, tone }: { title: string; items: string[]; tone: "good" | "improve" }) {
  const Icon = tone === "good" ? Plus : Minus
  return (
    <div className="min-w-0">
      <h3 className={cn("mb-2.5 text-sm font-semibold", tone === "good" ? "text-emerald-700 dark:text-emerald-400" : "text-[var(--iv-warn-fg)]")}>{title}</h3>
      <ul className="flex flex-col gap-2.5">
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

/** Step 4 of the flow: the overall result, one list of questions, and the PDF. */
export const ReportView: React.FC<ReportViewProps> = ({ config, answers, overallScore, sessionSeconds = 0, onPracticeAgain, onBackToFeedback, onOpenQuestion }) => {
  const s = getInterviewStrings(config.language)
  const r = s.report
  const role = config.role.trim() || s.generalRole
  const list = Object.values(answers).sort((a, b) => a.questionNumber - b.questionNumber)
  const total = list.length
  const answered = list.filter((a) => !isSkippedAnswer(a))
  const scored = answered.filter((a) => a.evaluation).map((a) => a.evaluation!)

  const tier = overallScore >= 80 ? r.tiers.ready : overallScore >= 65 ? r.tiers.competitive : r.tiers.developing
  const rates = scored.map((e) => e.speechMetrics?.speakingRateWordsPerMinute).filter((n): n is number => typeof n === "number" && n > 0)
  const avgRate = rates.length ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : null
  const fillers = scored.reduce((sum, e) => sum + (e.speechMetrics?.fillerAnalysis.total ?? 0), 0)
  const starAnswers = answered.filter((a) => config.type !== "technical" && a.answerText)
  const starCoverage = starAnswers.length
    ? Math.round((starAnswers.reduce((sum, a) => sum + (4 - checkStar(a.answerText).missing.length), 0) / (starAnswers.length * 4)) * 100)
    : null
  const duration = sessionSeconds || list.reduce((sum, a) => sum + a.durationSeconds, 0)

  const strengths = topPoints(scored.map((e) => e.strengths))
  const workOn = topPoints(scored.map((e) => improvementPoints(e)))
  const metrics = [
    { label: r.speakingRate, value: avgRate !== null ? r.wpmShort(avgRate) : "–" },
    { label: r.fillerWords, value: String(fillers) },
    { label: r.starCoverage, value: starCoverage !== null ? `${starCoverage}%` : "–" },
    { label: r.duration, value: duration > 0 ? formatClock(duration) : "–" },
  ]
  const date = new Date().toLocaleDateString(config.language === "ms-MY" ? "ms-MY" : "en-GB", { day: "numeric", month: "short", year: "numeric" })

  return (
    <div className="interview-theme flex w-full min-w-0 flex-col gap-4 sm:gap-5" lang={config.language === "ms-MY" ? "ms" : "en"}>
      <PageHeading eyebrow={moduleLabel(3)} title={r.title} subtitle={`${role} · ${s.typeName[config.type]} · ${personaInfo(config.persona).name} · ${date}`}>
        <Button type="button" className="min-h-10 font-semibold" onClick={() => window.print()}>
          <Download aria-hidden="true" /> {r.downloadPdf}
        </Button>
      </PageHeading>

      <FlowBar step="report" s={s} />

      {/* Summary */}
      <section className="flex min-w-0 flex-col items-center gap-5 rounded-2xl border bg-card p-5 text-center text-card-foreground sm:flex-row sm:p-7 sm:text-left">
        <div
          className="relative grid size-28 shrink-0 place-items-center rounded-full sm:size-32"
          style={{ background: `conic-gradient(var(--primary) ${Math.max(0, Math.min(100, overallScore)) * 3.6}deg, var(--muted) 0)` }}
          role="img"
          aria-label={`${r.scoreLabel}: ${overallScore} / 100`}
        >
          <div className="absolute inset-[9px] rounded-full bg-card" />
          <div className="relative leading-none">
            <strong className="block font-heading text-4xl font-bold text-primary">{overallScore}</strong>
            <span className="text-xs font-medium text-muted-foreground">{s.outOf100}</span>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div>
            <h2 className="font-heading text-xl font-bold tracking-tight">{tier.label}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {tier.desc} {answered.length === total ? r.answeredAll(total, role) : r.answeredSome(answered.length, total, role)}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-0 sm:divide-x">
            {metrics.map((m) => (
              <div key={m.label} className="rounded-lg bg-muted/40 px-3 py-2 text-left sm:rounded-none sm:bg-transparent sm:px-5 sm:py-0 sm:first:pl-0">
                <dd className="text-lg font-semibold tabular-nums">{m.value}</dd>
                <dt className="text-xs text-muted-foreground">{m.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="grid min-w-0 items-start gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Questions */}
        <section aria-labelledby="report-questions" className="min-w-0 overflow-hidden rounded-2xl border bg-card text-card-foreground">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3.5 sm:px-5">
            <h2 id="report-questions" className="text-[15px] font-semibold">
              {s.questionsTitle}
            </h2>
            <span className="no-print text-xs text-muted-foreground">{r.openQuestionHint}</span>
          </div>
          <ol>
            {list.map((a, i) => {
              const skipped = isSkippedAnswer(a)
              const score = skipped ? null : (a.evaluation?.overallScore ?? null)
              return (
                <li key={a.questionId} className="border-b last:border-b-0">
                  <button
                    type="button"
                    onClick={() => onOpenQuestion(i)}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left outline-none hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset sm:px-5"
                  >
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">{i + 1}</span>
                    <span className="min-w-0 flex-1 text-sm leading-snug [overflow-wrap:anywhere]">{a.questionText}</span>
                    <span className="h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-muted max-sm:hidden" aria-hidden="true">
                      {score !== null && <span className={cn("block h-full rounded-full", scoreBarClass(score))} style={{ width: `${score}%` }} />}
                    </span>
                    <span className={cn("w-8 shrink-0 text-right text-sm font-semibold tabular-nums", score === null ? "text-muted-foreground" : scoreTextClass(score))}>
                      {score ?? "–"}
                    </span>
                    <ChevronRight className="no-print size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  </button>
                </li>
              )
            })}
          </ol>
        </section>

        <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
          {(strengths.length > 0 || workOn.length > 0) && (
            <section className="flex flex-col gap-4 rounded-2xl border bg-card p-5 text-card-foreground">
              {strengths.length > 0 && <Points title={r.strengthsTitle} items={strengths} tone="good" />}
              {strengths.length > 0 && workOn.length > 0 && <div className="border-t" />}
              {workOn.length > 0 && <Points title={r.workOn} items={workOn} tone="improve" />}
            </section>
          )}

          <section className="no-print flex items-center gap-3 rounded-2xl border border-primary/25 bg-[var(--iv-selected)] p-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-card text-primary">
              <FileText className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-primary">{r.pdfTitle}</p>
              <p className="text-xs text-primary/80">{r.pdfDesc}</p>
            </div>
            <Button type="button" className="min-h-10 shrink-0" onClick={() => window.print()}>
              <Download aria-hidden="true" /> {r.download}
            </Button>
          </section>
        </div>
      </div>

      {/* Printed PDF only: every answer with its feedback */}
      <section className="hidden flex-col gap-4 print:flex">
        <h2 className="text-lg font-semibold">{r.perQuestion}</h2>
        {list.map((a, i) => {
          const skipped = isSkippedAnswer(a)
          const ev = skipped ? null : a.evaluation
          return (
            <article key={a.questionId} className="break-inside-avoid rounded-xl border p-4">
              <h3 className="text-sm font-semibold">
                {i + 1}. {a.questionText} {ev ? `· ${ev.overallScore}/100` : ""}
              </h3>
              <p className="mt-2 text-sm">{skipped ? r.skippedNote : a.answerText}</p>
              {ev && (
                <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>{s.wentWell}</strong>
                    <ul className="list-disc pl-4">
                      {ev.strengths.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <strong>{s.improveNext}</strong>
                    <ul className="list-disc pl-4">
                      {improvementPoints(ev).map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </article>
          )
        })}
      </section>

      <div className="no-print flex gap-2 [&>*]:max-sm:flex-1 sm:justify-between">
        <Button type="button" variant="outline" className="min-h-11" onClick={onBackToFeedback}>
          <ArrowLeft aria-hidden="true" /> {r.backToFeedback}
        </Button>
        <Button type="button" variant="outline" className="min-h-11" onClick={onPracticeAgain}>
          <RotateCcw aria-hidden="true" /> {r.practiceAgain}
        </Button>
      </div>
    </div>
  )
}
