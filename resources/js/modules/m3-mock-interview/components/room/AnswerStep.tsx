import { useId } from "react"
import { AlertCircle, Upload, UserRound, Video, VideoOff } from "lucide-react"
import type { InterviewStrings } from "../../i18n/interviewStrings"
import { countWords, detectFillers } from "../../services/speechAnalysis"
import { AnswerModePicker, type AnswerMode } from "./ListenStep"
import { StepActions, primaryButton, secondaryButton } from "./RoomParts"
import { TranscriptText } from "./TranscriptText"
import { SuggestedAnswer } from "./SuggestedAnswer"
import { Button, buttonVariants } from "@/components/shadcn/button"
import { Textarea } from "@/components/shadcn/textarea"
import { cn } from "@/lib/utils"

const TARGET_MIN = 60
const TARGET_MAX = 120
const BAR_MAX = 180

export const formatClock = (secs: number) => `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`

interface AnswerStepProps {
  s: InterviewStrings
  mode: AnswerMode
  onModeChange: (mode: AnswerMode) => void
  headingRef: React.Ref<HTMLHeadingElement>
  // speech
  speechSupported: boolean
  speechError: "not-allowed" | "network" | "other" | null
  listening: boolean
  paused: boolean
  transcript: string
  interim: string
  seconds: number
  onPauseToggle: () => void
  // text (type + upload)
  onTextChange: (text: string) => void
  // upload
  upload: { name: string; url: string; isVideo: boolean } | null
  onUpload: (file: File) => void
  // camera
  setVideoElement: (el: HTMLVideoElement | null) => void
  cameraOn: boolean
  onCameraToggle: () => void
  onDone: () => void
  /** Test account only: sample answer to read aloud or paste. */
  suggestion?: string | null
}

export function AnswerStep(props: AnswerStepProps) {
  const { s, mode, transcript } = props
  const ids = useId()
  const fillers = detectFillers(`${transcript} ${props.interim}`).total
  const words = countWords(`${transcript} ${props.interim}`)
  const wpm = props.seconds >= 5 && words > 0 ? Math.round(words / (props.seconds / 60)) : null
  const speakBlocked = mode === "speak" && (!props.speechSupported || props.speechError === "not-allowed" || props.speechError === "network")

  return (
    <>
      <h3 ref={props.headingRef} tabIndex={-1} className="sr-only outline-none">
        {s.steps.answer}
      </h3>
      <AnswerModePicker mode={mode} onChange={props.onModeChange} s={s} compact />

      {props.suggestion && mode === "speak" && <SuggestedAnswer s={s} text={props.suggestion} />}

      {mode === "speak" && (
        <>
          {speakBlocked ? (
            <div role="alert" className="flex flex-wrap items-start gap-3 rounded-xl bg-[var(--iv-warn-bg)] p-4 text-sm text-[var(--iv-warn-fg)]">
              <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <p className="min-w-0 flex-1 basis-56">
                {!props.speechSupported ? s.speechUnsupported : props.speechError === "network" ? s.speechNetwork : s.micBlocked}
              </p>
              <Button type="button" variant="outline" className="min-h-11" onClick={() => props.onModeChange("type")}>
                {s.switchToType}
              </Button>
            </div>
          ) : (
            <div className="flex flex-row items-center gap-4 sm:gap-5">
              {/* Self-view */}
              <div
                className={cn(
                  "relative flex aspect-[4/3] w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#23262c] sm:w-44",
                  props.listening && !props.paused && "ring-2 ring-[#b42318] ring-offset-2 ring-offset-card",
                )}
              >
                <video
                  ref={props.setVideoElement}
                  autoPlay
                  playsInline
                  muted
                  className={cn("size-full -scale-x-100 object-cover", props.cameraOn ? "block" : "hidden")}
                />
                {!props.cameraOn && <UserRound className="size-10 text-[#8a9099]" aria-hidden="true" />}
                <span className="absolute inset-x-1.5 bottom-1.5 w-fit max-w-[calc(100%-0.75rem)] truncate rounded bg-black/65 px-1.5 py-0.5 text-xs text-white">
                  {s.selfView}
                </span>
                <button
                  type="button"
                  onClick={props.onCameraToggle}
                  aria-pressed={props.cameraOn}
                  aria-label={props.cameraOn ? s.cameraOff : s.cameraOn}
                  className="absolute top-1.5 right-1.5 grid size-11 place-items-center rounded-md bg-black/55 text-white outline-none hover:bg-black/75 focus-visible:ring-[3px] focus-visible:ring-white/60"
                >
                  {props.cameraOn ? <VideoOff className="size-4" /> : <Video className="size-4" />}
                </button>
              </div>

              {/* Recording status and timer */}
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <span
                    className={cn(
                      "flex items-center gap-2 text-[15px] font-semibold",
                      props.listening && !props.paused ? "text-[#b42318] dark:text-[#ff8a7a]" : "text-muted-foreground",
                    )}
                    aria-live="polite"
                  >
                    <span
                      aria-hidden="true"
                      className={cn("size-2.5 rounded-full", props.listening && !props.paused ? "animate-pulse bg-[#b42318] dark:bg-[#ff8a7a] motion-reduce:animate-none" : "bg-muted-foreground")}
                    />
                    {props.paused ? s.paused : props.listening ? s.recording : s.startingMic}
                  </span>
                  <span className="font-heading text-2xl font-semibold tabular-nums sm:text-[28px]">{formatClock(props.seconds)}</span>
                </div>
                <div className="relative h-2.5 overflow-hidden rounded-full bg-muted" role="img" aria-label={s.timerLabel(props.seconds)}>
                  <div
                    className="absolute inset-y-0 bg-[var(--iv-step-done)]"
                    style={{ left: `${(TARGET_MIN / BAR_MAX) * 100}%`, width: `${((TARGET_MAX - TARGET_MIN) / BAR_MAX) * 100}%` }}
                  />
                  <div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${Math.min(100, (props.seconds / BAR_MAX) * 100)}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">{s.targetBand}</p>
              </div>
            </div>
          )}

          {!speakBlocked && (
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-semibold" id={`${ids}-live`}>
                {s.liveTranscript}
              </h4>
              <div aria-labelledby={`${ids}-live`} aria-live="off">
                <TranscriptText text={transcript} interim={props.interim} empty={s.transcriptEmpty} />
              </div>
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                <span className="rounded bg-[var(--iv-filler)] px-1.5 py-0.5 text-[var(--iv-filler-fg)]">{s.fillers(fillers)}</span>
                {wpm !== null && <span>· {s.wpm(wpm)}</span>}
              </p>
              <p className="text-xs text-muted-foreground">{s.fillerCaveat}</p>
            </div>
          )}
        </>
      )}

      {mode === "type" && (
        <div className="flex flex-col gap-2">
          <label htmlFor={`${ids}-type`} className="text-sm font-semibold">
            {s.typeLabel}
          </label>
          <Textarea
            id={`${ids}-type`}
            value={transcript}
            onChange={(e) => props.onTextChange(e.target.value)}
            placeholder={props.suggestion ?? s.typePlaceholder}
            maxLength={6000}
            className="min-h-40 bg-background text-base leading-relaxed"
          />
          <p className="text-sm text-muted-foreground">{s.words(countWords(transcript))}</p>
          {props.suggestion && !transcript.trim() && (
            <Button type="button" variant="outline" className="min-h-11 w-fit" onClick={() => props.onTextChange(props.suggestion ?? "")}>
              {s.useSuggestion}
            </Button>
          )}
        </div>
      )}

      {mode === "upload" && (
        <div className="flex flex-col gap-3">
          <label
            className={cn(
              buttonVariants({ variant: "outline" }),
              "min-h-12 w-fit max-w-full cursor-pointer whitespace-normal focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
            )}
          >
            <Upload aria-hidden="true" />
            <span className="min-w-0 [overflow-wrap:anywhere]">{props.upload ? s.uploadedFile(props.upload.name) : s.uploadLabel}</span>
            <input
              type="file"
              accept="audio/*,video/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) props.onUpload(file)
                e.target.value = ""
              }}
            />
          </label>
          {props.upload &&
            (props.upload.isVideo ? (
              <video controls src={props.upload.url} className="max-h-64 w-full rounded-xl bg-black" />
            ) : (
              <audio controls src={props.upload.url} className="w-full" />
            ))}
          <p className="text-sm text-muted-foreground">{s.uploadNote}</p>
          <label htmlFor={`${ids}-upload-text`} className="text-sm font-semibold">
            {s.typeLabel}
          </label>
          <Textarea
            id={`${ids}-upload-text`}
            value={transcript}
            onChange={(e) => props.onTextChange(e.target.value)}
            placeholder={props.suggestion ?? s.typePlaceholder}
            maxLength={6000}
            className="min-h-32 bg-background text-base leading-relaxed"
          />
          {props.suggestion && !transcript.trim() && (
            <Button type="button" variant="outline" className="min-h-11 w-fit" onClick={() => props.onTextChange(props.suggestion ?? "")}>
              {s.useSuggestion}
            </Button>
          )}
        </div>
      )}

      <StepActions>
        {mode === "speak" && !speakBlocked ? (
          <Button type="button" variant="outline" className={secondaryButton} onClick={props.onPauseToggle} disabled={!props.listening && !props.paused}>
            {props.paused ? s.resume : s.pause}
          </Button>
        ) : (
          <span className="hidden sm:block" />
        )}
        <Button type="button" className={primaryButton} onClick={props.onDone}>
          <span aria-hidden="true" className="size-3 rounded-[3px] bg-primary-foreground" />
          {s.done}
        </Button>
      </StepActions>
    </>
  )
}
