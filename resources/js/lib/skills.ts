// Shared skill taxonomy used by the Resume Analyzer, Readiness Assessment and
// Learning Recommendation modules. `tag` values match learning_resources.skill_tags.

export interface SkillDefinition {
  tag: string
  label: string
  keywords: string[]
}

export const SKILLS: SkillDefinition[] = [
  { tag: "sql", label: "SQL & databases", keywords: ["sql", "mysql", "postgresql", "postgres", "sqlite", "database", "query", "queries", "joins"] },
  { tag: "data-analysis", label: "Data analysis", keywords: ["data analysis", "analytics", "analysed", "analyzed", "insights", "pandas", "dataset", "cohort"] },
  { tag: "data-visualization", label: "Data visualisation", keywords: ["tableau", "power bi", "looker", "dashboard", "visualization", "visualisation", "charts"] },
  { tag: "excel", label: "Excel & spreadsheets", keywords: ["excel", "spreadsheet", "vlookup", "pivot", "google sheets"] },
  { tag: "statistics", label: "Statistics", keywords: ["statistics", "statistical", "regression", "hypothesis", "significance", "probability"] },
  { tag: "python", label: "Python", keywords: ["python", "numpy", "jupyter", "django", "flask"] },
  { tag: "programming", label: "Programming fundamentals", keywords: ["programming", "java", "c++", "c#", "php", "oop", "object-oriented", "coding"] },
  { tag: "javascript", label: "JavaScript / TypeScript", keywords: ["javascript", "typescript", "node.js", "nodejs", "es6"] },
  { tag: "react", label: "React & front-end frameworks", keywords: ["react", "vue", "angular", "next.js", "nextjs", "redux"] },
  { tag: "web-development", label: "Web development", keywords: ["html", "css", "web development", "frontend", "front-end", "backend", "back-end", "rest api", "api", "laravel", "tailwind"] },
  { tag: "git", label: "Git & version control", keywords: ["git", "github", "gitlab", "version control", "pull request"] },
  { tag: "algorithms", label: "Algorithms & data structures", keywords: ["algorithm", "algorithms", "data structures", "complexity", "leetcode"] },
  { tag: "system-design", label: "System design", keywords: ["system design", "architecture", "microservices", "scalability", "cloud", "aws", "azure", "docker", "kubernetes"] },
  { tag: "product-management", label: "Product management", keywords: ["product management", "roadmap", "product owner", "user stories", "requirements", "backlog", "stakeholder"] },
  { tag: "product-analytics", label: "Product analytics", keywords: ["kpi", "metrics", "retention", "churn", "funnel", "conversion", "engagement", "dau", "mau"] },
  { tag: "ab-testing", label: "A/B testing & experimentation", keywords: ["a/b test", "ab test", "a/b testing", "experiment", "experimentation", "split test"] },
  { tag: "prioritization", label: "Prioritisation", keywords: ["prioritization", "prioritisation", "prioritize", "prioritise", "rice", "moscow", "trade-off"] },
  { tag: "agile", label: "Agile & Scrum", keywords: ["agile", "scrum", "kanban", "sprint", "jira"] },
  { tag: "ux-design", label: "UX / UI design", keywords: ["ux", "ui", "figma", "wireframe", "prototype", "prototyping", "usability", "adobe xd"] },
  { tag: "user-research", label: "User research", keywords: ["user research", "interviews", "survey", "persona", "usability testing", "user testing"] },
  { tag: "communication", label: "Communication", keywords: ["communication", "communicated", "presented", "collaborated", "collaboration", "liaised", "stakeholders"] },
  { tag: "presentation", label: "Presentation & public speaking", keywords: ["presentation", "presented", "public speaking", "pitch", "workshop"] },
  { tag: "leadership", label: "Leadership", keywords: ["led", "lead", "leader", "leadership", "managed", "mentored", "president", "head of", "coordinated"] },
  { tag: "problem-solving", label: "Problem solving", keywords: ["problem solving", "problem-solving", "troubleshoot", "troubleshooting", "resolved", "debugged", "root cause"] },
  { tag: "digital-marketing", label: "Digital marketing", keywords: ["marketing", "seo", "sem", "social media", "campaign", "content", "google ads", "email marketing"] },
  { tag: "sales", label: "Sales", keywords: ["sales", "prospecting", "crm", "salesforce", "quota", "lead generation", "negotiation", "closing"] },
  { tag: "customer-service", label: "Customer service", keywords: ["customer service", "customer support", "helpdesk", "zendesk", "client relations", "customer satisfaction"] },
  { tag: "interview-skills", label: "Interview skills", keywords: [] },
  { tag: "star-method", label: "STAR answer structure", keywords: [] },
  { tag: "career-planning", label: "Career planning", keywords: [] },
]

export const SKILL_BY_TAG: Record<string, SkillDefinition> = Object.fromEntries(SKILLS.map((skill) => [skill.tag, skill]))

export const TARGET_ROLES = [
  "Associate Product Analyst",
  "Software Engineer",
  "Data Analyst",
  "Product Manager",
  "UX Designer",
  "Marketing Specialist",
  "Sales Representative",
  "Business Analyst",
  "Customer Support Specialist",
]

/** Skills each target role is expected to demonstrate (most important first). */
export const ROLE_SKILLS: Record<string, string[]> = {
  "Associate Product Analyst": ["sql", "product-analytics", "data-analysis", "ab-testing", "excel", "communication", "data-visualization", "prioritization"],
  "Software Engineer": ["programming", "javascript", "algorithms", "git", "web-development", "system-design", "react", "problem-solving"],
  "Data Analyst": ["sql", "data-analysis", "excel", "data-visualization", "statistics", "python", "communication"],
  "Product Manager": ["product-management", "prioritization", "agile", "product-analytics", "user-research", "communication", "leadership", "ab-testing"],
  "UX Designer": ["ux-design", "user-research", "communication", "presentation", "web-development", "problem-solving"],
  "Marketing Specialist": ["digital-marketing", "data-analysis", "communication", "excel", "ab-testing", "presentation"],
  "Sales Representative": ["sales", "communication", "customer-service", "presentation", "excel", "leadership"],
  "Business Analyst": ["data-analysis", "sql", "excel", "product-management", "communication", "data-visualization", "agile"],
  "Customer Support Specialist": ["customer-service", "communication", "problem-solving", "excel"],
}

export function roleSkills(role?: string | null): string[] {
  if (role && ROLE_SKILLS[role]) return ROLE_SKILLS[role]
  return ["communication", "problem-solving", "leadership", "excel"]
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")
}

/** Returns skill tags whose keywords appear in the given text. */
export function detectSkillTags(text: string): string[] {
  const lower = ` ${text.toLowerCase()} `
  return SKILLS.filter((skill) =>
    skill.keywords.some((keyword) => new RegExp(`(^|[^a-z0-9])${escapeRegex(keyword)}([^a-z0-9]|$)`, "i").test(lower)),
  ).map((skill) => skill.tag)
}

/** Maps free-text skill names (from the profile) to taxonomy tags. */
export function tagsFromSkillNames(names: string[]): string[] {
  return Array.from(new Set(names.flatMap((name) => detectSkillTags(name).concat(SKILLS.filter((s) => s.label.toLowerCase() === name.toLowerCase()).map((s) => s.tag)))))
}

export function skillLabel(tag: string) {
  return SKILL_BY_TAG[tag]?.label ?? tag.replace(/-/g, " ")
}
