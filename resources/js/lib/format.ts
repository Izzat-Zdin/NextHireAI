export function formatDate(
  value?: string | null,
  opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" },
) {
  if (!value) return "—"
  return new Date(value).toLocaleDateString("en-MY", opts)
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function timeAgo(value?: string | null) {
  if (!value) return ""
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.round(diff / 60000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`
  const days = Math.round(hours / 24)
  if (days === 1) return "Yesterday"
  if (days < 30) return `${days} days ago`
  return formatDate(value)
}

export function formatDuration(minutes?: number | null) {
  if (!minutes) return "Self-paced"
  if (minutes < 60) return `${minutes} min`
  const hours = minutes / 60
  if (hours < 40) return `${Math.round(hours * 10) / 10} hours`
  return `~${Math.round(hours / 10)} weeks`
}

export function initials(name?: string | null, fallback = "U") {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return fallback
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
}

export function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value))
}

export function average(values: number[]) {
  const valid = values.filter((value) => Number.isFinite(value))
  if (!valid.length) return 0
  return Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length)
}

export function scoreTone(score: number): "green" | "blue" | "amber" | "red" {
  if (score >= 80) return "green"
  if (score >= 60) return "blue"
  if (score >= 40) return "amber"
  return "red"
}

export function scoreLabel(score: number) {
  if (score >= 80) return "Excellent"
  if (score >= 65) return "Strong foundation"
  if (score >= 50) return "Developing"
  return "Needs work"
}

export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === "string") return error
  return fallback
}
