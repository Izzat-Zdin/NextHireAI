import type { ReactNode } from "react"
import { Check } from "lucide-react"
import type { EvaluationResult } from "../../types"
import type { InterviewStrings } from "../../i18n/interviewStrings"
import { Button } from "@/components/shadcn/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/shadcn/dialog"
import { cn } from "@/lib/utils"

/** The four pages of one mock interview, shown as a bar on every page of the flow. */
export type FlowStep = "setup" | "interview" | "feedback" | "report"
export const FLOW_STEPS: FlowStep[] = ["setup", "interview", "feedback", "report"]

export const formatClock = (secs: number) => `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`

/** "Improve next time": weaknesses first, then the improvement tips, without repeats. */
export function improvementPoints(evaluation: EvaluationResult) {
  return [...new Set([...evaluation.weaknesses, ...evaluation.improvements])].slice(0, 3)
}

/** Teal for good scores (80+), amber for scores to work on. */
export const scoreTextClass = (score: number) => (score >= 80 ? "text-primary" : "text-[var(--iv-warn-fg)]")
export const scoreBarClass = (score: number) => (score >= 80 ? "bg-primary" : "bg-amber-500")

export function FlowBar({ step, s }: { step: FlowStep; s: InterviewStrings }) {
  const current = FLOW_STEPS.indexOf(step)
  return (
    <ol aria-label={s.flowLabel} className="no-print grid grid-cols-4 gap-1.5 sm:gap-2.5">
      {FLOW_STEPS.map((id, index) => {
        const done = index < current
        const active = index === current
        return (
          <li
            key={id}
            aria-current={active ? "step" : undefined}
            className={cn(
              "flex min-h-9 min-w-0 items-center justify-center gap-1.5 rounded-full px-2 py-1.5 text-center text-xs font-semibold",
              active && "bg-primary text-primary-foreground",
              done && "bg-[var(--iv-step-done)] text-[var(--iv-step-done-fg)]",
              !active && !done && "bg-muted text-muted-foreground",
            )}
          >
            {done && <Check className="size-3.5 shrink-0" strokeWidth={2.6} aria-hidden="true" />}
            <span className="min-w-0 truncate">
              {!done && <span className="max-sm:hidden">{index + 1} </span>}
              {s.flow[id]}
              {done && <span className="sr-only"> ({s.stepDone})</span>}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/** Page title block used by the room, feedback and report pages. */
export function PageHeading({ eyebrow, title, subtitle, children }: { eyebrow: string; title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0 flex-1 basis-64">
        <p className="mb-1 text-xs font-medium text-muted-foreground">{eyebrow}</p>
        <h1 className="font-heading text-xl font-bold tracking-tight [overflow-wrap:anywhere] sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children && <div className="no-print flex flex-wrap items-center gap-2 max-sm:w-full [&>*]:max-sm:flex-1">{children}</div>}
    </header>
  )
}

export function ExitDialog({
  open,
  onOpenChange,
  answered,
  total,
  s,
  onFinish,
  onDiscard,
  onSaveLater,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  answered: number
  total: number
  s: InterviewStrings
  onFinish: () => void
  onDiscard: () => void
  /** Keep the saved answers and continue this session later from the history page. */
  onSaveLater?: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* No built-in close icon: its hidden label is English; "Keep going" closes the dialog in the session language. */}
      <DialogContent showCloseButton={false} className="interview-theme sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{s.exitTitle}</DialogTitle>
          <DialogDescription>{answered > 0 ? s.exitAnswered(answered, total) : s.exitNone}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" className="min-h-11" onClick={() => onOpenChange(false)}>
            {s.keepGoing}
          </Button>
          <Button
            type="button"
            variant={answered > 0 ? "outline" : "destructive"}
            className={cn("min-h-11", answered > 0 && "border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive")}
            onClick={onDiscard}
          >
            {s.discard}
          </Button>
          {answered > 0 && onSaveLater && (
            <Button type="button" variant="outline" className="min-h-11" onClick={onSaveLater}>
              {s.saveLater}
            </Button>
          )}
          {answered > 0 && (
            <Button type="button" className="min-h-11" onClick={onFinish}>
              {s.finishNow}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
