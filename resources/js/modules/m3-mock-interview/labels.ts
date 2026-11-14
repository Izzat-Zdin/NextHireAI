import type { InterviewTypeDb, SessionStatus } from "@/lib/types"

/** Display labels for interview_sessions.interview_type (DB values stay HR | Tech | Behaviour). */
export const INTERVIEW_TYPE_LABEL: Record<InterviewTypeDb, string> = {
  HR: "HR",
  Tech: "Technical",
  Behaviour: "Behavioural",
}

/** Display label + badge tone for interview_sessions.status (DB values stay Active | Pause | Cancel | Finish). */
export const SESSION_STATUS_BADGE: Record<SessionStatus, { label: string; tone: "green" | "blue" | "amber" | "slate" }> = {
  Finish: { label: "Finished", tone: "green" },
  Active: { label: "In progress", tone: "blue" },
  Pause: { label: "Paused", tone: "amber" },
  Cancel: { label: "Cancelled", tone: "slate" },
}
