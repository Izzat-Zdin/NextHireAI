import React from "react"

interface OverallScoreProps {
  score: number
  role: string
  interviewType: string
  summary: string
  recommendation: string
  durationMinutes: number
  completedDate: string
}

export const OverallScore: React.FC<OverallScoreProps> = ({
  score,
  role,
  interviewType,
  summary,
  recommendation,
  durationMinutes,
  completedDate,
}) => {
  return (
    <div className="assessment-hero">
      <div
        className="score-ring score-violet"
        style={{ "--score": `${score * 3.6}deg` } as React.CSSProperties}
      >
        <div>
          <strong>{score}</strong>
          <span>Overall</span>
        </div>
      </div>

      <div className="assessment-copy">
        <span className="badge badge-green">Strong performance</span>
        <h2>{summary}</h2>
        <p>{recommendation}</p>
      </div>

      <div className="assessment-meta">
        <span>{interviewType}</span>
        <strong>{role}</strong>
        <small>
          {completedDate} · {durationMinutes} min
        </small>
      </div>
    </div>
  )
}

