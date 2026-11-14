import { CheckCircle2, Circle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AnalysisStep } from "../types"

const STEPS: { key: AnalysisStep; label: string; hint: string }[] = [
  { key: "reading", label: "Reading file", hint: "Extracting text from your resume" },
  { key: "analysing", label: "Analysing", hint: "Checking skills, impact, structure and clarity" },
  { key: "saving", label: "Saving", hint: "Storing your report securely" },
]

export default function AnalysisProgress({ step }: { step: AnalysisStep }) {
  const current = STEPS.findIndex((item) => item.key === step)
  return (
    <ol className="mt-4 flex flex-col gap-3 rounded-lg border bg-muted/40 p-4" aria-live="polite">
      {STEPS.map((item, index) => {
        const done = index < current
        const active = index === current
        return (
          <li key={item.key} className="flex items-center gap-3">
            {done ? (
              <CheckCircle2 className="size-[18px] shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            ) : active ? (
              <Loader2 className="size-[18px] shrink-0 animate-spin text-foreground" aria-hidden="true" />
            ) : (
              <Circle className="size-[18px] shrink-0 text-muted-foreground/50" aria-hidden="true" />
            )}
            <div className="flex min-w-0 flex-col">
              <strong
                className={cn(
                  "text-sm font-medium",
                  active ? "text-foreground" : done ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground",
                )}
              >
                {item.label}
              </strong>
              <small className="text-xs text-muted-foreground">{item.hint}</small>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
