import React, { useState } from "react"
import { AssessmentForm } from "../components/AssessmentForm"
import { AssessmentQuestion } from "../components/AssessmentQuestion"
import type { AssessmentConfig, AssessmentQuestionItem } from "../types"
import { assessmentService } from "../services/assessmentService"
import { Sparkles } from "lucide-react"

interface ReadinessAssessmentPageProps {
  onAssessmentComplete: (result: any) => void
}

const DEFAULT_QUESTIONS: AssessmentQuestionItem[] = [
  {
    id: "q1",
    questionNo: 1,
    question: "Tell me about a project where you used data to improve a product or process.",
    category: "behavioral",
    targetMetric: "Data-driven storytelling",
  },
  {
    id: "q2",
    questionNo: 2,
    question: "How would you prioritize features when stakeholders have competing requirements?",
    category: "problem_solving",
    targetMetric: "Stakeholder management & trade-offs",
  },
  {
    id: "q3",
    questionNo: 3,
    question: "Describe a time you received difficult feedback. How did you respond?",
    category: "communication",
    targetMetric: "Coachability & resilience",
  },
  {
    id: "q4",
    questionNo: 4,
    question: "How would you investigate a sudden drop in a product's weekly active users?",
    category: "technical",
    targetMetric: "Root cause analysis",
  },
  {
    id: "q5",
    questionNo: 5,
    question: "Why are you interested in this Associate Product Analyst role?",
    category: "communication",
    targetMetric: "Role motivation & alignment",
  },
]

export const ReadinessAssessment: React.FC<ReadinessAssessmentPageProps> = ({
  onAssessmentComplete,
}) => {
  const [stage, setStage] = useState<"config" | "answering" | "submitting">("config")
  const [config, setConfig] = useState<AssessmentConfig | null>(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const handleStart = (cfg: AssessmentConfig) => {
    setConfig(cfg)
    setCurrentIdx(0)
    setAnswers({})
    setStage("answering")
  }

  const handleAnswerSubmit = async (answer: string) => {
    const nextAnswers = { ...answers, [currentIdx + 1]: answer }
    setAnswers(nextAnswers)

    const total = config?.questionCount || 5
    if (currentIdx + 1 >= total) {
      setStage("submitting")
      try {
        const result = await assessmentService.submitAssessment(config!, nextAnswers)
        onAssessmentComplete(result)
      } catch (err) {
        console.error("Failed to submit assessment:", err)
      }
    } else {
      setCurrentIdx((prev) => prev + 1)
    }
  }

  if (stage === "config") {
    return (
      <div className="py-6">
        <AssessmentForm onStart={handleStart} />
      </div>
    )
  }

  if (stage === "submitting") {
    return (
      <div className="card max-w-md mx-auto text-center py-12 space-y-4">
        <div className="animate-spin w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">Calculating Career Readiness Score</h3>
        <p className="text-sm text-slate-500">
          AI is analyzing your STAR structure, technical accuracy, and communication relevance…
        </p>
      </div>
    )
  }

  const q = DEFAULT_QUESTIONS[currentIdx] || DEFAULT_QUESTIONS[0]
  return (
    <div className="py-6">
      <AssessmentQuestion
        questionNo={currentIdx + 1}
        totalQuestions={config?.questionCount || 5}
        questionText={q.question}
        category={q.category}
        onSubmitAnswer={handleAnswerSubmit}
      />
    </div>
  )
}

