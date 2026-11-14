import { Fragment, useId, useMemo } from "react"
import { findFillerSpans } from "../../services/speechAnalysis"
import { cn } from "@/lib/utils"

const markClass = "rounded-[4px] bg-[var(--iv-filler)] px-1 py-px text-[var(--iv-filler-fg)]"

/** Splits text into plain pieces and filler pieces (same matcher as the filler count). */
function useFillerPieces(text: string) {
  return useMemo(() => {
    const spans = findFillerSpans(text)
    const pieces: { text: string; filler: boolean }[] = []
    let cursor = 0
    for (const span of spans) {
      if (span.start > cursor) pieces.push({ text: text.slice(cursor, span.start), filler: false })
      pieces.push({ text: text.slice(span.start, span.end), filler: true })
      cursor = span.end
    }
    if (cursor < text.length) pieces.push({ text: text.slice(cursor), filler: false })
    return pieces
  }, [text])
}

/** Read-only transcript with filler words highlighted inline, plus the phrase still being heard. */
export function TranscriptText({ text, interim, empty, className }: { text: string; interim?: string; empty: string; className?: string }) {
  const pieces = useFillerPieces(text)
  const interimPieces = useFillerPieces(interim ?? "")
  const isEmpty = !text.trim() && !interim?.trim()
  return (
    <div className={cn("min-h-28 rounded-xl border bg-muted/30 p-4 text-base leading-[1.7] [overflow-wrap:anywhere]", className)}>
      {isEmpty ? (
        <span className="text-muted-foreground">{empty}</span>
      ) : (
        <>
          {pieces.map((piece, i) =>
            piece.filler ? (
              <mark key={i} className={markClass}>
                {piece.text}
              </mark>
            ) : (
              <Fragment key={i}>{piece.text}</Fragment>
            ),
          )}
          {interim?.trim() && (
            <span className="text-muted-foreground">
              {text.trim() ? " " : ""}
              {interimPieces.map((piece, i) =>
                piece.filler ? (
                  <mark key={i} className={markClass}>
                    {piece.text}
                  </mark>
                ) : (
                  <Fragment key={i}>{piece.text}</Fragment>
                ),
              )}
            </span>
          )}
        </>
      )}
    </div>
  )
}

/**
 * Editable answer with filler words highlighted behind the text. The highlighted copy sits under a
 * transparent textarea and sizes the box, so the two always line up without scroll syncing.
 */
export function HighlightedEditor({
  value,
  onChange,
  label,
  placeholder,
  describedBy,
}: {
  value: string
  onChange: (value: string) => void
  label: string
  placeholder?: string
  describedBy?: string
}) {
  const id = useId()
  const pieces = useFillerPieces(value)
  const shared = "min-h-36 w-full p-4 text-base leading-[1.7] whitespace-pre-wrap [overflow-wrap:anywhere] font-[inherit] tracking-normal"
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm text-muted-foreground">
        {label}
      </label>
      <div className="relative rounded-xl border bg-background focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
        <div aria-hidden="true" className={cn(shared, "text-transparent")}>
          {pieces.map((piece, i) =>
            piece.filler ? (
              <mark key={i} className="rounded-[4px] bg-[var(--iv-filler)] text-transparent">
                {piece.text}
              </mark>
            ) : (
              <Fragment key={i}>{piece.text}</Fragment>
            ),
          )}
          {/* Keeps the last line's height when the text ends with a newline. */}
          {"​"}
        </div>
        <textarea
          id={id}
          value={value}
          placeholder={placeholder}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            shared,
            "absolute inset-0 resize-none overflow-hidden rounded-xl bg-transparent text-foreground caret-foreground outline-none placeholder:text-muted-foreground",
          )}
        />
      </div>
    </div>
  )
}
