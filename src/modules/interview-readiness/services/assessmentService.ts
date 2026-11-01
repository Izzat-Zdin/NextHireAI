import type { AssessmentConfig, AssessmentQuestionItem, AssessmentResultData } from "../types"

const SAMPLE_RESULT: AssessmentResultData = {
  id: "asmt_001",
  role: "Associate Product Analyst",
  interviewType: "Behavioural & Technical",
  overallScore: 82,
  summary:
    "You communicated clearly and connected your examples to business outcomes. Strong early-career interview readiness.",
  recommendation:
    "Focus next on concise technical explanations and stronger closing statements.",
  completedDate: "Today",
  durationMinutes: 12,
  metrics: {
    communicationScore: 84,
    relevanceScore: 86,
    technicalScore: 74,
    scoresByQuestion: [78, 85, 74, 88, 84],
    strengths: [
      "Strong STAR structure: Your challenge and impact were easy to follow.",
      "Business awareness: You linked metrics to customer outcomes.",
    ],
    weaknesses: [
      "Technical precision: Define metrics and SQL logic before explaining the final analysis.",
    ],
  },
  questionFeedback: [
    {
      questionNo: 1,
      question: "Tell me about a project where you used data to improve a product or process.",
      score: 78,
      feedback: "Clear structure and specific outcome mentioned. Good explanation of business impact.",
      strength: "Structured approach using past project experience.",
      suggestion: "Quantify the outcome more clearly with exact metric gains.",
    },
    {
      questionNo: 2,
      question: "How would you prioritize features when stakeholders have competing requirements?",
      score: 85,
      feedback: "Strong prioritization framework applied. Good stakeholder empathy demonstrated.",
      strength: "Mentioned RICE or value-vs-effort matrix.",
      suggestion: "Mention how you communicate trade-offs back to leadership.",
    },
    {
      questionNo: 3,
      question: "Describe a time you received difficult feedback. How did you respond?",
      score: 74,
      feedback: "Good honesty. Add more detail about the analysis method and how you validated the result.",
      strength: "Demonstrated maturity and coachability.",
      suggestion: "Conclude with the concrete change in your workflow resulting from that feedback.",
    },
    {
      questionNo: 4,
      question: "How would you investigate a sudden drop in a product's weekly active users?",
      score: 88,
      feedback: "Excellent analytical breakdown, segmenting by platform, cohort, and release schedule.",
      strength: "Thorough root-cause methodology.",
      suggestion: "Keep response concise so the interviewer has time for follow-up questions.",
    },
    {
      questionNo: 5,
      question: "Why are you interested in this Associate Product Analyst role?",
      score: 84,
      feedback: "Genuine passion shown for product decision-making and cross-functional teamwork.",
      strength: "Good connection to personal career vision.",
      suggestion: "Reference a specific product feature that the company recently launched.",
    },
  ],
}

export const assessmentService = {
  async getLatestAssessment(id?: string): Promise<AssessmentResultData> {
    // In production with Laravel, this calls: await fetch(`/career-readiness/result/${id}`)
    return new Promise((resolve) => {
      setTimeout(() => resolve(SAMPLE_RESULT), 300)
    })
  },

  async submitAssessment(
    config: AssessmentConfig,
    answers: Record<string, string>
  ): Promise<AssessmentResultData> {
    // In production with Laravel, this calls: await fetch('/career-readiness', { method: 'POST', body: ... })
    return new Promise((resolve) => {
      setTimeout(() => resolve(SAMPLE_RESULT), 600)
    })
  },

  exportReport(): void {
    window.print()
  },
}

