// Persistence for the AI Mock Interview Engine via the Laravel API (project ERD tables).
// The browser scores each answer instantly (services/evaluation.ts); the server recomputes and stores the score
// (app/Services/Interview/AnswerEvaluator.php). Each answer is saved as soon as it is submitted.
import { api } from "@/lib/api"
import type {
  AnswerEvaluationRow,
  AudioAnalysisRow,
  InterviewLanguageDb,
  InterviewSessionSummary,
  InterviewTypeDb,
  ReportRow,
} from "@/lib/types"
import type { AnswerRecord, InterviewType, Language, QuestionItem, SetupConfig } from "../types"
import { isSkippedAnswer as isSkipped } from "./answerStatus"

export interface CreatedSession {
  sessionId: string
  /** question_no → question_id */
  questionIds: Record<number, string>
}

/** UI interview type → interview_sessions.interview_type */
const TYPE_TO_DB: Record<InterviewType, InterviewTypeDb> = { hr: "HR", technical: "Tech", behavioral: "Behaviour" }

/** UI speech-recognition locale → interview_sessions.language */
const toDbLanguage = (language: Language): InterviewLanguageDb => (language === "ms-MY" ? "Malay" : "BI")

export async function createSession(_userId: string, config: SetupConfig, questions: QuestionItem[]): Promise<CreatedSession> {
  const result = await api.post<{ session_id: string; questions: { question_id: string; question_no: number }[] }>("/api/interview/sessions", {
    role: config.role.trim() || "General",
    interview_type: TYPE_TO_DB[config.type],
    language: toDbLanguage(config.language),
    persona: config.persona,
    questions: questions.map((question) => ({
      question_no: question.number,
      question_text: question.text,
      question_type: TYPE_TO_DB[question.type],
    })),
  })
  return {
    sessionId: result.session_id,
    questionIds: Object.fromEntries(result.questions.map((row) => [row.question_no, row.question_id])),
  }
}

/** Marks a running or paused session as cancelled (user discarded it). */
export async function cancelSession(sessionId: string) {
  await api.post(`/api/interview/sessions/${sessionId}/cancel`)
}

/** Marks a running session as paused so it can be continued from the history page. */
export async function pauseSession(sessionId: string) {
  await api.post(`/api/interview/sessions/${sessionId}/pause`)
}

/** The answer fields the server stores. It recomputes the score itself, so no score or feedback is sent. */
function answerPayload(created: CreatedSession, record: AnswerRecord) {
  const questionId = created.questionIds[record.questionNumber]
  if (!questionId) return null
  const skipped = isSkipped(record)
  const metrics = record.evaluation?.speechMetrics
  return {
    question_id: questionId,
    answer_text: skipped ? null : record.answerText,
    answer_method: record.mediaKind === "video" ? "Video" : record.mediaKind === "audio" || record.audioBlobUrl ? "Audio" : "Text",
    attempt_no: Math.max(1, record.attempts ?? (record.retried ? 2 : 1)),
    audio:
      metrics && !skipped
        ? {
            speaking_rate: metrics.speakingRateWordsPerMinute,
            filler_total: metrics.fillerAnalysis.total,
            silence_count: metrics.longPauses ?? null,
          }
        : null,
    facial:
      record.evaluation?.facialMetrics && !skipped
        ? {
            dominant_expression: record.evaluation.facialMetrics.dominantExpression,
            nervous_percent: record.evaluation.facialMetrics.nervousPercent,
            confidence_score: Math.max(0, 100 - record.evaluation.facialMetrics.nervousPercent),
            raw_metrics: { source: "browser-hud" },
          }
        : null,
  }
}

/** Saves one submitted answer right away, so a closed tab or a paused session keeps it. Returns the stored score. */
export async function saveAnswer(created: CreatedSession, record: AnswerRecord): Promise<number | null> {
  const payload = answerPayload(created, record)
  if (!payload) return null
  const result = await api.post<{ answer_id: string; overall_score: number | null }>(
    `/api/interview/sessions/${created.sessionId}/answers`,
    payload,
  )
  return result.overall_score
}

/**
 * Finishes the session. Answers already saved one by one are sent again only if their save failed
 * (unsaved), plus the skipped questions; the server writes the report from the stored scores.
 */
export async function completeSession(input: { created: CreatedSession; answers: Record<string, AnswerRecord>; savedIds?: Set<string> }) {
  const { created, answers, savedIds } = input
  const payloadAnswers = Object.values(answers)
    .sort((a, b) => a.questionNumber - b.questionNumber)
    .filter((record) => !savedIds?.has(record.questionId))
    .map((record) => answerPayload(created, record))
    .filter(Boolean)
  await api.post(`/api/interview/sessions/${created.sessionId}/finish`, { answers: payloadAnswers })
}

export interface ResumeData {
  session: { session_id: string; role: string; interview_type: InterviewTypeDb; language: InterviewLanguageDb; persona: string; status: string }
  questions: { question_id: string; question_no: number; question_text: string; question_type: InterviewTypeDb }[]
  answers: {
    question_id: string
    answer_text: string | null
    answer_method: "Text" | "Audio" | "Video"
    attempt_no: number
    overall_score: number | null
    speaking_rate: number | null
    silence_count: number | null
    filler_total: number | null
  }[]
}

/** Reopens a paused or interrupted session (status back to Active) and returns its questions and saved answers. */
export async function resumeSession(sessionId: string) {
  return api.post<ResumeData>(`/api/interview/sessions/${sessionId}/resume`)
}

export async function deleteSession(sessionId: string) {
  await api.delete(`/api/interview/sessions/${sessionId}`)
}

type EvaluationDetail = Pick<AnswerEvaluationRow, "overall_score" | "strengths" | "weaknesses" | "improvements" | "ai_source">
type AudioDetail = Pick<AudioAnalysisRow, "word_count" | "speaking_rate" | "filler_total">

export interface SessionDetail {
  /** Row from the interview_session_summaries view (includes derived score and counts). */
  session: InterviewSessionSummary
  report: Pick<ReportRow, "strengths_summary" | "weaknesses_summary" | "generated_at"> | null
  items: {
    questionNo: number
    question: string
    answer: string | null
    evaluation: EvaluationDetail | null
    audio: AudioDetail | null
  }[]
}

export async function getSessionDetail(sessionId: string): Promise<SessionDetail | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId)) return null
  return api.getOrNull<SessionDetail>(`/api/interview/sessions/${sessionId}`)
}

/** Transcript of one spoken answer from a filler-aware transcriber (server side), used only to count "um"/"uh". */
export async function transcribeForFillers(audio: Blob, language: Language): Promise<string> {
  const form = new FormData()
  form.append("audio", audio, "answer.webm")
  form.append("language", language === "ms-MY" ? "ms" : "en")
  const result = await api.postForm<{ transcript: string }>("/api/interview/transcribe", form)
  return result.transcript ?? ""
}
