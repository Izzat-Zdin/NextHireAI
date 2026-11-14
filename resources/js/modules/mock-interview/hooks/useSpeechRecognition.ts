import { useCallback, useEffect, useRef, useState } from "react"
import type { Language } from "../types"
import { LONG_PAUSE_MS } from "../services/speechAnalysis"

type RecognitionError = "not-allowed" | "network" | "other" | null

const getRecognitionClass = (): any =>
  typeof window === "undefined" ? null : (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null

const waitUntilSilent = () =>
  new Promise<void>((resolve) => {
    const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined
    if (!synth || (!synth.speaking && !synth.pending)) return resolve()
    const timer = window.setInterval(() => {
      if (!synth.speaking && !synth.pending) {
        window.clearInterval(timer)
        resolve()
      }
    }, 100)
  })

/**
 * Live speech-to-text for the candidate's answer (Web Speech API, Chrome / Edge).
 * - `start` never opens the mic while the interviewer's voice is still playing.
 * - One transcript: final phrases are appended to `transcript`, the phrase being spoken is `interim`.
 * - `longPauses` counts gaps of LONG_PAUSE_MS or more between recognised phrases while listening.
 * - English uses en-MY and falls back to en-US if the browser does not support en-MY.
 */
export function useSpeechRecognition(language: Language) {
  const supported = Boolean(getRecognitionClass())
  const [listening, setListening] = useState(false)
  const [transcript, setTranscriptState] = useState("")
  const [interim, setInterim] = useState("")
  const [longPauses, setLongPauses] = useState(0)
  const [error, setError] = useState<RecognitionError>(null)

  const recognitionRef = useRef<any>(null)
  const wantListening = useRef(false)
  const transcriptRef = useRef("")
  const lastSpeechAt = useRef<number | null>(null)
  const localeRef = useRef(language === "ms-MY" ? "ms-MY" : "en-MY")
  const startToken = useRef(0)

  const setTranscript = useCallback((text: string) => {
    transcriptRef.current = text
    setTranscriptState(text)
  }, [])

  const createRecognition = useCallback(() => {
    const Recognition = getRecognitionClass()
    if (!Recognition) return null
    const recognition = new Recognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = localeRef.current

    recognition.onresult = (event: any) => {
      let interimText = ""
      let finalText = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const piece = event.results[i][0].transcript
        if (event.results[i].isFinal) finalText += piece + " "
        else interimText += piece
      }
      const now = Date.now()
      if (lastSpeechAt.current !== null && now - lastSpeechAt.current >= LONG_PAUSE_MS) setLongPauses((n) => n + 1)
      lastSpeechAt.current = now
      setInterim(interimText)
      if (finalText.trim()) {
        const prev = transcriptRef.current.trim()
        setTranscript(prev ? `${prev} ${finalText.trim()}` : finalText.trim())
      }
    }

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech" || event.error === "aborted") return
      if (event.error === "language-not-supported" && localeRef.current === "en-MY") {
        localeRef.current = "en-US"
        return // onend restarts with the fallback locale
      }
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        wantListening.current = false
        setError("not-allowed")
      } else if (event.error === "network") {
        wantListening.current = false
        setError("network")
      } else {
        setError("other")
      }
    }

    recognition.onend = () => {
      // Chrome stops after a stretch of silence; keep going while the candidate is still answering.
      if (wantListening.current) {
        try {
          recognition.lang = localeRef.current
          recognition.start()
          return
        } catch {
          /* fall through */
        }
      }
      setListening(false)
      setInterim("")
    }
    return recognition
  }, [setTranscript])

  const start = useCallback(async () => {
    if (!supported) return
    const token = ++startToken.current
    wantListening.current = true
    setError(null)
    // Never listen while the interviewer is talking, or her words end up in the answer.
    await waitUntilSilent()
    if (token !== startToken.current || !wantListening.current) return
    if (!recognitionRef.current) recognitionRef.current = createRecognition()
    lastSpeechAt.current = null
    try {
      recognitionRef.current?.start()
      setListening(true)
    } catch {
      // Already started: fine.
      setListening(true)
    }
  }, [createRecognition, supported])

  /** Stops listening. Pending words that the browser already heard are still added. */
  const stop = useCallback(() => {
    startToken.current++
    wantListening.current = false
    lastSpeechAt.current = null
    try {
      recognitionRef.current?.stop()
    } catch {
      /* ignore */
    }
    setListening(false)
  }, [])

  /** Stops listening and drops anything still in flight (used when moving on or when the interviewer speaks). */
  const abort = useCallback(() => {
    startToken.current++
    wantListening.current = false
    lastSpeechAt.current = null
    const recognition = recognitionRef.current
    if (recognition) {
      recognition.onresult = null
      try {
        recognition.abort()
      } catch {
        /* ignore */
      }
    }
    recognitionRef.current = null
    setListening(false)
    setInterim("")
  }, [])

  const reset = useCallback(
    (text = "") => {
      setTranscript(text)
      setInterim("")
      setLongPauses(0)
      setError(null)
    },
    [setTranscript],
  )

  // New session language: rebuild the recogniser next time.
  useEffect(() => {
    localeRef.current = language === "ms-MY" ? "ms-MY" : "en-MY"
    recognitionRef.current = null
  }, [language])

  useEffect(() => () => abort(), [abort])

  return { supported, listening, transcript, interim, longPauses, error, start, stop, abort, reset, setTranscript }
}
