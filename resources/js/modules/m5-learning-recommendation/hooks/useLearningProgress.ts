import { useMemo, useState } from "react"
import { useFlash } from "@/components/ui"
import { errorMessage } from "@/lib/format"
import type { LearningProgressRow, LearningResource } from "@/lib/types"
import { learningService, progressPatches, type ProgressPatch } from "../services/learningService"

/**
 * Holds the learner's learning_progress rows and exposes plan actions with
 * optimistic updates: the UI changes immediately, the server row replaces the
 * optimistic one on success, and the previous row is restored on failure.
 */
export function useLearningProgress(userId?: string) {
  const [progress, setProgress] = useState<LearningProgressRow[]>([])
  const [pending, setPending] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useFlash()

  const byResource = useMemo(() => new Map(progress.map((row) => [row.resource_id, row])), [progress])

  const replace = (resourceId: string, row: LearningProgressRow | null) => {
    setProgress((list) => {
      if (!row) return list.filter((item) => item.resource_id !== resourceId)
      return list.some((item) => item.resource_id === resourceId)
        ? list.map((item) => (item.resource_id === resourceId ? row : item))
        : [...list, row]
    })
  }

  const optimisticRow = (resourceId: string, patch: ProgressPatch): LearningProgressRow => {
    const current = byResource.get(resourceId)
    return {
      progress_id: `pending-${resourceId}`,
      user_id: userId ?? "",
      resource_id: resourceId,
      status: "Not Started",
      progress_percent: 0,
      completed_at: null,
      ...current,
      ...patch,
    }
  }

  const run = async (
    resourceId: string,
    optimistic: LearningProgressRow | null,
    request: () => Promise<LearningProgressRow | null>,
    success?: string,
  ): Promise<boolean> => {
    const previous = byResource.get(resourceId) ?? null
    setError(null)
    replace(resourceId, optimistic)
    setPending((map) => ({ ...map, [resourceId]: true }))
    try {
      const row = await request()
      replace(resourceId, row)
      if (success) setFlash(success)
      return true
    } catch (err) {
      replace(resourceId, previous)
      setError(errorMessage(err, "Could not update your learning plan. Please try again."))
      return false
    } finally {
      setPending((map) => {
        const next = { ...map }
        delete next[resourceId]
        return next
      })
    }
  }

  const actions = {
    save(resource: LearningResource) {
      const id = resource.resource_id
      return run(id, optimisticRow(id, progressPatches.save()), () => learningService.saveToPlan(id), `Saved "${resource.title}" to your learning plan.`)
    },
    start(resource: LearningResource) {
      const id = resource.resource_id
      const current = byResource.get(id) ?? null
      return run(id, optimisticRow(id, progressPatches.start(current)), () => learningService.startResource(id, current), `Started "${resource.title}". Good luck!`)
    },
    complete(resource: LearningResource) {
      const id = resource.resource_id
      return run(id, optimisticRow(id, progressPatches.complete()), () => learningService.completeResource(id), `Nice work — "${resource.title}" is completed.`)
    },
    setPercent(resource: LearningResource, percent: number) {
      const id = resource.resource_id
      const current = byResource.get(id) ?? null
      return run(
        id,
        optimisticRow(id, progressPatches.percent(percent, current)),
        () => learningService.updateProgress(id, percent, current),
        percent >= 100 ? `Nice work — "${resource.title}" is completed.` : undefined,
      )
    },
    remove(resource: LearningResource) {
      const id = resource.resource_id
      return run(
        id,
        null,
        async () => {
          await learningService.removeFromPlan(id)
          return null
        },
        `Removed "${resource.title}" from your learning plan.`,
      )
    },
    /** Bookmark toggle: save when not in the plan, unsave when saved but not started. */
    toggleSave(resource: LearningResource) {
      const current = byResource.get(resource.resource_id)
      if (!current) return actions.save(resource)
      if (current.status === "Not Started") return actions.remove(resource)
      return Promise.resolve(true)
    },
  }

  return { progress, setProgress, byResource, pending, error, setError, flash, setFlash, actions }
}

export type LearningActions = ReturnType<typeof useLearningProgress>["actions"]
