import { useId, useMemo } from "react"
import { AlertCircle, CheckCircle2, Loader2, RotateCcw } from "lucide-react"
import type { InterviewStrings } from "../../i18n/interviewStrings"
import { checkStar } from "../../services/starCheck"
import { countWords, detectFillers } from "../../services/speechAnalysis"
import { StepActions, primaryButton, secondaryButton } from "./RoomParts"
import { HighlightedEditor } from "./TranscriptText"
import { Button } from "@/components/shadcn/button"

export function ReviewStep({
  s,
  text,
  onTextChange,
  seconds,
  spoken,
  showStar,
  error,
  onAnswerAgain,
  onSubmit,
  submitting = false,
  headingRef,
}: {
  s: InterviewStrings
  text: string
  onTextChange: (text: string) => void
  /** Speaking time; only shown for spoken answers. */
  seconds: number
  spoken: boolean
  /** STAR applies to behavioural and HR stories; technical answers skip it. */
  showStar: boolean
  error: string | null
  onAnswerAgain: () => void
  onSubmit: () => void
  /** Waiting for the optional filler transcription before scoring. */
  submitting?: boolean
  headingRef: React.Ref<HTMLHeadingElement>
}) {
  const ids = useId()
  const fillers = detectFillers(text).total
  const words = countWords(text)
  const wpm = spoken && seconds >= 5 && words > 0 ? Math.round(words / (seconds / 60)) : null
  const star = useMemo(() => checkStar(text), [text])
  const length = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`

  const starTone = star.missing.length === 0 && !star.resultWithoutNumber ? "ok" : "warn"
  const starTitle =
    star.missing.length > 0
      ? s.starMissing(star.missing.map((part) => s.starParts[part]))
      : star.resultWithoutNumber
        ? s.starResultNoNumber
        : s.starOk
  const starDetail = star.missing.length > 0 ? s.starMissingDetail : star.resultWithoutNumber ? s.starResultNoNumberDetail : s.starOkDetail

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 ref={headingRef} tabIndex={-1} className="text-base font-semibold outline-none">
          {s.yourAnswer}
        </h3>
        <span className="flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
          {spoken ? `${length} · ` : `${s.words(words)} · `}
          {wpm !== null && `${s.wpm(wpm)} · `}
          <span className="rounded bg-[var(--iv-filler)] px-1.5 py-0.5 text-[var(--iv-filler-fg)]">{s.fillers(fillers)}</span>
        </span>
      </div>

      <HighlightedEditor
        value={text}
        onChange={onTextChange}
        label={spoken ? s.fixWords : s.editAnswer}
        describedBy={error ? `${ids}-error` : undefined}
      />
      {error && (
        <p id={`${ids}-error`} role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      {showStar && text.trim() && (
        <div
          className={
            starTone === "ok"
              ? "flex items-start gap-3 rounded-xl bg-[var(--iv-selected)] px-4 py-3.5 text-sm"
              : "flex items-start gap-3 rounded-xl bg-[var(--iv-warn-bg)] px-4 py-3.5 text-sm"
          }
          aria-live="polite"
        >
          {starTone === "ok" ? (
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          ) : (
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-[var(--iv-warn-fg)]" aria-hidden="true" />
          )}
          <div className="min-w-0">
            <p className="font-semibold">{starTitle}</p>
            <p className="mt-1 text-muted-foreground">{starDetail}</p>
          </div>
        </div>
      )}

      <StepActions>
        <Button type="button" variant="outline" className={secondaryButton} onClick={onAnswerAgain} disabled={submitting}>
          <RotateCcw aria-hidden="true" /> {s.answerAgain}
        </Button>
        <Button type="button" className={primaryButton} onClick={onSubmit} disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" /> {s.scoring}
            </>
          ) : (
            s.submit
          )}
        </Button>
      </StepActions>
    </>
  )
}
