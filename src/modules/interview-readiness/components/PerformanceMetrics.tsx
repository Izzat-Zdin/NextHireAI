import React from "react"
import { MessageSquareText, Target, Activity, CheckCircle2, Zap } from "lucide-react"
import type { PerformanceMetrics as MetricsType } from "../types"

interface PerformanceMetricsProps {
  metrics: MetricsType
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ metrics }) => {
  const {
    communicationScore,
    relevanceScore,
    technicalScore,
    scoresByQuestion,
    strengths,
    weaknesses,
  } = metrics

  return (
    <>
      <div className="stats-grid three">
        <section className="card stat-card">
          <div className="icon-box icon-blue">
            <MessageSquareText size={19} />
          </div>
          <div>
            <p>Communication</p>
            <strong>{communicationScore}/100</strong>
            <small>Clear and structured</small>
          </div>
        </section>

        <section className="card stat-card">
          <div className="icon-box icon-green">
            <Target size={19} />
          </div>
          <div>
            <p>Answer relevance</p>
            <strong>{relevanceScore}/100</strong>
            <small>Strong examples</small>
          </div>
        </section>

        <section className="card stat-card">
          <div className="icon-box icon-violet">
            <Activity size={19} />
          </div>
          <div>
            <p>Technical response</p>
            <strong>{technicalScore}/100</strong>
            <small>Needs more depth</small>
          </div>
        </section>
      </div>

      <div className="content-grid">
        <section className="card">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="section-title">Performance by question</h2>
          </div>
          <div className="trend-chart">
            <div className="chart-grid">
              {scoresByQuestion.map((val, idx) => (
                <div className="chart-column" key={idx}>
                  <span className="chart-value">{val}</span>
                  <div
                    className="chart-bar"
                    style={{ height: `${Math.max(24, val)}%` }}
                  />
                  <span className="chart-label">Q{idx + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="card">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="section-title">What stood out</h2>
          </div>
          <div className="insight-list positive">
            {strengths.map((s, idx) => (
              <div key={idx}>
                <CheckCircle2 size={18} />
                <span>
                  <strong>{s.split(":")[0]}</strong>
                  <small>{s.split(":")[1] || s}</small>
                </span>
              </div>
            ))}
          </div>
          <div className="insight-list negative mt-3">
            {weaknesses.map((w, idx) => (
              <div key={idx}>
                <Zap size={18} />
                <span>
                  <strong>{w.split(":")[0]}</strong>
                  <small>{w.split(":")[1] || w}</small>
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}

