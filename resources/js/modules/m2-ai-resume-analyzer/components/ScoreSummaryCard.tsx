import { Card, Progress, ScoreRing } from "@/components/ui"
import { scoreLabel } from "@/lib/format"
import type { ResumeScores } from "@/lib/types"
import { SCORE_WEIGHTS } from "../services/resumeAnalysis"
import { SCORE_LABELS } from "../types"

const ORDER: (keyof ResumeScores)[] = ["keywords", "impact", "structure", "clarity", "ats"]

export default function ScoreSummaryCard({ score, scores, targetRole }: { score: number; scores: ResumeScores; targetRole: string }) {
  return (
    <Card className="items-center text-center">
      <ScoreRing value={score} label="Resume score" />
      <h3 className="mt-4 font-heading text-lg font-semibold">{scoreLabel(score)}</h3>
      <p className="mt-1 text-sm text-muted-foreground">Overall fit for {targetRole}, weighted across five dimensions.</p>
      <div className="mt-5 flex w-full flex-col gap-3 border-t pt-4 text-left">
        {ORDER.map((key) => {
          const value = Math.round(scores?.[key] ?? 0)
          return (
            <div key={key} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span>
                  {SCORE_LABELS[key]} <small className="text-xs text-muted-foreground">({Math.round(SCORE_WEIGHTS[key] * 100)}%)</small>
                </span>
                <strong className="font-semibold tabular-nums">{value}</strong>
              </div>
              <Progress value={value} label={SCORE_LABELS[key]} />
            </div>
          )
        })}
      </div>
    </Card>
  )
}
