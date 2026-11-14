import type { ReactNode } from "react"
import { Check } from "lucide-react"
import type { Persona } from "../../types"
import type { InterviewStrings } from "../../i18n/interviewStrings"
import { personaInfo } from "../../services/personas"
import { AvatarStatusIndicator, InterviewerAvatar, type AvatarState } from "../avatar/InterviewerAvatar"
import { Button } from "@/components/shadcn/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/shadcn/dialog"
import { cn } from "@/lib/utils"

export type RoomStep = "listen" | "answer" | "review" | "feedback"
export const ROOM_STEPS: RoomStep[] = ["listen", "answer", "review", "feedback"]

export function StepBar({ step, s }: { step: RoomStep; s: InterviewStrings }) {
  const current = ROOM_STEPS.indexOf(step)
  return (
    <ol aria-label={s.stepsLabel} className="grid grid-cols-4 gap-1.5 sm:gap-2">
      {ROOM_STEPS.map((id, index) => {
        const done = index < current
        const active = index === current
        return (
          <li
            key={id}
            aria-current={active ? "step" : undefined}
            className={cn(
              "flex min-h-11 min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1.5 py-2 text-center text-xs sm:flex-row sm:justify-start sm:gap-2 sm:px-3 sm:text-left sm:text-sm",
              active && "bg-primary font-semibold text-primary-foreground",
              done && "bg-[var(--iv-step-done)] font-medium text-[var(--iv-step-done-fg)]",
              !active && !done && "bg-muted text-muted-foreground",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "grid size-5.5 shrink-0 place-items-center rounded-full text-xs sm:size-6",
                active && "bg-primary-foreground text-primary",
                done && "text-[var(--iv-step-done-fg)]",
                !active && !done && "bg-card",
              )}
            >
              {done ? <Check className="size-4" strokeWidth={2.6} /> : index + 1}
            </span>
            <span className="min-w-0 truncate">
              {s.steps[id]}
              {done && <span className="sr-only"> ({s.stepDone})</span>}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/** The dark interviewer panel at the top of every step. */
export function InterviewerPanel({
  persona,
  state,
  mouthOpen,
  s,
  large,
  bubble,
  children,
}: {
  persona: Persona
  state: AvatarState
  mouthOpen?: number | null
  s: InterviewStrings
  large?: boolean
  /** Show the content in a light speech bubble (when the interviewer is talking). */
  bubble?: boolean
  children: ReactNode
}) {
  const info = personaInfo(persona)
  return (
    <section
      aria-label={s.interviewerRegion}
      className={cn(
        "flex flex-col gap-4 rounded-2xl bg-[var(--iv-panel)] text-[var(--iv-panel-fg)] sm:flex-row sm:items-center sm:gap-6",
        large ? "p-5 sm:p-6" : "p-4 sm:px-6 sm:py-5",
      )}
    >
      <div className={cn("flex shrink-0 items-center gap-3", large && "sm:w-36 sm:flex-col sm:gap-2")}>
        <InterviewerAvatar persona={persona} state={state} mouthOpen={mouthOpen} size={large ? 120 : 80} className={cn(!large && "max-sm:size-16")} />
        <div className={cn("min-w-0", large && "sm:text-center")}>
          <p className="text-[15px] font-semibold">{info.name}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--iv-panel-muted)] sm:justify-[inherit]">
            <AvatarStatusIndicator state={state} />
            {s.status[state]}
          </p>
        </div>
      </div>
      <div
        className={cn(
          "min-w-0 flex-1",
          bubble ? "rounded-[4px_16px_16px_16px] bg-[var(--iv-bubble)] px-5 py-4 text-[var(--iv-bubble-fg)]" : "text-[15px] leading-relaxed text-[var(--iv-panel-muted)]",
        )}
      >
        {children}
      </div>
    </section>
  )
}

/** One row of step buttons: optional secondary on the left, the single primary on the right. */
export function StepActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-col-reverse gap-2.5 border-t pt-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">{children}</div>
}

export const primaryButton = "min-h-12 px-6 text-[15px] font-semibold"
export const secondaryButton = "min-h-12 px-5 text-[15px]"

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
