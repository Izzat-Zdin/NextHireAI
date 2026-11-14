import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "@/lib/router"
import { BookMarked, CircleCheckBig, FileText, Info, Library, RotateCcw, Search, Target, X } from "lucide-react"
import { Alert, Badge, Button, Card, EmptyState, LoadingState, PageIntro } from "@/components/ui"
import { Alert as UiAlert, AlertDescription as UiAlertDescription } from "@/components/shadcn/alert"
import { Button as UiButton } from "@/components/shadcn/button"
import { Card as UiCard } from "@/components/shadcn/card"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/shadcn/input-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs"
import { errorMessage } from "@/lib/format"
import {
  deriveSkillGaps,
  fetchLearningProgress,
  fetchResources,
  fetchResumes,
  fetchSessions,
  inferTargetRole,
  rankResources,
  type RankedResource,
} from "@/lib/insights"
import { skillLabel } from "@/lib/skills"
import type { InterviewSessionSummary, LearningResource, LearningStatus, ResourceType, ResumeRow } from "@/lib/types"
import { useAuth } from "@/modules/m1-user-management/context/AuthContext"
import { ResourceCard } from "../components/ResourceCard"
import { useLearningProgress } from "../hooks/useLearningProgress"
import { PRIORITY_TONE, RESOURCE_TYPES, typeLabel } from "../resourceMeta"
import { moduleLabel } from "@/components/navigation"

type Tab = "recommended" | "plan" | "browse"
type TypeFilter = "All" | ResourceType

const RECOMMENDED_LIMIT = 12
const STATUS_ORDER: Record<LearningStatus, number> = { "In Progress": 0, "Not Started": 1, Completed: 2 }

export default function LearningPage() {
  const { user } = useAuth()
  const userId = user?.id
  const { progress, setProgress, byResource, pending, error, setError, flash, setFlash, actions } = useLearningProgress(userId)

  const [resources, setResources] = useState<LearningResource[]>([])
  const [latestResume, setLatestResume] = useState<ResumeRow | null>(null)
  const [sessions, setSessions] = useState<InterviewSessionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [tab, setTab] = useState<Tab>("recommended")
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("All")
  const [skillFilter, setSkillFilter] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setLoadError(null)
    try {
      const [resourceRows, progressRows, resumes, sessionRows] = await Promise.all([
        fetchResources(),
        fetchLearningProgress(userId),
        fetchResumes(userId, 1),
        fetchSessions(userId),
      ])
      setResources(resourceRows)
      setProgress(progressRows)
      setLatestResume(resumes[0] ?? null)
      setSessions(sessionRows)
    } catch (err) {
      setLoadError(errorMessage(err, "Could not load learning resources."))
    } finally {
      setLoading(false)
    }
  }, [userId, setProgress])

  useEffect(() => {
    void load()
  }, [load])

  const targetRole = useMemo(
    () => inferTargetRole({ resumes: latestResume ? [latestResume] : [], sessions }),
    [latestResume, sessions],
  )

  const gaps = useMemo(() => deriveSkillGaps({ targetRole, latestResume, sessions }), [targetRole, latestResume, sessions])

  const ranked = useMemo(() => rankResources(resources, gaps, targetRole, progress), [resources, gaps, targetRole, progress])
  const rankedById = useMemo(() => new Map(ranked.map((item) => [item.resource.resource_id, item])), [ranked])

  // ----- Summary figures -----
  const priorityGaps = gaps.filter((gap) => gap.priority === "High")
  const planRows = progress.filter((row) => row.status !== "Completed")
  const inProgressCount = progress.filter((row) => row.status === "In Progress").length
  const savedCount = planRows.length - inProgressCount
  const completedCount = progress.filter((row) => row.status === "Completed").length

  // ----- Filtering -----
  const query = search.trim().toLowerCase()
  const filtersActive = query !== "" || typeFilter !== "All" || skillFilter !== null

  const matches = useCallback(
    (resource: LearningResource) => {
      if (typeFilter !== "All" && resource.resource_type !== typeFilter) return false
      if (skillFilter && !resource.skill_tags.includes(skillFilter)) return false
      if (query) {
        const haystack = [resource.title, resource.skill_name, typeLabel(resource.resource_type), ...resource.skill_tags.map(skillLabel)]
          .join(" ")
          .toLowerCase()
        if (!haystack.includes(query)) return false
      }
      return true
    },
    [typeFilter, skillFilter, query],
  )

  const recommended = useMemo(
    () =>
      ranked
        .filter((item) => byResource.get(item.resource.resource_id)?.status !== "Completed")
        .filter((item) => matches(item.resource))
        .slice(0, RECOMMENDED_LIMIT),
    [ranked, byResource, matches],
  )

  const planItems = useMemo(
    () =>
      progress
        .slice()
        .sort(
          (a, b) =>
            STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
            b.progress_percent - a.progress_percent ||
            new Date(b.completed_at ?? 0).getTime() - new Date(a.completed_at ?? 0).getTime(),
        )
        .map((row) => rankedById.get(row.resource_id))
        .filter((item): item is RankedResource => !!item),
    [progress, rankedById],
  )
  const filteredPlan = planItems.filter((item) => matches(item.resource))

  const browse = useMemo(
    () =>
      ranked
        .filter((item) => matches(item.resource))
        .sort((a, b) => a.resource.title.localeCompare(b.resource.title)),
    [ranked, matches],
  )

  const visible = tab === "recommended" ? recommended : tab === "plan" ? filteredPlan : browse

  const resetFilters = () => {
    setSearch("")
    setTypeFilter("All")
    setSkillFilter(null)
  }

  if (!userId || (loading && !resources.length && !loadError)) return <LoadingState label="Loading your learning recommendations…" />

  const gapSource = latestResume
    ? `Estimated for ${targetRole ?? "your target role"} from your latest resume${sessions.length ? " and interviews" : ""}`
    : sessions.length
      ? "Estimated from your interview practice"
      : "General career skills"

  const summary = [
    {
      icon: Target,
      title: `${priorityGaps.length} priority gap${priorityGaps.length === 1 ? "" : "s"}`,
      text: priorityGaps.length
        ? priorityGaps
            .slice(0, 3)
            .map((gap) => gap.label)
            .join(", ") + (priorityGaps.length > 3 ? ` +${priorityGaps.length - 3} more` : "")
        : gaps.length
          ? `${gaps.length} smaller gap${gaps.length === 1 ? "" : "s"} to polish`
          : "No skill gaps detected, keep it up",
    },
    {
      icon: BookMarked,
      title: `${planRows.length} resource${planRows.length === 1 ? "" : "s"} in your plan`,
      text: planRows.length ? `${inProgressCount} in progress · ${savedCount} not started` : "Save a recommendation to start your plan",
    },
    {
      icon: CircleCheckBig,
      title: `${completedCount} completed`,
      text: completedCount ? "Completed resources count towards your readiness" : "Finish a resource to see it here",
    },
  ]

  return (
    <div className="@container/page">
      <PageIntro
        eyebrow={moduleLabel(5)}
        title="Learning recommendations"
        description="Courses, certifications and practice picked to close the skill gaps for your target role. Save them to your plan, track progress and mark them complete."
        action={
          <UiButton asChild variant="outline" className="pointer-coarse:min-h-11">
            <Link to="/resume">
              <FileText /> {latestResume ? "Analyse another resume" : "Analyse a resume"}
            </Link>
          </UiButton>
        }
      />

      {!latestResume && (
        <UiAlert role="note" className="mb-4">
          <Info aria-hidden="true" />
          <UiAlertDescription className="block text-foreground">
            {targetRole ? `Recommendations are based on your ${targetRole} interview practice.` : "Recommendations are general for now."}{" "}
            <Link to="/resume" className="font-medium underline underline-offset-4">
              Analyse a resume
            </Link>{" "}
            to personalise them to your skills and target role.
          </UiAlertDescription>
        </UiAlert>
      )}

      {loadError && (
        <Alert tone="error" onClose={() => setLoadError(null)}>
          {loadError}{" "}
          <button type="button" className="font-medium underline underline-offset-4" onClick={() => void load()}>
            Try again
          </button>
        </Alert>
      )}
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

      <div className="mb-4 grid gap-3 @3xl/page:grid-cols-3">
        {summary.map(({ icon: Icon, title, text }) => (
          <UiCard key={title} className="min-w-0 flex-row items-start gap-3 p-4">
            <div className="grid size-9 shrink-0 place-items-center rounded-md border bg-muted text-foreground">
              <Icon className="size-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="font-heading text-sm font-semibold">{title}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{text}</p>
            </div>
          </UiCard>
        ))}
      </div>

      <Card
        title="Your skill gaps"
        action={<p className="text-xs leading-snug text-muted-foreground sm:text-right">{gapSource}</p>}
      >
        {gaps.length ? (
          <>
            <div className="flex flex-wrap gap-2">
              {gaps.map((gap) => (
                <UiButton
                  key={gap.tag}
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-pressed={skillFilter === gap.tag}
                  title={`Show resources that build ${gap.label}`}
                  className="pr-1.5 aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground pointer-coarse:min-h-11 dark:aria-pressed:bg-primary dark:aria-pressed:text-primary-foreground"
                  onClick={() => setSkillFilter((current) => (current === gap.tag ? null : gap.tag))}
                >
                  {gap.label}
                  <Badge tone={PRIORITY_TONE[gap.priority]}>{gap.priority}</Badge>
                </UiButton>
              ))}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Tap a skill to filter resources that build it.</p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No gaps detected for your target role. Browse the catalogue to keep growing.</p>
        )}
      </Card>

      <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)} className="mt-6 gap-4">
        <div className="overflow-x-auto [scrollbar-width:none] max-sm:-mx-4 max-sm:px-4 @max-xl/page:[mask-image:linear-gradient(to_right,black_85%,transparent)] [&::-webkit-scrollbar]:hidden">
          <TabsList aria-label="Learning views" className="w-max pointer-coarse:h-11! @max-xl/page:mr-10">
            {(
              [
                ["recommended", "Recommended for you"],
                ["plan", `My learning plan (${planItems.length})`],
                ["browse", `Browse all (${resources.length})`],
              ] as const
            ).map(([key, label]) => (
              <TabsTrigger key={key} value={key} className="px-3">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value={tab} className="min-w-0">
          <div className="mb-4 flex flex-col gap-3 @5xl/page:flex-row @5xl/page:items-center">
            <InputGroup className="h-10 @5xl/page:max-w-xs pointer-coarse:h-11">
              <InputGroupAddon>
                <Search aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                className="h-full"
                type="search"
                value={search}
                aria-label="Search resources"
                placeholder="Search title or skill"
                onChange={(event) => setSearch(event.target.value)}
              />
            </InputGroup>
            <div className="min-w-0 overflow-x-auto [scrollbar-width:none] max-sm:-mx-4 max-sm:px-4 @max-3xl/page:[mask-image:linear-gradient(to_right,black_85%,transparent)] [&::-webkit-scrollbar]:hidden">
              <div className="flex w-max gap-1.5 @max-3xl/page:pr-10" role="group" aria-label="Resource type">
                {(["All", ...RESOURCE_TYPES] as TypeFilter[]).map((type) => (
                  <UiButton
                    key={type}
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-pressed={typeFilter === type}
                    className="rounded-full aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground pointer-coarse:min-h-11 dark:aria-pressed:bg-primary dark:aria-pressed:text-primary-foreground"
                    onClick={() => setTypeFilter(type)}
                  >
                    {type === "All" ? "All" : typeLabel(type)}
                  </UiButton>
                ))}
              </div>
            </div>
          </div>

          {(filtersActive || visible.length > 0) && (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span>
                Showing {visible.length} resource{visible.length === 1 ? "" : "s"}
                {skillFilter && (
                  <>
                    {" "}
                    that build <span className="font-semibold text-foreground">{skillLabel(skillFilter)}</span>
                    <button
                      type="button"
                      className="ml-1 inline-grid size-6 place-items-center rounded-md align-middle text-muted-foreground hover:bg-accent hover:text-foreground pointer-coarse:-my-2.5 pointer-coarse:size-11"
                      aria-label="Clear skill filter"
                      onClick={() => setSkillFilter(null)}
                    >
                      <X className="size-3.5" />
                    </button>
                  </>
                )}
                {tab === "recommended" && !filtersActive && " · ranked by how well they close your gaps"}
              </span>
              {filtersActive && (
                <Button variant="ghost" size="sm" className="-mr-2" onClick={resetFilters}>
                  <RotateCcw /> Reset filters
                </Button>
              )}
            </div>
          )}

          {visible.length ? (
            <div className="grid gap-4 @2xl/page:grid-cols-2 @7xl/page:grid-cols-3">
              {visible.map((item) => (
                <ResourceCard
                  key={item.resource.resource_id}
                  item={item}
                  progress={byResource.get(item.resource.resource_id)}
                  pending={!!pending[item.resource.resource_id]}
                  actions={actions}
                  showProgressControls={tab === "plan"}
                />
              ))}
            </div>
          ) : (
            <Card>
              {!resources.length ? (
                <EmptyState
                  icon={Library}
                  title="No learning resources yet"
                  text="An administrator has not published any learning resources. Check back soon."
                />
              ) : filtersActive ? (
                <EmptyState
                  icon={Search}
                  title="No resources match your filters"
                  text="Try a different search term, type or skill."
                  action={
                    <Button variant="secondary" onClick={resetFilters}>
                      <RotateCcw /> Reset filters
                    </Button>
                  }
                />
              ) : tab === "plan" ? (
                <EmptyState
                  icon={Library}
                  title="Your learning plan is empty"
                  text="Save or start a recommended resource to build your plan."
                  action={<Button onClick={() => setTab("recommended")}>See recommendations</Button>}
                />
              ) : (
                <EmptyState
                  icon={CircleCheckBig}
                  title="You have completed every recommendation"
                  text="Great progress! Browse the full catalogue for more to learn."
                  action={<Button onClick={() => setTab("browse")}>Browse all resources</Button>}
                />
              )}
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
