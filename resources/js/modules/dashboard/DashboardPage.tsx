import { useEffect, useState } from "react"
import { Link, useNavigate } from "@/lib/router"
import { ArrowRight, Award, BarChart3, BookOpen, FileText, Layers, Mic, Play, Sparkles, Tag, Target, TrendingUp, type LucideIcon } from "lucide-react"
import { HOME_NAV, MODULE_NAV, MODULES, PROGRESS_NAV } from "@/components/navigation"
import { UserRound } from "lucide-react"

const MODULE_ICONS: Record<string, LucideIcon> = Object.fromEntries([HOME_NAV, ...MODULE_NAV, PROGRESS_NAV].map((item) => [item.to, item.icon]))
import { Button as UiButton } from "@/components/shadcn/button"
import { Card as UiCard } from "@/components/shadcn/card"
import { Alert, Badge, Button, Card, EmptyState, LoadingState, Progress, ScoreRing, StatCard, TrendChart } from "@/components/ui"
import { errorMessage, timeAgo } from "@/lib/format"
import {
  completedSessions,
  deriveSkillGaps,
  fetchLearningProgress,
  fetchResources,
  fetchResumes,
  fetchSessions,
  inferTargetRole,
  rankResources,
  type RankedResource,
  type SkillGap,
} from "@/lib/insights"
import type { InterviewSessionSummary, LearningProgressRow, LearningResource, ResumeRow } from "@/lib/types"
import { useAuth } from "@/modules/user-management/context/AuthContext"
import { typeLabel } from "@/modules/learning-recommendation/resourceMeta"

interface Data {
  resumes: ResumeRow[]
  sessions: InterviewSessionSummary[]
  learning: LearningProgressRow[]
  resources: LearningResource[]
}

const DAY = 24 * 60 * 60 * 1000

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

const signed = (value: number) => (value > 0 ? `+${value}` : `${value}`)

export default function DashboardPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return
    Promise.all([fetchResumes(profile.user_id, 10), fetchSessions(profile.user_id, 50), fetchLearningProgress(profile.user_id), fetchResources()])
      .then(([resumes, sessions, learning, resources]) => setData({ resumes, sessions, learning, resources }))
      .catch((err) => setError(errorMessage(err)))
  }, [profile])

  if (!profile) return null
  if (!data) return error ? <Alert tone="error">{error}</Alert> : <LoadingState label="Preparing your dashboard…" />

  const firstName = (profile.full_name || "there").split(" ")[0]
  const latestResume = data.resumes[0] ?? null
  const previousResume = data.resumes[1] ?? null
  const done = completedSessions(data.sessions)
  const latestSession = done[0]
  const recentScores = done.slice(0, 3).map((session) => Number(session.average_score))
  const readiness = recentScores.length ? Math.round(recentScores.reduce((sum, value) => sum + value, 0) / recentScores.length) : 0
  const targetRole = inferTargetRole({ resumes: data.resumes, sessions: data.sessions })
  const gaps: SkillGap[] = deriveSkillGaps({ targetRole, latestResume, sessions: data.sessions })
  const ranked: RankedResource[] = rankResources(data.resources, gaps, targetRole, data.learning)
  const topPick = ranked[0]
  const chronological = [...done].reverse().slice(-8)
  const firstScore = chronological[0] ? Number(chronological[0].average_score) : 0
  const lastScore = chronological.at(-1) ? Number(chronological.at(-1)!.average_score) : 0
  const improvement = chronological.length > 1 && firstScore > 0 ? Math.round(((lastScore - firstScore) / firstScore) * 100) : null
  const learningCompleted = data.learning.filter((item) => item.status === "Completed").length
  const learningInProgress = data.learning.filter((item) => item.status === "In Progress").length
  const resourceTitle = new Map(data.resources.map((resource) => [resource.resource_id, resource.title]))

  const stepStatus: Record<string, string> = {
    "/profile": "Account",
    "/resume": latestResume ? `Score ${Math.round(latestResume.overall_score)}` : "Not started",
    "/interview": done.length ? `${done.length} session${done.length > 1 ? "s" : ""}` : "Not started",
    "/assessment": "Take anytime",
    "/learning": learningCompleted ? `${learningCompleted} completed` : learningInProgress ? "In progress" : "Not started",
    "/progress": "Track trends",
  }

  const activity: { title: string; text: string; date: string; icon: LucideIcon }[] = [
    ...done.slice(0, 4).map((s) => ({ title: "Mock interview completed", text: `Scored ${Math.round(Number(s.average_score))} · ${s.role}`, date: s.completed_at ?? s.created_at, icon: Mic })),
    ...data.resumes.slice(0, 3).map((r) => ({ title: "Resume analysed", text: `${Math.round(r.overall_score)}/100 for ${r.target_role}`, date: r.analyzed_at ?? r.uploaded_at, icon: FileText })),
    ...data.learning
      .filter((l) => l.status === "Completed" && l.completed_at)
      .map((l) => ({ title: "Learning completed", text: resourceTitle.get(l.resource_id) ?? "Learning resource", date: l.completed_at!, icon: Award })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  const lastInterviewAt = latestSession ? new Date(latestSession.completed_at ?? latestSession.created_at).getTime() : 0
  const nextAction = !latestResume
    ? { text: "Start by analysing your resume against the role you're aiming for.", label: "Analyse resume", to: "/resume" }
    : !done.length
      ? { text: "Your resume is in. Now practise your first mock interview.", label: "Start mock interview", to: "/interview" }
      : Date.now() - lastInterviewAt > 14 * DAY
        ? { text: "It's been a while since your last mock interview. A short session keeps your answers sharp.", label: "Practise again", to: "/interview" }
        : { text: "You have enough evidence for a readiness check. See where you stand and what to work on next.", label: "Check readiness", to: "/assessment" }

  return (
    <div className="flex min-w-0 flex-col gap-4 lg:gap-6">
      <UiCard className="min-w-0 gap-0 p-5 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 max-w-2xl flex-col gap-3">
            <Badge tone="slate">
              <Sparkles size={13} /> Your career brief
            </Badge>
            <h1 className="font-heading text-2xl font-bold tracking-tight [overflow-wrap:anywhere] sm:text-3xl">
              {greeting()}, {firstName}.
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">{nextAction.text}</p>
            <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap">
              <Button onClick={() => navigate(nextAction.to)}>
                <Play size={16} /> {nextAction.label}
              </Button>
              <Button variant="secondary" onClick={() => navigate("/learning")}>
                View learning plan
              </Button>
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-4 rounded-lg border bg-muted/50 p-4 lg:w-80 lg:shrink-0">
            <ScoreRing value={readiness} label="Ready" color="violet" />
            <div className="flex min-w-0 flex-col gap-1">
              <strong className="font-heading text-base font-semibold">Interview readiness</strong>
              <span className="text-sm text-muted-foreground">
                {recentScores.length
                  ? `Average of your last ${recentScores.length > 1 ? `${recentScores.length} interviews` : "interview"}`
                  : "No interviews yet"}
              </span>
            </div>
          </div>
        </div>
      </UiCard>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4 max-sm:[&>[data-slot=card]]:flex-col max-sm:[&>[data-slot=card]]:gap-2">
        <StatCard
          icon={FileText}
          label="Latest resume score"
          value={latestResume ? `${Math.round(latestResume.overall_score)}/100` : "—"}
          meta={
            latestResume
              ? previousResume
                ? `${signed(Math.round(latestResume.overall_score - previousResume.overall_score))} vs previous`
                : latestResume.target_role
              : "Analyse your first resume"
          }
        />
        <StatCard
          icon={Mic}
          label="Recent interview"
          value={latestSession ? `${Math.round(Number(latestSession.average_score))}/100` : "—"}
          meta={latestSession ? `${latestSession.role} · ${timeAgo(latestSession.completed_at ?? latestSession.created_at)}` : "No sessions yet"}
          tone="violet"
        />
        <StatCard
          icon={BookOpen}
          label="Learning completed"
          value={String(learningCompleted)}
          meta={`${learningInProgress} in progress`}
          tone="green"
        />
        <StatCard
          icon={Target}
          label="Skill gaps"
          value={`${gaps.length} skill${gaps.length === 1 ? "" : "s"}`}
          meta={gaps[0] ? `${gaps[0].label} is highest priority` : "No major gaps found"}
          tone="amber"
        />
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-6">
        <Card
          title="Interview score trend"
          action={
            <Link
              className="inline-flex items-center gap-1 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground pointer-coarse:min-h-11"
              to="/progress"
            >
              View progress <ArrowRight size={14} />
            </Link>
          }
        >
          {chronological.length ? (
            <>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="flex flex-col">
                  <strong className="font-heading text-3xl font-bold leading-none tabular-nums">{Math.round(lastScore)}</strong>
                  <span className="mt-1 text-sm text-muted-foreground">Latest score</span>
                </div>
                {improvement !== null && (
                  <Badge tone={improvement >= 0 ? "green" : "red"}>
                    <TrendingUp size={13} /> {improvement >= 0 ? "+" : ""}
                    {improvement}% since first session
                  </Badge>
                )}
              </div>
              <TrendChart values={chronological.map((s) => Number(s.average_score))} labels={chronological.map((_, i) => `S${done.length - chronological.length + i + 1}`)} />
            </>
          ) : (
            <EmptyState
              icon={Mic}
              title="No interview data yet"
              text="Complete a mock interview to start your score trend."
              action={
                <UiButton asChild className="pointer-coarse:min-h-11">
                  <Link to="/interview">Start practising</Link>
                </UiButton>
              }
            />
          )}
        </Card>
        <Card title="Priority skill gaps">
          {gaps.length ? (
            <div className="flex flex-col gap-4">
              {gaps.slice(0, 4).map((gap) => (
                <div key={gap.tag} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate text-sm font-medium">{gap.label}</span>
                    <Badge tone={gap.priority === "High" ? "amber" : gap.priority === "Medium" ? "blue" : "slate"}>{gap.priority}</Badge>
                  </div>
                  <Progress value={gap.score} tone={gap.score > 60 ? "violet" : "blue"} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-muted-foreground">No major gaps found. Analyse an updated resume to keep this list current.</p>
          )}
          <Button variant="secondary" className="mt-5 w-full" onClick={() => navigate("/learning")}>
            Explore recommendations
          </Button>
        </Card>
      </div>

      <Card title="Your career workflow">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {MODULES.map((module) => {
            const Icon = MODULE_ICONS[module.to] ?? UserRound
            return (
              <button
                key={module.to}
                type="button"
                className="group flex min-h-11 min-w-0 items-center gap-3 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                onClick={() => navigate(module.to)}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-md border bg-muted text-foreground">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <small className="truncate text-xs font-medium text-muted-foreground">Module {module.number}</small>
                  <strong className="truncate text-sm font-semibold">{module.name}</strong>
                  <small className="truncate text-xs text-muted-foreground">{stepStatus[module.to]}</small>
                </span>
                <ArrowRight size={16} className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </button>
            )
          })}
        </div>
      </Card>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2 lg:gap-6">
        <Card title="Recommended for you">
          {topPick ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="grid size-16 shrink-0 place-items-center rounded-lg border bg-muted text-muted-foreground">
                <BarChart3 size={28} />
              </div>
              <div className="flex min-w-0 flex-col items-start gap-2">
                <Badge tone={topPick.priority === "High" ? "violet" : "blue"}>{topPick.priority === "High" ? "Top priority" : "Recommended"}</Badge>
                <h3 className="font-heading text-base font-semibold leading-snug">{topPick.resource.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{topPick.reason}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Layers size={14} /> {typeLabel(topPick.resource.resource_type)}
                  </span>
                  {topPick.resource.skill_name && (
                    <span className="inline-flex items-center gap-1.5">
                      <Tag size={14} /> {topPick.resource.skill_name}
                    </span>
                  )}
                </div>
                <Button size="sm" className="mt-1" onClick={() => navigate(`/learning/${topPick.resource.resource_id}`)}>
                  Start learning <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-muted-foreground">No learning resources available yet. An administrator can add them in the admin panel.</p>
          )}
        </Card>
        <Card title="Recent activity">
          {activity.length ? (
            <ul className="flex flex-col divide-y">
              {activity.map((item, index) => (
                <li className="flex items-start gap-3 py-3 first:pt-0 last:pb-0" key={`${item.title}-${index}`}>
                  <span className="grid size-8 shrink-0 place-items-center rounded-full border bg-muted text-muted-foreground">
                    <item.icon size={15} />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <div className="min-w-0">
                      <strong className="block text-sm font-medium">{item.title}</strong>
                      <p className="truncate text-sm text-muted-foreground">{item.text}</p>
                    </div>
                    <small className="shrink-0 text-xs text-muted-foreground">{timeAgo(item.date)}</small>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm leading-relaxed text-muted-foreground">Your activity will appear here as you use NextHire.</p>
          )}
        </Card>
      </div>
    </div>
  )
}
