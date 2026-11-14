import { useEffect, useState, useRef } from "react"
import { usePage } from "@inertiajs/react"
import { useNavigate, useSearchParams } from "@/lib/router"
import { Alert } from "@/components/ui"
import { errorMessage } from "@/lib/format"
import { fetchResumes, fetchSessions } from "@/lib/insights"
import type { InterviewSessionSummary } from "@/lib/types"
import { useAuth } from "@/modules/user-management/context/AuthContext"
import { isTestAccountEmail } from "@/modules/user-management/services/authService"
import type { AnswerRecord, Difficulty, InterviewType, Language, Persona, QuestionItem, ResumeContext, SetupConfig } from "./types"
import { SetupPage } from "./components/setup/SetupPage"
import { InterviewRoom } from "./components/room/InterviewRoom"
import { ReportView } from "./components/ReportView"
import { getQuestionsForSession } from "./services/questions"
import {
  cancelSession,
  completeSession,
  createSession,
  pauseSession,
  resumeSession,
  saveAnswer,
  transcribeForFillers,
  type CreatedSession,
  type ResumeData,
} from "./services/interviewService"
import { evaluateAnswerLocally } from "./services/evaluation"
import { analyzeTranscript } from "./services/speechAnalysis"
import { SKIPPED_ANSWER_TEXT } from "./services/answerStatus"

const DEFAULT_CONFIG: SetupConfig = {
  role: "",
  type: "behavioral",
  difficulty: "Medium",
  questionCount: 5,
  language: "en-MY",
  persona: "friendly",
  source: "none",
  jobAdText: "",
}

/** Difficulty and question count have no database column, so the last choice is kept in this browser. */
const LOCAL_KEY = "nexthire-last-interview-setup"
const DB_TYPE_TO_UI: Record<string, InterviewType> = { HR: "hr", Tech: "technical", Behaviour: "behavioral" }

function readLocalSetup(): { difficulty?: Difficulty; questionCount?: number } {
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return {
      difficulty: ["Easy", "Medium", "Hard"].includes(parsed?.difficulty) ? parsed.difficulty : undefined,
      questionCount: [3, 5, 8].includes(parsed?.questionCount) ? parsed.questionCount : undefined,
    }
  } catch {
    return {}
  }
}

/**
 * Rebuilds the room state of a saved session: its setup, its questions, and the answers already given
 * (re-scored in the browser from the saved text so the report can show them), starting at the first
 * unanswered question.
 */
function restoreSession(data: ResumeData) {
  const type = DB_TYPE_TO_UI[data.session.interview_type] ?? DEFAULT_CONFIG.type
  const language: Language = data.session.language === "Malay" ? "ms-MY" : "en-MY"
  const role = data.session.role === "General" ? "" : data.session.role
  const config: SetupConfig = {
    ...DEFAULT_CONFIG,
    role,
    type,
    language,
    persona: (["friendly", "strict", "neutral"] as Persona[]).includes(data.session.persona as Persona)
      ? (data.session.persona as Persona)
      : DEFAULT_CONFIG.persona,
    questionCount: data.questions.length,
  }
  const questions: QuestionItem[] = data.questions.map((q) => ({
    id: q.question_id,
    number: q.question_no,
    text: q.question_text,
    type: DB_TYPE_TO_UI[q.question_type] ?? type,
    role,
    difficulty: config.difficulty,
  }))
  const answers: Record<string, AnswerRecord> = {}
  for (const saved of data.answers) {
    const question = questions.find((q) => q.id === saved.question_id)
    if (!question) continue
    const text = saved.answer_text ?? ""
    const spoken = saved.answer_method !== "Text"
    const metrics = text ? analyzeTranscript(text, null, spoken ? saved.silence_count : null) : null
    if (metrics && spoken && saved.speaking_rate) metrics.speakingRateWordsPerMinute = Math.round(saved.speaking_rate)
    answers[question.id] = {
      questionId: question.id,
      questionNumber: question.number,
      questionText: question.text,
      answerText: text || SKIPPED_ANSWER_TEXT,
      durationSeconds: 0,
      mediaKind: saved.answer_method === "Video" ? "video" : spoken ? "audio" : null,
      attempts: saved.attempt_no,
      evaluation: text
        ? evaluateAnswerLocally({ question: question.text, answer: text, type: question.type, role, speechMetrics: metrics, isMalay: language === "ms-MY" })
        : null,
    }
  }
  const firstOpen = questions.findIndex((q) => !answers[q.id])
  return {
    config,
    questions,
    answers,
    index: firstOpen === -1 ? questions.length - 1 : firstOpen,
    created: {
      sessionId: data.session.session_id,
      questionIds: Object.fromEntries(data.questions.map((q) => [q.question_no, q.question_id])),
    } satisfies CreatedSession,
  }
}

function writeLocalSetup(config: SetupConfig) {
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify({ difficulty: config.difficulty, questionCount: config.questionCount }))
  } catch {
    /* storage unavailable: Repeat last setup falls back to defaults for these two */
  }
}

export function MockInterviewModule() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [phase, setPhase] = useState<"setup" | "room" | "report">("setup")
  const [config, setConfig] = useState<SetupConfig>(DEFAULT_CONFIG)
  const [questions, setQuestions] = useState<QuestionItem[]>([])
  const [answers, setAnswers] = useState<Record<string, AnswerRecord>>({})
  const [overallScore, setOverallScore] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveWarning, setSaveWarning] = useState<string | null>(null)
  const [resume, setResume] = useState<ResumeContext | null | undefined>(undefined)
  const [lastSession, setLastSession] = useState<InterviewSessionSummary | null>(null)
  const [startWithCamera, setStartWithCamera] = useState(false)
  const [startIndex, setStartIndex] = useState(0)
  const sessionRef = useRef<CreatedSession | null>(null)
  /** Question ids whose answer reached the server; the rest are sent again when the session finishes. */
  const savedIds = useRef<Set<string>>(new Set())
  const [searchParams] = useSearchParams()
  const continueId = searchParams.get("continue")
  const fillerTranscription = Boolean((usePage().props as { features?: { fillerTranscription?: boolean } }).features?.fillerTranscription)

  const userId = profile?.user_id
  // The demo accounts (Ali Test, Admin Test) get a suggested answer for every question (see SuggestedAnswer).
  const isTestAccount = isTestAccountEmail(profile?.email)
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    fetchSessions(userId, 1)
      .then(([latest]) => !cancelled && setLastSession(latest ?? null))
      .catch(() => {})
    fetchResumes(userId, 1)
      .then(([latest]) => {
        if (cancelled) return
        setResume(
          latest
            ? {
                fileName: latest.file_name,
                score: Number(latest.overall_score) || 0,
                targetRole: latest.target_role ?? "",
                skills: latest.detected_skills ?? [],
              }
            : null,
        )
      })
      .catch(() => !cancelled && setResume(null))
    return () => {
      cancelled = true
    }
  }, [userId])

  // "Continue" from the history page: reopen the saved session at its first unanswered question.
  const continuedFor = useRef<string | null>(null)
  useEffect(() => {
    if (!continueId || continuedFor.current === continueId) return
    continuedFor.current = continueId
    setLoading(true)
    setError(null)
    resumeSession(continueId)
      .then((data) => {
        const restored = restoreSession(data)
        sessionRef.current = restored.created
        savedIds.current = new Set(Object.keys(restored.answers))
        setConfig(restored.config)
        setQuestions(restored.questions)
        setAnswers(restored.answers)
        setStartIndex(restored.index)
        setStartWithCamera(false)
        setPhase("room")
      })
      .catch((err) => setError(`Could not continue the session: ${errorMessage(err)}`))
      .finally(() => setLoading(false))
    // The ?continue= parameter stays in the address bar on purpose: reloading the page continues the same
    // session again. continuedFor stops it from reopening after the session is finished or left.
  }, [continueId])

  const repeatLastSetup = () => {
    if (!lastSession) return
    const local = readLocalSetup()
    setConfig({
      ...DEFAULT_CONFIG,
      role: lastSession.role === "General" ? "" : lastSession.role,
      type: DB_TYPE_TO_UI[lastSession.interview_type] ?? DEFAULT_CONFIG.type,
      language: lastSession.language === "Malay" ? "ms-MY" : "en-MY",
      persona: (["friendly", "strict", "neutral"] as Persona[]).includes(lastSession.persona as Persona)
        ? (lastSession.persona as Persona)
        : DEFAULT_CONFIG.persona,
      difficulty: local.difficulty ?? DEFAULT_CONFIG.difficulty,
      questionCount: local.questionCount ?? DEFAULT_CONFIG.questionCount,
    })
  }

  const handleStart = async ({ cameraOn }: { cameraOn: boolean }) => {
    if (!profile) return
    setLoading(true)
    setError(null)
    setSaveWarning(null)
    const sessionQuestions = getQuestionsForSession({
      role: config.role,
      type: config.type,
      count: config.questionCount,
      language: config.language,
      difficulty: config.difficulty,
      source: config.source,
      resume: config.source === "resume" ? resume : null,
      jobAdText: config.source === "jobAd" ? config.jobAdText : "",
    })
    try {
      sessionRef.current = await createSession(profile.user_id, config, sessionQuestions)
      savedIds.current = new Set()
      writeLocalSetup(config)
      setQuestions(sessionQuestions)
      setAnswers({})
      setStartIndex(0)
      setStartWithCamera(cameraOn)
      setPhase("room")
    } catch (err) {
      setError(`Could not start the session: ${errorMessage(err)}`)
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = async (completed: Record<string, AnswerRecord>, finalScore: number) => {
    setAnswers(completed)
    setOverallScore(finalScore)
    if (profile && sessionRef.current) {
      try {
        await completeSession({ created: sessionRef.current, answers: completed, savedIds: savedIds.current })
      } catch (err) {
        setSaveWarning(`Your report is shown below, but saving to your history failed: ${errorMessage(err)}`)
      }
    }
    setPhase("report")
  }

  const handleExit = () => {
    if (sessionRef.current) void cancelSession(sessionRef.current.sessionId)
    sessionRef.current = null
    setPhase("setup")
  }

  /** Saves each main answer as soon as it is submitted. A failed save is retried when the session finishes. */
  const handleAnswerSubmitted = (record: AnswerRecord) => {
    const created = sessionRef.current
    if (!created) return
    savedIds.current.delete(record.questionId)
    saveAnswer(created, record)
      .then(() => savedIds.current.add(record.questionId))
      .catch(() => {})
  }

  const handleSaveForLater = async () => {
    const created = sessionRef.current
    sessionRef.current = null
    if (created) {
      try {
        await pauseSession(created.sessionId)
      } catch {
        /* the session stays Active, which history also offers to continue */
      }
    }
    navigate("/interview/history")
  }

  if (phase === "room") {
    return (
      <InterviewRoom
        config={config}
        questions={questions}
        startWithCamera={startWithCamera}
        onFinishSession={handleFinish}
        onExit={handleExit}
        suggestAnswers={isTestAccount}
        initialAnswers={answers}
        initialIndex={startIndex}
        onAnswerSubmitted={handleAnswerSubmitted}
        onSaveForLater={() => void handleSaveForLater()}
        transcribeFillers={fillerTranscription ? (audio) => transcribeForFillers(audio, config.language) : undefined}
      />
    )
  }

  if (phase === "report") {
    return (
      <>
        {saveWarning && <Alert tone="error">{saveWarning}</Alert>}
        <ReportView
          config={config}
          answers={answers}
          overallScore={overallScore}
          onPracticeAgain={() => {
            sessionRef.current = null
            setAnswers({})
            setPhase("setup")
          }}
          onNavigateTab={(tab) => navigate(`/${tab}`)}
        />
      </>
    )
  }

  return (
    <>
      {error && <Alert tone="error" onClose={() => setError(null)}>{error}</Alert>}
      <SetupPage
        config={config}
        onChange={setConfig}
        onStart={handleStart}
        loading={loading}
        resume={resume}
        canRepeat={Boolean(lastSession)}
        onRepeat={repeatLastSetup}
      />
    </>
  )
}

export default MockInterviewModule
