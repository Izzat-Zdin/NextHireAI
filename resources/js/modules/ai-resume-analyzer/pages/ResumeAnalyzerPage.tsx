import { useEffect, useState } from "react"
import { Link, useNavigate } from "@/lib/router"
import { ClipboardType, FileSearch, History, Lightbulb, ShieldCheck, Sparkles, UploadCloud } from "lucide-react"
import { Alert, Badge, Button, Card, PageIntro, ScoreRing, SelectField, Spinner, TextAreaField } from "@/components/ui"
import { Button as UiButton } from "@/components/shadcn/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs"
import { errorMessage, formatDate, scoreLabel, scoreTone } from "@/lib/format"
import { TARGET_ROLES } from "@/lib/skills"
import type { ResumeRow } from "@/lib/types"
import { useAuth } from "@/modules/user-management/context/AuthContext"
import AnalysisProgress from "../components/AnalysisProgress"
import ResumeUploadZone from "../components/ResumeUploadZone"
import { analyzeResume, SCORE_WEIGHTS } from "../services/resumeAnalysis"
import { MIN_TEXT_LENGTH, parsePastedText, parseResumeFile } from "../services/resumeParser"
import { listResumes, uploadAndSave } from "../services/resumeService"
import { SCORE_LABELS, type AnalysisStep } from "../types"
import { moduleLabel } from "@/components/navigation"

type InputMode = "upload" | "paste"

export default function ResumeAnalyzerPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState<InputMode>("upload")
  const [file, setFile] = useState<File | null>(null)
  const [pasted, setPasted] = useState("")
  // null = not chosen yet → falls back to the latest resume's role, else the first preset role.
  const [chosenRole, setChosenRole] = useState<string | null>(null)
  const [jobDescription, setJobDescription] = useState("")
  const [step, setStep] = useState<AnalysisStep | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [history, setHistory] = useState<ResumeRow[] | null>(null)

  useEffect(() => {
    if (!user) return
    let active = true
    listResumes(user.id, 10)
      .then((rows) => active && setHistory(rows))
      .catch(() => active && setHistory([]))
    return () => {
      active = false
    }
  }, [user])

  const busy = step !== null
  const latest = history?.[0] ?? null
  const latestRole = latest?.target_role?.trim() || null
  const targetRole = chosenRole ?? latestRole ?? TARGET_ROLES[0]
  const roleOptions = TARGET_ROLES.includes(targetRole) ? TARGET_ROLES : [targetRole, ...TARGET_ROLES]
  const pastedLength = pasted.replace(/\s/g, "").length
  const canSubmit = !busy && (mode === "upload" ? Boolean(file) : pastedLength >= MIN_TEXT_LENGTH)

  const analyse = async () => {
    if (!user) return setError("You are not signed in.")
    setError(null)
    if (mode === "upload" && !file) return setError("Choose a resume file first.")

    try {
      setStep("reading")
      const parsed = mode === "upload" && file ? await parseResumeFile(file) : parsePastedText(pasted)

      setStep("analysing")
      // Yield a frame so the step indicator updates before the synchronous analysis runs.
      await new Promise((resolve) => window.setTimeout(resolve, 250))
      const analysis = analyzeResume({ text: parsed.text, targetRole, jobDescription })
      const analyzedAt = new Date().toISOString()

      setStep("saving")
      const { row, warning } = await uploadAndSave({
        userId: user.id,
        file: mode === "upload" ? file : null,
        text: parsed.text,
        targetRole,
        jobDescription,
        analysis,
        analyzedAt,
      })
      navigate(`/resume/${row.analysis_id}`, { state: { warning } })
    } catch (err) {
      setError(errorMessage(err))
      setStep(null)
    }
  }

  return (
    <>
      <PageIntro
        eyebrow={moduleLabel(2)}
        title="AI Resume Analyzer"
        description="Upload your resume to get an instant score, see which skills recruiters for your target role expect, and get specific, prioritised improvements."
        action={
          <UiButton asChild variant="outline" className="pointer-coarse:min-h-11">
            <Link to="/resume/history">
              <History /> View history
            </Link>
          </UiButton>
        }
      />

      <div className="grid items-start gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
        <Card title="Analyse your resume">
          <Tabs value={mode} onValueChange={(value) => setMode(value as InputMode)} className="gap-4">
            <TabsList aria-label="Resume input method" className="max-sm:w-full pointer-coarse:h-auto!">
              <TabsTrigger value="upload" disabled={busy} className="px-3 pointer-coarse:h-11">
                <UploadCloud /> Upload file
              </TabsTrigger>
              <TabsTrigger value="paste" disabled={busy} className="px-3 pointer-coarse:h-11">
                <ClipboardType /> Paste text
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload">
              <ResumeUploadZone
                file={file}
                disabled={busy}
                onFile={(selected) => {
                  setFile(selected)
                  setError(null)
                }}
                onRemove={() => setFile(null)}
                onError={setError}
              />
            </TabsContent>
            <TabsContent value="paste" className="[&_textarea]:min-h-64">
              <TextAreaField
                label="Resume text"
                value={pasted}
                onChange={setPasted}
                rows={12}
                disabled={busy}
                placeholder="Paste the full text of your resume here — contact details, summary, experience, education, skills…"
              />
              <p className="mt-1.5 text-xs text-muted-foreground tabular-nums">
                {pastedLength < MIN_TEXT_LENGTH
                  ? `${pastedLength}/${MIN_TEXT_LENGTH} characters minimum`
                  : `${pasted.trim().split(/\s+/).length} words`}
              </p>
            </TabsContent>
          </Tabs>

          <div className="mt-5 grid gap-4 [&_textarea]:min-h-28">
            <SelectField label="Target role" value={targetRole} options={roleOptions} onChange={setChosenRole} disabled={busy} />
            <TextAreaField
              label="Job description (optional)"
              value={jobDescription}
              onChange={setJobDescription}
              rows={5}
              disabled={busy}
              placeholder="Paste a job posting to check how well your resume matches its keywords."
            />
          </div>

          {error && (
            <div className="mt-4">
              <Alert tone="error" onClose={() => setError(null)}>{error}</Alert>
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> Analysed in your browser — files are stored privately in your account.
            </p>
            <Button onClick={analyse} disabled={!canSubmit} className="max-sm:w-full">
              {busy ? <Spinner label="Analysing…" /> : <><Sparkles size={16} /> Analyse resume</>}
            </Button>
          </div>

          {step && <AnalysisProgress step={step} />}
        </Card>

        <div className="flex min-w-0 flex-col gap-4 sm:gap-6">
          {history === null ? (
            <Card>
              <div className="flex justify-center py-8 text-muted-foreground">
                <Spinner />
              </div>
            </Card>
          ) : latest ? (
            <Card className="items-center text-center">
              <p className="mb-4 self-start text-sm font-medium text-muted-foreground">Latest analysis</p>
              <ScoreRing value={latest.overall_score} label="Score" />
              <h3 className="mt-4 font-heading text-lg font-semibold">{scoreLabel(latest.overall_score)}</h3>
              <p className="mt-1 w-full min-w-0 text-sm text-muted-foreground">
                <span className="block truncate font-medium text-foreground">{latest.file_name}</span>
                {latest.target_role} · {formatDate(latest.analyzed_at)}
              </p>
              <div className="mt-5 flex w-full flex-col gap-2">
                <UiButton asChild className="w-full pointer-coarse:min-h-11">
                  <Link to={`/resume/${latest.analysis_id}`}>
                    <FileSearch /> View report
                  </Link>
                </UiButton>
                <UiButton asChild variant="ghost" size="sm" className="w-full pointer-coarse:min-h-11">
                  <Link to="/resume/history">
                    <History /> All analyses ({history.length}
                    {history.length >= 10 ? "+" : ""})
                  </Link>
                </UiButton>
              </div>
            </Card>
          ) : (
            <Card title="Tips for a strong resume">
              <ul className="ml-4 list-disc space-y-2 text-sm text-muted-foreground marker:text-foreground/40">
                <li>Use standard headings: Summary, Experience, Education, Skills, Projects.</li>
                <li>Start bullets with action verbs — Built, Led, Analysed, Improved.</li>
                <li>Add numbers: users, % growth, time saved, RM value, team size.</li>
                <li>Mirror the skills listed in job posts for your target role.</li>
                <li>Keep it to 1–2 pages (about 300–900 words), single column.</li>
              </ul>
            </Card>
          )}

          <Card title="What we check">
            <ul className="flex flex-col divide-y">
              {(Object.keys(SCORE_WEIGHTS) as (keyof typeof SCORE_WEIGHTS)[]).map((key) => (
                <li key={key} className="flex min-h-10 items-center justify-between gap-3 text-sm">
                  <span>{SCORE_LABELS[key]}</span>
                  <Badge tone="slate">{Math.round(SCORE_WEIGHTS[key] * 100)}%</Badge>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-start gap-2.5 rounded-lg border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-foreground" aria-hidden="true" />
              <span>Adding a job description gives a sharper keyword match for a specific application.</span>
            </div>
          </Card>

          {history && history.length > 1 && (
            <Card title="Recent scores">
              <div className="-mx-2 flex flex-col">
                {history.slice(0, 4).map((row) => (
                  <Link
                    key={row.analysis_id}
                    to={`/resume/${row.analysis_id}`}
                    className="flex min-h-12 items-center justify-between gap-3 rounded-md px-2 py-1.5 outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <span className="min-w-0">
                      <strong className="block truncate text-sm font-medium">{row.file_name}</strong>
                      <small className="block text-xs text-muted-foreground">{formatDate(row.analyzed_at)}</small>
                    </span>
                    <Badge tone={scoreTone(row.overall_score)}>{Math.round(row.overall_score)}</Badge>
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
