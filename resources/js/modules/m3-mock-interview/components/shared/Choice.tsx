import { useRef, type KeyboardEvent, type ReactNode } from "react"
import { cn } from "@/lib/utils"

const focusRing = "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring"

/**
 * A radio group made of large buttons (cards or chips). One tab stop; arrow keys move the
 * selection, as with native radio buttons.
 */
export function ChoiceGroup<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
  renderOption,
  optionClassName,
}: {
  label: string
  value: T | null
  options: readonly T[]
  onChange: (value: T) => void
  className?: string
  optionClassName?: string | ((selected: boolean) => string)
  renderOption: (value: T, selected: boolean) => ReactNode
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const current = value === null ? -1 : options.indexOf(value)

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const forward = event.key === "ArrowRight" || event.key === "ArrowDown"
    const back = event.key === "ArrowLeft" || event.key === "ArrowUp"
    if (!forward && !back) return
    event.preventDefault()
    const next = (index + (forward ? 1 : -1) + options.length) % options.length
    onChange(options[next])
    refs.current[next]?.focus()
  }

  return (
    <div role="radiogroup" aria-label={label} className={className}>
      {options.map((option, index) => {
        const selected = option === value
        const extra = typeof optionClassName === "function" ? optionClassName(selected) : optionClassName
        return (
          <button
            key={option}
            ref={(el) => {
              refs.current[index] = el
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected || (current === -1 && index === 0) ? 0 : -1}
            onClick={() => onChange(option)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className={cn(
              "min-w-0 rounded-xl border text-left transition-colors hover:bg-accent/60",
              focusRing,
              selected ? "border-2 border-primary bg-[var(--iv-selected)]" : "border-border bg-card",
              extra,
            )}
          >
            {renderOption(option, selected)}
          </button>
        )
      })}
    </div>
  )
}

/** Segmented toggle (Easy / Medium / Hard, 3 / 5 / 8, English / Bahasa Melayu). */
export function SegmentedToggle<T extends string | number>({
  label,
  value,
  options,
  onChange,
  format = (v) => String(v),
}: {
  label: string
  value: T
  options: readonly T[]
  onChange: (value: T) => void
  format?: (value: T) => string
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const forward = event.key === "ArrowRight" || event.key === "ArrowDown"
    const back = event.key === "ArrowLeft" || event.key === "ArrowUp"
    if (!forward && !back) return
    event.preventDefault()
    const next = (index + (forward ? 1 : -1) + options.length) % options.length
    onChange(options[next])
    refs.current[next]?.focus()
  }
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <span className="text-sm text-muted-foreground" aria-hidden="true">
        {label}
      </span>
      <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-lg bg-muted p-1">
        {options.map((option, index) => {
          const selected = option === value
          return (
            <button
              key={String(option)}
              ref={(el) => {
                refs.current[index] = el
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(option)}
              onKeyDown={(e) => onKeyDown(e, index)}
              className={cn(
                "min-h-11 min-w-0 flex-1 rounded-md px-2 text-sm transition-colors",
                focusRing,
                selected ? "bg-card font-semibold text-foreground shadow-sm" : "font-medium text-muted-foreground hover:text-foreground",
              )}
            >
              {format(option)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
