// Display metadata shared by the Learning Recommendation pages and the
// Admin · Learning Resource Management screens.
import {
  Award,
  BookOpen,
  ClipboardList,
  FileText,
  GraduationCap,
  Hammer,
  CirclePlay,
  Wrench,
  type LucideIcon,
} from "lucide-react"
import type { Tone } from "@/components/ui"
import type { LearningStatus, ResourceType } from "@/lib/types"

export type Priority = "High" | "Medium" | "Low"

/** Values allowed by learning_resources.resource_type (check constraint). */
export const RESOURCE_TYPES: ResourceType[] = ["Course", "Cert", "Tutorial", "Article", "Video", "Practice", "Project"]

/** Human-readable label for a resource type ("Cert" is shown as "Certification"). */
export const TYPE_LABEL: Record<ResourceType, string> = {
  Course: "Course",
  Cert: "Certification",
  Tutorial: "Tutorial",
  Article: "Article",
  Video: "Video",
  Practice: "Practice",
  Project: "Project",
}

export function typeLabel(type: string): string {
  return TYPE_LABEL[type as ResourceType] ?? type
}

/** Options for <SelectField>: DB value + display label. */
export const RESOURCE_TYPE_OPTIONS = RESOURCE_TYPES.map((type) => ({ value: type, label: TYPE_LABEL[type] }))

/** learning_progress.status. "Not Started" means "saved to the plan". */
export const STATUS_LABEL: Record<LearningStatus, string> = {
  "Not Started": "Saved",
  "In Progress": "In progress",
  Completed: "Completed",
}

export const STATUS_TONE: Record<LearningStatus, Tone> = {
  "Not Started": "blue",
  "In Progress": "violet",
  Completed: "green",
}

export const PRIORITY_TONE: Record<Priority, Tone> = {
  High: "red",
  Medium: "amber",
  Low: "slate",
}

export const TYPE_ICON: Record<ResourceType, LucideIcon> = {
  Course: GraduationCap,
  Cert: Award,
  Tutorial: BookOpen,
  Article: FileText,
  Video: CirclePlay,
  Practice: Wrench,
  Project: Hammer,
}

/** Fallback icon when a row carries an unexpected type value. */
export const DEFAULT_TYPE_ICON: LucideIcon = ClipboardList

/** Only http(s) URLs may be rendered as links (blocks javascript: and similar schemes). */
export function isSafeUrl(value?: string | null): value is string {
  if (!value) return false
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}
