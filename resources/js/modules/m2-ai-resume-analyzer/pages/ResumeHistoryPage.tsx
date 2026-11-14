import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "@/lib/router"
import { ChevronRight, Eye, FileText, Plus, Trash2, TrendingUp, Trophy } from "lucide-react"
import { Alert, Badge, Button, Card, EmptyState, LoadingState, PageIntro, StatCard, TrendChart } from "@/components/ui"
import { Button as UiButton } from "@/components/shadcn/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table"
import { errorMessage, formatDate, scoreTone } from "@/lib/format"
import type { ResumeRow } from "@/lib/types"
import { useAuth } from "@/modules/m1-user-management/context/AuthContext"
import DeleteResumeModal from "../components/DeleteResumeModal"
import { listResumes } from "../services/resumeService"
import { moduleLabel } from "@/components/navigation"

const TREND_POINTS = 10

export default function ResumeHistoryPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [rows, setRows] = useState<ResumeRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<ResumeRow | null>(null)

  useEffect(() => {
    if (!user) return
    let active = true
    listResumes(user.id, 100)
      .then((data) => active && setRows(data))
      .catch((err) => {
        if (!active) return
        setError(errorMessage(err))
        setRows([])
      })
    return () => {
      active = false
    }
  }, [user])

  const trend = useMemo(() => {
    const points = (rows ?? []).slice(0, TREND_POINTS).reverse() // oldest → newest
    return {
      values: points.map((row) => Math.round(row.overall_score)),
      labels: points.map((row) => formatDate(row.analyzed_at, { day: "numeric", month: "short" })),
    }
  }, [rows])

  if (rows === null) return <LoadingState label="Loading your analyses…" />

  const latest = rows[0]
  const previous = rows[1]
  const best = Math.round(rows.reduce((max, row) => Math.max(max, row.overall_score), 0))
  const change = latest && previous ? Math.round(latest.overall_score - previous.overall_score) : null

  return (
    <>
      <PageIntro
        eyebrow={moduleLabel(2)}
        title="Resume history"
        description="Track how your resume score improves as you apply the suggestions."
        action={
          <UiButton asChild className="pointer-coarse:min-h-11">
            <Link to="/resume">
              <Plus /> New analysis
            </Link>
          </UiButton>
        }
      />

      {error && <Alert tone="error" onClose={() => setError(null)}>{error}</Alert>}

      {!rows.length ? (
        <Card>
          <EmptyState
            icon={FileText}
            title="No analyses yet"
            text="Upload your resume to get a score, matched keywords and prioritised improvements."
            action={
              <UiButton asChild className="pointer-coarse:min-h-11">
                <Link to="/resume">
                  <Plus /> Analyse my resume
                </Link>
              </UiButton>
            }
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-4 sm:gap-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard icon={FileText} label="Analyses" value={String(rows.length)} meta="Total reports saved" tone="blue" />
            <StatCard icon={Trophy} label="Best score" value={`${best}`} meta="Highest overall score" tone="green" />
            <StatCard
              icon={TrendingUp}
              label="Latest score"
              value={`${Math.round(latest.overall_score)}`}
              meta={change === null ? formatDate(latest.analyzed_at) : `${change >= 0 ? "+" : ""}${change} vs previous`}
              tone={change !== null && change < 0 ? "amber" : "violet"}
            />
          </div>

          <Card title="Score trend" action={<small className="text-xs text-muted-foreground">Last {trend.values.length} analyses</small>}>
            <TrendChart values={trend.values} labels={trend.labels} />
          </Card>

          <Card title="All analyses">
            {/* Phones: stacked rows. */}
            <ul className="-mx-2 flex flex-col divide-y md:hidden">
              {rows.map((row) => (
                <li key={row.analysis_id} className="flex items-center gap-1 py-1">
                  <Link
                    to={`/resume/${row.analysis_id}`}
                    className="flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-md px-2 py-2 outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-md border bg-muted">
                      <FileText className="size-4" aria-hidden="true" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <strong className="truncate text-sm font-medium" title={row.file_name}>{row.file_name}</strong>
                      <small className="truncate text-xs text-muted-foreground">{row.target_role}</small>
                      <small className="truncate text-xs text-muted-foreground">
                        {formatDate(row.analyzed_at)} · {row.file_path ? "Uploaded file" : "Pasted text"}
                      </small>
                    </span>
                    <Badge tone={scoreTone(row.overall_score)}>{Math.round(row.overall_score)}</Badge>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  </Link>
                  <Button variant="ghost" size="icon" title="Delete analysis" onClick={() => setToDelete(row)}>
                    <Trash2 size={16} />
                  </Button>
                </li>
              ))}
            </ul>

            {/* Tablet and desktop: table. */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-muted-foreground">File</TableHead>
                    <TableHead className="text-muted-foreground">Target role</TableHead>
                    <TableHead className="text-muted-foreground">Score</TableHead>
                    <TableHead className="text-muted-foreground">Date</TableHead>
                    <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.analysis_id} className="cursor-pointer" onClick={() => navigate(`/resume/${row.analysis_id}`)}>
                      <TableCell className="py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="grid size-8 shrink-0 place-items-center rounded-md border bg-muted">
                            <FileText className="size-4" aria-hidden="true" />
                          </span>
                          <div className="flex min-w-0 flex-col">
                            <strong className="block max-w-[260px] truncate font-medium" title={row.file_name}>{row.file_name}</strong>
                            <small className="text-xs text-muted-foreground">{row.file_path ? "Uploaded file" : "Pasted text"}</small>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{row.target_role}</TableCell>
                      <TableCell>
                        <Badge tone={scoreTone(row.overall_score)}>{Math.round(row.overall_score)}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(row.analyzed_at)}</TableCell>
                      <TableCell onClick={(event) => event.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" title="View report" onClick={() => navigate(`/resume/${row.analysis_id}`)}>
                            <Eye size={16} />
                          </Button>
                          <Button variant="ghost" size="icon" title="Delete analysis" onClick={() => setToDelete(row)}>
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      )}

      {toDelete && (
        <DeleteResumeModal
          resume={toDelete}
          onClose={() => setToDelete(null)}
          onDeleted={() => {
            setRows((current) => (current ?? []).filter((row) => row.analysis_id !== toDelete.analysis_id))
            setToDelete(null)
          }}
        />
      )}
    </>
  )
}
