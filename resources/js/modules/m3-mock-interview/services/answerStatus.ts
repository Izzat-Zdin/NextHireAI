import type { AnswerRecord } from "../types"

/** Placeholder text stored on a question the candidate moved past without answering. */
export const SKIPPED_ANSWER_TEXT = "[Skipped without answering]"

/** True when the candidate moved past the question without an answer. */
export const isSkippedAnswer = (record: Pick<AnswerRecord, "answerText">) => record.answerText.startsWith("[Skipped")
