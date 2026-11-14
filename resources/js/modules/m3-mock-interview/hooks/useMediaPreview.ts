import { useCallback, useEffect, useRef, useState } from "react"

export type MediaProblem = "denied" | "unavailable" | null

/**
 * Camera self-view and live mic level, each on its own stream so turning the camera off never
 * touches the mic (and a missing camera does not block the mic). Nothing is recorded.
 * Devices are only opened when the user asks (setCameraOn / startMic), never on page load.
 */
export function useMediaPreview() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const videoStream = useRef<MediaStream | null>(null)
  const audioStream = useRef<MediaStream | null>(null)
  const audioCtx = useRef<AudioContext | null>(null)
  const frame = useRef<number | null>(null)

  const [cameraOn, setCameraOnState] = useState(false)
  const [micOn, setMicOn] = useState(false)
  const [micLevel, setMicLevel] = useState(0)
  const [cameraProblem, setCameraProblem] = useState<MediaProblem>(null)
  const [micProblem, setMicProblem] = useState<MediaProblem>(null)

  const attachVideo = useCallback(() => {
    if (videoRef.current && videoStream.current) videoRef.current.srcObject = videoStream.current
  }, [])

  const stopCamera = useCallback(() => {
    videoStream.current?.getTracks().forEach((t) => t.stop())
    videoStream.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraOnState(false)
  }, [])

  const setCameraOn = useCallback(
    async (on: boolean) => {
      if (!on) return stopCamera()
      if (!navigator.mediaDevices?.getUserMedia) return setCameraProblem("unavailable")
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        videoStream.current = stream
        setCameraProblem(null)
        setCameraOnState(true)
        attachVideo()
      } catch (err: any) {
        setCameraProblem(err?.name === "NotAllowedError" ? "denied" : "unavailable")
        setCameraOnState(false)
      }
    },
    [attachVideo, stopCamera],
  )

  const stopMic = useCallback(() => {
    if (frame.current) cancelAnimationFrame(frame.current)
    frame.current = null
    audioStream.current?.getTracks().forEach((t) => t.stop())
    audioStream.current = null
    if (audioCtx.current && audioCtx.current.state !== "closed") audioCtx.current.close().catch(() => {})
    audioCtx.current = null
    setMicOn(false)
    setMicLevel(0)
  }, [])

  const startMic = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) return setMicProblem("unavailable")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      audioStream.current = stream
      setMicProblem(null)
      setMicOn(true)
      const Ctx = window.AudioContext || (window as any).webkitAudioContext
      if (!Ctx) return
      const ctx: AudioContext = new Ctx()
      audioCtx.current = ctx
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      ctx.createMediaStreamSource(stream).connect(analyser)
      const data = new Uint8Array(analyser.frequencyBinCount)
      let last = 0
      const tick = (time: number) => {
        // ~15 updates a second is plenty for a meter and keeps re-renders low.
        if (time - last > 66) {
          analyser.getByteFrequencyData(data)
          let sum = 0
          for (let i = 0; i < data.length; i++) sum += data[i]
          setMicLevel(Math.min(100, Math.round((sum / data.length / 128) * 100)))
          last = time
        }
        frame.current = requestAnimationFrame(tick)
      }
      frame.current = requestAnimationFrame(tick)
    } catch (err: any) {
      setMicProblem(err?.name === "NotAllowedError" ? "denied" : "unavailable")
      setMicOn(false)
    }
  }, [])

  // Re-attach when the <video> element mounts after the stream exists.
  const setVideoElement = useCallback(
    (el: HTMLVideoElement | null) => {
      videoRef.current = el
      attachVideo()
    },
    [attachVideo],
  )

  useEffect(
    () => () => {
      stopCamera()
      stopMic()
    },
    [stopCamera, stopMic],
  )

  return { setVideoElement, cameraOn, setCameraOn, cameraProblem, micOn, micLevel, micProblem, startMic, stopMic }
}
