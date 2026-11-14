import { useState } from "react"
import { Link } from "@/lib/router"
import { ArrowRight, BookOpen, CheckCircle2, Info, Lightbulb, Printer, RotateCcw, Target, Zap } from "lucide-react"
import { Badge, Button, Card, EmptyState, Progress, ScoreRing } from "@/components/ui"
import { Alert as UiAlert, AlertDescription } from "@/components/shadcn/alert"
import { Button as UiButton } from "@/components/shadcn/button"
import { Card as UiCard } from "@/components/shadcn/card"
import { Separator } from "@/components/shadcn/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs"
import { formatDate, formatDateTime } from "@/lib/format"
import { COMPONENT_LABELS, COMPONENT_WEIGHTS, LEVEL_META, type AssessmentResult, type ComponentScores } from "../services/assessmentEngine"

const COMPONENT_LINKS: Record<keyof ComponentScores, string> = {
  interview: "/interview",
  skills: "/learning",
  resume: "/resume",
  self: "/interview",
  learning: "/learning",
}

type ResultTab = "overview" | "gaps" | "report"

const reportHeading = "pt-6 font-heading text-sm font-semibold"
const reportText = "pt-1.5 text-sm leading-relaxed text-muted-foreground"

export function AssessmentResultView({
  assessment,
  candidateName,
  onRetake,
}: {
  assessment: AssessmentResult
  candidateName: string
  onRetake: () => void
}) {
  const [tab, setTab] = useState<ResultTab>("overview")
  const level = LEVEL_META[assessment.readiness_level]
  const components = Object.keys(COMPONENT_WEIGHTS) as (keyof ComponentScores)[]

  return (
    <div className="flex min-w-0 flex-col gap-4 lg:gap-6">
      <UiAlert role="note">
        <Lightbulb />
        <AlertDescription className="text-sm leading-relaxed">
          <span>
            <strong className="font-semibold text-foreground">Use scores as guidance.</strong> The readiness score is calculated by a transparent
            rule-based model from your own data — it is not a hiring decision.
          </span>
        </AlertDescription>
      </UiAlert>

      <UiCard className="min-w-0 gap-0 p-5 sm:p-6">
        <div className="grid min-w-0 justify-items-center gap-5 text-center sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:justify-items-stretch sm:text-left xl:grid-cols-[auto_minmax(0,1fr)_auto] xl:gap-8">
          <ScoreRing value={assessment.overall_score} label="Readiness" color="violet" />
          <div className="flex min-w-0 flex-col items-center gap-2 sm:items-start">
            <Badge tone={level.tone}>{level.label}</Badge>
            <h2 className="font-heading text-lg font-semibold leading-snug tracking-tight sm:text-xl">{assessment.summary}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{assessment.recommendations[0]}</p>
          </div>
          <div className="flex w-full min-w-0 flex-col gap-0.5 rounded-lg border bg-muted/50 p-4 text-left sm:col-span-2 xl:col-span-1 xl:w-56">
            <span className="text-xs text-muted-foreground">Target role</span>
            <strong className="font-heading text-base font-semibold">{assessment.target_role}</strong>
            <small className="text-xs text-muted-foreground">Assessed {formatDateTime(assessment.assessed_at)}</small>
          </div>
        </div>
      </UiCard>

      <Tabs value={tab} onValueChange={(value) => setTab(value as ResultTab)} className="min-w-0 gap-4 lg:gap-6">
        <TabsList className="no-print w-full print:hidden sm:w-fit pointer-coarse:h-auto!">
          {(
            [
              ["overview", "Overview"],
              ["gaps", `Skill gaps (${assessment.gaps.length})`],
              ["report", "Full report"],
            ] as const
          ).map(([id, label]) => (
            <TabsTrigger key={id} value={id} className="px-3 pointer-coarse:min-h-11">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="flex min-w-0 flex-col gap-4 lg:gap-6">
          <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-6">
            <Card title="Readiness breakdown">
              <div className="flex flex-col gap-4">
                {components.map((key) => (
                  <div key={key} className="flex flex-col gap-2">
                    <div className="flex min-h-8 flex-wrap items-center justify-between gap-x-3 gap-y-1 pointer-coarse:min-h-11">
                      <span className="min-w-0 text-sm font-medium">
                        {COMPONENT_LABELS[key]} <small className="text-xs font-normal text-muted-foreground">· {Math.round(COMPONENT_WEIGHTS[key] * 100)}%</small>
                      </span>
                      <span className="ml-auto flex items-center gap-3">
                        <strong className="text-sm font-semibold tabular-nums">{assessment.component_scores[key]}%</strong>
                        {assessment.component_scores[key] < 60 && (
                          <Link
                            to={COMPONENT_LINKS[key]}
                            className="inline-flex items-center gap-1 rounded-md text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline pointer-coarse:min-h-11"
                          >
                            Improve <ArrowRight size={12} />
                          </Link>
                        )}
                      </span>
                    </div>
                    <Progress
                      value={assessment.component_scores[key]}
                      tone={assessment.component_scores[key] >= 75 ? "green" : assessment.component_scores[key] >= 50 ? "violet" : "blue"}
                    />
                  </div>
                ))}
              </div>
            </Card>
            <Card title="What stood out">
              <ul className="flex flex-col gap-3">
                {assessment.strengths.map((text) => (
                  <li key={text} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                    <strong className="text-sm font-medium">{text}</strong>
                  </li>
                ))}
              </ul>
              {assessment.strengths.length > 0 && assessment.gaps.length > 0 && <Separator className="my-4" />}
              <ul className="flex flex-col gap-3">
                {assessment.gaps.slice(0, 3).map((gap) => (
                  <li key={gap.tag} className="flex items-start gap-3">
                    <Zap className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                    <span className="flex min-w-0 flex-col">
                      <strong className="text-sm font-medium">{gap.skill}</strong>
                      <small className="text-xs text-muted-foreground">
                        Estimated {gap.score}% · {gap.priority} priority
                      </small>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
          <Card title="Your action plan">
            <div className="grid gap-3 md:grid-cols-2">
              {assessment.recommendations.map((text, index) => (
                <div className="flex min-w-0 gap-3 rounded-lg border p-4" key={text}>
                  <span className="font-heading text-lg font-bold leading-none tabular-nums text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                  <div className="min-w-0">
                    <Badge tone={index < 2 ? "amber" : "slate"}>{index < 2 ? "Do first" : "Next"}</Badge>
                    <p className="pt-2 text-sm leading-relaxed">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="gaps" className="min-w-0">
          <Card
            title="Priority skill gaps"
            action={
              <UiButton asChild size="sm" className="max-sm:w-full pointer-coarse:min-h-11">
                <Link to="/learning">
                  <BookOpen size={14} /> See recommended learning
                </Link>
              </UiButton>
            }
          >
            {assessment.gaps.length === 0 ? (
              <EmptyState icon={Target} title="No significant gaps" text="Every required skill scored 70% or higher. Great work!" />
            ) : (
              <div className="flex flex-col gap-4">
                {assessment.gaps.map((gap) => (
                  <div key={gap.tag} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="min-w-0 text-sm font-medium">{gap.skill}</span>
                      <span className="flex shrink-0 items-center gap-2">
                        <small className="text-xs tabular-nums text-muted-foreground">{gap.score}%</small>
                        <Badge tone={gap.priority === "High" ? "red" : gap.priority === "Medium" ? "amber" : "blue"}>{gap.priority}</Badge>
                      </span>
                    </div>
                    <Progress value={gap.score} tone="blue" />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="report" className="min-w-0">
          <Card className="print:border-0 print:shadow-none">
            <div className="flex flex-wrap items-start gap-3 sm:flex-nowrap sm:items-center">
              <div className="grid size-9 shrink-0 place-items-center rounded-md bg-primary font-heading text-base font-bold text-primary-foreground">N</div>
              <div className="min-w-0 flex-1">
                <h2 className="font-heading text-base font-semibold leading-snug sm:text-lg">NextHire AI · Career Readiness Report</h2>
                <p className="text-sm text-muted-foreground">
                  {candidateName} · {assessment.target_role} · {formatDate(assessment.assessed_at)}
                </p>
              </div>
              <Button variant="secondary" size="sm" className="no-print max-sm:w-full print:hidden" onClick={() => window.print()}>
                <Printer size={14} /> Print / PDF
              </Button>
            </div>
            <Separator className="my-5" />
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1 rounded-lg border bg-muted/50 p-4">
                <span className="text-xs text-muted-foreground">Overall readiness</span>
                <strong className="text-sm font-semibold">
                  {assessment.overall_score}/100 · {level.label}
                </strong>
              </div>
              <div className="flex flex-col gap-1 rounded-lg border bg-muted/50 p-4">
                <span className="text-xs text-muted-foreground">Strongest area</span>
                <strong className="text-sm font-semibold">
                  {COMPONENT_LABELS[[...components].sort((a, b) => assessment.component_scores[b] - assessment.component_scores[a])[0]]}
                </strong>
              </div>
              <div className="flex flex-col gap-1 rounded-lg border bg-muted/50 p-4">
                <span className="text-xs text-muted-foreground">Priority focus</span>
                <strong className="text-sm font-semibold">{assessment.gaps[0]?.skill ?? "Keep practising"}</strong>
              </div>
            </div>
            <h3 className={reportHeading}>Summary</h3>
            <p className={reportText}>{assessment.summary}</p>
            <h3 className={reportHeading}>Component scores</h3>
            <p className={reportText}>{components.map((key) => `${COMPONENT_LABELS[key]}: ${assessment.component_scores[key]}%`).join(" · ")}</p>
            <h3 className={reportHeading}>Skill gaps</h3>
            <p className={reportText}>
              {assessment.gaps.length ? assessment.gaps.map((gap) => `${gap.skill} (${gap.score}%, ${gap.priority})`).join(", ") : "None identified."}
            </p>
            <h3 className={reportHeading}>Recommendations</h3>
            <ul className="list-disc pt-1.5 space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
              {assessment.recommendations.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="no-print flex flex-col gap-2 print:hidden sm:flex-row sm:flex-wrap">
        <Button onClick={onRetake}>
          <RotateCcw size={15} /> Retake assessment
        </Button>
        <UiButton asChild variant="outline" className="pointer-coarse:min-h-11">
          <Link to="/progress">
            View progress <ArrowRight size={15} />
          </Link>
        </UiButton>
      </div>
      <p className="no-print flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground print:hidden">
        <Info size={13} className="mt-0.5 shrink-0" /> These results are not saved. You can retake the assessment anytime to see an updated score.
      </p>
    </div>
  )
}
