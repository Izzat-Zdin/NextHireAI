import { Link } from "@/lib/router"
import { Bookmark, BookmarkCheck, CircleCheck, CircleCheckBig, ExternalLink, Play, Sparkles } from "lucide-react"
import { Badge, Button, Progress } from "@/components/ui"
import { Button as UiButton } from "@/components/shadcn/button"
import { Card as UiCard } from "@/components/shadcn/card"
import { formatDate } from "@/lib/format"
import type { RankedResource } from "@/lib/insights"
import { skillLabel } from "@/lib/skills"
import type { LearningProgressRow } from "@/lib/types"
import type { LearningActions } from "../hooks/useLearningProgress"
import { DEFAULT_TYPE_ICON, isSafeUrl, PRIORITY_TONE, STATUS_LABEL, STATUS_TONE, TYPE_ICON, typeLabel } from "../resourceMeta"
import { ProgressSlider } from "./ProgressSlider"

export function ResourceCard({
  item,
  progress,
  pending,
  actions,
  showProgressControls = false,
}: {
  item: RankedResource
  progress?: LearningProgressRow
  pending: boolean
  actions: LearningActions
  /** Show the progress slider (used in "My learning plan"). */
  showProgressControls?: boolean
}) {
  const { resource, priority, reason } = item
  const TypeIcon = TYPE_ICON[resource.resource_type] ?? DEFAULT_TYPE_ICON
  const status = progress?.status
  const percent = progress?.progress_percent ?? 0
  const tags = resource.skill_tags.map(skillLabel)
  const bookmarkTitle = !progress ? "Save to plan" : status === "Not Started" ? "Remove from plan" : "In your learning plan"

  return (
    <UiCard className="h-full min-w-0 gap-0 p-0">
      <div className="flex items-start justify-between gap-3 px-5 pt-5">
        <div className="grid size-10 shrink-0 place-items-center rounded-md border bg-muted text-foreground">
          <TypeIcon className="size-5" strokeWidth={1.75} aria-hidden="true" />
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          <Badge tone={PRIORITY_TONE[priority]}>{priority} priority</Badge>
          {status && <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-col gap-1.5">
          <Badge tone="blue">{typeLabel(resource.resource_type)}</Badge>
          <h3 className="font-heading text-base leading-snug font-semibold [overflow-wrap:anywhere]">
            <Link
              to={`/learning/${resource.resource_id}`}
              className="rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:-my-3 pointer-coarse:inline-block pointer-coarse:py-3"
            >
              {resource.title}
            </Link>
          </h3>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Builds:</span> {resource.skill_name || tags[0] || "General career skills"}
          </p>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 3).map((tag) => (
              <Badge key={tag} tone="slate">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && <Badge tone="slate">+{tags.length - 3}</Badge>}
          </div>
        )}

        <p className="flex items-start gap-2 text-sm leading-snug text-muted-foreground">
          <Sparkles className="mt-0.5 size-3.5 shrink-0 text-foreground" aria-hidden="true" />
          <span>{reason}</span>
        </p>

        {progress && status !== "Completed" && (showProgressControls || status === "In Progress") && (
          <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-3">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Progress</span>
              {!showProgressControls && <span className="font-semibold text-foreground tabular-nums">{percent}%</span>}
            </div>
            <Progress value={percent} tone="violet" />
            {showProgressControls && (
              <ProgressSlider
                value={percent}
                label={`Progress for ${resource.title}`}
                onCommit={(value) => void actions.setPercent(resource, value)}
              />
            )}
          </div>
        )}

        {status === "Completed" && (
          <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            <CircleCheckBig className="size-3.5 shrink-0" aria-hidden="true" /> Completed{" "}
            {progress?.completed_at ? `on ${formatDate(progress.completed_at)}` : ""}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-2 border-t pt-4">
          <Button
            variant="secondary"
            size="icon"
            title={bookmarkTitle}
            disabled={pending || (!!progress && status !== "Not Started")}
            onClick={() => void actions.toggleSave(resource)}
          >
            {progress ? <BookmarkCheck /> : <Bookmark />}
          </Button>

          {(!status || status === "Not Started") && (
            <Button size="sm" disabled={pending} onClick={() => void actions.start(resource)}>
              <Play /> Start learning
            </Button>
          )}
          {status === "In Progress" && (
            <Button size="sm" disabled={pending} onClick={() => void actions.complete(resource)}>
              <CircleCheck /> Mark completed
            </Button>
          )}
          {status === "Completed" && <Badge tone="green">Completed</Badge>}

          {isSafeUrl(resource.resource_url) && (
            <UiButton asChild variant="ghost" size="sm" className="ml-auto pointer-coarse:min-h-11">
              <a href={resource.resource_url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${resource.title} in a new tab`}>
                <ExternalLink /> Open
              </a>
            </UiButton>
          )}
        </div>
      </div>
    </UiCard>
  )
}
