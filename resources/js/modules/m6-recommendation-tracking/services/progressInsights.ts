// Pure helpers that turn the user's real data into progress insights:
// period filtering, skills development, next-step recommendations and an activity feed.
import { completedSessions, deriveSkillGaps, inferTargetRole, rankResources } from "@/lib/insights"
import { roleSkills, skillLabel } from "@/lib/skills"
import type { InterviewSessionSummary, InterviewTypeDb, LearningProgressRow, LearningResource, ResumeRow } from "@/lib/types"

const DAY = 24 * 60 * 60 * 1000

export const time = (value?: string | null) => (value ? new Date(value).getTime() : 0)

export function periodStart(months: number) {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() - months, now.getDate()).getTime()
}

export function withinPeriod<T>(rows: T[], dateOf: (row: T) => string | null | undefined, months: number) {
  const start = periodStart(months)
  return rows.filter((row) => time(dateOf(row)) >= start)
}

export function sortNewest<T>(rows: T[], dateOf: (row: T) => string | null | undefined) {
  return [...rows].sort((a, b) => time(dateOf(b)) - time(dateOf(a)))
}

/** When a resume analysis happened. */
export const resumeDate = (row: ResumeRow) => row.analyzed_at ?? row.uploaded_at

/** When an interview session finished (report generated), or started if unfinished. */
export const sessionDate = (row: InterviewSessionSummary) => row.completed_at ?? row.created_at

/**
 * learning_progress only records completed_at, so only completions can be placed in a period.
 * Not Started / In Progress rows reflect the current state and are always included.
 */
export function learningInPeriod(progress: LearningProgressRow[], months: number) {
  const start = periodStart(months)
  return progress.filter((item) => item.status !== "Completed" || time(item.completed_at) >= start)
}

export type SkillStatus = "gained" | "lost" | "missing" | "kept"

export interface SkillChange {
  tag: string
  label: string
  before: boolean
  after: boolean
  status: SkillStatus
}

/**
 * Compares the target role's required skills against the detected_skills of the
 * earliest and latest resume analyses (pass the same resume twice for a single snapshot).
 */
export function skillChanges(targetRole: string | null, earliest: ResumeRow, latest: ResumeRow): SkillChange[] {
  const before = new Set(earliest.detected_skills ?? [])
  const after = new Set(latest.detected_skills ?? [])
  const order: Record<SkillStatus, number> = { gained: 0, lost: 1, missing: 2, kept: 3 }
  return roleSkills(targetRole)
    .map((tag) => {
      const had = before.has(tag)
      const has = after.has(tag)
      const status: SkillStatus = has ? (had ? "kept" : "gained") : had ? "lost" : "missing"
      return { tag, label: skillLabel(tag), before: had, after: has, status }
    })
    .sort((a, b) => order[a.status] - order[b.status])
}

export type StepKind = "resume" | "interview" | "assessment" | "learning"

export interface NextStep {
  kind: StepKind
  title: string
  text: string
  to: string
  cta: string
}

export function nextSteps(input: {
  resumes: ResumeRow[]
  sessions: InterviewSessionSummary[]
  progress: LearningProgressRow[]
  resources: LearningResource[]
}): NextStep[] {
  const { progress, resources } = input
  const resumes = sortNewest(input.resumes, resumeDate)
  const sessions = sortNewest(input.sessions, (row) => row.created_at)
  const steps: NextStep[] = []

  if (!resumes.length) {
    steps.push({
      kind: "resume",
      title: "Analyse your resume",
      text: "Upload your resume to get an ATS score, keyword gaps and improvement tips.",
      to: "/resume",
      cta: "Analyse resume",
    })
  }

  const lastInterview = completedSessions(sessions)[0]
  if (!lastInterview || Date.now() - time(sessionDate(lastInterview)) > 14 * DAY) {
    steps.push({
      kind: "interview",
      title: lastInterview ? "Keep your interview skills sharp" : "Practise your first mock interview",
      text: lastInterview
        ? "You haven't completed a mock interview in the last 14 days. A short session keeps answers fresh."
        : "Run an AI mock interview to get feedback on your answers, delivery and structure.",
      to: "/interview",
      cta: "Start practice",
    })
  }

  steps.push({
    kind: "assessment",
    title: "Check your career readiness",
    text: "Get a live readiness score and skill-gap breakdown built from your latest resume and interviews.",
    to: "/assessment",
    cta: "Check readiness",
  })

  const targetRole = inferTargetRole({ resumes, sessions })
  const gaps = deriveSkillGaps({ targetRole, latestResume: resumes[0] ?? null, sessions })
  const top = rankResources(resources, gaps, targetRole, progress).find((item) => item.score > 0)
  if (top) {
    const inProgress = progress.find((item) => item.resource_id === top.resource.resource_id)?.status === "In Progress"
    steps.push({
      kind: "learning",
      title: inProgress ? `Continue: ${top.resource.title}` : top.resource.title,
      text: top.reason,
      to: `/learning/${top.resource.resource_id}`,
      cta: inProgress ? "Continue learning" : "View resource",
    })
  }

  return steps
}

export type ActivityKind = "interview" | "resume" | "learning"

export interface ActivityItem {
  id: string
  kind: ActivityKind
  title: string
  detail: string
  date: string
}

const TYPE_LABEL: Record<InterviewTypeDb, string> = {
  HR: "an HR",
  Tech: "a technical",
  Behaviour: "a behavioural",
}

export function recentActivity(input: {
  sessions: InterviewSessionSummary[]
  resumes: ResumeRow[]
  progress: LearningProgressRow[]
  resources: LearningResource[]
  limit?: number
}): ActivityItem[] {
  const titles = new Map(input.resources.map((resource) => [resource.resource_id, resource.title]))
  const items: ActivityItem[] = [
    ...input.sessions
      .filter((session) => session.status !== "Cancel")
      .map((session) => {
        const finished = session.status === "Finish"
        const label = TYPE_LABEL[session.interview_type] ?? "a mock"
        return {
          id: `s-${session.session_id}`,
          kind: "interview" as const,
          title: finished ? `Completed ${label} interview` : `Started ${label} interview`,
          detail:
            finished && session.average_score !== null
              ? `${session.role} · scored ${Math.round(Number(session.average_score))}/100`
              : `${session.role} · ${session.status === "Pause" ? "paused" : finished ? "completed" : "in progress"}`,
          date: sessionDate(session),
        }
      }),
    ...input.resumes.map((resume) => ({
      id: `r-${resume.analysis_id}`,
      kind: "resume" as const,
      title: "Analysed a resume",
      detail: `${resume.file_name} · scored ${Math.round(resume.overall_score)}/100`,
      date: resumeDate(resume),
    })),
    ...input.progress
      .filter((item) => item.status === "Completed" && item.completed_at)
      .map((item) => ({
        id: `l-${item.progress_id}`,
        kind: "learning" as const,
        title: "Completed a learning resource",
        detail: titles.get(item.resource_id) ?? "Learning resource",
        date: item.completed_at as string,
      })),
  ]
  return sortNewest(items, (item) => item.date).slice(0, input.limit ?? 8)
}
