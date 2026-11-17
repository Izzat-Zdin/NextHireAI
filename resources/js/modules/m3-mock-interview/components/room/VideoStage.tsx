import { useState } from "react"
import { Columns2, Mic, MicOff, PhoneOff, RotateCcw, UserRound, Video, VideoOff, Volume2 } from "lucide-react"
import type { Persona } from "../../types"
import type { InterviewStrings } from "../../i18n/interviewStrings"
import { personaInfo } from "../../services/personas"
import { AvatarStatusIndicator, InterviewerAvatar, type AvatarState } from "../avatar/InterviewerAvatar"
import { InterviewerVideo, useInterviewerClips } from "../avatar/InterviewerVideo"
import { cn } from "@/lib/utils"

const control =
  "grid size-11 place-items-center rounded-full text-white outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-white/60 disabled:opacity-40"

/** Like Google Meet / Zoom: who fills the stage. */
export type StageLayout = "speaker" | "self" | "grid"
const LAYOUTS: { id: StageLayout; icon: typeof Mic }[] = [
  { id: "speaker", icon: UserRound },
  { id: "self", icon: Video },
  { id: "grid", icon: Columns2 },
]

/** The interviewer's tile: large in the middle of the stage, or small in the corner. */
function InterviewerTile({ persona, state, mouthOpen, s, size }: { persona: Persona; state: AvatarState; mouthOpen?: number | null; s: InterviewStrings; size: "large" | "medium" | "small" }) {
  const info = personaInfo(persona)
  const clips = useInterviewerClips(persona)

  // Real-looking video clips, when they have been added (see docs/INTERVIEWER-VIDEOS.md).
  if (clips)
    return (
      <div className="relative size-full">
        <InterviewerVideo persona={persona} state={state} avatarSize={96} className="absolute inset-0" />
        {size === "small" ? (
          <span className="absolute bottom-1.5 left-1.5 max-w-[calc(100%-0.75rem)] truncate rounded-full bg-black/65 px-2 py-0.5 text-[10px] text-white sm:text-xs">
            {info.name}
          </span>
        ) : (
          <>
            <p className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white" aria-live="polite">
              <AvatarStatusIndicator state={state} />
              {info.name} · {s.status[state].toLowerCase()}
            </p>
            <span className="absolute top-3 left-3 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase">
              {s.aiInterviewer}
            </span>
          </>
        )}
      </div>
    )

  return (
    <div className="flex size-full flex-col items-center justify-center gap-2 text-center">
      <InterviewerAvatar
        persona={persona}
        state={state}
        mouthOpen={mouthOpen}
        size={size === "large" ? 112 : size === "medium" ? 96 : 48}
        className={cn(size === "large" && "max-sm:size-20", size === "medium" && "max-sm:size-16", size === "small" && "max-sm:size-10")}
      />
      {size === "small" ? (
        <span className="max-w-full truncate rounded-full bg-black/55 px-2 py-0.5 text-[10px] text-white sm:text-xs">{info.name}</span>
      ) : (
        <p className="flex items-center gap-1.5 text-sm font-medium" aria-live="polite">
          <AvatarStatusIndicator state={state} />
          {info.name} · {s.status[state].toLowerCase()}
        </p>
      )}
    </div>
  )
}

/** Your camera tile. The <video> element is the only one on the page, so it moves between tiles when the layout changes. */
function SelfTile({
  s,
  setVideoElement,
  cameraOn,
  recording,
  paused,
  size,
}: {
  s: InterviewStrings
  setVideoElement: (el: HTMLVideoElement | null) => void
  cameraOn: boolean
  recording: boolean
  paused: boolean
  size: "large" | "small"
}) {
  return (
    <div className="relative flex size-full items-center justify-center bg-[#2a2d33]">
      <video ref={setVideoElement} autoPlay playsInline muted className={cn("absolute inset-0 size-full -scale-x-100 object-cover", !cameraOn && "hidden")} />
      {!cameraOn && <UserRound className={cn("text-[#8a9099]", size === "large" ? "size-16" : "size-8")} aria-hidden="true" />}
      <span
        className={cn(
          "absolute bottom-1.5 left-1.5 max-w-[calc(100%-0.75rem)] truncate rounded-full bg-black/65 px-2 py-0.5 text-white",
          size === "large" ? "bottom-3 left-3 text-xs" : "text-[10px] sm:text-xs",
        )}
      >
        {s.selfView}
      </span>
      {recording &&
        (paused ? (
          <MicOff className="absolute top-2 right-2 size-4 text-white/70" aria-hidden="true" />
        ) : (
          <Mic className="absolute top-2 right-2 size-4 text-[var(--iv-meter)]" aria-hidden="true" />
        ))}
    </div>
  )
}

/** Speak mode: the video-call stage. Choose who fills the stage (interviewer, you, or side by side), call controls below. */
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
  const [layout, setLayout] = useState<StageLayout>("speaker")
  const interviewer = (size: "large" | "medium" | "small") => <InterviewerTile persona={persona} state={state} mouthOpen={mouthOpen} s={s} size={size} />
  const self = (size: "large" | "small") => (
    <SelfTile s={s} setVideoElement={setVideoElement} cameraOn={cameraOn} recording={recording} paused={paused} size={size} />
  )
  const pip = "absolute top-3 right-3 z-10 aspect-[4/3] w-24 overflow-hidden rounded-xl border border-white/30 shadow-lg outline-none transition-transform hover:scale-[1.03] focus-visible:ring-[3px] focus-visible:ring-white/60 sm:w-44"

  return (
    <section aria-label={s.interviewerRegion} className="flex flex-col gap-3 overflow-hidden rounded-2xl bg-[var(--iv-panel)] p-3 text-[var(--iv-panel-fg)] sm:gap-4 sm:p-4">
      {/* Top bar: who and which question, plus the layout switch */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-2 rounded-full bg-white/10 py-1 pr-3 pl-1.5 text-xs font-medium">
            <InterviewerAvatar persona={persona} state="idle" size={22} decorative />
            {info.name}
            <Volume2 className={cn("size-3.5", state === "speaking" ? "text-[var(--iv-meter)]" : "text-white/40")} aria-hidden="true" />
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">{questionLabel}</span>
        </div>
        <div role="radiogroup" aria-label={s.layoutLabel} className="flex gap-0.5 rounded-full bg-white/10 p-0.5">
          {LAYOUTS.map(({ id, icon: Icon }) => {
            const selected = layout === id
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={s.layouts[id]}
                title={s.layouts[id]}
                onClick={() => setLayout(id)}
                className={cn(
                  "flex min-h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                  selected ? "bg-white text-[#16181d]" : "text-white/75 hover:text-white",
                )}
              >
                <Icon className="size-3.5" aria-hidden="true" />
                <span className="max-sm:hidden">{s.layouts[id]}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Stage */}
      {layout === "grid" ? (
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="aspect-[4/3] overflow-hidden rounded-xl bg-white/5">{interviewer("medium")}</div>
          <div className="aspect-[4/3] overflow-hidden rounded-xl">{self("large")}</div>
        </div>
      ) : (
        <div className="relative h-60 overflow-hidden rounded-xl sm:h-72">
          {layout === "speaker" ? interviewer("large") : self("large")}
          <button type="button" onClick={() => setLayout(layout === "speaker" ? "self" : "speaker")} aria-label={s.swapView} title={s.swapView} className={pip}>
            {layout === "speaker" ? self("small") : <span className="block size-full bg-[#22302f]">{interviewer("small")}</span>}
          </button>
        </div>
      )}

      {/* Question */}
      <div className="rounded-xl bg-white/10 px-4 py-3">
        <h2 className="font-heading text-base leading-snug font-semibold [overflow-wrap:anywhere] sm:text-lg">{questionText}</h2>
        {tip && <p className="mt-1 text-xs text-[var(--iv-panel-muted)] sm:text-sm">{tip}</p>}
      </div>

      {/* Call controls */}
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
            title={paused ? s.resume : s.pause}
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
          title={cameraOn ? s.cameraOff : s.cameraOn}
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
