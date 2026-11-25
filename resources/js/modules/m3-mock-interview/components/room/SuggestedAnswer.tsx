import { useId, useState } from "react"
import { ChevronDown, Lightbulb } from "lucide-react"
import type { InterviewStrings } from "../../i18n/interviewStrings"
import { Button } from "@/components/shadcn/button"
import { cn } from "@/lib/utils"

/**
 * Test account only: a sample answer to read aloud (or paste) so the mic, transcript, filler
 * detection, STAR check and scoring can be tried quickly. Never shown to normal users.
 * Hidden by default so it does not clutter the answer card; "Show" opens it.
 */
export function SuggestedAnswer({ s, text, onUse }: { s: InterviewStrings; text: string; onUse?: () => void }) {
  const id = useId()
  const [open, setOpen] = useState(false)
  return (
    <aside
      aria-labelledby={`${id}-title`}
      className={cn(
        "flex flex-col gap-2.5 rounded-xl border border-dashed border-primary/50 bg-[var(--iv-selected)]",
        open ? "p-4" : "px-4 py-2",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 id={`${id}-title`} className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Lightbulb className="size-4 shrink-0" aria-hidden="true" />
          {s.suggestionTitle}
        </h4>
        <div className="flex flex-wrap gap-2">
          {open && onUse && (
            <Button type="button" variant="outline" size="sm" className="min-h-9 bg-card pointer-coarse:min-h-11" onClick={onUse}>
              {s.useSuggestion}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-9 text-primary hover:text-primary pointer-coarse:min-h-11"
            aria-expanded={open}
            aria-controls={`${id}-body`}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? s.hideSuggestion : s.showSuggestion}
            <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden="true" />
          </Button>
        </div>
      </div>
      {open && (
        <div id={`${id}-body`} className="flex flex-col gap-2.5">
          <p className="text-base leading-[1.7] [overflow-wrap:anywhere]">{text}</p>
          <p className="text-xs text-muted-foreground">{s.suggestionHint}</p>
        </div>
      )}
    </aside>
  )
}
