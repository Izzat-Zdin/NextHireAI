import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "@/lib/router"
import {
  Award,
  BookOpen,
  ChevronRight,
  FileSearch,
  FileText,
  Gauge,
  GraduationCap,
  MessageSquareText,
  Mic,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react"
import { Card as UiCard } from "@/components/shadcn/card"
import { Alert, Badge, Button, Card, EmptyState, LoadingState, PageIntro, SelectField, StatCard, TrendChart, type Tone } from "@/components/ui"
import {
  completedSessions,
  deriveSkillGaps,
  fetchLearningProgress,
  fetchResources,
  fetchResumes,
  fetchSessions,
  inferTargetRole,
  monthlyTrend,
} from "@/lib/insights"
import { errorMessage, formatDate, scoreLabel, timeAgo } from "@/lib/format"
import type { InterviewSessionSummary, LearningProgressRow, LearningResource, ResumeRow } from "@/lib/types"
import { useAuth } from "@/modules/m1-user-management/context/AuthContext"
import {
  learningInPeriod,
  nextSteps,
  recentActivity,
  resumeDate,
  sessionDate,
  skillChanges,
  sortNewest,
  withinPeriod,
  type ActivityKind,
  type SkillStatus,
  type StepKind,
} from "../services/progressInsights"
import { moduleLabel } from "@/components/navigation"

interface ProgressData {
  resumes: ResumeRow[]
  sessions: InterviewSessionSummary[]
  progress: LearningProgressRow[]
  resources: LearningResource[]
}

const PERIODS = [
  { value: "3", label: "Last 3 months" },
  { value: "6", label: "Last 6 months" },
  { value: "12", label: "Last 12 months" },
]

const STEP_ICON: Record<StepKind, LucideIcon> = {
  resume: FileSearch,
  interview: MessageSquareText,
  assessment: Gauge,
  learning: BookOpen,
}

const ACTIVITY_ICON: Record<ActivityKind, LucideIcon> = {
  interview: MessageSquareText,
  resume: FileText,
  learning: GraduationCap,
}

const SKILL_BADGE: Record<SkillStatus, { tone: Tone; label: string }> = {
  gained: { tone: "green", label: "Gained" },
  kept: { tone: "blue", label: "Detected" },
  lost: { tone: "red", label: "Not shown" },
  missing: { tone: "amber", label: "Missing" },
}

const signed = (value: number) => (value > 0 ? `+${value}` : `${value}`)

function LearningDonut({ completed, inProgress, notStarted }: { completed: number; inProgress: number; notStarted: number }) {
  const total = completed + inProgress + notStarted
  const a = total ? (completed / total) * 100 : 0
  const b = total ? ((completed + inProgress) / total) * 100 : 0
  const inProgressColor = "color-mix(in oklab, var(--primary) 40%, transparent)"
  const background = total
    ? `conic-gradient(var(--primary) 0 ${a}%, ${inProgressColor} ${a}% ${b}%, var(--border) ${b}% 100%)`
    : "var(--border)"
  const legend: [string, string, number][] = [
    ["bg-primary", "Completed", completed],
    ["bg-primary/40", "In progress", inProgress],
    ["bg-border", "Not started", notStarted],
  ]
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center lg:flex-col xl:flex-row">
      <div
        className="relative grid size-36 shrink-0 place-items-center rounded-full"
        style={{ background }}
        role="img"
        aria-label={`${completed} completed, ${inProgress} in progress, ${notStarted} not started`}
      >
        <div className="absolute inset-4 rounded-full bg-card" />
        <div className="relative flex flex-col items-center">
          <strong className="font-heading text-3xl font-bold leading-none tabular-nums">{total}</strong>
          <span className="mt-1 text-xs text-muted-foreground">resources</span>
        </div>
      </div>
      <ul className="flex w-full max-w-60 flex-col gap-2 text-sm">
        {legend.map(([dot, label, count]) => (
          <li key={label} className="flex items-center gap-2">
            <i className={`size-2.5 shrink-0 rounded-full ${dot}`} aria-hidden="true" />
            <span className="flex-1 text-muted-foreground">{label}</span>
            <b className="font-semibold tabular-nums">{count}</b>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function ProgressPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [period, setPeriod] = useState("6")
  const [data, setData] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const userId = user?.id

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const [resumes, sessions, progress, resources] = await Promise.all([
        fetchResumes(userId),
        fetchSessions(userId),
        fetchLearningProgress(userId),
        fetchResources(),
      ])
      setData({ resumes, sessions, progress, resources })
    } catch (err) {
      setError(errorMessage(err, "Could not load your progress data."))
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void load()
  }, [load])

  const months = Number(period)
  const periodLabel = PERIODS.find((item) => item.value === period)?.label ?? ""
  const periodText = periodLabel.toLowerCase()

  const view = useMemo(() => {
    if (!data) return null
    const allResumes = sortNewest(data.resumes, resumeDate)
    const resumes = withinPeriod(allResumes, resumeDate, months)
    const sessions = withinPeriod(data.sessions, (row) => row.created_at, months)
    const progress = learningInPeriod(data.progress, months)
    const done = sortNewest(completedSessions(sessions), sessionDate)

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
    const interviewsThisMonth = done.filter((row) => new Date(sessionDate(row)).getTime() >= monthStart).length

    const latestResume = resumes[0] ?? null
    const earliestResume = resumes[resumes.length - 1] ?? null
    const previousResume = latestResume ? allResumes[allResumes.indexOf(latestResume) + 1] ?? null : null

    const latestSession = done[0] ?? null
    const earliestSession = done[done.length - 1] ?? null

    const targetRole = inferTargetRole({ resumes: allResumes, sessions: data.sessions })
    const gaps = deriveSkillGaps({ targetRole, latestResume: allResumes[0] ?? null, sessions: data.sessions })

    return {
      resumes,
      done,
      interviewsThisMonth,
      latestResume,
      earliestResume,
      previousResume,
      latestSession,
      earliestSession,
      targetRole,
      gaps,
      learning: {
        completed: progress.filter((item) => item.status === "Completed").length,
        inProgress: progress.filter((item) => item.status === "In Progress").length,
        notStarted: progress.filter((item) => item.status === "Not Started").length,
      },
      interviewTrend: monthlyTrend(
        done.map((row) => ({ date: sessionDate(row), value: Number(row.average_score) })),
        months,
      ),
      resumeTrend: monthlyTrend(
        resumes.map((row) => ({ date: resumeDate(row), value: row.overall_score })),
        months,
      ),
      skills: latestResume && earliestResume ? skillChanges(targetRole, earliestResume, latestResume) : [],
      activity: recentActivity({ sessions, resumes, progress, resources: data.resources }),
    }
  }, [data, months])

  const steps = useMemo(() => (data ? nextSteps(data) : []), [data])

  const intro = (
    <PageIntro
      eyebrow={moduleLabel(6)}
      title="Your progress"
      description="Track how your interview performance, resume and skills have changed over time, and see what to do next."
      action={<SelectField label="Period" value={period} options={PERIODS} onChange={setPeriod} />}
    />
  )

  if (loading && !data) {
    return (
      <>
        {intro}
        <LoadingState label="Loading your progress…" />
      </>
    )
  }

  if (error || !data || !view || !profile) {
    return (
      <>
        {intro}
        <Alert tone="error">{error ?? "Could not load your progress data."}</Alert>
        <Button variant="secondary" onClick={() => void load()}>
          <RefreshCw size={15} /> Try again
        </Button>
      </>
    )
  }

  const { latestSession, earliestSession, latestResume, earliestResume, previousResume } = view
  const latestScore = latestSession ? Math.round(Number(latestSession.average_score)) : 0
  const scoreChange =
    latestSession && earliestSession && view.done.length >= 2
      ? latestScore - Math.round(Number(earliestSession.average_score))
      : null
  const resumeChange = latestResume && previousResume ? Math.round(latestResume.overall_score - previousResume.overall_score) : null
  const highGaps = view.gaps.filter((gap) => gap.priority === "High").length
  const multipleResumes = view.resumes.length >= 2
  const gained = view.skills.filter((skill) => skill.status === "gained").length
  const detected = view.skills.filter((skill) => skill.after).length
  const roleName = view.targetRole ?? "your target role"

  return (
    <>
      {intro}
      <div className="flex min-w-0 flex-col gap-4 lg:gap-6">

      {/* Hero: interview score change across the selected period */}
      {latestSession ? (
        <UiCard className="min-w-0 gap-0 p-5 sm:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-8">
            <div className="flex min-w-0 max-w-2xl flex-col gap-2">
              <Badge tone="slate">{periodLabel}</Badge>
              <h2 className="font-heading text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
                {scoreChange === null
                  ? "Your interview baseline is set"
                  : scoreChange > 0
                    ? `Your interview score improved by ${scoreChange} points`
                    : scoreChange === 0
                      ? "Your interview score is holding steady"
                      : `Your interview score dipped by ${Math.abs(scoreChange)} points`}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {scoreChange === null || !earliestSession
                  ? `Scored ${latestScore} on ${formatDate(sessionDate(latestSession))}. Complete another mock interview to measure your change.`
                  : `From ${Math.round(Number(earliestSession.average_score))} on ${formatDate(sessionDate(earliestSession))} to ${latestScore} on ${formatDate(sessionDate(latestSession))} across ${view.done.length} completed interviews.`}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border bg-muted/50 px-4 py-3 md:flex-col md:items-start md:px-5">
              <div className="flex items-baseline gap-2">
                <strong className="font-heading text-4xl font-bold leading-none tabular-nums">{latestScore}</strong>
                <span className="whitespace-nowrap text-sm text-muted-foreground">/ 100 latest interview</span>
              </div>
              <Badge tone={scoreChange === null ? "slate" : scoreChange >= 0 ? "green" : "red"}>
                {scoreChange === null ? scoreLabel(latestScore) : `${signed(scoreChange)} pts in period`}
              </Badge>
            </div>
          </div>
        </UiCard>
      ) : (
        <UiCard className="min-w-0 gap-0 p-5 sm:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-8">
            <div className="flex min-w-0 max-w-2xl flex-col gap-2">
              <Badge tone="slate">Get started</Badge>
              <h2 className="font-heading text-xl font-semibold leading-snug tracking-tight sm:text-2xl">Set your interview baseline</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                No completed mock interview in the {periodText}. Practise one now — every interview after that will show how
                far you've come.
              </p>
            </div>
            <Button className="max-md:w-full" onClick={() => navigate("/interview")}>
              <Mic size={16} /> Start mock interview
            </Button>
          </div>
        </UiCard>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4 max-sm:[&>[data-slot=card]]:flex-col max-sm:[&>[data-slot=card]]:gap-2">
        <StatCard
          icon={MessageSquareText}
          label="Interviews completed"
          value={String(view.done.length)}
          meta={`${view.interviewsThisMonth} this month`}
        />
        <StatCard
          icon={BookOpen}
          tone="violet"
          label="Learning completed"
          value={String(view.learning.completed)}
          meta={`${view.learning.inProgress} in progress`}
        />
        <StatCard
          icon={FileText}
          tone="green"
          label="Latest resume score"
          value={latestResume ? `${Math.round(latestResume.overall_score)}` : "—"}
          meta={
            !latestResume
              ? "No resume analysed in period"
              : resumeChange === null
                ? "First analysis"
                : `${signed(resumeChange)} vs previous`
          }
        />
        <StatCard
          icon={Target}
          tone="amber"
          label="Skill gaps"
          value={String(view.gaps.length)}
          meta={view.gaps.length ? `${highGaps} high priority` : "No major gaps found"}
        />
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2 lg:gap-6">
        <Card title="Interview score trend" action={<Badge tone="slate">Avg. per month</Badge>}>
          <TrendChart values={view.interviewTrend.values} labels={view.interviewTrend.labels} />
        </Card>
        <Card title="Resume score trend" action={<Badge tone="slate">Avg. per month</Badge>}>
          <TrendChart values={view.resumeTrend.values} labels={view.resumeTrend.labels} />
        </Card>
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-6">
        <Card
          title="Skills development"
          action={view.skills.length > 0 && <span className="text-xs text-muted-foreground">{roleName}</span>}
        >
          {view.skills.length && earliestResume && latestResume ? (
            <>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {multipleResumes
                  ? `${detected} of ${view.skills.length} required skills shown on your latest resume · ${gained} gained since ${formatDate(resumeDate(earliestResume))}.`
                  : `${detected} of ${view.skills.length} required skills shown on your resume. Analyse an updated resume to measure your change.`}
              </p>
              <ul className="mt-4 flex flex-col divide-y rounded-lg border">
                {view.skills.map((skill) => (
                  <li
                    key={skill.tag}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-3 py-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:px-4"
                  >
                    <strong className="min-w-0 truncate text-sm font-medium">{skill.label}</strong>
                    <span className="col-span-2 row-start-2 text-xs text-muted-foreground sm:col-span-1 sm:row-start-1 sm:col-start-2 sm:text-sm">
                      {multipleResumes
                        ? `${skill.before ? "Detected" : "Missing"} → ${skill.after ? "Detected" : "Missing"}`
                        : skill.after
                          ? "On your resume"
                          : "Not on your resume"}
                    </span>
                    <span className="col-start-2 row-start-1 justify-self-end sm:col-start-3">
                      <Badge tone={SKILL_BADGE[skill.status].tone}>{SKILL_BADGE[skill.status].label}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <EmptyState
              icon={TrendingUp}
              title="No resume analysed in this period"
              text={`Analyse your resume to see which skills for ${roleName} it shows and track them over the ${periodText}.`}
              action={
                <Button variant="secondary" onClick={() => navigate("/resume")}>
                  Analyse resume
                </Button>
              }
            />
          )}
        </Card>

        <Card title="Learning status">
          {view.learning.completed + view.learning.inProgress + view.learning.notStarted > 0 ? (
            <LearningDonut {...view.learning} />
          ) : (
            <EmptyState
              icon={BookOpen}
              title="No learning activity"
              text="Start a recommended resource to track it here."
              action={
                <Button variant="secondary" onClick={() => navigate("/learning")}>
                  Browse learning
                </Button>
              }
            />
          )}
        </Card>
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-6">
        <Card title="Recommended next steps" action={<Sparkles size={17} className="text-muted-foreground" />}>
          {steps.length ? (
            <div className="flex flex-col gap-2">
              {steps.map((step) => {
                const Icon = STEP_ICON[step.kind]
                return (
                  <Link
                    key={`${step.kind}-${step.to}`}
                    to={step.to}
                    className="group flex min-w-0 items-center gap-3 rounded-lg border p-3 text-inherit no-underline transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <span className="grid size-9 shrink-0 place-items-center self-start rounded-md border bg-muted text-foreground">
                      <Icon size={17} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <strong className="block text-sm font-semibold">{step.title}</strong>
                      <p className="pt-0.5 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
                      <small className="mt-1 inline-block text-sm font-medium text-foreground underline-offset-4 group-hover:underline">{step.cta} →</small>
                    </div>
                    <ChevronRight size={16} className="shrink-0 text-muted-foreground" aria-hidden="true" />
                  </Link>
                )
              })}
            </div>
          ) : (
            <EmptyState icon={Award} title="You're on track" text="You've covered every recommended step. Keep practising to hold your momentum." />
          )}
        </Card>

        <Card title="Recent activity">
          {view.activity.length ? (
            <ul className="flex flex-col divide-y">
              {view.activity.map((item) => {
                const Icon = ACTIVITY_ICON[item.kind]
                return (
                  <li className="flex items-start gap-3 py-3 first:pt-0 last:pb-0" key={item.id}>
                    <span className="grid size-8 shrink-0 place-items-center rounded-full border bg-muted text-muted-foreground">
                      <Icon size={15} />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="flex items-start justify-between gap-3">
                        <strong className="min-w-0 text-sm font-medium">{item.title}</strong>
                        <small className="shrink-0 pt-0.5 text-xs text-muted-foreground">{timeAgo(item.date)}</small>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">{item.detail}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <EmptyState icon={TrendingUp} title="No activity yet" text={`Nothing recorded in the ${periodText}.`} />
          )}
        </Card>
      </div>
      </div>
    </>
  )
}
