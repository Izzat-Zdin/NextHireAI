import { usePage } from "@inertiajs/react"

/**
 * Number of the user's interview sessions with status 'Pause' (amber dot on "Interview").
 * Shared by HandleInertiaRequests on every page visit, so it refreshes with each navigation.
 */
export function usePausedSessionCount(_userId: string | undefined, _refreshKey: string): number {
  const { props } = usePage<{ pausedSessionCount?: number }>()
  return props.pausedSessionCount ?? 0
}
