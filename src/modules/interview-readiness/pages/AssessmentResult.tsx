import React, { useState } from "react"
import { FileText, Lightbulb, RotateCcw } from "lucide-react"
import type { AssessmentResultData } from "../types"
import { OverallScore } from "../components/OverallScore"
import { PerformanceMetrics } from "../components/PerformanceMetrics"
import { QuestionFeedback } from "../components/QuestionFeedback"
import { FullReport } from "../components/FullReport"
import { assessmentService } from "../services/assessmentService"

interface AssessmentResultPageProps {
  data: AssessmentResultData
  onRetake: () => void
}

export const AssessmentResult: React.FC<AssessmentResultPageProps> = ({ data, onRetake }) => {
  const [activeTab, setActiveTab] = useState<"Overview" | "Question feedback" | "Full report">(
    "Overview"
  )

  return (
    <div className="space-y-6">
      <div className="page-intro">
        <div>
          <p className="eyebrow">Module 4 · Reflect</p>
          <h1>Understand Every Response</h1>
          <p>
            Review your comprehensive career readiness assessment and turn actionable feedback into
            focused milestones.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => assessmentService.exportReport()}
            className="btn btn-secondary flex items-center gap-1.5"
          >
            <FileText size={16} /> Export Report
          </button>
          <button onClick={onRetake} className="btn btn-primary flex items-center gap-1.5">
            <RotateCcw size={16} /> Take New Assessment
          </button>
        </div>
      </div>

      <div className="guidance-note">
        <Lightbulb size={18} />
        <span>
          <strong>Use scores as guidance.</strong> AI-style feedback in this evaluation is for
          practice and growth, reflecting readiness for typical company hiring bars.
        </span>
      </div>

      <OverallScore
        score={data.overallScore}
        role={data.role}
        interviewType={data.interviewType}
        summary={data.summary}
        recommendation={data.recommendation}
        durationMinutes={data.durationMinutes}
        completedDate={data.completedDate}
      />

      <div className="tab-list">
        {(["Overview", "Question feedback", "Full report"] as const).map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Overview" && <PerformanceMetrics metrics={data.metrics} />}

      {activeTab === "Question feedback" && (
        <QuestionFeedback items={data.questionFeedback} />
      )}

      {activeTab === "Full report" && <FullReport data={data} />}
    </div>
  )
}

