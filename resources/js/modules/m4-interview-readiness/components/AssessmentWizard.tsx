import { useMemo, useState } from "react"
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Sparkles } from "lucide-react"
import { Badge, Button, Card, Progress, SelectField } from "@/components/ui"
import { Separator } from "@/components/shadcn/separator"
import { TARGET_ROLES } from "@/lib/skills"
import { cn } from "@/lib/utils"
import { SOFT_QUESTIONS, skillQuestions, type SelfQuestion } from "../services/assessmentEngine"

export interface EvidenceSummary {
  resumeScore: number | null
  interviewCount: number
  learningCompleted: number
}

function RatingRow({ question, value, onChange }: { question: SelfQuestion; value?: number; onChange: (value: number) => void }) {
  return (
    <div className="flex flex-col gap-3 border-b py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <strong className="block text-sm font-semibold">{question.title}</strong>
        <p className="pt-0.5 text-sm leading-relaxed text-muted-foreground">{question.hint}</p>
      </div>
      <div className="flex shrink-0 gap-1.5" role="radiogroup" aria-label={question.title}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            className={cn(
              "grid size-10 place-items-center rounded-md border text-sm font-medium tabular-nums shadow-xs transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:size-11",
              value === n
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-background hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:hover:bg-input/50",
            )}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

const SCORE_WEIGHTS: [string, string][] = [
  ["Interview performance", "35%"],
  ["Skill alignment", "30%"],
  ["Resume quality", "20%"],
  ["Soft skills (self-rated)", "10%"],
  ["Learning activity", "5%"],
]

export function AssessmentWizard({
  defaultRole,
  evidence,
  onCancel,
  onSubmit,
}: {
  defaultRole: string
  evidence: EvidenceSummary
  onCancel?: () => void
  onSubmit: (role: string, ratings: Record<string, number>) => void
}) {
  const [step, setStep] = useState(0)
  const [role, setRole] = useState(defaultRole)
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const skills = useMemo(() => skillQuestions(role), [role])
  const steps = ["Target role", "Technical skills", "Interview & soft skills", "Review"]
  const skillsDone = skills.every((q) => ratings[q.id])
  const softDone = SOFT_QUESTIONS.every((q) => ratings[q.id])
  const rate = (id: string, value: number) => setRatings((current) => ({ ...current, [id]: value }))

  const evidenceItems: [string, boolean, string][] = [
    ["Resume analysis", evidence.resumeScore !== null, evidence.resumeScore !== null ? `Latest score ${evidence.resumeScore}/100` : "Not analysed yet"],
    ["Mock interviews", evidence.interviewCount > 0, `${evidence.interviewCount} completed`],
    ["Learning", evidence.learningCompleted > 0, `${evidence.learningCompleted} resources completed`],
  ]

  const sectionTitle = "font-heading text-lg font-semibold leading-snug tracking-tight"

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-6">
      <Card>
        <div className="mb-2 flex items-center justify-between gap-3 text-sm">
          <span className="min-w-0 font-medium">
            Step {step + 1} of {steps.length} <span className="text-muted-foreground">· {steps[step]}</span>
          </span>
          <span className="shrink-0 tabular-nums text-muted-foreground">{Math.round(((step + 1) / steps.length) * 100)}%</span>
        </div>
        <Progress value={((step + 1) / steps.length) * 100} tone="violet" />

        <div className="mt-6">
          {step === 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h2 className={sectionTitle}>Which role are you preparing for?</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">Your readiness is measured against the skills this role usually requires.</p>
              </div>
              <SelectField label="Target role" value={role} options={TARGET_ROLES} onChange={setRole} />
              <div className="flex flex-wrap gap-1.5">
                {skills.map((q) => (
                  <Badge key={q.id} tone="slate">
                    {q.title}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {step === 1 && (
            <>
              <div className="flex flex-col gap-1">
                <h2 className={sectionTitle}>Rate your skills for {role}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">Be honest — this is blended with the skills detected in your latest resume analysis.</p>
              </div>
              <div className="mt-2">
                {skills.map((q) => (
                  <RatingRow key={q.id} question={q} value={ratings[q.id]} onChange={(v) => rate(q.id, v)} />
                ))}
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <div className="flex flex-col gap-1">
                <h2 className={sectionTitle}>Interview & soft skills</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">1 = strongly disagree · 5 = strongly agree</p>
              </div>
              <div className="mt-2">
                {SOFT_QUESTIONS.map((q) => (
                  <RatingRow key={q.id} question={q} value={ratings[q.id]} onChange={(v) => rate(q.id, v)} />
                ))}
              </div>
            </>
          )}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h2 className={sectionTitle}>Ready to calculate your score</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  We combine your self-assessment with the evidence on the right. Missing evidence counts as 0, so completing those steps will raise
                  your score. Results are shown instantly and are not saved.
                </p>
              </div>
              <dl className="divide-y rounded-lg border text-sm">
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <dt className="text-muted-foreground">Target role</dt>
                  <dd className="min-w-0 text-right font-medium">{role}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <dt className="text-muted-foreground">Skills rated</dt>
                  <dd className="font-medium tabular-nums">
                    {skills.filter((q) => ratings[q.id]).length} / {skills.length}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <dt className="text-muted-foreground">Soft-skill questions answered</dt>
                  <dd className="shrink-0 font-medium tabular-nums">
                    {SOFT_QUESTIONS.filter((q) => ratings[q.id]).length} / {SOFT_QUESTIONS.length}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </div>

        <Separator className="mt-6" />
        <div className="mt-4 flex items-center justify-between gap-2">
          <Button variant="secondary" onClick={() => (step === 0 ? onCancel?.() : setStep(step - 1))} disabled={step === 0 && !onCancel}>
            <ArrowLeft size={15} /> {step === 0 ? "Cancel" : "Back"}
          </Button>
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} disabled={(step === 1 && !skillsDone) || (step === 2 && !softDone)}>
              Continue <ArrowRight size={15} />
            </Button>
          ) : (
            <Button onClick={() => onSubmit(role, ratings)}>
              <Sparkles size={15} /> Calculate readiness
            </Button>
          )}
        </div>
        {((step === 1 && !skillsDone) || (step === 2 && !softDone)) && (
          <p className="pt-3 text-right text-sm text-destructive">Rate every item to continue.</p>
        )}
      </Card>

      <div className="flex min-w-0 flex-col gap-4 lg:gap-6">
        <Card title="Evidence we will use">
          <ul className="flex flex-col gap-3">
            {evidenceItems.map(([label, ok, meta]) => (
              <li key={label} className="flex items-start gap-3">
                {ok ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-label="Available" />
                ) : (
                  <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-label="Missing" />
                )}
                <span className="flex min-w-0 flex-col">
                  <strong className="text-sm font-medium">{label}</strong>
                  <small className="text-xs text-muted-foreground">{meta}</small>
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="How the score works">
          <ul className="flex flex-col divide-y text-sm">
            {SCORE_WEIGHTS.map(([label, weight]) => (
              <li key={label} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium tabular-nums">{weight}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
