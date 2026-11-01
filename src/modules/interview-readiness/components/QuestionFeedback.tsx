import React from "react"
import type { QuestionFeedbackItem } from "../types"

interface QuestionFeedbackProps {
  items: QuestionFeedbackItem[]
}

export const QuestionFeedback: React.FC<QuestionFeedbackProps> = ({ items }) => {
  return (
    <div className="question-feedback-list space-y-4">
      {items.map((item) => (
        <section className="card" key={item.questionNo}>
          <div className="feedback-head flex items-start justify-between gap-4">
            <span className="font-bold text-violet-600">Q{item.questionNo}</span>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-800">{item.question}</h3>
              <p className="text-slate-600 mt-1">{item.feedback}</p>
              
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-lg border border-emerald-100">
                  <span className="font-bold">✨ Strength: </span>
                  {item.strength}
                </div>
                <div className="bg-amber-50 text-amber-800 p-2.5 rounded-lg border border-amber-100">
                  <span className="font-bold">💡 Suggestion: </span>
                  {item.suggestion}
                </div>
              </div>
            </div>
            <span
              className={`badge ${
                item.score >= 80
                  ? "badge-green"
                  : item.score >= 70
                  ? "badge-blue"
                  : "badge-amber"
              }`}
            >
              {item.score}/100
            </span>
          </div>
        </section>
      ))}
    </div>
  )
}

