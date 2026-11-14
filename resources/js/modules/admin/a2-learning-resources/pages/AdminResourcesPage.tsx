import { useCallback, useEffect, useId, useMemo, useState } from "react"
import { Link } from "@/lib/router"
import { ExternalLink, Layers, Library, LinkIcon, Pencil, Plus, RotateCcw, Search, Target, Trash2 } from "lucide-react"
import { Alert, Badge, Button, Card, EmptyState, LoadingState, Modal, PageIntro, SelectField, Spinner, StatCard, useFlash } from "@/components/ui"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/shadcn/input-group"
import { Label } from "@/components/shadcn/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table"
import { errorMessage } from "@/lib/format"
import { skillLabel } from "@/lib/skills"
import type { LearningResource } from "@/lib/types"
import { isSafeUrl, RESOURCE_TYPE_OPTIONS, typeLabel } from "@/modules/m5-learning-recommendation/resourceMeta"
import { ResourceForm } from "../components/ResourceForm"
import { adminResourceService, type ResourceInput } from "../services/adminResourceService"

const byTitle = (a: LearningResource, b: LearningResource) => a.title.localeCompare(b.title)

export default function AdminResourcesPage() {
  const [resources, setResources] = useState<LearningResource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useFlash(3500)

  const [search, setSearch] = useState("")
  const searchId = useId()
  const [type, setType] = useState("all")

  /** null = closed, "new" = create, resource = edit */
  const [editing, setEditing] = useState<LearningResource | "new" | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<LearningResource | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setResources(await adminResourceService.list())
    } catch (err) {
      setError(errorMessage(err, "Could not load learning resources."))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const skillNames = useMemo(
    () => Array.from(new Set(resources.map((item) => item.skill_name.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [resources],
  )
  const typeCount = new Set(resources.map((item) => item.resource_type)).size
  const withoutUrl = resources.filter((item) => !isSafeUrl(item.resource_url)).length

  const query = search.trim().toLowerCase()
  const filtered = useMemo(
    () =>
      resources.filter((item) => {
        if (type !== "all" && item.resource_type !== type) return false
        if (query) {
          const haystack = [item.title, item.skill_name, typeLabel(item.resource_type), ...item.skill_tags.map(skillLabel)].join(" ").toLowerCase()
          if (!haystack.includes(query)) return false
        }
        return true
      }),
    [resources, type, query],
  )
  const filtersActive = query !== "" || type !== "all"

  const resetFilters = () => {
    setSearch("")
    setType("all")
  }

  const upsertLocal = (row: LearningResource) =>
    setResources((list) =>
      (list.some((item) => item.resource_id === row.resource_id)
        ? list.map((item) => (item.resource_id === row.resource_id ? row : item))
        : [...list, row]
      ).sort(byTitle),
    )

  const handleSubmit = async (input: ResourceInput) => {
    if (editing && editing !== "new") {
      const row = await adminResourceService.update(editing.resource_id, input)
      upsertLocal(row)
      setFlash(`Updated "${row.title}".`)
    } else {
      const row = await adminResourceService.create(input)
      upsertLocal(row)
      setFlash(`Added "${row.title}".`)
    }
    setError(null)
    setEditing(null)
  }

  const removeResource = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    setError(null)
    try {
      await adminResourceService.remove(confirmDelete.resource_id)
      setResources((list) => list.filter((item) => item.resource_id !== confirmDelete.resource_id))
      setFlash(`Deleted "${confirmDelete.title}".`)
      setConfirmDelete(null)
    } catch (err) {
      setError(errorMessage(err, "Could not delete the resource."))
      setConfirmDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  const linkCell = (item: LearningResource) =>
    isSafeUrl(item.resource_url) ? (
      <a
        href={item.resource_url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-sm whitespace-nowrap underline underline-offset-4 pointer-coarse:-my-3 pointer-coarse:py-3"
        title={item.resource_url}
      >
        <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" /> Open
      </a>
    ) : (
      <Badge tone="slate">No link</Badge>
    )

  const rowActions = (item: LearningResource) => (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="icon" title={`Edit ${item.title}`} onClick={() => setEditing(item)}>
        <Pencil />
      </Button>
      <Button variant="ghost" size="icon" title={`Delete ${item.title}`} onClick={() => setConfirmDelete(item)}>
        <Trash2 className="text-destructive" />
      </Button>
    </div>
  )

  const tagSummary = (item: LearningResource) =>
    item.skill_tags.length > 0
      ? `${item.skill_tags.slice(0, 2).map(skillLabel).join(", ")}${item.skill_tags.length > 2 ? ` +${item.skill_tags.length - 2}` : ""}`
      : null

  return (
    <div className="@container/page">
      <PageIntro
        eyebrow="Admin · Module 2"
        title="Learning resource management"
        description="Curate the courses, certifications and practice material that power learner recommendations. Tag each resource with skills so it reaches learners with matching gaps."
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

      <div className="mb-6 grid gap-3 @md/page:grid-cols-2 @5xl/page:grid-cols-4">
        <StatCard icon={Library} label="Total resources" value={String(resources.length)} meta="In the catalogue" />
        <StatCard icon={Target} label="Skills covered" value={String(skillNames.length)} meta="Distinct primary skills" tone="green" />
        <StatCard icon={Layers} label="Resource types" value={String(typeCount)} meta={`Of ${RESOURCE_TYPE_OPTIONS.length} available`} tone="violet" />
        <StatCard icon={LinkIcon} label="Missing link" value={String(withoutUrl)} meta="Resources without a URL" tone="amber" />
      </div>

      <Card className="overflow-hidden p-0 sm:p-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:p-5 @3xl/page:flex-row @3xl/page:items-end">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Label htmlFor={searchId}>Search</Label>
            <InputGroup className="h-10 pointer-coarse:h-11">
              <InputGroupAddon>
                <Search aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                className="h-full"
                id={searchId}
                type="search"
                value={search}
                placeholder="Search title or skill"
                onChange={(event) => setSearch(event.target.value)}
              />
            </InputGroup>
          </div>
          <div className="@3xl/page:w-48">
            <SelectField label="Type" value={type} options={[{ value: "all", label: "All types" }, ...RESOURCE_TYPE_OPTIONS]} onChange={setType} />
          </div>
          <Button className="h-10" onClick={() => setEditing("new")}>
            <Plus /> Add resource
          </Button>
        </div>

        {loading ? (
          <LoadingState label="Loading resources…" />
        ) : !resources.length ? (
          <EmptyState
            icon={Library}
            title="No learning resources yet"
            text="Add your first resource so learners start receiving recommendations."
            action={
              <Button onClick={() => setEditing("new")}>
                <Plus /> Add resource
              </Button>
            }
          />
        ) : !filtered.length ? (
          <EmptyState
            icon={Search}
            title="No resources match your filters"
            text="Try a different search term or clear the filters."
            action={
              <Button variant="secondary" onClick={resetFilters}>
                <RotateCcw /> Reset filters
              </Button>
            }
          />
        ) : (
          <>
            <p className="flex flex-wrap items-center gap-x-1 px-4 pt-3 text-sm text-muted-foreground sm:px-5">
              Showing {filtered.length} of {resources.length} resource{resources.length === 1 ? "" : "s"}
              {filtersActive && (
                <>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    className="font-medium text-foreground underline underline-offset-4 pointer-coarse:-my-3 pointer-coarse:py-3"
                    onClick={resetFilters}
                  >
                    Clear filters
                  </button>
                </>
              )}
            </p>

            {/* Phones: stacked rows. */}
            <ul className="mt-2 divide-y border-t @4xl/page:hidden">
              {filtered.map((item) => {
                const tags = tagSummary(item)
                return (
                  <li key={item.resource_id} className="flex items-start gap-2 py-3 pr-2 pl-4">
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <Link
                        to={`/learning/${item.resource_id}`}
                        className="text-sm leading-snug font-medium underline-offset-4 [overflow-wrap:anywhere] hover:underline pointer-coarse:-my-3 pointer-coarse:py-3"
                        title="Preview as learner"
                      >
                        {item.title}
                      </Link>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                        <Badge tone="blue">{typeLabel(item.resource_type)}</Badge>
                        <span>{item.skill_name || "—"}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.skill_tags.length} tag{item.skill_tags.length === 1 ? "" : "s"}
                        {tags ? `: ${tags}` : ""}
                      </p>
                      <div>{linkCell(item)}</div>
                    </div>
                    {rowActions(item)}
                  </li>
                )
              })}
            </ul>

            {/* Tablet and desktop: table. */}
            <Table className="mt-2 hidden @4xl/page:table">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5 text-muted-foreground">Title</TableHead>
                  <TableHead className="text-muted-foreground">Type</TableHead>
                  <TableHead className="text-muted-foreground">Skill</TableHead>
                  <TableHead className="text-muted-foreground">Tags</TableHead>
                  <TableHead className="text-muted-foreground">Link</TableHead>
                  <TableHead className="pr-5 text-right text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => {
                  const tags = tagSummary(item)
                  return (
                    <TableRow key={item.resource_id}>
                      <TableCell className="min-w-56 py-3 pl-5 whitespace-normal">
                        <Link
                          to={`/learning/${item.resource_id}`}
                          className="font-medium underline-offset-4 hover:underline"
                          title="Preview as learner"
                        >
                          {item.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge tone="blue">{typeLabel(item.resource_type)}</Badge>
                      </TableCell>
                      <TableCell>{item.skill_name || "—"}</TableCell>
                      <TableCell className="min-w-40 whitespace-normal">
                        <span className="font-medium tabular-nums">{item.skill_tags.length}</span>
                        {tags && <span className="block text-xs text-muted-foreground">{tags}</span>}
                      </TableCell>
                      <TableCell>{linkCell(item)}</TableCell>
                      <TableCell className="pr-4">{rowActions(item)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </>
        )}
      </Card>

      {editing && (
        <ResourceForm
          resource={editing === "new" ? null : editing}
          skillNames={skillNames}
          onClose={() => setEditing(null)}
          onSubmit={handleSubmit}
        />
      )}

      {confirmDelete && (
        <Modal
          title="Delete resource?"
          onClose={() => {
            if (!deleting) setConfirmDelete(null)
          }}
          footer={
            <>
              <Button variant="secondary" disabled={deleting} onClick={() => setConfirmDelete(null)}>
                Cancel
              </Button>
              <Button variant="danger" disabled={deleting} onClick={() => void removeResource()}>
                {deleting ? (
                  <Spinner label="Deleting…" />
                ) : (
                  <>
                    <Trash2 /> Delete permanently
                  </>
                )}
              </Button>
            </>
          }
        >
          <p className="text-sm leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">{confirmDelete.title}</span> will be permanently deleted. Learners who
            saved or completed it will lose that progress entry. This cannot be undone.
          </p>
        </Modal>
      )}
    </div>
  )
}
