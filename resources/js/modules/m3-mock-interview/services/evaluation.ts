import type { EvaluationResult, FacialMetrics, SpeechMetrics, InterviewType } from "../types"
import { checkStar } from "./starCheck"
import { getSuggestedAnswer } from "./suggestedAnswers"

// Rule-based answer scoring. The same rules run on the server (app/Services/Interview/AnswerEvaluator.php),
// which recomputes and stores the score, so a score sent from the browser is never trusted.
// Keep both files in step: any change to a word list, weight or cap here must be made there too.

interface EvaluateInput {
  question: string
  answer: string
  type: InterviewType
  role: string
  speechMetrics?: SpeechMetrics | null
  facialMetrics?: FacialMetrics | null
  isMalay?: boolean
}

/** Common English and Malay function words. Real sentences always contain some; keyword lists and gibberish do not. */
export const STOPWORDS = new Set([
  "i", "me", "my", "we", "our", "you", "your", "he", "she", "it", "they", "them", "their",
  "a", "an", "the", "and", "or", "but", "so", "because", "if", "then", "than", "that", "this", "these", "those",
  "is", "am", "are", "was", "were", "be", "been", "have", "has", "had", "do", "did", "does", "will", "would", "can", "could",
  "to", "of", "in", "on", "at", "for", "with", "from", "by", "about", "as", "into", "after", "before", "when", "while", "what", "how", "which", "who",
  "not", "no", "very", "also", "just", "more", "most", "some", "all", "each",
  "saya", "kami", "kita", "anda", "dia", "mereka", "dan", "atau", "tetapi", "kerana", "sebab", "jika", "kalau", "maka",
  "yang", "ini", "itu", "di", "ke", "dari", "daripada", "pada", "untuk", "dengan", "dalam", "oleh", "tentang", "sebagai",
  "ada", "adalah", "ialah", "akan", "telah", "sudah", "sedang", "boleh", "perlu", "tidak", "bukan", "juga", "lebih", "sangat", "semasa", "ketika", "apabila", "selepas", "sebelum",
])

const EXAMPLE_CUE = /\b(for example|for instance|such as|like when|instance|project|team|company|client|customer|internship|projek|pasukan|syarikat|pelanggan|contohnya|misalnya|sebagai contoh)\b/gi
const NUMBER_CUE = /\d+(?:[.,]\d+)?\s*(?:%|k|m|rm|percent|peratus)?|\b(one|two|three|four|five|six|seven|eight|nine|ten|first|second|third|satu|dua|tiga|empat|lima|pertama|kedua|ketiga)\b/gi
const STAR_CUE = /\b(situation|task|action|result|challenge|goal|outcome|achieved|improved|reduced|increased|keadaan|tugas|tindakan|hasil|hasilnya|cabaran|matlamat|mencapai|meningkat|berjaya)\b/gi

/** Terms every role can use well (process, teamwork, results), in English and Malay. */
const GENERAL_TERMS = [
  "deadline", "stakeholder", "priority", "prioritise", "prioritize", "feedback", "process", "plan", "schedule", "budget", "report",
  "kpi", "target", "metric", "metrics", "quality", "customer", "client", "collaborate", "communication", "problem",
  "tarikh akhir", "keutamaan", "maklum balas", "proses", "perancangan", "jadual", "bajet", "laporan", "sasaran", "kualiti", "pelanggan", "kerjasama", "komunikasi", "masalah",
]

/** Role families: a role title that matches the pattern scores its domain terms as technical vocabulary. */
const ROLE_TERMS: { pattern: RegExp; terms: string[] }[] = [
  {
    pattern: /\b(software|developer|engineer|programmer|web|frontend|front-end|backend|back-end|full ?stack|devops|it\b|system|network|mobile|app|cloud|security|pembangun|perisian|sistem|rangkaian)\b/i,
    terms: ["api", "database", "framework", "algorithm", "component", "architecture", "deploy", "deployment", "test", "testing", "unit test", "function", "class", "module", "schema", "query", "sql", "server", "json", "rest", "git", "ci/cd", "bug", "debug", "refactor", "latency", "cache", "docker", "cloud", "react", "laravel", "python", "java", "pangkalan data", "pelayan", "pengekodan", "ujian"],
  },
  {
    pattern: /\b(data|analyst|analytics|scientist|machine learning|ml|ai|business intelligence|bi|penganalisis|analisis data)\b/i,
    terms: ["sql", "python", "dashboard", "regression", "model", "dataset", "visualisation", "visualization", "excel", "power bi", "tableau", "statistics", "correlation", "a/b", "forecast", "cleaning", "pipeline", "data", "statistik", "ramalan", "papan pemuka"],
  },
  {
    pattern: /\b(marketing|sales|business|growth|brand|social media|content|digital|seo|pemasaran|jualan|perniagaan|jenama)\b/i,
    terms: ["cac", "ltv", "churn", "retention", "conversion", "funnel", "campaign", "roi", "engagement", "lead", "leads", "seo", "brand", "segment", "a/b", "revenue", "pipeline", "quota", "kempen", "jualan", "hasil", "penukaran", "pelanggan sasaran"],
  },
  {
    pattern: /\b(account|accountant|accounting|finance|financial|audit|auditor|tax|bank|perakaunan|akauntan|kewangan|juruaudit|cukai)\b/i,
    terms: ["reconciliation", "ledger", "balance sheet", "cash flow", "audit", "tax", "accrual", "budget", "variance", "forecast", "invoice", "ifrs", "mfrs", "payroll", "compliance", "penyata", "aliran tunai", "lejar", "cukai", "audit", "belanjawan", "pematuhan"],
  },
  {
    pattern: /\b(nurse|nursing|doctor|medical|clinic|hospital|health|pharmac|therapist|jururawat|doktor|perubatan|klinik|hospital|kesihatan|farmasi)\b/i,
    terms: ["patient", "care plan", "triage", "medication", "vital signs", "infection control", "hygiene", "ward", "handover", "assessment", "safety", "sop", "pesakit", "rawatan", "ubat", "wad", "kebersihan", "keselamatan", "penilaian"],
  },
  {
    pattern: /\b(teacher|lecturer|tutor|education|teaching|trainer|cikgu|guru|pensyarah|pendidikan|pengajar|jurulatih)\b/i,
    terms: ["lesson plan", "curriculum", "assessment", "classroom", "student", "learning outcome", "differentiated", "rubric", "engagement", "pedagogy", "rancangan pengajaran", "kurikulum", "pentaksiran", "bilik darjah", "murid", "pelajar", "hasil pembelajaran"],
  },
  {
    pattern: /\b(mechanical|civil|electrical|chemical|manufacturing|production|quality|maintenance|technician|site|kejuruteraan|juruteknik|pembuatan|pengeluaran|penyelenggaraan|tapak)\b/i,
    terms: ["autocad", "solidworks", "maintenance", "root cause", "lean", "six sigma", "safety", "osha", "iso", "inspection", "tolerance", "commissioning", "plc", "drawing", "specification", "punca", "keselamatan", "pemeriksaan", "lukisan", "spesifikasi", "penyelenggaraan"],
  },
  {
    pattern: /\b(design|designer|ui|ux|graphic|creative|pereka|reka bentuk|grafik)\b/i,
    terms: ["wireframe", "prototype", "figma", "user research", "usability", "persona", "accessibility", "typography", "layout", "brand guideline", "iteration", "prototaip", "kebolehgunaan", "susun atur", "penyelidikan pengguna"],
  },
  {
    pattern: /\b(hr|human resource|recruit|talent|admin|administrative|executive|clerk|officer|sumber manusia|pengambilan|pentadbiran|eksekutif|kerani|pegawai)\b/i,
    terms: ["recruitment", "onboarding", "policy", "payroll", "compliance", "employee", "interview", "record", "filing", "documentation", "sop", "pengambilan", "dasar", "pekerja", "rekod", "dokumentasi", "pematuhan"],
  },
  {
    pattern: /\b(customer service|support|call centre|call center|hospitality|hotel|restaurant|retail|cashier|front desk|khidmat pelanggan|sokongan|hotel|restoran|runcit|juruwang)\b/i,
    terms: ["complaint", "escalation", "service level", "satisfaction", "ticket", "resolution", "upsell", "inventory", "pos", "check-in", "aduan", "kepuasan", "penyelesaian", "inventori", "perkhidmatan"],
  },
]

/** Generic technical words used when the role matches no family (the old fixed list, kept as a fallback). */
const FALLBACK_TERMS = ["api", "database", "framework", "algorithm", "system", "process", "analytics", "metrics", "kpi", "testing", "sprint", "scrum", "sistem", "proses", "analisis"]

export function termsForRole(role: string): string[] {
  const families = ROLE_TERMS.filter((family) => family.pattern.test(role))
  const domain = families.length ? families.flatMap((family) => family.terms) : FALLBACK_TERMS
  return [...new Set([...domain, ...GENERAL_TERMS])]
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

/** Distinct terms from the list that appear in the text, plus how many times they appear in total. */
function termHits(text: string, terms: string[]) {
  let distinct = 0
  let total = 0
  for (const term of terms) {
    const matches = text.match(new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegex(term)}(?![\\p{L}\\p{N}])`, "giu"))
    if (matches) {
      distinct += 1
      total += matches.length
    }
  }
  return { distinct, total }
}

const countMatches = (text: string, pattern: RegExp) => (text.match(pattern) ?? []).length

/** Score caps for answers that are too short, gibberish, a keyword list, or one phrase repeated. */
export const CAPS = { shortPerWord: 3, minWords: 8, noSentences: 20, stuffing: 45, repetitive: 30 }

export function evaluateAnswerLocally({
  question,
  answer,
  type,
  role,
  speechMetrics,
  facialMetrics,
  isMalay = false,
}: EvaluateInput): EvaluationResult {
  const cleanAnswer = (answer || "").trim()
  const exampleAnswer = getSuggestedAnswer({ text: question, type, role, language: isMalay ? "ms-MY" : "en-MY" })

  if (!cleanAnswer) {
    return {
      scores: { relevance: 0, clarity: 0, specificity: 0, technicalAccuracy: 0 },
      overallScore: 0,
      strengths: [],
      weaknesses: [isMalay ? "Tiada jawapan diberikan." : "No answer was provided."],
      improvements: [
        isMalay
          ? "Sila berikan jawapan lisan atau bertulis supaya AI dapat menganalisis prestasi anda."
          : "Provide a response so we can analyze your interview content and delivery.",
      ],
      exampleAnswer,
      summary: isMalay ? "Tiada jawapan dikesan." : "No answer provided.",
    }
  }

  const normalizedAnswer = cleanAnswer.toLowerCase()
  const words = normalizedAnswer.split(/\s+/).filter(Boolean)
  const tokens = words.map((w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "")).filter(Boolean)
  const wordCount = tokens.length
  const sentences = normalizedAnswer.split(/[.!?]+/).filter((s) => s.trim().length > 0)

  // Signals of a real answer versus gibberish, a keyword list, or one phrase repeated.
  const stopwordCount = tokens.filter((t) => STOPWORDS.has(t)).length
  const stopRatio = wordCount ? stopwordCount / wordCount : 0
  const uniqueRatio = wordCount ? new Set(tokens).size / wordCount : 0
  const tooShort = wordCount < CAPS.minWords
  const noSentences = !tooShort && stopRatio < 0.08
  const repetitive = wordCount >= 20 && uniqueRatio < 0.35

  const terms = termsForRole(role)
  const tech = termHits(normalizedAnswer, terms)
  const exampleHits = countMatches(normalizedAnswer, EXAMPLE_CUE)
  const numberHits = countMatches(normalizedAnswer, NUMBER_CUE)
  const starHits = countMatches(normalizedAnswer, STAR_CUE)
  const keywordDensity = wordCount ? (tech.total + exampleHits + starHits) / wordCount : 0
  const stuffing = !tooShort && keywordDensity > 0.3

  // 1. Relevance (0-10): content words shared with the question.
  const questionWords = new Set(
    question.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 3 && !STOPWORDS.has(w)),
  )
  const answerWords = new Set(tokens.filter((w) => w.length > 3))
  const overlap = [...questionWords].filter((w) => answerWords.has(w)).length
  let relevance = 3 + Math.round((overlap / Math.max(1, questionWords.size)) * 7)
  if (wordCount > 25) relevance += 1
  relevance = clamp(relevance, 1, 10)

  // 2. Clarity & structure (0-10).
  const avgSentenceLength = wordCount / Math.max(1, sentences.length)
  const fillerRate = speechMetrics?.fillerAnalysis.ratePer100Words ?? 0
  let clarity = 5
  if (avgSentenceLength >= 6 && avgSentenceLength <= 24) clarity += 2
  if (sentences.length >= 2) clarity += 1
  if (wordCount >= 30) clarity += 1
  if (fillerRate > 6) clarity -= 2
  else if (fillerRate > 3) clarity -= 1
  clarity = clamp(clarity, 1, 10)

  // 3. Specificity & STAR (0-10). STAR earns more when its parts come in order.
  const star = checkStar(cleanAnswer)
  const starParts = Object.values(star.present).filter(Boolean).length
  let specificity = 4
  if (exampleHits > 0) specificity += 2
  if (numberHits > 0) specificity += 2
  if (starParts >= 2) specificity += 1
  if (starParts >= 2 && starInOrder(cleanAnswer)) specificity += 1
  if (wordCount > 50) specificity += 1
  if (stuffing) specificity = Math.min(specificity, 4)
  specificity = clamp(specificity, 1, 10)

  // 4. Technical accuracy (0-10): vocabulary of the candidate's role family, in English or Malay.
  let technicalAccuracy = type === "technical" ? 4 : 5
  if (tech.distinct >= 1) technicalAccuracy += 2
  if (tech.distinct >= 3) technicalAccuracy += 1
  if (wordCount > 40) technicalAccuracy += 1
  if (stuffing) technicalAccuracy = Math.min(technicalAccuracy, 4)
  technicalAccuracy = clamp(technicalAccuracy, 1, 10)

  let overallScore = Math.round((relevance + clarity + specificity + technicalAccuracy) * 2.5)
  if (tooShort) overallScore = Math.min(overallScore, wordCount * CAPS.shortPerWord)
  if (noSentences) overallScore = Math.min(overallScore, CAPS.noSentences)
  if (stuffing) overallScore = Math.min(overallScore, CAPS.stuffing)
  if (repetitive) overallScore = Math.min(overallScore, CAPS.repetitive)
  overallScore = clamp(overallScore, 0, 100)

  const wpm = speechMetrics?.speakingRateWordsPerMinute ?? null
  const fillerTotal = speechMetrics?.fillerAnalysis.total ?? 0
  const t = isMalay ? MS : EN

  const strengths: string[] = []
  if (!tooShort && !noSentences && !stuffing) {
    if (relevance >= 7) strengths.push(t.strongRelevance)
    if (clarity >= 7) strengths.push(t.strongClarity)
    if (specificity >= 7) strengths.push(t.strongSpecificity)
    if (technicalAccuracy >= 7) strengths.push(t.strongTechnical)
  }
  if (strengths.length === 0) strengths.push(tooShort || noSentences ? t.strongTried : t.strongBase)

  const weaknesses: string[] = []
  if (tooShort) weaknesses.push(t.weakTooShort)
  else if (noSentences) weaknesses.push(t.weakNoSentences)
  if (stuffing) weaknesses.push(t.weakStuffing)
  if (repetitive) weaknesses.push(t.weakRepetitive)
  if (!tooShort && wordCount < 35) weaknesses.push(t.weakBrief)
  if (specificity < 6) weaknesses.push(t.weakSpecificity)
  if (fillerRate > 5) weaknesses.push(t.weakFillers(fillerTotal))
  if (wpm && wpm > 175) weaknesses.push(t.weakFast(wpm))

  const improvements: string[] = [t.improveStar]
  if (specificity < 7) improvements.push(t.improveNumber)
  if (fillerRate > 4) improvements.push(t.improveFillers)
  if (improvements.length < 3) improvements.push(t.improveClose)

  const band = overallScore >= 75 ? 2 : overallScore >= 55 ? 1 : 0
  return {
    scores: { relevance, clarity, specificity, technicalAccuracy },
    overallScore,
    strengths: strengths.slice(0, 3),
    weaknesses: weaknesses.slice(0, 3),
    improvements: improvements.slice(0, 3),
    exampleAnswer,
    summary: t.summary(band, overallScore),
    speechMetrics: speechMetrics || undefined,
    facialMetrics: facialMetrics || undefined,
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

/** Situation or task wording appears before action wording, which appears before result wording. */
function starInOrder(answer: string) {
  const at = (pattern: RegExp) => {
    const m = pattern.exec(answer)
    return m ? m.index : -1
  }
  const setup = Math.min(...[at(STAR_ORDER.situation), at(STAR_ORDER.task)].filter((i) => i >= 0), Infinity)
  const action = at(STAR_ORDER.action)
  const result = at(STAR_ORDER.result)
  const points = [setup === Infinity ? -1 : setup, action, result].filter((i) => i >= 0)
  if (points.length < 2) return false
  return points.every((p, i) => i === 0 || p > points[i - 1])
}

const STAR_ORDER = {
  situation: /\b(when i was|while i was|in my (last|previous|current)|during my|internship|our team|we had|there was|semasa saya|ketika saya|di syarikat|latihan industri|pasukan kami)\b/i,
  task: /\b(my (role|job|task|goal|responsibility)|i was (asked|responsible|tasked|in charge)|i needed to|we needed to|the goal was|tugas saya|peranan saya|saya perlu|matlamat)\b/i,
  action: /\b(i (built|created|designed|wrote|led|organised|organized|analysed|analyzed|proposed|decided|implemented|changed|tested|trained|introduced|started)|so i|first,? i|saya (bina|buat|reka|tulis|pimpin|cadangkan|analisis|laksanakan|ubah|uji|latih|mula)|lalu saya|kemudian saya)\b/i,
  result: /\b(as a result|resulted in|in the end|which (led|meant)|reduced|increased|improved|saved|achieved|outcome|hasilnya|akhirnya|berjaya|meningkat|menurun|dicapai)\b/i,
}

const EN = {
  strongRelevance: "Your answer directly addresses the core objective of the question.",
  strongClarity: "Well-structured phrasing with clear transitions between key points.",
  strongSpecificity: "You backed your points with tangible actions and measurable outcomes.",
  strongTechnical: "Effective use of terminology from your field.",
  strongBase: "Good effort; the foundational concept of your answer is clear.",
  strongTried: "You made an attempt; now build it into full sentences.",
  weakTooShort: "The answer is too short to assess. Answer in full sentences.",
  weakNoSentences: "This does not read as a sentence-based answer. Explain in your own words rather than listing words.",
  weakStuffing: "The answer reads like a list of keywords. Explain what you did and why it mattered.",
  weakRepetitive: "The same words are repeated many times. Add new detail instead.",
  weakBrief: "The answer is relatively brief; interviewers expect deeper context.",
  weakSpecificity: "Lacks concrete metrics, KPIs, or quantitative evidence of impact.",
  weakFillers: (n: number) => `High filler word frequency (${n} fillers detected).`,
  weakFast: (wpm: number) => `Speaking pace was hurried (${wpm} WPM).`,
  improveStar: "Structure your thoughts using the STAR method: Situation → Task → Action → Result.",
  improveNumber: "Include at least one measurable KPI (e.g. 'improved user retention by 18%').",
  improveFillers: "Replace verbal fillers with a confident 1-second silent pause.",
  improveClose: "Close your answer by summarizing the key takeaway or lesson learned.",
  summary: (band: number, score: number) =>
    `Overall evaluation: ${["Needs further structured practice", "Solid foundation with actionable room for depth", "Strong, credible response"][band]}. Assessed score: ${score}/100.`,
}

const MS: typeof EN = {
  strongRelevance: "Jawapan anda kekal fokus kepada soalan yang ditanya.",
  strongClarity: "Struktur huraian tersusun dan mudah difahami.",
  strongSpecificity: "Anda memberikan contoh spesifik dengan impak yang meyakinkan.",
  strongTechnical: "Penggunaan istilah bidang anda yang relevan dan tepat.",
  strongBase: "Percubaan yang baik; asas mesej anda telah berjaya disampaikan.",
  strongTried: "Anda sudah mencuba; sekarang huraikan dalam ayat yang lengkap.",
  weakTooShort: "Jawapan terlalu pendek untuk dinilai. Jawab dalam ayat yang lengkap.",
  weakNoSentences: "Jawapan ini tidak berbentuk ayat. Terangkan dengan kata-kata sendiri, bukan senarai perkataan.",
  weakStuffing: "Jawapan berbunyi seperti senarai kata kunci. Terangkan apa yang anda buat dan kenapa ia penting.",
  weakRepetitive: "Perkataan yang sama diulang berkali-kali. Tambah butiran baharu.",
  weakBrief: "Huraian agak ringkas — penemuduga mengharapkan perincian yang lebih mendalam.",
  weakSpecificity: "Kurang contoh metrik atau angka kuantitatif untuk membuktikan hasil.",
  weakFillers: (n: number) => `Kadar perkataan 'filler' agak tinggi (${n} perkataan penampal).`,
  weakFast: (wpm: number) => `Anda bercakap terlalu laju (${wpm} patah perkataan seminit).`,
  improveStar: "Gunakan formula STAR (Situation, Task, Action, Result) secara berurutan.",
  improveNumber: "Sertakan sekurang-kurangnya satu metrik bernombor (cth: 'meningkatkan kecekapan sebanyak 25%').",
  improveFillers: "Gantikan perkataan 'um/err/macam' dengan jeda senyap (pause) 1 saat.",
  improveClose: "Akhiri jawapan dengan rumusan atau pengajaran utama.",
  summary: (band: number, score: number) =>
    `Prestasi keseluruhannya adalah ${["memerlukan latihan lanjut", "baik dengan ruang peningkatan", "cemerlang"][band]}. Skor keseluruhan dinilai pada ${score}/100.`,
}
