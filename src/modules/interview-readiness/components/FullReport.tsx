import React from "react"
import { Printer } from "lucide-react"
import type { AssessmentResultData } from "../types"

interface FullReportProps {
  data: AssessmentResultData
  userName?: string
}

export const FullReport: React.FC<FullReportProps> = ({
  data,
  userName = "Maya Chen",
}) => {
  return (
    <section className="card report-view">
      <div className="report-header">
        <div className="logo-mark small">N</div>
        <div>
          <h2>NextHire AI Interview Report</h2>
          <p>
            {userName} · {data.role}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-slate">Official Assessment</span>
          <button
            onClick={() => window.print()}
            className="btn btn-secondary btn-sm flex items-center gap-1.5"
          >
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      <div className="report-grid">
        <div>
          <span>Overall score</span>
          <strong>{data.overallScore}/100</strong>
        </div>
        <div>
          <span>Top strength</span>
          <strong>Answer relevance & STAR structure</strong>
        </div>
        <div>
          <span>Priority focus</span>
          <strong>Technical precision & depth</strong>
        </div>
      </div>

      <h3>Coach summary</h3>
      <p>{data.summary}</p>

      <h3 className="mt-5">Actionable recommendations</h3>
      <p>{data.recommendation}</p>

      <div className="mt-6 border-t border-slate-200 pt-4 text-xs text-slate-500 flex justify-between">
        <span>Completed date: {data.completedDate}</span>
        <span>Session duration: {data.durationMinutes} minutes</span>
      </div>
    </section>
  )
}

