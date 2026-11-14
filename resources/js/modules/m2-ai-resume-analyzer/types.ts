import type { ResumeRow } from "@/lib/types"

/** The analysis fields of a `resume` row, produced by `analyzeResume` (`feedback` is derived on save). */
export type ResumeAnalysis = Pick<
  ResumeRow,
  | "overall_score"
  | "scores"
  | "detected_skills"
  | "matched_keywords"
  | "missing_keywords"
  | "sections"
  | "strengths"
  | "weaknesses"
  | "suggestions"
  | "summary"
>

export interface AnalyzeInput {
  text: string
  targetRole: string
  jobDescription?: string | null
}

export type SectionKey = "contact" | "summary" | "experience" | "education" | "skills" | "projects" | "certifications"

export const SECTION_KEYS: SectionKey[] = ["contact", "summary", "experience", "education", "skills", "projects", "certifications"]

export const SECTION_LABELS: Record<SectionKey, string> = {
  contact: "Contact details",
  summary: "Summary / objective",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  certifications: "Certifications & awards",
}

export const SCORE_LABELS: Record<keyof ResumeRow["scores"], string> = {
  keywords: "Keyword match",
  impact: "Impact & achievements",
  structure: "Structure",
  clarity: "Clarity",
  ats: "ATS readability",
}

export type AnalysisStep = "reading" | "analysing" | "saving"

export interface ParsedResume {
  text: string
  fileName: string
  /** "pdf" | "docx" | "txt" | "paste" */
  source: "pdf" | "docx" | "txt" | "paste"
  pageCount?: number
}
