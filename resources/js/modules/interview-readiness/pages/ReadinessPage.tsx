import { useCallback, useEffect, useState } from "react"
import { Alert, LoadingState, PageIntro } from "@/components/ui"
import { errorMessage } from "@/lib/format"
import { completedSessions, fetchLearningProgress, fetchResumes, fetchSessions, inferTargetRole } from "@/lib/insights"
import { TARGET_ROLES } from "@/lib/skills"
import type { InterviewSessionSummary, LearningProgressRow, ResumeRow } from "@/lib/types"
import { useAuth } from "@/modules/user-management/context/AuthContext"
import { AssessmentResultView } from "../components/AssessmentResultView"
import { AssessmentWizard } from "../components/AssessmentWizard"
import { computeReadiness, type AssessmentResult } from "../services/assessmentEngine"
import { moduleLabel } from "@/components/navigation"

interface Data {
  resumes: ResumeRow[]
  sessions: InterviewSessionSummary[]
  learning: LearningProgressRow[]
}

export default function ReadinessPage() {
  const { profile } = useAuth()
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState<string | null>(null)
  // The ERD has no readiness table: the result lives in page state only.
  const [result, setResult] = useState<AssessmentResult | null>(null)
  const [mode, setMode] = useState<"wizard" | "result">("wizard")

  const load = useCallback(async () => {
    if (!profile) return
    try {
      const [resumes, sessions, learning] = await Promise.all([
        fetchResumes(profile.user_id),
        fetchSessions(profile.user_id),
        fetchLearningProgress(profile.user_id),
      ])
      setData({ resumes, sessions, learning })
    } catch (err) {
      setError(errorMessage(err))
    }
  }, [profile])

  useEffect(() => {
    void load()
  }, [load])

  if (!profile) return null
  if (!data) return error ? <Alert tone="error">{error}</Alert> : <LoadingState label="Loading readiness data…" />

  const inferred = inferTargetRole({ resumes: data.resumes, sessions: data.sessions })
  const defaultRole = result?.target_role ?? (inferred && TARGET_ROLES.includes(inferred) ? inferred : TARGET_ROLES[0])

  const submit = (role: string, ratings: Record<string, number>) => {
    setError(null)
    try {
      const output = computeReadiness({ role, ratings, resumes: data.resumes, sessions: data.sessions, learning: data.learning })
      setResult({ ...output, target_role: role, assessed_at: new Date().toISOString() })
      setMode("result")
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const showResult = mode === "result" && result

  return (
    <>
      <PageIntro
        eyebrow={moduleLabel(4)}
        title={showResult ? "Your career readiness" : "Measure your career readiness"}
        description={
          showResult
            ? "See how ready you are for your target role, where you are strong, and exactly what to work on next."
            : "A short self-assessment combined with your resume, mock interview and learning evidence."
        }
      />
      {error && <Alert tone="error" onClose={() => setError(null)}>{error}</Alert>}

      {showResult ? (
        <AssessmentResultView assessment={result} candidateName={profile.full_name || profile.email} onRetake={() => setMode("wizard")} />
      ) : (
        <AssessmentWizard
          key={result?.assessed_at ?? "first"}
          defaultRole={defaultRole}
          onCancel={result ? () => setMode("result") : undefined}
          onSubmit={submit}
          evidence={{
            resumeScore: data.resumes[0] ? Math.round(Number(data.resumes[0].overall_score)) : null,
            interviewCount: completedSessions(data.sessions).length,
            learningCompleted: data.learning.filter((item) => item.status === "Completed").length,
          }}
        />
      )}
    </>
  )
}
