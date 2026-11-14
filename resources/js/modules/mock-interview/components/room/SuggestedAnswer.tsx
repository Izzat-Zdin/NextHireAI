import { useId } from "react"
import { Lightbulb } from "lucide-react"
import type { InterviewStrings } from "../../i18n/interviewStrings"
import { Button } from "@/components/shadcn/button"

/**
 * Test account only: a sample answer to read aloud (or paste) so the mic, transcript, filler
 * detection, STAR check and scoring can be tried quickly. Never shown to normal users.
 */
export function SuggestedAnswer({ s, text, onUse }: { s: InterviewStrings; text: string; onUse?: () => void }) {
  const id = useId()
  return (
    <aside aria-labelledby={id} className="flex flex-col gap-2.5 rounded-xl border border-dashed border-primary/50 bg-[var(--iv-selected)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 id={id} className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Lightbulb className="size-4 shrink-0" aria-hidden="true" />
          {s.suggestionTitle}
        </h4>
        {onUse && (
          <Button type="button" variant="outline" size="sm" className="min-h-11 bg-card" onClick={onUse}>
            {s.useSuggestion}
          </Button>
        )}
      </div>
      <p className="text-base leading-[1.7] [overflow-wrap:anywhere]">{text}</p>
      <p className="text-xs text-muted-foreground">{s.suggestionHint}</p>
    </aside>
  )
}
