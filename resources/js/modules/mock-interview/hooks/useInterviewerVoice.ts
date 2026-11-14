import { useCallback, useEffect, useRef, useState } from "react"
import type { Language, Persona } from "../types"
import { personaInfo } from "../services/personas"
import { speechLocale } from "../i18n/interviewStrings"
import { pickVoice, waitForVoices } from "./interviewerVoices"

const isNaturalVoice = (voice: SpeechSynthesisVoice | null) => Boolean(voice && /natural|neural|online|^google/i.test(voice.name))

/**
 * The interviewer's voice, using the browser's speechSynthesis with the most natural voice available
 * for the session language (see interviewerVoices.ts).
 * - `speak` resolves only when speech has really finished (or was cancelled), so callers can start
 *   the microphone afterwards without transcribing the interviewer.
 * - `mouthOpen` follows word boundaries when the browser reports them; otherwise it stays null and
 *   the avatar uses its looping mouth animation from start to end.
 */
export function useInterviewerVoice(persona: Persona, language: Language) {
  const [speaking, setSpeaking] = useState(false)
  const [mouthOpen, setMouthOpen] = useState<number | null>(null)
  const pendingResolve = useRef<(() => void) | null>(null)
  const pollRef = useRef<number | null>(null)
  const mouthTimer = useRef<number | null>(null)
  const speakToken = useRef(0)
  const supported = typeof window !== "undefined" && "speechSynthesis" in window

  const finish = useCallback(() => {
    if (pollRef.current) window.clearInterval(pollRef.current)
    if (mouthTimer.current) window.clearTimeout(mouthTimer.current)
    pollRef.current = null
    mouthTimer.current = null
    setSpeaking(false)
    setMouthOpen(null)
    const resolve = pendingResolve.current
    pendingResolve.current = null
    resolve?.()
  }, [])

  const cancel = useCallback(() => {
    speakToken.current++
    if (supported) window.speechSynthesis.cancel()
    finish()
  }, [finish, supported])

  const speak = useCallback(
    (text: string) =>
      new Promise<void>((resolve) => {
        if (!supported || !text.trim()) {
          resolve()
          return
        }
        // Stop anything still playing and release whoever waited on it.
        window.speechSynthesis.cancel()
        finish()
        const token = ++speakToken.current
        pendingResolve.current = resolve
        setSpeaking(true)

        void waitForVoices().then(() => {
          if (token !== speakToken.current) return // a newer speak() or cancel() took over

          const info = personaInfo(persona)
          const voice = pickVoice(language, info.voice.prefer)
          const utterance = new SpeechSynthesisUtterance(text)
          utterance.lang = voice?.lang ?? speechLocale(language)
          if (voice) utterance.voice = voice
          // Neural voices sound unnatural when pitch-shifted; only older desktop voices get the persona pitch.
          utterance.pitch = isNaturalVoice(voice) ? 1 : info.voice.pitch
          utterance.rate = info.voice.rate

          let started = false
          utterance.onstart = () => {
            started = true
            setSpeaking(true)
          }
          utterance.onboundary = () => {
            setMouthOpen(1)
            if (mouthTimer.current) window.clearTimeout(mouthTimer.current)
            mouthTimer.current = window.setTimeout(() => setMouthOpen(0.25), 140)
          }
          utterance.onend = () => token === speakToken.current && finish()
          utterance.onerror = () => token === speakToken.current && finish()

          window.speechSynthesis.speak(utterance)

          // Safety net: some browsers never fire onend. Treat "no longer speaking" as finished,
          // and give up if speech never starts within a few seconds.
          const startedAt = Date.now()
          pollRef.current = window.setInterval(() => {
            if (token !== speakToken.current) return
            const busy = window.speechSynthesis.speaking || window.speechSynthesis.pending
            if (started && !busy) finish()
            else if (!started && !busy && Date.now() - startedAt > 4000) finish()
          }, 250)
        })
      }),
    [finish, language, persona, supported],
  )

  useEffect(() => () => cancel(), [cancel])

  return { speak, cancel, speaking, mouthOpen, supported }
}
