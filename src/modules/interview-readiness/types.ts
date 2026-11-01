export interface AssessmentQuestionItem {
  id: string
  questionNo: number
  question: string
  category: "behavioral" | "technical" | "communication" | "problem_solving"
  targetMetric: string
}

export interface QuestionFeedbackItem {
  questionNo: number
  question: string
  score: number
  feedback: string
  strength: string
  suggestion: string
  starAnalysis?: {
    situation: string
    task: string
    action: string
    result: string
  }
}

export interface PerformanceMetrics {
  communicationScore: number
  relevanceScore: number
  technicalScore: number
  scoresByQuestion: number[]
  strengths: string[]
  weaknesses: string[]
}

export interface AssessmentResultData {
  id: string
  role: string
  interviewType: string
  overallScore: number
  summary: string
  recommendation: string
  completedDate: string
  durationMinutes: number
  metrics: PerformanceMetrics
  questionFeedback: QuestionFeedbackItem[]
}

export interface AssessmentConfig {
  role: string
  interviewType: string
  difficulty: string
  questionCount: number
}

