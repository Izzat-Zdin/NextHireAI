import { ArrowRight, Loader2 } from "lucide-react"
import type { EvaluationResult } from "../../types"
import type { InterviewStrings } from "../../i18n/interviewStrings"
import { StepActions, primaryButton, secondaryButton } from "./RoomParts"
import { Button } from "@/components/shadcn/button"

/** "Improve next time": weaknesses first, then the improvement tips, without repeats. */
export function improvementPoints(evaluation: EvaluationResult) {
  return [...new Set([...evaluation.weaknesses, ...evaluation.improvements])].slice(0, 3)
}

export function FeedbackStep({
  s,
  evaluation,
  spoken,
  isFollowUp,
  isLast,
  total,
  saving,
  exampleAnswer = null,
  onFollowUp,
  onNext,
  headingRef,
}: {
  s: InterviewStrings
  evaluation: EvaluationResult
  spoken: boolean
  isFollowUp: boolean
  isLast: boolean
  total: number
  saving: boolean
  /** A model answer for this question (from the suggested-answer bank), shown folded. */
  exampleAnswer?: string | null
  onFollowUp: () => void
  onNext: () => void
  headingRef: React.Ref<HTMLHeadingElement>
}) {
  const metrics = evaluation.speechMetrics
  const delivery: string[] = []
  if (spoken && metrics) {
    delivery.push(s.length(metrics.durationSeconds))
    if (metrics.speakingRateWordsPerMinute) delivery.push(s.wpm(metrics.speakingRateWordsPerMinute))
  } else if (metrics) {
    delivery.push(`${s.words(metrics.wordCount)} (${s.typedAnswer})`)
  }
  if (metrics) delivery.push(s.fillers(metrics.fillerAnalysis.total))
  if (spoken && typeof metrics?.longPauses === "number") delivery.push(s.longPauses(metrics.longPauses))

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <h3 ref={headingRef} tabIndex={-1} className="flex items-baseline gap-1 outline-none">
          <span className="font-heading text-[44px] leading-none font-semibold text-primary tabular-nums">{evaluation.overallScore}</span>
          <span className="text-base text-muted-foreground">/ 100</span>
        </h3>
        <p className="min-w-0 flex-1 basis-64 text-sm text-muted-foreground">{isFollowUp ? s.practiceScore : s.scoreFor(isLast, total)}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-[var(--iv-selected)] px-5 py-4">
          <h4 className="mb-2 text-[15px] font-semibold text-primary">{s.wentWell}</h4>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
            {evaluation.strengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl bg-[var(--iv-warn-bg)] px-5 py-4">
          <h4 className="mb-2 text-[15px] font-semibold text-[var(--iv-warn-fg)]">{s.improveNext}</h4>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
            {improvementPoints(evaluation).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      {delivery.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {s.delivery}: {delivery.join(" · ")}
        </p>
      )}
      {exampleAnswer && (
        <details className="rounded-xl border px-5 py-3 text-sm">
          <summary className="cursor-pointer font-medium text-primary">{s.exampleAnswerTitle}</summary>
          <p className="mt-2 leading-relaxed whitespace-pre-line [overflow-wrap:anywhere]">{exampleAnswer}</p>
          <p className="mt-2 text-xs text-muted-foreground">{s.exampleAnswerNote}</p>
        </details>
      )}
      <p className="text-xs text-muted-foreground">{s.ruleBased}</p>

      <StepActions>
        {!isFollowUp ? (
          <Button type="button" variant="outline" className={secondaryButton} onClick={onFollowUp} disabled={saving}>
            {s.tryFollowUp}
          </Button>
        ) : (
          <span className="hidden sm:block" />
        )}
        <Button type="button" className={primaryButton} onClick={onNext} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" /> {s.saving}
            </>
          ) : (
            <>
              {isLast ? s.seeReport : s.nextQuestion} <ArrowRight aria-hidden="true" />
            </>
          )}
        </Button>
      </StepActions>
    </>
  )
}
