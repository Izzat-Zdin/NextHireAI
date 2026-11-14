import { useEffect, useState, type ReactNode } from "react"
import { Link, useLocation, useNavigate, useParams } from "@/lib/router"
import { AlertTriangle, ArrowRight, BookOpen, CheckCircle2, Download, FileQuestion, RotateCcw, Trash2, X, XCircle } from "lucide-react"
import { Alert, Badge, Button, Card, EmptyState, LoadingState, PageIntro, Spinner, type Tone } from "@/components/ui"
import { Button as UiButton } from "@/components/shadcn/button"
import { Separator } from "@/components/shadcn/separator"
import { errorMessage, formatDateTime } from "@/lib/format"
import { skillLabel } from "@/lib/skills"
import type { ResumeRow, ResumeSuggestion } from "@/lib/types"
import { cn } from "@/lib/utils"
import DeleteResumeModal from "../components/DeleteResumeModal"
import ScoreSummaryCard from "../components/ScoreSummaryCard"
import { countWords } from "../services/resumeAnalysis"
import { formatFileSize } from "../services/resumeParser"
import { getDownloadUrl, getResume } from "../services/resumeService"
import { SECTION_KEYS, SECTION_LABELS } from "../types"
import { moduleLabel } from "@/components/navigation"

const PRIORITY_TONE: Record<ResumeSuggestion["priority"], Tone> = { High: "red", Medium: "amber", Low: "slate" }

/** Splits "Title — detail" insight strings for the two-line insight list. */
function splitInsight(value: string) {
  const index = value.indexOf(" — ")
  if (index === -1) return { title: value, detail: "" }
  return { title: value.slice(0, index), detail: value.slice(index + 3) }
}

/** Splits stored resume.feedback into its summary paragraph(s) and "• title: detail" next-step lines. */
function parseFeedback(feedback: string | null, fallback: string | null) {
  const lines = (feedback ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const steps = lines
    .filter((line) => line.startsWith("•"))
    .map((line) => {
      const body = line.replace(/^•\s*/, "")
      const index = body.indexOf(": ")
      return index === -1 ? body : body.slice(0, index)
    })
  const text = lines.filter((line) => !line.startsWith("•")).join(" ") || fallback?.trim() || ""
  return { text, steps }
}

/** Small section label inside report cards. */
function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("mb-2 text-sm font-medium text-muted-foreground", className)}>{children}</p>
}

function EmptyLine({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>
}

function InsightList({ items, positive }: { items: string[]; positive: boolean }) {
  if (!items.length) {
    return (
      <div className="mb-5">
        <EmptyLine>{positive ? "No clear strengths detected yet." : "No major weaknesses found — nice work."}</EmptyLine>
      </div>
    )
  }
  return (
    <ul className="mb-5 flex flex-col gap-3">
      {items.map((item) => {
        const { title, detail } = splitInsight(item)
        return (
          <li key={item} className="flex items-start gap-2.5">
            {positive ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            ) : (
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            )}
            <span className="flex min-w-0 flex-col gap-0.5">
              <strong className="text-sm font-medium">{title}</strong>
              {detail && <small className="text-sm leading-relaxed text-muted-foreground">{detail}</small>}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

export default function ResumeResultPage() {
  const { resumeId } = useParams<{ resumeId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const saveWarning = (location.state as { warning?: string | null } | null)?.warning ?? null

  const [resume, setResume] = useState<ResumeRow | null | undefined>(undefined)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [warning, setWarning] = useState<string | null>(saveWarning)

  useEffect(() => {
    if (!resumeId) return
    let active = true
    setResume(undefined)
    setLoadError(null)
    getResume(resumeId)
      .then((row) => active && setResume(row))
      .catch((err) => {
        if (!active) return
        setLoadError(errorMessage(err))
        setResume(null)
      })
    return () => {
      active = false
    }
  }, [resumeId])

  if (resume === undefined) return <LoadingState label="Loading your resume report…" />

  if (!resume) {
    return (
      <Card>
        <EmptyState
          icon={FileQuestion}
          title="Report not found"
          text={loadError ?? "This analysis doesn't exist or was deleted."}
          action={
            <UiButton asChild className="pointer-coarse:min-h-11">
              <Link to="/resume/history">Back to history</Link>
            </UiButton>
          }
        />
      </Card>
    )
  }

  const download = async () => {
    if (!resume.file_path) return
    setDownloading(true)
    setActionError(null)
    try {
      const url = await getDownloadUrl(resume.file_path)
      window.open(url, "_blank", "noopener,noreferrer")
    } catch (err) {
      setActionError(errorMessage(err))
    } finally {
      setDownloading(false)
    }
  }

  const sections = resume.sections ?? {}
  const wordCount = countWords(resume.extracted_text)
  const detected = resume.detected_skills ?? []
  const matched = resume.matched_keywords ?? []
  const missing = resume.missing_keywords ?? []
  const suggestions = resume.suggestions ?? []
  const sectionsFound = SECTION_KEYS.filter((key) => sections[key]).length
  const feedback = parseFeedback(resume.feedback, resume.summary)

  const facts = [
    { label: "Word count", value: wordCount ? `${wordCount} words` : "—" },
    { label: "File size", value: formatFileSize(resume.file_size) },
    { label: "Target role", value: resume.target_role },
    { label: "Job description", value: resume.job_description ? "Compared" : "Not provided" },
  ]

  return (
    <>
      {/* File names can be long with no spaces: let the h1 wrap anywhere, and stack the actions below the title until there is room. */}
      <div className="min-w-0 [&_h1]:[overflow-wrap:anywhere] sm:max-xl:[&>div]:flex-col sm:max-xl:[&>div]:items-start">
        <PageIntro
          eyebrow={moduleLabel(2)}
          title={resume.file_name}
          description={`Analysed for ${resume.target_role} on ${formatDateTime(resume.analyzed_at)}.`}
          action={
            <>
              {resume.file_path && (
                <Button variant="secondary" onClick={download} disabled={downloading}>
                  {downloading ? <Spinner label="Preparing…" /> : <><Download size={16} /> Download original</>}
                </Button>
              )}
              <UiButton asChild className="pointer-coarse:min-h-11">
                <Link to="/resume">
                  <RotateCcw /> Analyse another
                </Link>
              </UiButton>
              <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                <Trash2 size={16} /> Delete
              </Button>
            </>
          }
        />
      </div>

      {warning && (
        <div
          role="status"
          className="mb-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{warning}</span>
          <button
            type="button"
            className="-m-1 rounded p-1 opacity-70 hover:opacity-100 pointer-coarse:p-2.5"
            onClick={() => setWarning(null)}
            aria-label="Dismiss"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
      {actionError && <Alert tone="error" onClose={() => setActionError(null)}>{actionError}</Alert>}

      <div className="grid items-start gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
        <Card title="Analysis summary">
          {feedback.text && <p className="mb-5 text-sm leading-relaxed text-muted-foreground sm:text-base">{feedback.text}</p>}

          {feedback.steps.length > 0 && (
            <div className="mb-5">
              <SectionLabel>Start with</SectionLabel>
              <ul className="flex flex-col gap-2.5">
                {feedback.steps.map((title, index) => (
                  <li key={`${title}-${index}`} className="flex items-start gap-2.5">
                    <ArrowRight className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <strong className="text-sm font-medium">{title}</strong>
                  </li>
                ))}
              </ul>
              {suggestions.length > 0 && (
                <a
                  href="#priority-improvements"
                  className="mt-2 inline-flex items-center text-sm font-medium underline underline-offset-4 hover:text-muted-foreground pointer-coarse:min-h-11"
                >
                  See all {suggestions.length} suggestions below
                </a>
              )}
            </div>
          )}

          <Separator className="mb-5" />

          <SectionLabel>Keywords matched ({matched.length})</SectionLabel>
          <div className="mb-5 flex flex-wrap gap-1.5">
            {matched.length ? (
              matched.map((keyword) => (
                <Badge key={keyword} tone="green">
                  {keyword}
                </Badge>
              ))
            ) : (
              <EmptyLine>None of the expected keywords were found.</EmptyLine>
            )}
          </div>

          <SectionLabel>Missing keywords ({missing.length})</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {missing.length ? (
              missing.map((keyword) => (
                <Badge key={keyword} tone="amber">
                  {keyword}
                </Badge>
              ))
            ) : (
              <EmptyLine>Great — every expected keyword is covered.</EmptyLine>
            )}
          </div>

          {missing.length > 0 && (
            <div className="mt-5 flex flex-col gap-3 rounded-lg border bg-muted/40 p-4 xl:flex-row xl:items-center xl:justify-between">
              <span className="text-sm text-muted-foreground">Close these gaps with curated courses and tutorials.</span>
              <UiButton asChild variant="outline" size="sm" className="self-start max-sm:w-full max-sm:self-stretch pointer-coarse:min-h-11">
                <Link to="/learning">
                  <BookOpen /> Find courses for missing skills
                </Link>
              </UiButton>
            </div>
          )}
        </Card>

        <ScoreSummaryCard score={resume.overall_score} scores={resume.scores} targetRole={resume.target_role} />
      </div>

      <div className="mb-4 mt-8 flex flex-col gap-1 sm:mt-10 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Detailed feedback</p>
          <h2 className="font-heading text-xl font-semibold tracking-tight">What we found in your resume</h2>
        </div>
        <small className="text-xs text-muted-foreground">Rule-based analysis · no external AI</small>
      </div>

      <div className="mb-4 grid items-start gap-4 sm:mb-6 sm:gap-6 lg:grid-cols-2">
        <Card title="Extracted profile" headingLevel={3}>
          <SectionLabel>Detected skills ({detected.length})</SectionLabel>
          <div className="mb-5 flex flex-wrap gap-1.5">
            {detected.length ? (
              detected.map((tag) => (
                <Badge key={tag} tone="blue">
                  {skillLabel(tag)}
                </Badge>
              ))
            ) : (
              <EmptyLine>No recognised skills detected — add a clear Skills section.</EmptyLine>
            )}
          </div>

          <SectionLabel>
            Sections ({sectionsFound}/{SECTION_KEYS.length})
          </SectionLabel>
          <ul className="grid grid-cols-2 gap-2 xl:grid-cols-3">
            {SECTION_KEYS.map((key) => (
              <li
                key={key}
                className={cn(
                  "flex min-w-0 items-center gap-2 rounded-md border px-2.5 py-2 text-sm",
                  sections[key] ? "text-foreground" : "border-dashed text-muted-foreground",
                )}
              >
                {sections[key] ? (
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                ) : (
                  <XCircle className="size-4 shrink-0 text-red-500 dark:text-red-400" aria-hidden="true" />
                )}
                <span className="min-w-0 leading-snug break-words">{SECTION_LABELS[key]}</span>
                <span className="sr-only">{sections[key] ? "(found)" : "(missing)"}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 grid grid-cols-2 gap-2">
            {facts.map((fact) => (
              <div key={fact.label} className="flex min-w-0 flex-col gap-0.5 rounded-lg border bg-muted/40 p-3">
                <dt className="text-xs text-muted-foreground">{fact.label}</dt>
                <dd className="text-sm font-semibold [overflow-wrap:anywhere]">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card title="Strengths & weaknesses" headingLevel={3}>
          <SectionLabel>Strengths</SectionLabel>
          <InsightList items={resume.strengths ?? []} positive />
          <SectionLabel>Areas to improve</SectionLabel>
          <InsightList items={resume.weaknesses ?? []} positive={false} />
        </Card>
      </div>

      <div id="priority-improvements" className="scroll-mt-6">
        <Card title="Priority improvements" action={<Badge tone="violet">{suggestions.length} suggestions</Badge>}>
          {suggestions.length ? (
            <ol className="grid gap-3 xl:grid-cols-2">
              {suggestions.map((suggestion, index) => (
                <li className="flex min-w-0 gap-3 rounded-lg border p-4" key={`${suggestion.title}-${index}`}>
                  <span className="font-heading text-sm font-semibold tabular-nums text-muted-foreground" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="flex min-w-0 flex-col items-start gap-1.5">
                    <Badge tone={PRIORITY_TONE[suggestion.priority]}>{suggestion.priority} priority</Badge>
                    <h3 className="text-sm font-semibold">{suggestion.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{suggestion.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyLine>No suggestions — your resume covers the essentials.</EmptyLine>
          )}
        </Card>
      </div>

      {confirmDelete && (
        <DeleteResumeModal
          resume={resume}
          onClose={() => setConfirmDelete(false)}
          onDeleted={() => navigate("/resume/history", { replace: true })}
        />
      )}
    </>
  )
}
