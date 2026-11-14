// Rule-based STAR check for the Review step. It looks for wording that usually signals each part of a
// STAR answer (Situation, Task, Action, Result). It is a hint for the candidate, not a score.

export type StarPart = "situation" | "task" | "action" | "result"

export interface StarCheckResult {
  present: Record<StarPart, boolean>
  missing: StarPart[]
  /** A result is described but it contains no number (count, percentage, time, money). */
  resultWithoutNumber: boolean
}

const PATTERNS: Record<StarPart, RegExp> = {
  situation:
    /\b(when i was|while i was|at my|in my (last|previous|current)|during my|at (a|an|the) (company|startup|firm|bank|agency)|internship|semester|project|our team|the team|we had|there was|situation|background|keadaan|semasa saya|ketika saya|di syarikat|projek|latihan industri|pasukan kami)\b/i,
  task: /\b(my (role|job|task|goal|responsibility)|i was (asked|responsible|tasked|in charge)|i needed to|we needed to|the goal was|had to|objective|target|tugas saya|peranan saya|saya perlu|matlamat|bertanggungjawab|sasaran)\b/i,
  action:
    /\b(i (built|created|designed|wrote|led|ran|set up|organised|organized|analysed|analyzed|pulled|proposed|decided|talked|spoke|worked|implemented|changed|tested|trained|introduced|reached out|started|used|made)|i then|so i|first,? i|next,? i|saya (bina|buat|reka|tulis|pimpin|cadangkan|analisis|laksanakan|ubah|uji|latih|mula|guna|hubungi)|lalu saya|kemudian saya)\b/i,
  result:
    /\b(as a result|resulted in|result was|in the end|which (led|meant)|this (led|meant|cut|reduced|increased|improved|saved)|reduced|increased|improved|saved|grew|dropped|cut|achieved|delivered|launched|finished|outcome|impact|hasilnya|akhirnya|berjaya|meningkat|menurun|berkurang|menjimatkan|dicapai)\b/i,
}

const HAS_NUMBER = /\d|\b(one|two|three|four|five|six|seven|eight|nine|ten|twenty|thirty|fifty|hundred|thousand|half|double|twice|satu|dua|tiga|empat|lima|enam|tujuh|lapan|sembilan|sepuluh|seratus|ribu|separuh|dua kali)\b/i

export function checkStar(answer: string): StarCheckResult {
  const text = answer.trim()
  const present = {
    situation: PATTERNS.situation.test(text),
    task: PATTERNS.task.test(text),
    action: PATTERNS.action.test(text),
    result: PATTERNS.result.test(text),
  }

  let resultWithoutNumber = false
  if (present.result) {
    // Look at the sentences that carry the result wording.
    const sentences = text.split(/(?<=[.!?])\s+/)
    const resultSentences = sentences.filter((s) => PATTERNS.result.test(s))
    resultWithoutNumber = resultSentences.length > 0 && !resultSentences.some((s) => HAS_NUMBER.test(s))
  }

  const missing = (Object.keys(present) as StarPart[]).filter((part) => !present[part])
  return { present, missing, resultWithoutNumber }
}
