// Row types that mirror the database after
// supabase/migrations/20261110000001_align_with_erd.sql (project ERD, 12 tables).

export type UserRole = "user" | "admin"
export type UserStatus = "active" | "inactive"

/** public.users — passwords live (hashed) in Supabase Auth, not here. */
export interface UserProfile {
  user_id: string
  full_name: string
  email: string
  status: UserStatus
  role: UserRole
  created_at: string
  updated_at: string | null
}

// ---------------------------------------------------------------- resume
export interface ResumeSuggestion {
  title: string
  detail: string
  priority: "High" | "Medium" | "Low"
}
export interface ResumeScores {
  ats: number
  keywords: number
  impact: number
  structure: number
  clarity: number
}

/** public.resume — ERD columns + approved analysis detail columns. */
export interface ResumeRow {
  analysis_id: string
  user_id: string
  file_path: string | null
  overall_score: number
  feedback: string | null
  uploaded_at: string
  analyzed_at: string
  // approved extras (analysis detail)
  file_name: string
  file_size: number | null
  target_role: string
  job_description: string | null
  extracted_text: string | null
  scores: ResumeScores
  detected_skills: string[]
  matched_keywords: string[]
  missing_keywords: string[]
  sections: Record<string, boolean>
  strengths: string[]
  weaknesses: string[]
  suggestions: ResumeSuggestion[]
  summary: string | null
}

// ------------------------------------------------------------- interview
export type InterviewTypeDb = "HR" | "Tech" | "Behaviour"
export type InterviewLanguageDb = "BI" | "Malay"
export type SessionStatus = "Active" | "Pause" | "Cancel" | "Finish"
export type AnswerMethod = "Text" | "Audio" | "Video"
export type AiSource = "GPT" | "Gemini" | "Claude" | "Rule-based" | "Other"

/** public.interview_sessions */
export interface InterviewSessionRow {
  session_id: string
  user_id: string
  role: string
  interview_type: InterviewTypeDb
  language: InterviewLanguageDb
  persona: "neutral" | "friendly" | "strict"
  status: SessionStatus
  created_at: string
}

/** public.interview_session_summaries (read-only VIEW over the ERD tables). */
export interface InterviewSessionSummary extends InterviewSessionRow {
  /** reports.generated_at — null until the session is finished */
  completed_at: string | null
  question_count: number
  answered_count: number
  /** average of answer_evaluations.overall_score — null when nothing was evaluated */
  average_score: number | null
}

/** public.interview_questions */
export interface InterviewQuestionRow {
  question_id: string
  session_id: string
  question_no: number
  question_text: string
  question_type: string
  created_at: string
}

/** public.interview_answers */
export interface InterviewAnswerRow {
  answer_id: string
  session_id: string
  question_id: string
  answer_text: string | null
  answer_method: AnswerMethod
  file_path: string | null
  created_at: string
}

/** public.answer_evaluations */
export interface AnswerEvaluationRow {
  evaluation_id: string
  answer_id: string
  overall_score: number
  strengths: string | null
  weaknesses: string | null
  improvements: string | null
  ai_source: AiSource
  created_at: string
}

/** public.audio_analyses */
export interface AudioAnalysisRow {
  audio_id: string
  answer_id: string
  transcript: string | null
  word_count: number | null
  speaking_rate: number | null
  filler_total: number | null
  silence_count: number | null
  created_at: string
}

/** public.facial_analyses */
export interface FacialAnalysisRow {
  facial_analysis_id: string
  answer_id: string
  dominant_expression: string | null
  nervous_percent: number | null
  confidence_score: number | null
  eye_contact_score: number | null
  raw_metrics: Record<string, unknown> | null
  created_at: string
}

/** public.answer_attempts */
export interface AnswerAttemptRow {
  attempt_id: string
  question_id: string
  answer_id: string
  attempt_no: number
  attempted_at: string
}

/** public.reports */
export interface ReportRow {
  report_id: string
  session_id: string
  strengths_summary: string | null
  weaknesses_summary: string | null
  pdf_path: string | null
  generated_at: string
}

// -------------------------------------------------------------- learning
export type ResourceType = "Course" | "Tutorial" | "Project" | "Cert" | "Article" | "Video" | "Practice"

/** public.learning_resources — ERD columns + approved skill_tags. */
export interface LearningResource {
  resource_id: string
  title: string
  resource_type: ResourceType
  skill_name: string
  resource_url: string | null
  /** approved extra: taxonomy tags used to match resources to skill gaps */
  skill_tags: string[]
}

export type LearningStatus = "Not Started" | "In Progress" | "Completed"

/** public.learning_progress */
export interface LearningProgressRow {
  progress_id: string
  user_id: string
  resource_id: string
  status: LearningStatus
  progress_percent: number
  completed_at: string | null
}

// ------------------------------------------------- readiness (not stored)
/** Readiness is computed live in the browser; the ERD has no table for it. */
export interface ReadinessGap {
  skill: string
  tag: string
  score: number
  priority: "High" | "Medium" | "Low"
}
export type ReadinessLevel = "not_ready" | "developing" | "ready" | "highly_ready"
