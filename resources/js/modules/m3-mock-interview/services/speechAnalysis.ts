import type { SpeechMetrics } from "../types"

/**
 * Filler words and phrases. Hesitation sounds (um, uh, er, erm, ah, eh, em, hmm, mm, aa ...) are matched by
 * VOCAL_FILLER_PATTERN below in any length ("ummmm", "uhm", "hmmmm"), so they are not listed here.
 * Keep this list identical to app/Services/Interview/FillerDetector.php.
 */
export const FILLER_WORDS = [
  // English
  "like",
  "you know",
  "i mean",
  "sort of",
  "kind of",
  "basically",
  "actually",
  "you see",
  "how to say",
  "what to say",
  "so yeah",
  "or something",
  // Malay
  "ha",
  "haa",
  "haah",
  "kot",
  "tahu tak",
  "macam",
  "apa tu",
  "apa ni",
  "apa benda",
  "apa nama",
  "tu lah",
  "maksud saya",
  "apa orang kata",
  "sebenarnya",
]

/** Hesitation sounds in any length: um, umm, uhm, uh, er, erm, eh, em, ah, aa, eee, hmm, mm. */
export const VOCAL_FILLER_PATTERN = "u+h*m+|u+h+|e+r+m*|e+h+|e+m+|a+h+|a{2,}|e{3,}|h+m+|m{2,}"

/** One name per hesitation sound, so "ummm" and "umm" both count as "um". */
export function vocalFillerName(word: string): string {
  const w = word.toLowerCase()
  if (/^u+h*m+$/.test(w)) return "um"
  if (/^u+h+$/.test(w)) return "uh"
  if (/^e+r+m+$/.test(w)) return "erm"
  if (/^e+r+$/.test(w)) return "er"
  if (/^e+h+$/.test(w)) return "eh"
  if (/^e+m+$/.test(w)) return "em"
  if (/^a+h+$/.test(w)) return "ah"
  if (/^a+$/.test(w)) return "aa"
  if (/^e+$/.test(w)) return "ee"
  if (/^h+m+$/.test(w)) return "hmm"
  return "mm"
}

/** A gap between recognised phrases this long (or longer) counts as a long pause. */
export const LONG_PAUSE_MS = 3000

export interface FillerSpan {
  start: number
  end: number
  word: string
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
// Longest phrases first so "you know" wins over shorter overlaps.
const SORTED_FILLERS = [...FILLER_WORDS].sort((a, b) => b.length - a.length)
const LIKE_NOT_FILLER = /^\s+(a|an|the|this|that|these|those|my|your|his|her|our|their|its|to|of|in|on|at|for|with)\b/i
/** "macam mana", "macam ini", "macam biasa" and "macam-macam" are normal Malay, not fillers. */
const MACAM_NOT_FILLER = /^(\s+(mana|ini|itu|tu|biasa|biasanya|sekarang|dulu|kita|saya)\b|-)/i
/** Words that are only fillers when they open a sentence or clause, or are used more than once. */
const CLAUSE_START_FILLERS = new Set(["actually", "basically", "sebenarnya"])
const VOCAL_REGEX = new RegExp(`(?<![\\p{L}\\p{N}'])(?:${VOCAL_FILLER_PATTERN})(?![\\p{L}\\p{N}'])`, "giu")
const isClauseStart = (text: string, start: number) => {
  const before = text.slice(0, start).trimEnd()
  return before === "" || /[.!?,;:]$/.test(before)
}

/**
 * Finds filler words in the text, with their positions. This is the single matcher used for both
 * the filler count and the inline highlighting, so the two always agree.
 */
export function findFillerSpans(text: string): FillerSpan[] {
  if (!text) return []
  const spans: FillerSpan[] = []
  const taken = new Array<boolean>(text.length).fill(false)

  for (const phrase of SORTED_FILLERS) {
    const pattern = phrase.split(/\s+/).map(escapeRegex).join("\\s+")
    const regex = new RegExp(`(?<![\\p{L}\\p{N}'])${pattern}(?![\\p{L}\\p{N}'])`, "giu")
    for (const match of text.matchAll(regex)) {
      const start = match.index ?? 0
      const end = start + match[0].length
      if (phrase === "like" && LIKE_NOT_FILLER.test(text.slice(end))) continue
      if (phrase === "macam" && (MACAM_NOT_FILLER.test(text.slice(end)) || text[start - 1] === "-")) continue
      if (CLAUSE_START_FILLERS.has(phrase) && !isClauseStart(text, start) && (text.match(regex) ?? []).length < 2) continue
      let overlaps = false
      for (let i = start; i < end; i++) if (taken[i]) overlaps = true
      if (overlaps) continue
      for (let i = start; i < end; i++) taken[i] = true
      spans.push({ start, end, word: phrase })
    }
  }

  for (const match of text.matchAll(VOCAL_REGEX)) {
    const start = match.index ?? 0
    const end = start + match[0].length
    let overlaps = false
    for (let i = start; i < end; i++) if (taken[i]) overlaps = true
    if (overlaps) continue
    for (let i = start; i < end; i++) taken[i] = true
    spans.push({ start, end, word: vocalFillerName(match[0]) })
  }

  return spans.sort((a, b) => a.start - b.start)
}

export function detectFillers(transcript: string): {
  total: number
  perWord: Record<string, number>
  ratePer100Words: number
} {
  if (!transcript || !transcript.trim()) {
    return { total: 0, perWord: {}, ratePer100Words: 0 }
  }

  const spans = findFillerSpans(transcript)
  const totalWords = countWords(transcript)
  const counts: Record<string, number> = {}
  for (const span of spans) counts[span.word] = (counts[span.word] ?? 0) + 1

  return {
    total: spans.length,
    perWord: counts,
    ratePer100Words: totalWords > 0 ? Number(((spans.length / totalWords) * 100).toFixed(1)) : 0,
  }
}

export const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length

/** Hesitation sounds that browser speech recognition usually drops but a filler-aware transcriber keeps. */
const VOCAL_FILLERS = new Set(["um", "uh", "er", "erm", "eh", "em", "ah", "aa", "ee", "hmm", "mm"])

/** Hesitation sounds (um, uh, erm ...) in a piece of text, by name. */
export const vocalCounts = (text: string) => {
  const counts: Record<string, number> = {}
  for (const span of findFillerSpans(text)) if (VOCAL_FILLERS.has(span.word)) counts[span.word] = (counts[span.word] ?? 0) + 1
  return counts
}

/**
 * Adds hesitation sounds that were heard but are not in the final text: Chrome often shows "um" or "uh"
 * while the candidate is speaking, then drops it from the final transcript. Never lowers the count.
 */
export function addHeardFillers(metrics: SpeechMetrics, heard: Record<string, number>, text: string): SpeechMetrics {
  const extra = Object.values(heard).reduce((sum, n) => sum + n, 0)
  if (!extra) return metrics
  const perWord = { ...metrics.fillerAnalysis.perWord }
  for (const [word, n] of Object.entries(heard)) if (n > 0) perWord[word] = (perWord[word] ?? 0) + n
  const total = metrics.fillerAnalysis.total + extra
  const words = countWords(text)
  return { ...metrics, fillerAnalysis: { total, perWord, ratePer100Words: words > 0 ? Number(((total / words) * 100).toFixed(1)) : 0 } }
}

/**
 * Adds the hesitation sounds found in a filler-aware transcript of the same answer (for example
 * Deepgram with filler_words) that the browser transcript missed. Never lowers the count.
 */
export function mergeVocalFillers(metrics: SpeechMetrics, browserText: string, fillerAwareText: string, alreadyAdded: Record<string, number> = {}): SpeechMetrics {
  const fromBrowser = vocalCounts(browserText)
  for (const [word, n] of Object.entries(alreadyAdded)) fromBrowser[word] = (fromBrowser[word] ?? 0) + n
  const fromAudio = vocalCounts(fillerAwareText)
  const perWord = { ...metrics.fillerAnalysis.perWord }
  let extra = 0
  for (const [word, n] of Object.entries(fromAudio)) {
    const missing = n - (fromBrowser[word] ?? 0)
    if (missing > 0) {
      perWord[word] = (perWord[word] ?? 0) + missing
      extra += missing
    }
  }
  if (!extra) return metrics
  const total = metrics.fillerAnalysis.total + extra
  const words = countWords(browserText)
  return {
    ...metrics,
    fillerAnalysis: { total, perWord, ratePer100Words: words > 0 ? Number(((total / words) * 100).toFixed(1)) : 0 },
  }
}

/**
 * Speech metrics for an answer. Pass durationSeconds = null for typed answers: words per minute is
 * only reported when the answer was actually spoken and timed.
 */
export function analyzeTranscript(transcript: string, durationSeconds: number | null, longPauses: number | null = null): SpeechMetrics {
  const wordCount = countWords(transcript)
  const fillerAnalysis = detectFillers(transcript)
  const duration = durationSeconds && durationSeconds > 0 ? durationSeconds : null

  return {
    wordCount,
    durationSeconds: duration ? Math.round(duration) : 0,
    speakingRateWordsPerMinute: duration && wordCount > 0 ? Math.round(wordCount / (duration / 60)) : null,
    fillerAnalysis,
    longPauses,
  }
}
