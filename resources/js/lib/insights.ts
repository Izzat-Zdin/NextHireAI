// Shared read helpers + cross-module logic (skill gaps, recommendation ranking).
// Used by Dashboard, Readiness Assessment, Learning Recommendation and Progress Tracking.
import { api, qs } from "@/lib/api"
import { roleSkills, skillLabel } from "@/lib/skills"
import type { InterviewSessionSummary, LearningProgressRow, LearningResource, ResumeRow } from "@/lib/types"

/** public.resume rows for the signed-in user, newest first (GET /api/resumes). */
export async function fetchResumes(_userId: string, limit = 50): Promise<ResumeRow[]> {
  return api.get<ResumeRow[]>(`/api/resumes${qs({ limit })}`)
}

/** Interview sessions with derived score/completion (VIEW interview_session_summaries), newest first. */
export async function fetchSessions(_userId: string, limit = 100): Promise<InterviewSessionSummary[]> {
  return api.get<InterviewSessionSummary[]>(`/api/interview/sessions${qs({ limit })}`)
}

/** All learning resources (the ERD has no active flag), A–Z. */
export async function fetchResources(): Promise<LearningResource[]> {
  return api.get<LearningResource[]>("/api/learning/resources")
}

export async function fetchLearningProgress(_userId: string): Promise<LearningProgressRow[]> {
  return api.get<LearningProgressRow[]>("/api/learning/progress")
}

/** Finished sessions that have at least one evaluated answer, newest first. */
export function completedSessions(sessions: InterviewSessionSummary[]) {
  return sessions
    .filter((session) => session.status === "Finish" && session.average_score !== null)
    .sort((a, b) => new Date(b.completed_at ?? b.created_at).getTime() - new Date(a.completed_at ?? a.created_at).getTime())
}

/** Best guess of the role the user is preparing for (no profile column in the ERD). */
export function inferTargetRole(input: { resumes?: ResumeRow[]; sessions?: InterviewSessionSummary[] }): string | null {
  return input.resumes?.[0]?.target_role ?? input.sessions?.[0]?.role ?? null
}

export interface SkillGap {
  tag: string
  label: string
  /** 0-100 estimated proficiency */
  score: number
  priority: "High" | "Medium" | "Low"
}

/**
 * Estimates skill gaps for a target role from the latest resume analysis and
 * interview performance (the ERD stores no profile skills or saved assessments).
 */
export function deriveSkillGaps(input: {
  targetRole?: string | null
  latestResume?: ResumeRow | null
  sessions?: InterviewSessionSummary[]
}): SkillGap[] {
  const { latestResume, sessions = [] } = input
  const role = input.targetRole || latestResume?.target_role
  const required = roleSkills(role)
  const evidence = new Set(latestResume?.detected_skills ?? [])

  const gaps: SkillGap[] = required.map((tag, index) => {
    const score = evidence.has(tag) ? 65 : latestResume ? 25 : 20
    const important = index < 3
    const priority: SkillGap["priority"] = score < 50 && important ? "High" : score < 60 ? "Medium" : "Low"
    return { tag, label: skillLabel(tag), score, priority }
  })

  const done = completedSessions(sessions)
  if (done.length) {
    const recent = done.slice(0, 3)
    const avg = recent.reduce((sum, session) => sum + Number(session.average_score), 0) / recent.length
    if (avg < 70) {
      gaps.push({ tag: "star-method", label: skillLabel("star-method"), score: Math.round(avg), priority: avg < 55 ? "High" : "Medium" })
    }
  } else {
    gaps.push({ tag: "interview-skills", label: skillLabel("interview-skills"), score: 30, priority: "Medium" })
  }

  const order = { High: 0, Medium: 1, Low: 2 }
  return gaps.filter((gap) => gap.score < 75).sort((a, b) => order[a.priority] - order[b.priority] || a.score - b.score)
}

export interface RankedResource {
  resource: LearningResource
  score: number
  reason: string
  priority: "High" | "Medium" | "Low"
  matchedGaps: string[]
}

/** Ranks learning resources by how well their skill tags close the user's gaps. */
export function rankResources(
  resources: LearningResource[],
  gaps: SkillGap[],
  targetRole?: string | null,
  progress: LearningProgressRow[] = [],
): RankedResource[] {
  const gapWeight = new Map(gaps.map((gap) => [gap.tag, gap.priority === "High" ? 5 : gap.priority === "Medium" ? 3 : 1]))
  const roleTags = new Set(roleSkills(targetRole))
  const completed = new Set(progress.filter((item) => item.status === "Completed").map((item) => item.resource_id))

  return resources
    .map((resource) => {
      const matched = resource.skill_tags.filter((tag) => gapWeight.has(tag))
      let score = matched.reduce((sum, tag) => sum + (gapWeight.get(tag) ?? 0), 0)
      const roleRelevant = resource.skill_tags.some((tag) => roleTags.has(tag))
      if (roleRelevant) score += 1
      if (completed.has(resource.resource_id)) score -= 100

      const matchedLabels = matched.map(skillLabel)
      const reason = matched.length
        ? `Builds ${matchedLabels.slice(0, 2).join(" & ")} — ${matched.some((tag) => gapWeight.get(tag) === 5) ? "a priority gap" : "an identified gap"}`
        : roleRelevant && targetRole
          ? `Relevant for ${targetRole} candidates`
          : `Builds ${resource.skill_name || "general career skills"}`
      const priority: RankedResource["priority"] = score >= 5 ? "High" : score >= 2.5 ? "Medium" : "Low"
      return { resource, score, reason, priority, matchedGaps: matched }
    })
    .sort((a, b) => b.score - a.score)
}

/** Groups numeric points by month (last `months` months) → average per month. */
export function monthlyTrend(points: { date: string; value: number }[], months = 6) {
  const now = new Date()
  const buckets: { key: string; label: string; values: number[] }[] = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString("en-MY", { month: "short" }),
      values: [],
    })
  }
  for (const point of points) {
    const d = new Date(point.date)
    const bucket = buckets.find((item) => item.key === `${d.getFullYear()}-${d.getMonth()}`)
    if (bucket) bucket.values.push(point.value)
  }
  const filled = buckets.filter((bucket) => bucket.values.length)
  return {
    labels: filled.map((bucket) => bucket.label),
    values: filled.map((bucket) => Math.round(bucket.values.reduce((s, v) => s + v, 0) / bucket.values.length)),
  }
}
