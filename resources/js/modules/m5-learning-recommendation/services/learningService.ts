// Learning plan persistence (table: learning_progress, unique (user_id, resource_id)) via the Laravel API.
// Columns: status ('Not Started' | 'In Progress' | 'Completed'), progress_percent (0-100), completed_at.
// Every write is an upsert on the unique key so the same call works whether or not
// the learner already has a row for the resource.
import type { LearningProgressRow, LearningResource } from "@/lib/types"

export type ProgressPatch = Partial<Pick<LearningProgressRow, "status" | "progress_percent" | "completed_at">>

// TODO (Shafinaz & Wani): helper asal (bina semula):
//   const now = () => new Date().toISOString()
//   const clampPercent = (value) => Math.max(0, Math.min(100, Math.round(Number.isFinite(value) ? value : 0)))
// dan import { api } from "@/lib/api" untuk panggilan HTTP.

/**
 * Pure state transitions. The service uses them for the database write and the
 * UI uses the same functions for optimistic updates, so both always agree.
 */
export const progressPatches = {
  /** Saved to the plan, not started yet. */
  save(): ProgressPatch {
    // TODO (Shafinaz & Wani): pulangkan { status: "Not Started", progress_percent: 0, completed_at: null }
    return {}
  },
  /** Start (or resume / restart). Restarting a completed resource resets it to 0% and clears completed_at. */
  start(current?: LearningProgressRow | null): ProgressPatch {
    // TODO (Shafinaz & Wani):
    // 1. keepPercent = (current wujud DAN current.status !== "Completed") ? current.progress_percent : 0
    // 2. pulangkan { status: "In Progress", progress_percent: keepPercent, completed_at: null }
    void current
    return {}
  },
  complete(): ProgressPatch {
    // TODO (Shafinaz & Wani): pulangkan { status: "Completed", progress_percent: 100, completed_at: now() }
    return {}
  },
  percent(value: number, current?: LearningProgressRow | null): ProgressPatch {
    // TODO (Shafinaz & Wani):
    // 1. percent = clampPercent(value)  (bulatkan, had 0..100, bukan nombor → 0)
    // 2. jika percent >= 100 → pulangkan progressPatches.complete()
    // 3. jika percent === 0 DAN (tiada current ATAU current.status === "Not Started") → pulangkan progressPatches.save()
    // 4. selain itu → { status: "In Progress", progress_percent: percent, completed_at: null }
    void value
    void current
    return {}
  },
}

// TODO (Shafinaz & Wani): fungsi dalaman (tidak di-export):
//   function upsertProgress(resourceId: string, patch: ProgressPatch): Promise<LearningProgressRow>
//     → api.put<LearningProgressRow>(`/api/learning/resources/${resourceId}/progress`, patch)
//   Body yang dihantar = patch { status, progress_percent, completed_at }. Server pulangkan baris learning_progress terkini.

/** Adds a resource to the learner's plan with status "Not Started". */
export function saveToPlan(resourceId: string): Promise<LearningProgressRow> {
  // TODO (Shafinaz & Wani): return upsertProgress(resourceId, progressPatches.save())
  void resourceId
  return Promise.reject(new Error("Belum dibina (TODO)"))
}

/** Marks a resource as in progress (keeps the current percentage when resuming). */
export function startResource(resourceId: string, current?: LearningProgressRow | null): Promise<LearningProgressRow> {
  // TODO (Shafinaz & Wani): return upsertProgress(resourceId, progressPatches.start(current))
  void resourceId
  void current
  return Promise.reject(new Error("Belum dibina (TODO)"))
}

/** Marks a resource as completed (100%, completed_at = now). */
export function completeResource(resourceId: string): Promise<LearningProgressRow> {
  // TODO (Shafinaz & Wani): return upsertProgress(resourceId, progressPatches.complete())
  void resourceId
  return Promise.reject(new Error("Belum dibina (TODO)"))
}

/** Updates the completion percentage; 100% completes the resource. */
export function updateProgress(resourceId: string, percent: number, current?: LearningProgressRow | null): Promise<LearningProgressRow> {
  // TODO (Shafinaz & Wani): return upsertProgress(resourceId, progressPatches.percent(percent, current))
  void resourceId
  void percent
  void current
  return Promise.reject(new Error("Belum dibina (TODO)"))
}

/** Removes the resource from the learner's plan entirely. */
export async function removeFromPlan(resourceId: string): Promise<void> {
  // TODO (Shafinaz & Wani): await api.delete(`/api/learning/resources/${resourceId}/progress`)  (server pulangkan 204)
  void resourceId
  throw new Error("Belum dibina (TODO)")
}

/** Loads a single resource. */
export async function fetchResource(resourceId: string): Promise<LearningResource | null> {
  // TODO (Shafinaz & Wani):
  // 1. Jika resourceId bukan UUID (regex /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) → return null
  //    (elak panggil API dengan id rosak).
  // 2. return api.getOrNull<LearningResource>(`/api/learning/resources/${resourceId}`)  (404 → null)
  void resourceId
  return null
}

export const learningService = {
  saveToPlan,
  startResource,
  completeResource,
  updateProgress,
  removeFromPlan,
  fetchResource,
}
