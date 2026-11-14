// Picks the most natural speechSynthesis voice the browser has for the session language.
// Free browser voices only: Microsoft Edge ships natural ("Online (Natural)") voices for English and
// Malay; Chrome has Google English voices but no Malay one, so Malay falls back to Indonesian or the
// browser default and the setup page suggests Edge.
import { useEffect, useState } from "react"
import type { Language } from "../types"

export type VoiceGender = "female" | "male"

const FEMALE_NAMES = /female|woman|yasmin|gadis|aria|jenny|ava|emma|michelle|sonia|libby|maisie|natasha|clara|neerja|luna|zira|hazel|susan|samantha|karen|moira|tessa|fiona|serena|victoria|allison|google uk english female|google bahasa indonesia/i
const MALE_NAMES = /\bmale\b|\bman\b|osman|ardi|guy|andrew|brian|christopher|eric|roger|steffan|ryan|thomas|william|prabhat|wayne|david|mark|george|james|daniel|alex|fred|google uk english male/i

const norm = (lang: string) => lang.toLowerCase().replace("_", "-")

/** Locales to try in order, best first. */
function wantedLocales(language: Language): string[] {
  return language === "ms-MY" ? ["ms-my", "ms", "id-id", "id"] : ["en-my", "en-sg", "en-gb", "en-us", "en-au", "en-in", "en"]
}

function score(voice: SpeechSynthesisVoice, language: Language, gender: VoiceGender): number {
  const lang = norm(voice.lang)
  const locales = wantedLocales(language)
  const rank = locales.findIndex((l) => lang === l || lang.startsWith(`${l}-`) || (l.length === 2 && lang.startsWith(l)))
  if (rank === -1) return -Infinity
  let points = 100 - rank * 8
  const name = voice.name
  if (/natural|neural/i.test(name)) points += 60 // Edge online neural voices
  else if (/online/i.test(name)) points += 40
  else if (/^google/i.test(name)) points += 30 // Chrome's network voices sound smoother than desktop SAPI voices
  if (/desktop|espeak/i.test(name)) points -= 25
  const genderHit = gender === "female" ? FEMALE_NAMES.test(name) : MALE_NAMES.test(name)
  const genderMiss = gender === "female" ? MALE_NAMES.test(name) && !FEMALE_NAMES.test(name) : FEMALE_NAMES.test(name) && !MALE_NAMES.test(name)
  if (genderHit) points += 12
  if (genderMiss) points -= 12
  return points
}

export function pickVoice(language: Language, gender: VoiceGender): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null
  let best: SpeechSynthesisVoice | null = null
  let bestScore = -Infinity
  for (const voice of window.speechSynthesis.getVoices()) {
    const s = score(voice, language, gender)
    if (s > bestScore) {
      best = voice
      bestScore = s
    }
  }
  return bestScore === -Infinity ? null : best
}

/** Voices load asynchronously (Chrome, Edge). Wait briefly so the first question already uses the best voice. */
export function waitForVoices(timeoutMs = 1500): Promise<void> {
  return new Promise((resolve) => {
    const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined
    if (!synth || synth.getVoices().length > 0) return resolve()
    const done = () => {
      synth.removeEventListener?.("voiceschanged", done)
      window.clearTimeout(timer)
      resolve()
    }
    const timer = window.setTimeout(done, timeoutMs)
    synth.addEventListener?.("voiceschanged", done)
  })
}

export interface VoiceInfo {
  name: string | null
  /** The voice is in the session language (Malay for BM; Indonesian does not count). */
  matchesLanguage: boolean
  natural: boolean
}

export function describeVoice(language: Language, gender: VoiceGender): VoiceInfo {
  const voice = pickVoice(language, gender)
  if (!voice) return { name: null, matchesLanguage: false, natural: false }
  const lang = norm(voice.lang)
  return {
    // "Microsoft Yasmin Online (Natural) - Malay (Malaysia)" → "Yasmin"
    name:
      voice.name
        .replace(/\s*\(.*?\)\s*/g, " ")
        .replace(/\s+-\s+.*$/, "")
        .replace(/^Microsoft\s+/i, "")
        .replace(/\s+(Online|Desktop)\b/i, "")
        .trim() || voice.name,
    matchesLanguage: language === "ms-MY" ? lang.startsWith("ms") : lang.startsWith("en"),
    natural: /natural|neural|online|^google/i.test(voice.name),
  }
}

/** describeVoice that re-renders when the browser finishes loading its voice list. */
export function useVoiceInfo(language: Language, gender: VoiceGender): VoiceInfo & { supported: boolean; loaded: boolean } {
  const [, setVersion] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const supported = typeof window !== "undefined" && "speechSynthesis" in window
  useEffect(() => {
    if (!supported) return
    const synth = window.speechSynthesis
    const onChange = () => {
      setLoaded(true)
      setVersion((n) => n + 1)
    }
    synth.addEventListener?.("voiceschanged", onChange)
    if (synth.getVoices().length) setLoaded(true)
    // Some browsers never fire voiceschanged when they have no voices at all.
    const timer = window.setTimeout(() => setLoaded(true), 2000)
    return () => {
      window.clearTimeout(timer)
      synth.removeEventListener?.("voiceschanged", onChange)
    }
  }, [supported])
  return { ...describeVoice(language, gender), supported, loaded }
}
