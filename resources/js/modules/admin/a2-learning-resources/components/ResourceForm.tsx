import { useId, useState, type FormEvent, type ReactNode } from "react"
import { Check } from "lucide-react"
import { Alert, Button, Field, Modal, selectClassName, Spinner } from "@/components/ui"
import { Input } from "@/components/shadcn/input"
import { Label } from "@/components/shadcn/label"
import { cn } from "@/lib/utils"
import { errorMessage } from "@/lib/format"
import { SKILL_BY_TAG, SKILLS } from "@/lib/skills"
import type { LearningResource, ResourceType } from "@/lib/types"
import { RESOURCE_TYPE_OPTIONS } from "@/modules/m5-learning-recommendation/resourceMeta"
import type { ResourceInput } from "../services/adminResourceService"

interface FormState {
  title: string
  resource_type: ResourceType
  skill_name: string
  resource_url: string
  skill_tags: string[]
}

type Errors = Partial<Record<"title" | "skill_name" | "resource_url" | "skill_tags", string>>

const toState = (resource?: LearningResource | null): FormState => ({
  title: resource?.title ?? "",
  resource_type: resource?.resource_type ?? "Course",
  skill_name: resource?.skill_name ?? "",
  resource_url: resource?.resource_url ?? "",
  skill_tags: resource?.skill_tags ?? [],
})

function validate(state: FormState): Errors {
  const errors: Errors = {}
  const title = state.title.trim()
  if (!title) errors.title = "Title is required."
  else if (title.length < 3) errors.title = "Title must be at least 3 characters."
  else if (title.length > 160) errors.title = "Keep the title under 160 characters."

  const skill = state.skill_name.trim()
  if (!skill) errors.skill_name = "Skill is required."
  else if (skill.length > 80) errors.skill_name = "Keep the skill name under 80 characters."

  const url = state.resource_url.trim()
  if (url) {
    try {
      const parsed = new URL(url)
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") errors.resource_url = "URL must start with http:// or https://."
    } catch {
      errors.resource_url = "Enter a valid URL, e.g. https://example.com/course."
    }
  }

  if (!state.skill_tags.length) errors.skill_tags = "Choose at least one skill tag so the resource can be recommended."
  return errors
}

function toInput(state: FormState): ResourceInput {
  return {
    title: state.title.trim(),
    resource_type: state.resource_type,
    skill_name: state.skill_name.trim(),
    resource_url: state.resource_url.trim() || null,
    skill_tags: state.skill_tags,
  }
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs font-medium text-destructive">{message}</p>
}

function Group({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>{children}</div>
}

const toggle = (list: string[], value: string) => (list.includes(value) ? list.filter((item) => item !== value) : [...list, value])

export function ResourceForm({
  resource,
  skillNames = [],
  onClose,
  onSubmit,
}: {
  /** Resource being edited; omit to create a new one. */
  resource?: LearningResource | null
  /** Skill names already used in the catalogue, merged into the datalist suggestions. */
  skillNames?: string[]
  onClose: () => void
  /** Persists the resource; throw to show an error inside the modal. */
  onSubmit: (input: ResourceInput) => Promise<void>
}) {
  const [state, setState] = useState<FormState>(() => toState(resource))
  const [errors, setErrors] = useState<Errors>({})
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const typeId = useId()
  const skillId = useId()

  const update = (next: FormState) => {
    setState(next)
    if (submitted) setErrors(validate(next))
  }
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => update({ ...state, [key]: value })

  const toggleTag = (tag: string) => {
    const skill_tags = toggle(state.skill_tags, tag)
    // Convenience: the first tag picked fills an empty skill name.
    const fill = !state.skill_name.trim() && skill_tags.includes(tag) ? SKILL_BY_TAG[tag]?.label ?? "" : state.skill_name
    update({ ...state, skill_tags, skill_name: fill })
  }

  const suggestions = Array.from(new Set([...SKILLS.map((skill) => skill.label), ...skillNames.filter(Boolean)])).sort((a, b) =>
    a.localeCompare(b),
  )

  const submit = async (event?: FormEvent) => {
    event?.preventDefault()
    setSubmitted(true)
    setSubmitError(null)
    const found = validate(state)
    setErrors(found)
    if (Object.keys(found).length) return
    setSaving(true)
    try {
      await onSubmit(toInput(state))
    } catch (err) {
      setSubmitError(errorMessage(err, "Could not save the resource."))
      setSaving(false)
    }
  }

  const errorCount = Object.keys(errors).length

  return (
    <Modal
      title={resource ? "Edit learning resource" : "Add learning resource"}
      onClose={() => {
        if (!saving) onClose()
      }}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={saving}>
            {saving ? <Spinner label="Saving…" /> : resource ? "Save changes" : "Add resource"}
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={(event) => void submit(event)} noValidate>
        {submitError && <Alert tone="error">{submitError}</Alert>}
        {submitted && errorCount > 0 && (
          <Alert tone="error">
            Please fix {errorCount} highlighted field{errorCount === 1 ? "" : "s"} before saving.
          </Alert>
        )}

        <Group>
          <Field label="Title" required value={state.title} onChange={(value) => set("title", value)} placeholder="e.g. SQL for Data Analysis" />
          <FieldError message={errors.title} />
        </Group>

        <div className="grid gap-4 sm:grid-cols-2">
          <Group>
            <Label htmlFor={typeId}>
              Resource type <span className="text-destructive">*</span>
            </Label>
            <select
              id={typeId}
              value={state.resource_type}
              onChange={(event) => set("resource_type", event.target.value as ResourceType)}
              className={selectClassName}
            >
              {RESOURCE_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Group>
          <Group>
            <Label htmlFor={skillId}>
              Skill <span className="text-destructive">*</span>
            </Label>
            <Input
              id={skillId}
              list="resource-skill-suggestions"
              value={state.skill_name}
              placeholder="Choose or type the main skill"
              aria-invalid={!!errors.skill_name || undefined}
              className="h-10 pointer-coarse:h-11"
              onChange={(event) => set("skill_name", event.target.value)}
            />
            <datalist id="resource-skill-suggestions">
              {suggestions.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
            <FieldError message={errors.skill_name} />
          </Group>
          <Group className="sm:col-span-2">
            <Field
              label="Resource URL"
              type="url"
              value={state.resource_url}
              onChange={(value) => set("resource_url", value)}
              placeholder="https://"
              hint="Optional. Must start with http:// or https://."
            />
            <FieldError message={errors.resource_url} />
          </Group>
        </div>

        <fieldset className="flex min-w-0 flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">
            Skill tags <span className="text-destructive">*</span>{" "}
            <span className="font-normal text-muted-foreground">({state.skill_tags.length} selected · used to match skill gaps)</span>
          </legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
            {SKILLS.map((skill) => {
              const active = state.skill_tags.includes(skill.tag)
              return (
                <button
                  key={skill.tag}
                  type="button"
                  role="checkbox"
                  aria-checked={active}
                  className={cn(
                    "flex h-9 min-w-0 items-center gap-2 rounded-md border px-3 text-left text-sm outline-none transition-colors hover:bg-accent focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:min-h-11 dark:bg-input/30 dark:hover:bg-input/50",
                    active && "border-primary bg-accent dark:bg-accent",
                  )}
                  onClick={() => toggleTag(skill.tag)}
                >
                  <span
                    className={cn(
                      "grid size-4 shrink-0 place-items-center rounded-[4px] border shadow-xs",
                      active ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background",
                    )}
                    aria-hidden="true"
                  >
                    {active && <Check size={10} strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 truncate">{skill.label}</span>
                </button>
              )
            })}
          </div>
          <FieldError message={errors.skill_tags} />
        </fieldset>

        {/* Lets Enter in a text field submit the form. */}
        <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true">
          Save
        </button>
      </form>
    </Modal>
  )
}
