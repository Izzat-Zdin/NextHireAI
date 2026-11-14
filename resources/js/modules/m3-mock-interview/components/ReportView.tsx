import React, { useState } from "react"
import { ArrowRight, BarChart3, ChevronDown, ChevronUp, Download, Gauge, Lightbulb, RotateCcw, Target } from "lucide-react"
import type { AnswerRecord, SetupConfig } from "../types"
import { getInterviewStrings } from "../i18n/interviewStrings"
import { isSkippedAnswer } from "../services/answerStatus"
import { TranscriptText } from "./room/TranscriptText"
import { improvementPoints } from "./room/FeedbackStep"
import { Badge, Button, Card, ScoreRing, StatCard } from "@/components/ui"
import { Badge as UiBadge } from "@/components/shadcn/badge"
import { Card as UiCard } from "@/components/shadcn/card"
import { Progress as UiProgress } from "@/components/shadcn/progress"
import { cn } from "@/lib/utils"
import { moduleLabel } from "@/components/navigation"

interface ReportViewProps {
  config: SetupConfig
  answers: Record<string, AnswerRecord>
  overallScore: number
  onPracticeAgain: () => void
  onNavigateTab: (tab: string) => void
}

const average = (values: number[]) => (values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) : 0)

/** Session report, shown in the language of the interview. */
export const ReportView: React.FC<ReportViewProps> = ({ config, answers, overallScore, onPracticeAgain, onNavigateTab }) => {
  const s = getInterviewStrings(config.language)
  const r = s.report
  const role = config.role.trim() || s.generalRole
  const answerList = Object.values(answers).sort((a, b) => a.questionNumber - b.questionNumber)
  const totalQuestions = answerList.length
  const answeredCount = answerList.filter((a) => !isSkippedAnswer(a)).length
  const scored = answerList.filter((a) => a.evaluation && !isSkippedAnswer(a)).map((a) => a.evaluation!)

  const [expandedIndex, setExpandedIndex] = useState<number | null>(0)

  const avgRelevance = average(scored.map((e) => e.scores.relevance))
  const avgClarity = average(scored.map((e) => e.scores.clarity))
  const avgSpecificity = average(scored.map((e) => e.scores.specificity))
  const avgTechnical = average(scored.map((e) => e.scores.technicalAccuracy))
  const totalFillers = scored.reduce((sum, e) => sum + (e.speechMetrics?.fillerAnalysis.total || 0), 0)

  const tier = overallScore >= 80 ? r.tiers.ready : overallScore >= 65 ? r.tiers.competitive : r.tiers.developing

  const competencies = [
    { label: r.relevance, value: avgRelevance },
    { label: r.clarity, value: avgClarity },
    { label: r.specificity, value: avgSpecificity },
    { label: r.technical, value: avgTechnical },
  ]

  return (
    <div className="interview-theme mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-6" lang={config.language === "ms-MY" ? "ms" : "en"}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl min-w-0 space-y-1.5">
          <p className="text-sm font-medium text-muted-foreground">{moduleLabel(3)}</p>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">{r.title}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">{r.subtitle(role, s.typeName[config.type])}</p>
        </div>

        <div className="no-print flex shrink-0 flex-wrap gap-2 [&>*]:max-sm:flex-1">
          <Button variant="secondary" onClick={() => window.print()}>
            <Download size={15} /> {r.exportPdf}
          </Button>
          <Button onClick={onPracticeAgain}>
            <RotateCcw size={15} /> {r.practiceAgain}
          </Button>
        </div>
      </div>

      <UiCard className="min-w-0 flex-col gap-6 p-5 sm:p-7 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 space-y-2.5">
          <UiBadge variant="secondary">{r.completed}</UiBadge>
          <h2 className="font-heading text-2xl leading-tight font-bold tracking-tight sm:text-3xl">{tier.label}</h2>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            {tier.desc}{" "}
            {answeredCount === totalQuestions ? r.answeredAll(totalQuestions, role) : r.answeredSome(answeredCount, totalQuestions, role)}
          </p>
        </div>

        <div className="flex items-center gap-4 border-t pt-5 md:border-t-0 md:border-l md:pt-0 md:pl-7">
          <ScoreRing value={overallScore} label={r.scoreLabel} />
          <div className="flex flex-col">
            <strong className="font-heading text-base font-semibold">{r.performance}</strong>
            <span className="text-sm text-muted-foreground">{scored.length > 0 ? r.averageOf(scored.length) : r.noneScored}</span>
          </div>
        </div>
      </UiCard>

      <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Gauge} label={r.relevance} value={`${avgRelevance}%`} meta={r.relevanceMeta} />
        <StatCard icon={BarChart3} label={r.clarity} value={`${avgClarity}%`} meta={r.clarityMeta} />
        <StatCard icon={Target} label={r.specificity} value={`${avgSpecificity}%`} meta={r.specificityMeta} />
        <StatCard icon={Lightbulb} label={r.fillerWords} value={r.fillersCount(totalFillers)} meta={r.fillerMeta} />
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        <Card title={r.competencies}>
          <div className="flex flex-col gap-4">
            {competencies.map((item) => (
              <div key={item.label}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                  <span>{item.label}</span>
                  <strong className="font-semibold tabular-nums">{item.value}%</strong>
                </div>
                <UiProgress className="h-2" value={item.value} aria-label={item.label} />
              </div>
            ))}
          </div>
        </Card>

        <Card title={r.actionPlan}>
          <ol className="flex flex-col gap-4">
            {r.actions.map((step, index) => (
              <li key={step.title} className="flex items-start gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full border bg-muted text-xs font-bold">{index + 1}</span>
                <div className="min-w-0">
                  <strong className="block text-sm font-semibold">{step.title}</strong>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <Card title={r.perQuestion}>
        <p className="-mt-2 mb-4 text-sm text-muted-foreground">{r.perQuestionHint}</p>
        <div className="flex flex-col gap-2.5">
          {answerList.map((item, idx) => {
            const isExpanded = expandedIndex === idx
            const skipped = isSkippedAnswer(item)
            const score = skipped ? null : (item.evaluation?.overallScore ?? null)
            return (
              <div
                key={item.questionId || idx}
                className={cn("min-w-0 overflow-hidden rounded-lg border transition-colors", isExpanded ? "bg-muted/40" : "bg-card")}
              >
                <button
                  type="button"
                  className="flex min-h-14 w-full flex-col gap-2 px-4 py-3 text-left outline-none hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                  aria-expanded={isExpanded}
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
                    <span className="grid size-7 shrink-0 place-items-center rounded-md border bg-muted text-xs font-bold tabular-nums">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <strong className="min-w-0 text-sm font-medium sm:truncate">{item.questionText}</strong>
                  </div>
                  <div className="flex shrink-0 items-center justify-between gap-3 pl-10 sm:pl-0">
                    {score !== null ? (
                      <Badge tone={score >= 75 ? "green" : score >= 60 ? "blue" : "amber"}>
                        {r.scoreLabel}: {score}/100
                      </Badge>
                    ) : (
                      <Badge tone="slate">{skipped ? r.skipped : r.notScored}</Badge>
                    )}
                    {isExpanded ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="flex flex-col gap-4 border-t px-4 pt-3 pb-4">
                    {skipped ? (
                      <p className="text-sm text-muted-foreground italic">{r.skippedNote}</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <strong className="text-sm font-semibold">{r.yourResponse}</strong>
                          <span className="rounded bg-[var(--iv-filler)] px-1.5 py-0.5 text-xs text-[var(--iv-filler-fg)]">
                            {s.fillers(item.evaluation?.speechMetrics?.fillerAnalysis.total ?? 0)}
                          </span>
                        </div>
                        <TranscriptText text={item.answerText} empty="" className="min-h-0 bg-card text-sm" />
                      </div>
                    )}

                    {item.evaluation && !skipped && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="text-sm">
                          <strong className="mb-1 block font-semibold text-primary">{s.wentWell}</strong>
                          <ul className="list-disc space-y-1 pl-4 leading-relaxed text-muted-foreground">
                            {item.evaluation.strengths.map((point) => (
                              <li key={point}>{point}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="text-sm">
                          <strong className="mb-1 block font-semibold text-[var(--iv-warn-fg)]">{s.improveNext}</strong>
                          <ul className="list-disc space-y-1 pl-4 leading-relaxed text-muted-foreground">
                            {improvementPoints(item.evaluation).map((point) => (
                              <li key={point}>{point}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      <div className="no-print flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <Button variant="secondary" onClick={onPracticeAgain}>
          <RotateCcw size={15} /> {r.practiceAnother}
        </Button>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button variant="secondary" onClick={() => onNavigateTab("assessment")}>
            {r.goReadiness} <ArrowRight size={15} />
          </Button>
          <Button onClick={() => onNavigateTab("learning")}>
            {r.goLearning} <ArrowRight size={15} />
          </Button>
        </div>
      </div>
    </div>
  )
}
