import React, { useState } from "react"
import { Play, Sparkles } from "lucide-react"
import type { AssessmentConfig } from "../types"

interface AssessmentFormProps {
  onStart: (config: AssessmentConfig) => void
  loading?: boolean
}

export const AssessmentForm: React.FC<AssessmentFormProps> = ({ onStart, loading }) => {
  const [role, setRole] = useState("Associate Product Analyst")
  const [interviewType, setInterviewType] = useState("Behavioural & Technical")
  const [difficulty, setDifficulty] = useState("Intermediate")
  const [questionCount, setQuestionCount] = useState(5)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onStart({
      role,
      interviewType,
      difficulty,
      questionCount,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="card max-w-xl mx-auto space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="text-violet-600" size={20} />
        <h2 className="section-title">Configure Career Readiness Assessment</h2>
      </div>
      <p className="text-sm text-slate-600 mb-4">
        Customize your readiness evaluation to match your target job requirements and industry expectations.
      </p>

      <label className="field">
        <span>Target Job Role</span>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option>Associate Product Analyst</option>
          <option>Software Engineer</option>
          <option>Product Manager</option>
          <option>Data Analyst</option>
          <option>UI/UX Designer</option>
        </select>
      </label>

      <label className="field">
        <span>Interview Type</span>
        <select value={interviewType} onChange={(e) => setInterviewType(e.target.value)}>
          <option>Behavioural & Technical</option>
          <option>HR & Cultural Fit</option>
          <option>Technical Deep Dive</option>
        </select>
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="field">
          <span>Difficulty Level</span>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option>Entry-level / Fresh Grad</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
        </label>

        <label className="field">
          <span>Number of Questions</span>
          <select
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
          >
            <option value={3}>3 Questions (Quick)</option>
            <option value={5}>5 Questions (Standard)</option>
            <option value={8}>8 Questions (In-depth)</option>
          </select>
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary w-full mt-4 flex items-center justify-center gap-2"
      >
        <Play size={16} /> {loading ? "Preparing Assessment…" : "Begin Assessment Test"}
      </button>
    </form>
  )
}

