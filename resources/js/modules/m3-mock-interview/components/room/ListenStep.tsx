import { MicOff, RotateCcw } from "lucide-react"
import type { InterviewStrings } from "../../i18n/interviewStrings"
import { ChoiceGroup } from "../shared/Choice"
import { StepActions, primaryButton, secondaryButton } from "./RoomParts"
import { SuggestedAnswer } from "./SuggestedAnswer"
import { Button } from "@/components/shadcn/button"

export type AnswerMode = "speak" | "type" | "upload"
export const ANSWER_MODES: AnswerMode[] = ["speak", "type", "upload"]

export function AnswerModePicker({
  mode,
  onChange,
  s,
  compact,
}: {
  mode: AnswerMode
  onChange: (mode: AnswerMode) => void
  s: InterviewStrings
  compact?: boolean
}) {
  return (
    <ChoiceGroup
      label={s.answerMethod}
      value={mode}
      options={ANSWER_MODES}
      onChange={onChange}
      className="grid grid-cols-3 gap-2 sm:gap-3"
      optionClassName={compact ? "min-h-11 px-3 py-2 text-center" : "p-3 sm:p-4"}
      renderOption={(id) => (
        <>
          <span className="block text-[15px] font-semibold">{s.methods[id].label}</span>
          {!compact && <span className="mt-1 block text-xs text-muted-foreground sm:text-sm">{s.methods[id].desc}</span>}
        </>
      )}
    />
  )
}

export function ListenStep({
  s,
  mode,
  onModeChange,
  interviewerName,
  onRepeat,
  onStart,
  headingRef,
  suggestion,
}: {
  s: InterviewStrings
  mode: AnswerMode
  onModeChange: (mode: AnswerMode) => void
  interviewerName: string
  onRepeat: () => void
  onStart: () => void
  headingRef: React.Ref<HTMLHeadingElement>
  suggestion?: string | null
}) {
  return (
    <>
      <h3 ref={headingRef} tabIndex={-1} className="text-base font-semibold outline-none">
        {s.howToAnswer}
      </h3>
      <AnswerModePicker mode={mode} onChange={onModeChange} s={s} />
      {suggestion && <SuggestedAnswer s={s} text={suggestion} />}
      <StepActions>
        <p className="flex items-center gap-2 text-sm text-muted-foreground sm:mr-auto">
          <MicOff className="size-4 shrink-0" aria-hidden="true" />
          {s.micOffWhileSpeaking(interviewerName)}
        </p>
        <div className="flex flex-col-reverse gap-2.5 sm:flex-row">
          <Button type="button" variant="outline" className={secondaryButton} onClick={onRepeat}>
            <RotateCcw aria-hidden="true" /> {s.repeatQuestion}
          </Button>
          <Button type="button" className={primaryButton} onClick={onStart}>
            {s.startAnswering}
          </Button>
        </div>
      </StepActions>
    </>
  )
}
