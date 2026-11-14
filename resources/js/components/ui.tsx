// App-level UI primitives, built on shadcn/ui (src/components/shadcn/*).
// The exported names and props are unchanged so every page keeps working;
// only the look follows the shadcn neutral theme (light + dark).
import type { CSSProperties, ReactNode } from "react"
import { useEffect, useId, useState } from "react"
import { AlertCircle, CheckCircle2, Loader2, X, type LucideIcon } from "lucide-react"
import { Badge as UiBadge } from "@/components/shadcn/badge"
import { Button as UiButton } from "@/components/shadcn/button"
import { Card as UiCard } from "@/components/shadcn/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/shadcn/dialog"
import { Input } from "@/components/shadcn/input"
import { Label } from "@/components/shadcn/label"
import { Textarea } from "@/components/shadcn/textarea"
import { cn } from "@/lib/utils"

export type Tone = "blue" | "violet" | "green" | "amber" | "red" | "slate"

const BUTTON_VARIANT = { primary: "default", secondary: "outline", ghost: "ghost", danger: "destructive" } as const
const BUTTON_SIZE = { sm: "sm", md: "default", icon: "icon" } as const

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  disabled,
  type = "button",
  title,
  ariaLabel,
  ariaExpanded,
  ariaControls,
}: {
  children: ReactNode
  variant?: "primary" | "secondary" | "ghost" | "danger"
  size?: "sm" | "md" | "icon"
  className?: string
  onClick?: () => void
  disabled?: boolean
  type?: "button" | "submit"
  title?: string
  /** Accessible name when it should differ from the tooltip (defaults to title). */
  ariaLabel?: string
  ariaExpanded?: boolean
  ariaControls?: string
}) {
  return (
    <UiButton
      type={type}
      title={title}
      aria-label={ariaLabel ?? title}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      disabled={disabled}
      onClick={onClick}
      variant={BUTTON_VARIANT[variant]}
      size={BUTTON_SIZE[size]}
      className={cn("pointer-coarse:min-h-11", size === "icon" && "pointer-coarse:min-w-11", className)}
    >
      {children}
    </UiButton>
  )
}

export function Card({
  children,
  className = "",
  title,
  action,
  headingLevel = 2,
}: {
  children: ReactNode
  className?: string
  title?: ReactNode
  action?: ReactNode
  /** Heading element for the card title (default h2; use 3 inside an h2 section). */
  headingLevel?: 2 | 3
}) {
  const Heading = headingLevel === 3 ? "h3" : "h2"
  return (
    <UiCard className={cn("min-w-0 gap-0 p-5 sm:p-6", className)}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          {title && <Heading className="font-heading text-base font-semibold leading-tight">{title}</Heading>}
          {action}
        </div>
      )}
      {children}
    </UiCard>
  )
}

const BADGE_TONE: Record<Tone, string> = {
  blue: "border-transparent bg-secondary text-secondary-foreground",
  violet: "border-transparent bg-secondary text-secondary-foreground",
  slate: "border-border bg-transparent text-muted-foreground",
  green: "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  amber: "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  red: "border-transparent bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
}

export function Badge({ children, tone = "blue" }: { children: ReactNode; tone?: Tone }) {
  return (
    <UiBadge variant="outline" className={cn("gap-1 font-medium", BADGE_TONE[tone])}>
      {children}
    </UiBadge>
  )
}

export function Progress({ value, tone: _tone = "blue", label }: { value: number; tone?: "blue" | "violet" | "green"; label?: string }) {
  const safe = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div
      className="relative h-2 w-full overflow-hidden rounded-full bg-primary/15"
      role="progressbar"
      aria-label={label}
      aria-valuenow={safe}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${safe}%` }} />
    </div>
  )
}

function FieldShell({ id, label, required, hint, children }: { id: string; label: string; required?: boolean; hint?: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={id}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function Field({
  label,
  value,
  disabled,
  type = "text",
  required,
  placeholder,
  autoComplete,
  onChange,
  hint,
}: {
  label: string
  value: string
  disabled?: boolean
  type?: string
  required?: boolean
  placeholder?: string
  autoComplete?: string
  onChange?: (value: string) => void
  hint?: string
}) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} required={required} hint={hint}>
      <Input
        id={id}
        type={type}
        value={value}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(event) => onChange?.(event.target.value)}
        className="h-10 pointer-coarse:h-11"
      />
    </FieldShell>
  )
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  disabled,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  disabled?: boolean
}) {
  const id = useId()
  return (
    <FieldShell id={id} label={label}>
      <Textarea id={id} rows={rows} value={value} disabled={disabled} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </FieldShell>
  )
}

/** Native select styled like the shadcn input (keeps native mobile pickers). */
export const selectClassName =
  "h-10 w-full min-w-0 rounded-md border border-input bg-transparent px-3 text-base shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pointer-coarse:h-11 dark:bg-input/30 [&>option]:bg-popover [&>option]:text-popover-foreground"

export function SelectField({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string
  value: string
  options: (string | { value: string; label: string })[]
  onChange: (value: string) => void
  disabled?: boolean
}) {
  const id = useId()
  return (
    <FieldShell id={id} label={label}>
      <select id={id} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className={selectClassName}>
        {options.map((option) => {
          const item = typeof option === "string" ? { value: option, label: option } : option
          return (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          )
        })}
      </select>
    </FieldShell>
  )
}

export function PageIntro({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0 max-w-3xl space-y-1.5">
        <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p>
        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">{description}</p>
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2 [&>*]:max-sm:w-full">{action}</div>}
    </div>
  )
}

export function ScoreRing({ value, label, color: _color = "blue" }: { value: number; label: string; color?: "blue" | "violet" }) {
  const safe = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div
      className="relative grid size-32 shrink-0 place-items-center rounded-full"
      style={{ background: `conic-gradient(var(--primary) ${safe * 3.6}deg, var(--muted) 0)` } as CSSProperties}
      role="img"
      aria-label={`${label}: ${safe} out of 100`}
    >
      <div className="absolute inset-[10px] rounded-full bg-card" />
      <div className="relative flex flex-col items-center px-2 text-center">
        <strong className="font-heading text-3xl font-bold leading-none">{safe}</strong>
        <span className="mt-1 text-xs font-medium leading-tight text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}

export function TrendChart({ values, labels }: { values: number[]; labels: string[] }) {
  if (!values.length) {
    return (
      <div className="flex flex-col items-center gap-1 py-8 text-center">
        <strong className="text-sm">No data yet</strong>
        <p className="text-sm text-muted-foreground">Complete an activity to start your trend line.</p>
      </div>
    )
  }
  return (
    <div className="h-56 pt-3">
      <div className="flex h-full items-end gap-2 border-b bg-[repeating-linear-gradient(to_top,transparent,transparent_47px,var(--border)_48px)] sm:gap-3">
        {values.map((value, index) => (
          <div className="flex h-full min-w-0 flex-1 flex-col items-center justify-end" key={`${labels[index]}-${index}`}>
            <span className="mb-1 text-xs font-semibold tabular-nums">{Math.round(value)}</span>
            <div
              className={cn("w-[min(36px,70%)] rounded-t-md", index === values.length - 1 ? "bg-primary" : "bg-primary/35")}
              style={{ height: `${Math.max(8, value)}%` }}
            />
            <span className="h-7 truncate pt-1.5 text-xs text-muted-foreground">{labels[index]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function StatCard({
  icon: IconComponent,
  label,
  value,
  meta,
  tone: _tone = "blue",
}: {
  icon: LucideIcon
  label: string
  value: string
  meta: string
  tone?: "blue" | "violet" | "green" | "amber"
}) {
  return (
    <UiCard className="min-w-0 flex-row items-start gap-3 p-4 sm:p-5">
      <div className="grid size-9 shrink-0 place-items-center rounded-md border bg-muted text-foreground">
        <IconComponent className="size-4" aria-hidden="true" />
      </div>
      <div className="flex min-w-0 flex-col">
        <p className="text-sm text-muted-foreground">{label}</p>
        <strong className="mt-0.5 font-heading text-2xl font-bold leading-tight tabular-nums">{value}</strong>
        <small className="mt-0.5 text-xs text-muted-foreground">{meta}</small>
      </div>
    </UiCard>
  )
}

export function Spinner({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Loader2 className="size-4 animate-spin" aria-hidden="true" /> {label}
    </span>
  )
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-sm text-muted-foreground" role="status">
      <Loader2 className="size-7 animate-spin" aria-hidden="true" />
      <p>{label}</p>
    </div>
  )
}

export function EmptyState({
  icon: IconComponent,
  title,
  text,
  action,
}: {
  icon: LucideIcon
  title: string
  text: string
  action?: ReactNode
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-2 px-4 py-8 text-center">
      <div className="mb-1 grid size-11 place-items-center rounded-full border bg-muted">
        <IconComponent className="size-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="font-heading text-base font-semibold">{title}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{text}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export function Alert({ tone, children, onClose }: { tone: "success" | "error"; children: ReactNode; onClose?: () => void }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "mb-4 flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm",
        tone === "error"
          ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
          : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
      )}
    >
      {tone === "success" ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
      <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{children}</span>
      {onClose && (
        <button className="-m-1 rounded p-1 opacity-70 hover:opacity-100 pointer-coarse:p-2.5" onClick={onClose} aria-label="Dismiss">
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}

/** Auto-hiding success message helper. */
export function useFlash(timeout = 3000) {
  const [message, setMessage] = useState<string | null>(null)
  useEffect(() => {
    if (!message) return
    const id = window.setTimeout(() => setMessage(null), timeout)
    return () => window.clearTimeout(id)
  }, [message, timeout])
  return [message, setMessage] as const
}

/** Dialog shown while mounted (shadcn Dialog: focus trap, Escape and overlay close). */
export function Modal({
  title,
  children,
  onClose,
  footer,
}: {
  title: string
  children: ReactNode
  onClose: () => void
  footer?: ReactNode
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-heading">{title}</DialogTitle>
        </DialogHeader>
        <div className="min-w-0">{children}</div>
        {footer && <DialogFooter className="gap-2">{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  )
}

/** Comma/Enter separated tag editor. */
export function TagInput({
  label,
  values,
  onChange,
  placeholder = "Type and press Enter",
  suggestions = [],
}: {
  label: string
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  suggestions?: string[]
}) {
  const [draft, setDraft] = useState("")
  const add = (raw: string) => {
    const value = raw.trim()
    if (!value || values.some((item) => item.toLowerCase() === value.toLowerCase())) return
    onChange([...values, value])
    setDraft("")
  }
  const listId = `tags-${label.replace(/\W+/g, "-").toLowerCase()}`
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-input px-2 py-1.5 shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 dark:bg-input/30">
        {values.map((value) => (
          <UiBadge key={value} variant="secondary" className="gap-1">
            {value}
            <button type="button" className="-mr-1 rounded p-0.5 hover:bg-background/60" onClick={() => onChange(values.filter((item) => item !== value))} aria-label={`Remove ${value}`}>
              <X className="size-3" />
            </button>
          </UiBadge>
        ))}
        <input
          value={draft}
          aria-label={label}
          list={suggestions.length ? listId : undefined}
          placeholder={placeholder}
          className="h-7 min-w-32 flex-1 bg-transparent px-1 text-base outline-none placeholder:text-muted-foreground md:text-sm"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault()
              add(draft)
            }
          }}
          onBlur={() => add(draft)}
        />
        {suggestions.length > 0 && (
          <datalist id={listId}>
            {suggestions.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        )}
      </div>
    </div>
  )
}
