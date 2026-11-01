import React, { useState } from "react"
import { ArrowRight, Send } from "lucide-react"

interface AssessmentQuestionProps {
  questionNo: number
  totalQuestions: number
  questionText: string
  category: string
  onSubmitAnswer: (answer: string) => void
  loading?: boolean
}

export const AssessmentQuestion: React.FC<AssessmentQuestionProps> = ({
  questionNo,
  totalQuestions,
  questionText,
  category,
  onSubmitAnswer,
  loading,
}) => {
  const [answer, setAnswer] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!answer.trim()) return
    onSubmitAnswer(answer)
    setAnswer("")
  }

  return (
    <div className="card max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <span className="badge badge-violet capitalize">{category}</span>
        <span className="text-sm font-semibold text-slate-500">
          Question {questionNo} of {totalQuestions}
        </span>
      </div>

      <div className="progress-track mb-6">
        <div
          className="progress-fill progress-violet"
          style={{ width: `${(questionNo / totalQuestions) * 100}%` }}
        />
      </div>

      <h2 className="text-xl font-bold text-slate-800 mb-4">{questionText}</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="field">
          <span>Your Written Response / Solution:</span>
          <textarea
            rows={6}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your structured answer here (Hint: Situation, Task, Action, Result)..."
            className="w-full p-3 border rounded-lg border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
            required
          />
        </label>

        <div className="flex justify-between items-center pt-2">
          <small className="text-slate-500">
            {answer.trim().split(/\s+/).filter(Boolean).length} words
          </small>
          <button
            type="submit"
            disabled={loading || !answer.trim()}
            className="btn btn-primary flex items-center gap-2"
          >
            {questionNo === totalQuestions ? (
              <>
                <Send size={15} /> Submit for Final Assessment
              </>
            ) : (
              <>
                Next Question <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

