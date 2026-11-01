import React, { useState, useEffect } from "react"
import { ReadinessAssessment } from "./pages/ReadinessAssessment"
import { AssessmentResult } from "./pages/AssessmentResult"
import { assessmentService } from "./services/assessmentService"
import type { AssessmentResultData } from "./types"

interface ReadinessAssessmentModuleProps {
  onNavigateTab?: (tab: string) => void
}

export const ReadinessAssessmentModule: React.FC<ReadinessAssessmentModuleProps> = () => {
  const [view, setView] = useState<"result" | "assessment">("result")
  const [resultData, setResultData] = useState<AssessmentResultData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    assessmentService.getLatestAssessment().then((data) => {
      setResultData(data)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="card text-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-slate-500">Loading Career Readiness Data…</p>
      </div>
    )
  }

  if (view === "assessment") {
    return (
      <ReadinessAssessment
        onAssessmentComplete={(newResult) => {
          setResultData(newResult)
          setView("result")
        }}
      />
    )
  }

  return (
    resultData && (
      <AssessmentResult
        data={resultData}
        onRetake={() => setView("assessment")}
      />
    )
  )
}

export default ReadinessAssessmentModule

