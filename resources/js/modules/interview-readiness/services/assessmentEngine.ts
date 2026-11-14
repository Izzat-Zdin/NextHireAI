// Rule-based Career Readiness engine. Combines real evidence (resume analyses,
// mock interviews, learning progress) with the candidate's self-assessment.
// The ERD has no readiness table, so results are computed live and never stored.
import { average, clamp } from "@/lib/format"
import { completedSessions } from "@/lib/insights"
import { roleSkills, skillLabel } from "@/lib/skills"
import type { InterviewSessionSummary, LearningProgressRow, ReadinessGap, ReadinessLevel, ResumeRow } from "@/lib/types"

/** 0-100 score per readiness component. */
export interface ComponentScores {
  interview: number
  skills: number
  resume: number
  self: number
  learning: number
}

export interface SelfQuestion {
  id: string
  title: string
  hint: string
  /** skill tag for skill questions; undefined for soft/interview questions */
  tag?: string
}

export const SOFT_QUESTIONS: SelfQuestion[] = [
  { id: "star", title: "Structuring answers with STAR", hint: "I can explain Situation, Task, Action and Result clearly without notes." },
  { id: "communication", title: "Explaining ideas clearly", hint: "I can explain my work to non-technical people concisely." },
  { id: "company_research", title: "Researching employers", hint: "I research the company, product and role before every interview." },
  { id: "questions", title: "Asking good questions", hint: "I prepare thoughtful questions for the interviewer." },
  { id: "confidence", title: "Confidence under pressure", hint: "I stay calm with unexpected or difficult questions." },
  { id: "portfolio", title: "Evidence of work", hint: "I have projects, a portfolio or results I can show and talk about." },
]

export function skillQuestions(role: string): SelfQuestion[] {
  return roleSkills(role).map((tag) => ({
    id: `skill:${tag}`,
    tag,
    title: skillLabel(tag),
    hint: "Rate your current proficiency: 1 = no experience, 5 = can do it independently at work.",
  }))
}

export const COMPONENT_WEIGHTS: Record<keyof ComponentScores, number> = {
  interview: 0.35,
  skills: 0.3,
  resume: 0.2,
  self: 0.1,
  learning: 0.05,
}

export const COMPONENT_LABELS: Record<keyof ComponentScores, string> = {
  interview: "Interview performance",
  skills: "Skill alignment",
  resume: "Resume quality",
  self: "Self-assessed soft skills",
  learning: "Learning activity",
}

const ratingToScore = (rating?: number) => (rating ? (clamp(rating, 1, 5) - 1) * 25 : 0)

export interface AssessmentInput {
  role: string
  ratings: Record<string, number>
  resumes: ResumeRow[]
  sessions: InterviewSessionSummary[]
  learning: LearningProgressRow[]
}

export interface AssessmentOutput {
  component_scores: ComponentScores
  overall_score: number
  readiness_level: ReadinessLevel
  strengths: string[]
  gaps: ReadinessGap[]
  recommendations: string[]
  summary: string
}

/** A computed (unsaved) assessment as shown on the result screen. */
export interface AssessmentResult extends AssessmentOutput {
  target_role: string
  assessed_at: string
}

export function computeReadiness({ role, ratings, resumes, sessions, learning }: AssessmentInput): AssessmentOutput {
  // Evidence
  const latestResume = resumes.find((resume) => resume.target_role === role) ?? resumes[0] ?? null
  const done = completedSessions(sessions)
  const roleSessions = done.filter((session) => session.role === role)
  const recent = (roleSessions.length ? roleSessions : done).slice(0, 3)
  const completedLearning = learning.filter((item) => item.status === "Completed").length
  const inProgressLearning = learning.filter((item) => item.status === "In Progress").length

  // Skill scores: blend self rating 50/50 with resume evidence (detected skill = 65) when present
  const resumeSkills = new Set(latestResume?.detected_skills ?? [])

  const required = roleSkills(role)
  const skillScores = required.map((tag, index) => {
    const self = ratingToScore(ratings[`skill:${tag}`])
    const score = Math.round(resumeSkills.has(tag) ? self * 0.5 + 65 * 0.5 : self * 0.7)
    return { tag, score, important: index < 3 }
  })
  const weightedSkill = skillScores.reduce((sum, item) => sum + item.score * (item.important ? 2 : 1), 0)
  const skillWeight = skillScores.reduce((sum, item) => sum + (item.important ? 2 : 1), 0)

  const component_scores: ComponentScores = {
    resume: latestResume ? Math.round(Number(latestResume.overall_score)) : 0,
    interview: recent.length ? average(recent.map((session) => Number(session.average_score))) : 0,
    skills: skillWeight ? Math.round(weightedSkill / skillWeight) : 0,
    learning: clamp(completedLearning * 20 + inProgressLearning * 5),
    self: average(SOFT_QUESTIONS.map((question) => ratingToScore(ratings[question.id]))),
  }

  const overall_score = Math.round(
    (Object.keys(COMPONENT_WEIGHTS) as (keyof ComponentScores)[]).reduce(
      (sum, key) => sum + component_scores[key] * COMPONENT_WEIGHTS[key],
      0,
    ),
  )
  const readiness_level: ReadinessLevel =
    overall_score >= 80 ? "highly_ready" : overall_score >= 65 ? "ready" : overall_score >= 45 ? "developing" : "not_ready"

  // Gaps
  const gaps: ReadinessGap[] = skillScores
    .filter((item) => item.score < 70)
    .map((item) => ({
      skill: skillLabel(item.tag),
      tag: item.tag,
      score: item.score,
      priority: (item.score < 45 && item.important ? "High" : item.score < 55 ? "Medium" : "Low") as ReadinessGap["priority"],
    }))
  if (component_scores.interview < 60 || ratingToScore(ratings.star) < 50) {
    gaps.push({
      skill: skillLabel("star-method"),
      tag: "star-method",
      score: Math.min(component_scores.interview || 100, ratingToScore(ratings.star) || 100),
      priority: component_scores.interview < 45 ? "High" : "Medium",
    })
  }
  if (ratingToScore(ratings.communication) < 50) {
    gaps.push({ skill: skillLabel("communication"), tag: "communication", score: ratingToScore(ratings.communication), priority: "Medium" })
  }
  const order = { High: 0, Medium: 1, Low: 2 }
  gaps.sort((a, b) => order[a.priority] - order[b.priority] || a.score - b.score)
  const uniqueGaps = gaps.filter((gap, index) => gaps.findIndex((other) => other.tag === gap.tag) === index)

  // Strengths
  const strengths: string[] = []
  for (const key of Object.keys(component_scores) as (keyof ComponentScores)[]) {
    if (component_scores[key] >= 75) strengths.push(`${COMPONENT_LABELS[key]} is strong (${component_scores[key]}/100).`)
  }
  for (const item of skillScores.filter((s) => s.score >= 75).slice(0, 3)) strengths.push(`Solid ${skillLabel(item.tag)} for a ${role}.`)
  if (!strengths.length) strengths.push("You have taken the first step by measuring your readiness — keep building evidence.")

  // Recommendations
  const recommendations: string[] = []
  if (!latestResume) recommendations.push(`Upload your resume to the Resume Analyzer and target it at the ${role} role.`)
  else if (latestResume.overall_score < 70) recommendations.push(`Improve your resume (currently ${component_scores.resume}/100) — apply the high-priority suggestions and re-analyse.`)
  if (!done.length) recommendations.push("Complete at least one mock interview so your interview performance can be measured.")
  else if (component_scores.interview < 70) recommendations.push("Practise 2–3 more mock interviews focusing on STAR structure and measurable results.")
  for (const gap of uniqueGaps.filter((g) => g.priority === "High").slice(0, 2)) recommendations.push(`Close your ${gap.skill} gap with a recommended course or practice project.`)
  if (!completedLearning && !inProgressLearning) recommendations.push("Start a recommended learning resource to build your weakest skills.")
  if (ratingToScore(ratings.company_research) < 50) recommendations.push("Before each interview, research the company's products, values and recent news.")
  if (!recommendations.length) recommendations.push("You are in great shape — keep practising advanced questions and start applying to roles.")

  const levelText = {
    highly_ready: "highly ready",
    ready: "ready",
    developing: "developing",
    not_ready: "not yet ready",
  }[readiness_level]
  const weakest = (Object.keys(component_scores) as (keyof ComponentScores)[]).sort((a, b) => component_scores[a] - component_scores[b])[0]
  const summary = `You are ${levelText} for ${role} roles with an overall score of ${overall_score}/100. Your biggest opportunity is ${COMPONENT_LABELS[weakest].toLowerCase()}${uniqueGaps[0] ? `, followed by ${uniqueGaps[0].skill}` : ""}.`

  return {
    component_scores,
    overall_score,
    readiness_level,
    strengths: strengths.slice(0, 5),
    gaps: uniqueGaps,
    recommendations: recommendations.slice(0, 6),
    summary,
  }
}

export const LEVEL_META: Record<ReadinessLevel, { label: string; tone: "green" | "blue" | "amber" | "red" }> = {
  highly_ready: { label: "Highly ready", tone: "green" },
  ready: { label: "Interview ready", tone: "blue" },
  developing: { label: "Developing", tone: "amber" },
  not_ready: { label: "Not ready yet", tone: "red" },
}
