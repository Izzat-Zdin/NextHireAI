import type { SpeechMetrics } from "../types"

export const FILLER_WORDS = [
  // English fillers, vocal hesitations & pauses
  "um",
  "umm",
  "ummm",
  "uh",
  "uhh",
  "uhhh",
  "ah",
  "ahh",
  "ahhh",
  "aah",
  "er",
  "err",
  "errr",
  "erm",
  "ermm",
  "hmm",
  "hmmm",
  "aaa",
  "eee",
  "like",
  "you know",
  "i mean",
  "sort of",
  "kind of",
  "basically",
  "actually",
  // Malay vocal hesitations & colloquial fillers
  "ha",
  "haa",
  "haah",
  "mmm",
  "kot",
  "tahu tak",
  "macam",
  "apa tu",
  "apa ni",
  "apa benda",
  "apa nama",
  "tu lah",
]

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
const CLAUSE_START_FILLERS = new Set(["actually", "basically"])
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
const VOCAL_FILLERS = new Set(["um", "umm", "ummm", "uh", "uhh", "uhhh", "ah", "ahh", "ahhh", "aah", "er", "err", "errr", "erm", "ermm", "hmm", "hmmm", "mmm", "aaa", "eee"])

const vocalCounts = (text: string) => {
  const counts: Record<string, number> = {}
  for (const span of findFillerSpans(text)) if (VOCAL_FILLERS.has(span.word)) counts[span.word] = (counts[span.word] ?? 0) + 1
  return counts
}

/**
 * Adds the hesitation sounds found in a filler-aware transcript of the same answer (for example
 * Deepgram with filler_words) that the browser transcript missed. Never lowers the count.
 */
export function mergeVocalFillers(metrics: SpeechMetrics, browserText: string, fillerAwareText: string): SpeechMetrics {
  const fromBrowser = vocalCounts(browserText)
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
