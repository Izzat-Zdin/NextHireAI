import { useCallback, useEffect, useRef } from "react"

/**
 * Records the microphone while a spoken answer is given, only when filler transcription is switched on.
 * The recording is sent once to the server to count "um"/"uh" sounds and is never stored or played back.
 */
export function useAnswerRecorder(enabled: boolean) {
  const recorder = useRef<MediaRecorder | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const chunks = useRef<Blob[]>([])

  const release = useCallback(() => {
    stream.current?.getTracks().forEach((t) => t.stop())
    stream.current = null
    recorder.current = null
  }, [])

  const abort = useCallback(() => {
    if (recorder.current && recorder.current.state !== "inactive") {
      recorder.current.onstop = null
      recorder.current.stop()
    }
    chunks.current = []
    release()
  }, [release])

  const start = useCallback(async () => {
    abort()
    if (!enabled || typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) return
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      stream.current = media
      const type = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg", "audio/mp4"].find((t) => MediaRecorder.isTypeSupported(t))
      const rec = new MediaRecorder(media, type ? { mimeType: type, audioBitsPerSecond: 32000 } : undefined)
      rec.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.current.push(event.data)
      }
      rec.start(1000)
      recorder.current = rec
    } catch {
      release() // mic refused or busy: the answer still works, only the extra filler count is skipped
    }
  }, [abort, enabled, release])

  const pause = useCallback(() => {
    if (recorder.current?.state === "recording") recorder.current.pause()
  }, [])

  const resume = useCallback(() => {
    if (recorder.current?.state === "paused") recorder.current.resume()
  }, [])

  /** Stops recording and returns the audio (null when nothing was recorded). */
  const stop = useCallback(
    () =>
      new Promise<Blob | null>((resolve) => {
        const rec = recorder.current
        if (!rec || rec.state === "inactive") {
          release()
          resolve(null)
          return
        }
        rec.onstop = () => {
          const blob = chunks.current.length ? new Blob(chunks.current, { type: rec.mimeType || "audio/webm" }) : null
          chunks.current = []
          release()
          resolve(blob)
        }
        rec.stop()
      }),
    [release],
  )

  useEffect(() => abort, [abort])

  return { start, pause, resume, stop, abort }
}
