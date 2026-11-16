import { Mic, MicOff, PhoneOff, RotateCcw, UserRound, Video, VideoOff, Volume2 } from "lucide-react"
import type { Persona } from "../../types"
import type { InterviewStrings } from "../../i18n/interviewStrings"
import { personaInfo } from "../../services/personas"
import { AvatarStatusIndicator, InterviewerAvatar, type AvatarState } from "../avatar/InterviewerAvatar"
import { cn } from "@/lib/utils"

const control =
  "grid size-11 place-items-center rounded-full text-white outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-white/60 disabled:opacity-40"

/** Speak mode: the video-call stage. Interviewer in the middle, your camera as a small self-view, call controls below. */
export function VideoStage({
  s,
  persona,
  state,
  mouthOpen,
  questionLabel,
  questionText,
  tip,
  asking,
  recording,
  paused,
  setVideoElement,
  cameraOn,
  onCameraToggle,
  onMicToggle,
  onRepeat,
  onAnswerNow,
  onEnd,
}: {
  s: InterviewStrings
  persona: Persona
  state: AvatarState
  mouthOpen?: number | null
  questionLabel: string
  questionText: string
  tip?: string | null
  /** The interviewer is still reading the question. */
  asking: boolean
  recording: boolean
  paused: boolean
  setVideoElement: (el: HTMLVideoElement | null) => void
  cameraOn: boolean
  onCameraToggle: () => void
  onMicToggle: () => void
  onRepeat: () => void
  onAnswerNow: () => void
  onEnd: () => void
}) {
  const info = personaInfo(persona)
  return (
    <section
      aria-label={s.interviewerRegion}
      className="relative flex min-h-[420px] flex-col justify-between gap-4 overflow-hidden rounded-2xl bg-[var(--iv-panel)] p-3 text-[var(--iv-panel-fg)] sm:min-h-[460px] sm:p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-2 rounded-full bg-white/10 py-1 pr-3 pl-1.5 text-xs font-medium">
            <InterviewerAvatar persona={persona} state="idle" size={22} decorative />
            {info.name}
            <Volume2 className={cn("size-3.5", state === "speaking" ? "text-[var(--iv-meter)]" : "text-white/40")} aria-hidden="true" />
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">{questionLabel}</span>
        </div>

        {/* Self-view */}
        <div className="relative flex aspect-[4/3] w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/30 bg-[#2a2d33] sm:w-44">
          <video ref={setVideoElement} autoPlay playsInline muted className={cn("size-full -scale-x-100 object-cover", cameraOn ? "block" : "hidden")} />
          {!cameraOn && <UserRound className="size-8 text-[#8a9099]" aria-hidden="true" />}
          <span className="absolute bottom-1.5 left-1.5 max-w-[calc(100%-0.75rem)] truncate rounded-full bg-black/65 px-2 py-0.5 text-[10px] text-white sm:text-xs">
            {s.selfView}
          </span>
          {recording && !paused && <Mic className="absolute top-1.5 right-1.5 size-3.5 text-[var(--iv-meter)]" aria-hidden="true" />}
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <InterviewerAvatar persona={persona} state={state} mouthOpen={mouthOpen} size={112} className="max-sm:size-20" />
        <p className="flex items-center gap-1.5 text-sm font-medium" aria-live="polite">
          <AvatarStatusIndicator state={state} />
          {info.name} · {s.status[state].toLowerCase()}
        </p>
        <div className="mt-1 w-full max-w-2xl rounded-xl bg-white/10 px-4 py-3 text-left">
          <h2 className="font-heading text-base leading-snug font-semibold [overflow-wrap:anywhere] sm:text-lg">{questionText}</h2>
          {tip && <p className="mt-1 text-xs text-[var(--iv-panel-muted)] sm:text-sm">{tip}</p>}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
        {asking ? (
          <button
            type="button"
            onClick={onAnswerNow}
            className="min-h-11 rounded-full bg-[var(--iv-bubble)] px-5 text-sm font-semibold text-[var(--iv-bubble-fg)] outline-none hover:bg-white focus-visible:ring-[3px] focus-visible:ring-white/60"
          >
            {s.startAnswering}
          </button>
        ) : (
          <button
            type="button"
            onClick={onMicToggle}
            aria-pressed={paused}
            aria-label={paused ? s.resume : s.pause}
            className={cn(control, paused ? "bg-white/90 text-[#16181d]" : "bg-white/15 hover:bg-white/25")}
          >
            {paused ? <MicOff className="size-5" /> : <Mic className="size-5" />}
          </button>
        )}
        <button
          type="button"
          onClick={onCameraToggle}
          aria-pressed={cameraOn}
          aria-label={cameraOn ? s.cameraOff : s.cameraOn}
          className={cn(control, "bg-white/15 hover:bg-white/25")}
        >
          {cameraOn ? <Video className="size-5" /> : <VideoOff className="size-5" />}
        </button>
        <button type="button" onClick={onRepeat} aria-label={s.repeatQuestion} title={s.repeatQuestion} className={cn(control, "bg-white/15 hover:bg-white/25")}>
          <RotateCcw className="size-5" />
        </button>
        <button type="button" onClick={onEnd} aria-label={s.endInterview} title={s.endInterview} className={cn(control, "bg-red-600 hover:bg-red-700")}>
          <PhoneOff className="size-5" />
        </button>
      </div>
    </section>
  )
}

/** Type and Upload modes: no camera, just the interviewer and the question. */
export function QuestionCard({
  s,
  persona,
  state,
  questionLabel,
  questionText,
  tip,
  onRepeat,
}: {
  s: InterviewStrings
  persona: Persona
  state: AvatarState
  questionLabel: string
  questionText: string
  tip?: string | null
  onRepeat: () => void
}) {
  const info = personaInfo(persona)
  return (
    <section
      aria-label={s.interviewerRegion}
      className="flex flex-col gap-4 rounded-2xl bg-[var(--iv-panel)] p-4 text-[var(--iv-panel-fg)] sm:flex-row sm:items-center sm:gap-5 sm:p-5"
    >
      <div className="flex shrink-0 items-center gap-3 sm:w-28 sm:flex-col sm:gap-1.5 sm:text-center">
        <InterviewerAvatar persona={persona} state={state} size={64} className="max-sm:size-12" />
        <div className="min-w-0">
          <p className="text-sm font-semibold">{info.name}</p>
          <p className="flex items-center gap-1.5 text-xs text-[var(--iv-panel-muted)] sm:justify-center">
            <AvatarStatusIndicator state={state} />
            {state === "idle" ? s.waitingForYou : s.status[state]}
          </p>
        </div>
      </div>
      <div className="min-w-0 flex-1 rounded-xl bg-[var(--iv-bubble)] px-4 py-3 text-[var(--iv-bubble-fg)] sm:px-5 sm:py-4">
        <div className="mb-1 flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-[#0e5e5a]">{questionLabel}</p>
          <button
            type="button"
            onClick={onRepeat}
            className="flex min-h-8 items-center gap-1 rounded-md px-1.5 text-xs font-medium text-[#0e5e5a] outline-none hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-[#0e5e5a]"
          >
            <Volume2 className="size-3.5" aria-hidden="true" /> {s.repeatQuestion}
          </button>
        </div>
        <h2 className="font-heading text-base leading-snug font-semibold [overflow-wrap:anywhere] sm:text-lg">{questionText}</h2>
        {tip && <p className="mt-1.5 text-xs text-[#4a4f59] sm:text-sm">{tip}</p>}
      </div>
    </section>
  )
}
