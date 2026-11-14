export type InterviewType = "hr" | "behavioral" | "technical"

export type Difficulty = "Easy" | "Medium" | "Hard"

/** Stored in interview_sessions.persona: friendly = Aisyah, strict = Encik Faiz, neutral = Ms. Mei Ling */
export type Persona = "neutral" | "friendly" | "strict"

/** Session language. English sessions recognise speech as en-MY (falling back to en-US). */
export type Language = "en-US" | "en-MY" | "ms-MY"

/** Optional extra source for questions (rule-based, no AI). */
export type QuestionSource = "none" | "resume" | "jobAd"

export interface SetupConfig {
  /** Empty string = general questions for the chosen type (saved as "General"). */
  role: string
  type: InterviewType
  difficulty: Difficulty
  questionCount: number
  language: Language
  persona: Persona
  source: QuestionSource
  /** Pasted job ad text. Used only to pick questions for this session; never saved. */
  jobAdText: string
}

/** The parts of the user's latest analysed resume used for resume-based questions. */
export interface ResumeContext {
  fileName: string
  score: number
  targetRole: string
  skills: string[]
}

export interface QuestionItem {
  id: string
  number: number
  text: string
  type: InterviewType
  role: string
  difficulty: Difficulty
  /** Where the question came from (bank, a resume template or a job-ad template). */
  source?: "bank" | "resume" | "jobAd"
}

export interface RubricScores {
  relevance: number
  clarity: number
  specificity: number
  technicalAccuracy: number
}

export interface SpeechMetrics {
  wordCount: number
  durationSeconds: number
  speakingRateWordsPerMinute: number | null
  fillerAnalysis: {
    total: number
    perWord: Record<string, number>
    ratePer100Words: number
  }
  /** Gaps of 3 s or more between recognised phrases (spoken answers only). */
  longPauses?: number | null
}

export interface FacialMetrics {
  nervousPercent: number
  dominantExpression: string
}

export interface EvaluationResult {
  scores: RubricScores
  overallScore: number
  strengths: string[]
  weaknesses: string[]
  improvements: string[]
  exampleAnswer: string
  summary: string
  speechMetrics?: SpeechMetrics
  facialMetrics?: FacialMetrics
}

export interface AnswerRecord {
  questionId: string
  questionNumber: number
  questionText: string
  answerText: string
  audioBlobUrl?: string | null
  mediaFileName?: string | null
  /** kind of recorded/uploaded media, used for interview_answers.answer_method */
  mediaKind?: "audio" | "video" | null
  durationSeconds: number
  evaluation?: EvaluationResult | null
  /** How many tries the submitted answer took (answer_attempts.attempt_no). */
  attempts?: number
  /** @deprecated use attempts */
  retried?: boolean
  followUpQuestion?: string | null
  followUpAnswer?: string | null
}

export interface InterviewSessionData {
  id: string
  startedAt: string
  completedAt?: string
  config: SetupConfig
  questions: QuestionItem[]
  answers: Record<string, AnswerRecord>
  overallScore?: number
}
