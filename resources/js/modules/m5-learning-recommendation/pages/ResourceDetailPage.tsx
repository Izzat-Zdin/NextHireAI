import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useParams } from "@/lib/router"
import { ArrowLeft, Bookmark, CircleCheck, CircleCheckBig, ExternalLink, FileQuestion, Play, RotateCcw, Trash2 } from "lucide-react"
import { Alert, Badge, Button, Card, EmptyState, LoadingState, PageIntro, Progress } from "@/components/ui"
import { Button as UiButton } from "@/components/shadcn/button"
import { Separator } from "@/components/shadcn/separator"
import { errorMessage, formatDate } from "@/lib/format"
import { fetchLearningProgress, fetchResources } from "@/lib/insights"
import { skillLabel } from "@/lib/skills"
import type { LearningResource } from "@/lib/types"
import { useAuth } from "@/modules/m1-user-management/context/AuthContext"
import { ProgressSlider } from "../components/ProgressSlider"
import { useLearningProgress } from "../hooks/useLearningProgress"
import { learningService } from "../services/learningService"
import { DEFAULT_TYPE_ICON, isSafeUrl, STATUS_LABEL, STATUS_TONE, TYPE_ICON, typeLabel } from "../resourceMeta"
import { moduleLabel } from "@/components/navigation"

const RELATED_LIMIT = 4

export default function ResourceDetailPage() {
  const { resourceId = "" } = useParams()
  const { user } = useAuth()
  const userId = user?.id
  const { setProgress, byResource, pending, error, setError, flash, setFlash, actions } = useLearningProgress(userId)

  const [resource, setResource] = useState<LearningResource | null>(null)
  const [catalogue, setCatalogue] = useState<LearningResource[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setLoadError(null)
    try {
      const [row, progressRows, all] = await Promise.all([
        learningService.fetchResource(resourceId),
        fetchLearningProgress(userId),
        fetchResources(),
      ])
      setResource(row)
      setProgress(progressRows)
      setCatalogue(all)
    } catch (err) {
      setLoadError(errorMessage(err, "Could not load this resource."))
    } finally {
      setLoading(false)
    }
  }, [resourceId, userId, setProgress])

  useEffect(() => {
    void load()
  }, [load])

  const related = useMemo(() => {
    if (!resource) return []
    const tags = new Set(resource.skill_tags)
    return catalogue
      .filter((item) => item.resource_id !== resource.resource_id)
      .map((item) => ({ item, shared: item.skill_tags.filter((tag) => tags.has(tag)) }))
      .filter((entry) => entry.shared.length > 0)
      .sort((a, b) => b.shared.length - a.shared.length || a.item.title.localeCompare(b.item.title))
      .slice(0, RELATED_LIMIT)
  }, [resource, catalogue])

  if (loading) return <LoadingState label="Loading resource…" />

  if (loadError) {
    return (
      <Card>
        <EmptyState
          icon={FileQuestion}
          title="Could not load this resource"
          text={loadError}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={() => void load()}>
                <RotateCcw /> Try again
              </Button>
              <UiButton asChild variant="outline" className="pointer-coarse:min-h-11">
                <Link to="/learning">Back to learning</Link>
              </UiButton>
            </div>
          }
        />
      </Card>
    )
  }

  if (!resource) {
    return (
      <Card>
        <EmptyState
          icon={FileQuestion}
          title="Resource not found"
          text="This learning resource does not exist or is no longer available."
          action={
            <UiButton asChild className="pointer-coarse:min-h-11">
              <Link to="/learning">
                <ArrowLeft /> Back to learning
              </Link>
            </UiButton>
          }
        />
      </Card>
    )
  }

  const row = byResource.get(resource.resource_id)
  const status = row?.status
  const percent = row?.progress_percent ?? 0
  const busy = !!pending[resource.resource_id]
  const TypeIcon = TYPE_ICON[resource.resource_type] ?? DEFAULT_TYPE_ICON
  const type = typeLabel(resource.resource_type)
  const hasLink = isSafeUrl(resource.resource_url)

  return (
    <div className="@container/page">
      <UiButton asChild variant="ghost" size="sm" className="mb-3 -ml-2 text-muted-foreground pointer-coarse:min-h-11">
        <Link to="/learning">
          <ArrowLeft /> Back to learning
        </Link>
      </UiButton>

      <PageIntro
        eyebrow={moduleLabel(5)}
        title={resource.title}
        description={[type, resource.skill_name ? `Builds ${resource.skill_name}` : null].filter(Boolean).join(" · ")}
        action={
          hasLink ? (
            <UiButton asChild className="pointer-coarse:min-h-11">
              <a href={resource.resource_url ?? undefined} target="_blank" rel="noopener noreferrer">
                <ExternalLink /> Open resource
              </a>
            </UiButton>
          ) : undefined
        }
      />

      {error && (
        <Alert tone="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {flash && (
        <Alert tone="success" onClose={() => setFlash(null)}>
          {flash}
        </Alert>
      )}

      <div className="grid items-start gap-4 @4xl/page:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
        <div className="flex min-w-0 flex-col gap-4">
          <Card>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-md border bg-muted text-foreground">
                  <TypeIcon className="size-5" strokeWidth={1.75} aria-hidden="true" />
                </div>
                <h2 className="font-heading text-base leading-tight font-semibold">About this resource</h2>
              </div>
              <Badge tone="blue">{type}</Badge>
            </div>

            <dl className="divide-y rounded-lg border text-sm">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3">
                <dt className="text-muted-foreground">Type</dt>
                <dd className="font-medium">{type}</dd>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3">
                <dt className="text-muted-foreground">Builds</dt>
                <dd className="font-medium">{resource.skill_name || "—"}</dd>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3">
                <dt className="text-muted-foreground">Link</dt>
                <dd className="min-w-0 font-medium [overflow-wrap:anywhere]">
                  {hasLink ? (
                    <a
                      href={resource.resource_url ?? undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 underline underline-offset-4 pointer-coarse:-my-3 pointer-coarse:py-3"
                    >
                      {new URL(resource.resource_url ?? "").hostname}
                      <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
                    </a>
                  ) : (
                    "No link provided"
                  )}
                </dd>
              </div>
            </dl>

            <h3 className="mt-5 mb-2 text-sm font-semibold">Skills you will build</h3>
            {resource.skill_tags.length ? (
              <div className="flex flex-wrap gap-1.5">
                {resource.skill_tags.map((tag) => (
                  <Badge key={tag} tone="violet">
                    {skillLabel(tag)}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No skills tagged.</p>
            )}
          </Card>

          <Card title="Related resources">
            {related.length ? (
              <ul className="-my-3 divide-y">
                {related.map(({ item, shared }) => {
                  const itemStatus = byResource.get(item.resource_id)?.status
                  const Icon = TYPE_ICON[item.resource_type] ?? DEFAULT_TYPE_ICON
                  return (
                    <li key={item.resource_id} className="flex items-start gap-3 py-3">
                      <div className="grid size-9 shrink-0 place-items-center rounded-md border bg-muted text-foreground">
                        <Icon className="size-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-1.5 @xl/page:flex-row @xl/page:items-start @xl/page:justify-between @xl/page:gap-3">
                          <Link
                            to={`/learning/${item.resource_id}`}
                            className="text-sm leading-snug font-medium underline-offset-4 [overflow-wrap:anywhere] hover:underline pointer-coarse:-my-3 pointer-coarse:inline-block pointer-coarse:py-3"
                          >
                            {item.title}
                          </Link>
                          {itemStatus && <Badge tone={STATUS_TONE[itemStatus]}>{STATUS_LABEL[itemStatus]}</Badge>}
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {[typeLabel(item.resource_type), item.skill_name].filter(Boolean).join(" · ")}
                        </p>
                        <p className="text-sm text-muted-foreground">Also builds: {shared.map(skillLabel).join(", ")}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No other resources share these skills yet.</p>
            )}
          </Card>
        </div>

        <Card
          title="Your progress"
          action={status ? <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge> : <Badge tone="slate">Not in plan</Badge>}
        >
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Completion</span>
            <span className="font-semibold tabular-nums">{percent}%</span>
          </div>
          <Progress value={percent} tone={status === "Completed" ? "green" : "violet"} />
          <div className="mt-3">
            <ProgressSlider
              value={percent}
              label={`Progress for ${resource.title}`}
              disabled={busy}
              onCommit={(value) => void actions.setPercent(resource, value)}
            />
            <p className="mt-2 text-xs text-muted-foreground">Drag to update your progress. 100% marks the resource as completed.</p>
          </div>

          <Separator className="my-4" />

          <div className="flex flex-wrap gap-2">
            {!row && (
              <Button variant="secondary" size="sm" disabled={busy} onClick={() => void actions.save(resource)}>
                <Bookmark /> Save to plan
              </Button>
            )}
            {(!status || status === "Not Started") && (
              <Button size="sm" disabled={busy} onClick={() => void actions.start(resource)}>
                <Play /> Start learning
              </Button>
            )}
            {status === "In Progress" && (
              <Button size="sm" disabled={busy} onClick={() => void actions.complete(resource)}>
                <CircleCheck /> Mark completed
              </Button>
            )}
            {status === "Completed" && (
              <Button variant="secondary" size="sm" disabled={busy} onClick={() => void actions.start(resource)}>
                <RotateCcw /> Restart
              </Button>
            )}
            {row && (
              <Button variant="ghost" size="sm" disabled={busy} onClick={() => void actions.remove(resource)}>
                <Trash2 /> Remove from plan
              </Button>
            )}
          </div>

          {status === "Completed" && row?.completed_at && (
            <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
              <CircleCheckBig className="size-3.5 shrink-0" aria-hidden="true" /> Completed on {formatDate(row.completed_at)}
            </p>
          )}
        </Card>
      </div>
    </div>
  )
}
