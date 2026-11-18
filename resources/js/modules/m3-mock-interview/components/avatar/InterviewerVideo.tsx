import { useEffect, useRef, useState } from "react"
import type { Persona } from "../../types"
import { personaInfo } from "../../services/personas"
import { InterviewerAvatar, type AvatarState } from "./InterviewerAvatar"
import { cn } from "@/lib/utils"

/**
 * Real-looking interviewer: short looping video clips, one per state, switched as the interview goes
 * (waiting, speaking, listening, thinking). The voice still comes from the browser's speech synthesis.
 *
 * Clips live in public/interviewers/<videoDir>/ as idle.mp4, speaking.mp4, listening.mp4 and, optionally,
 * thinking.mp4 (see docs/INTERVIEWER-VIDEOS.md). idle.mp4 is enough to switch to video (missing states play
 * it); without it the drawn avatar is shown, so nothing breaks while the videos are being made.
 */

type ClipState = "idle" | "speaking" | "listening" | "thinking"
type Clips = Partial<Record<ClipState, string>>
/** Only the waiting clip is required; a state without its own clip plays the waiting clip. */
const REQUIRED: ClipState[] = ["idle"]
const ALL: ClipState[] = ["idle", "speaking", "listening", "thinking"]

/** One check per interviewer per page load. */
const cache = new Map<string, Promise<Clips | null>>()

async function exists(url: string) {
  try {
    const res = await fetch(url, { method: "HEAD", cache: "force-cache" })
    return res.ok && (res.headers.get("content-type") ?? "").startsWith("video/")
  } catch {
    return false
  }
}

function findClips(dir: string): Promise<Clips | null> {
  let found = cache.get(dir)
  if (!found) {
    found = Promise.all(
      ALL.map(async (state) => {
        const url = `/interviewers/${dir}/${state}.mp4`
        return [state, (await exists(url)) ? url : null] as const
      }),
    ).then((results) => {
      const clips: Clips = {}
      for (const [state, url] of results) if (url) clips[state] = url
      return REQUIRED.every((state) => clips[state]) ? clips : null
    })
    cache.set(dir, found)
  }
  return found
}

/** The clips for this interviewer, or null when they are not (all) there yet. undefined while checking. */
export function useInterviewerClips(persona: Persona) {
  const dir = personaInfo(persona).videoDir
  const [clips, setClips] = useState<Clips | null | undefined>(undefined)
  useEffect(() => {
    let alive = true
    setClips(undefined)
    void findClips(dir).then((result) => alive && setClips(result))
    return () => {
      alive = false
    }
  }, [dir])
  return clips
}

/**
 * Fills its box with the interviewer's video (all clips are loaded and kept playing; only the current
 * one is visible, so switching never flashes black). Falls back to the drawn avatar.
 */
export function InterviewerVideo({
  persona,
  state,
  mouthOpen,
  avatarSize,
  avatarClassName,
  className,
}: {
  persona: Persona
  state: AvatarState
  mouthOpen?: number | null
  /** Size of the drawn avatar used when there are no clips. */
  avatarSize: number
  avatarClassName?: string
  className?: string
}) {
  const clips = useInterviewerClips(persona)
  const refs = useRef<Partial<Record<ClipState, HTMLVideoElement | null>>>({})
  const current: ClipState = clips?.[state] ? state : "idle"

  // Start the clip that becomes visible from the beginning, so each sentence starts with fresh movement.
  useEffect(() => {
    const video = refs.current[current]
    if (!video) return
    if (current !== "idle") video.currentTime = 0
    void video.play().catch(() => {})
  }, [current, clips])

  if (!clips) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <InterviewerAvatar persona={persona} state={state} mouthOpen={mouthOpen} size={avatarSize} className={avatarClassName} />
      </div>
    )
  }

  const info = personaInfo(persona)
  return (
    <div className={cn("relative overflow-hidden bg-black", className)} role="img" aria-label={`${info.name}, ${state}`}>
      {(Object.keys(clips) as ClipState[]).map((key) => (
        <video
          key={key}
          ref={(el) => {
            refs.current[key] = el
          }}
          src={clips[key]}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          className={cn("absolute inset-0 size-full object-cover transition-opacity duration-300", key === current ? "opacity-100" : "opacity-0")}
        />
      ))}
    </div>
  )
}
