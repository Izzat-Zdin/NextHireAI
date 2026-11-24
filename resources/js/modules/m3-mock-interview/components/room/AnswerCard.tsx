import { useId, useRef } from "react"
import { AlertCircle, ArrowRight, FileAudio, Info, Keyboard, Loader2, Mic, RotateCcw, Upload, X } from "lucide-react"
import type { InterviewStrings } from "../../i18n/interviewStrings"
import { countWords } from "../../services/speechAnalysis"
import { formatClock } from "./RoomParts"
import { TranscriptText } from "./TranscriptText"
import { SuggestedAnswer } from "./SuggestedAnswer"
import { Button } from "@/components/shadcn/button"
import { Textarea } from "@/components/shadcn/textarea"
import { cn } from "@/lib/utils"

export type AnswerMode = "speak" | "type" | "upload"
const MODES: { id: AnswerMode; icon: typeof Mic }[] = [
  { id: "speak", icon: Mic },
  { id: "type", icon: Keyboard },
  { id: "upload", icon: Upload },
]

const TARGET_MIN = 60
const TARGET_MAX = 120
const BAR_MAX = 180

export interface UploadedFile {
  name: string
  url: string
  isVideo: boolean
  size: number
}

/** Speak / Type / Upload switch: one row, the selected mode raised like a tab. */
function ModeSwitch({ mode, onChange, s }: { mode: AnswerMode; onChange: (mode: AnswerMode) => void; s: InterviewStrings }) {
  const move = (forward: boolean) => {
    const i = MODES.findIndex((m) => m.id === mode)
    onChange(MODES[(i + (forward ? 1 : -1) + MODES.length) % MODES.length].id)
  }
  return (
    <div
      role="radiogroup"
      aria-label={s.answerMethod}
      className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1 sm:w-80"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault()
          move(true)
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault()
          move(false)
        }
      }}
    >
      {MODES.map(({ id, icon: Icon }) => {
        const selected = id === mode
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(id)}
            className={cn(
              "flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
              selected ? "bg-card font-semibold text-foreground shadow-sm ring-1 ring-border" : "font-medium text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className={cn("size-4", selected && "text-primary")} aria-hidden="true" />
            {s.methods[id].label}
          </button>
        )
      })}
    </div>
  )
}

export function AnswerCard(props: {
  s: InterviewStrings
  mode: AnswerMode
  onModeChange: (mode: AnswerMode) => void
  interviewerName: string
  /** The interviewer is still reading the question: nothing is being recorded yet. */
  asking: boolean
  speechSupported: boolean
  speechError: "not-allowed" | "network" | "other" | null
  listening: boolean
  paused: boolean
  transcript: string
  interim: string
  seconds: number
  onPauseToggle: () => void
  onTextChange: (text: string) => void
  upload: UploadedFile | null
  onUpload: (file: File) => void
  onRemoveUpload: () => void
  error: string | null
  busy: boolean
  isLast: boolean
  onReRecord: () => void
  onNext: () => void
  /** Test account only: sample answer to read aloud or paste. */
  suggestion?: string | null
}) {
  const { s, mode, transcript } = props
  const ids = useId()
  const fileInput = useRef<HTMLInputElement | null>(null)
  const live = `${transcript} ${props.interim}`.trim()
  const words = countWords(live)
  const wpm = props.seconds >= 5 && words > 0 ? Math.round(words / (props.seconds / 60)) : null
  const speakBlocked = mode === "speak" && (!props.speechSupported || props.speechError === "not-allowed" || props.speechError === "network")
  const recordingNow = props.listening && !props.paused

  const meta =
    mode === "speak"
      ? [s.words(words), wpm !== null ? s.wpm(wpm) : null, s.targetBand].filter(Boolean).join(" · ")
      : `${s.words(countWords(transcript))} · ${s.aimWords}`

  return (
    <section aria-labelledby={`${ids}-title`} className="flex min-w-0 flex-col gap-4 rounded-2xl border bg-card p-4 text-card-foreground sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 id={`${ids}-title`} className="text-base font-semibold">
            {s.typeLabel}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{s.modeHint[mode]}</p>
        </div>
        <ModeSwitch mode={mode} onChange={props.onModeChange} s={s} />
      </div>

      {props.suggestion && mode === "speak" && <SuggestedAnswer s={s} text={props.suggestion} />}

      {mode === "speak" &&
        (speakBlocked ? (
          <div role="alert" className="flex flex-wrap items-start gap-3 rounded-xl bg-[var(--iv-warn-bg)] p-4 text-sm text-[var(--iv-warn-fg)]">
            <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <p className="min-w-0 flex-1 basis-56">{!props.speechSupported ? s.speechUnsupported : props.speechError === "network" ? s.speechNetwork : s.micBlocked}</p>
            <Button type="button" variant="outline" className="min-h-11" onClick={() => props.onModeChange("type")}>
              {s.switchToType}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-3 sm:p-4">
              <p
                className={cn(
                  "flex items-center gap-2 text-xs font-semibold",
                  recordingNow ? "text-[#b42318] dark:text-[#ff8a7a]" : "text-muted-foreground",
                )}
                aria-live="polite"
              >
                <span
                  aria-hidden="true"
                  className={cn("size-2 rounded-full", recordingNow ? "animate-pulse bg-[#b42318] motion-reduce:animate-none dark:bg-[#ff8a7a]" : "bg-muted-foreground")}
                />
                {props.asking ? s.micOffWhileSpeaking(props.interviewerName) : props.paused ? s.paused : recordingNow ? `${s.recording} ${formatClock(props.seconds)}` : s.startingMic}
                <span className="font-normal text-muted-foreground">· {s.liveTranscript}</span>
              </p>
              <TranscriptText text={transcript} interim={props.interim} empty={s.transcriptEmpty} className="min-h-24 border-0 bg-transparent p-0 text-[15px]" />
            </div>
            <div className="relative h-1.5 overflow-hidden rounded-full bg-muted" role="img" aria-label={s.timerLabel(props.seconds)}>
              <div
                className="absolute inset-y-0 bg-[var(--iv-step-done)]"
                style={{ left: `${(TARGET_MIN / BAR_MAX) * 100}%`, width: `${((TARGET_MAX - TARGET_MIN) / BAR_MAX) * 100}%` }}
              />
              <div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${Math.min(100, (props.seconds / BAR_MAX) * 100)}%` }} />
            </div>
          </>
        ))}

      {mode === "type" && (
        <div className="flex flex-col gap-2">
          <label htmlFor={`${ids}-type`} className="sr-only">
            {s.typeLabel}
          </label>
          <Textarea
            id={`${ids}-type`}
            value={transcript}
            onChange={(e) => props.onTextChange(e.target.value)}
            placeholder={props.suggestion ?? s.typePlaceholder}
            maxLength={6000}
            className="min-h-44 bg-background text-[15px] leading-relaxed focus-visible:border-primary"
          />
          {props.suggestion && !transcript.trim() && (
            <Button type="button" variant="outline" className="min-h-10 w-fit" onClick={() => props.onTextChange(props.suggestion ?? "")}>
              {s.useSuggestion}
            </Button>
          )}
        </div>
      )}

      {mode === "upload" && (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="flex flex-col items-center gap-1.5 rounded-xl border-2 border-dashed bg-muted/30 px-4 py-6 text-center outline-none hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <span className="grid size-10 place-items-center rounded-full bg-[var(--iv-selected)] text-primary">
              <Upload className="size-5" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold text-primary">{props.upload ? s.uploadedFile(props.upload.name) : s.chooseFile}</span>
            <span className="text-xs text-muted-foreground">{s.fileTypes}</span>
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="audio/*,video/*"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) props.onUpload(file)
              e.target.value = ""
            }}
          />
          {props.upload && (
            <div className="flex flex-col gap-2 rounded-xl border p-3">
              <div className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-primary">
                  <FileAudio className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{props.upload.name}</span>
                  <span className="block text-xs text-muted-foreground">{(props.upload.size / (1024 * 1024)).toFixed(1)} MB</span>
                </span>
                <Button type="button" variant="ghost" size="icon" className="size-10" onClick={props.onRemoveUpload} aria-label={s.removeFile}>
                  <X aria-hidden="true" />
                </Button>
              </div>
              {props.upload.isVideo ? (
                <video controls src={props.upload.url} className="max-h-56 w-full rounded-lg bg-black" />
              ) : (
                <audio controls src={props.upload.url} className="w-full" />
              )}
            </div>
          )}
          <label htmlFor={`${ids}-upload-text`} className="text-sm font-semibold">
            {s.typeLabel}
          </label>
          <p className="-mt-2 text-xs text-muted-foreground">{s.uploadNote}</p>
          <Textarea
            id={`${ids}-upload-text`}
            value={transcript}
            onChange={(e) => props.onTextChange(e.target.value)}
            placeholder={s.typePlaceholder}
            maxLength={6000}
            className="min-h-28 bg-background text-[15px] leading-relaxed"
          />
        </div>
      )}

      {mode === "type" && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="size-3.5 shrink-0" aria-hidden="true" />
          {s.typedNote}
        </p>
      )}

      {props.error && (
        <p role="alert" className="flex items-center gap-2 text-sm text-[var(--iv-warn-fg)]">
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          {props.error}
        </p>
      )}

      <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center">
        <p className="min-w-0 flex-1 text-xs text-muted-foreground tabular-nums">{meta}</p>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button type="button" variant="outline" className="min-h-11" onClick={props.onReRecord} disabled={props.busy || props.asking}>
            <RotateCcw aria-hidden="true" /> {mode === "speak" ? s.reRecord : s.clear}
          </Button>
          <Button type="button" className="min-h-11 font-semibold" onClick={props.onNext} disabled={props.busy || props.asking}>
            {props.busy ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" /> {s.scoring}
              </>
            ) : (
              <>
                {props.isLast ? s.finishAndSee : s.nextQuestion} <ArrowRight aria-hidden="true" />
              </>
            )}
          </Button>
        </div>
      </div>
    </section>
  )
}
