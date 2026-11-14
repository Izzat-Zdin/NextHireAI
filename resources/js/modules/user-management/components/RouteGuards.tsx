import type { ReactNode } from "react"
import { Navigate, useLocation } from "@/lib/router"
import { ShieldAlert } from "lucide-react"
import { Button, Card, LoadingState } from "@/components/ui"
import { useAuth } from "../context/AuthContext"

export function FullScreenLoader({ label = "Loading NextHire…" }: { label?: string }) {
  return (
    <div className="grid min-h-svh place-items-center bg-background px-4 text-foreground">
      <LoadingState label={label} />
    </div>
  )
}

/** Only signed-in, active users with a loaded profile may pass. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, profile, loading, authNotice, signOut } = useAuth()
  const location = useLocation()

  if (loading) return <FullScreenLoader />
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  if (!profile) {
    return (
      <main className="grid min-h-svh place-items-center bg-background px-4 py-10 text-foreground">
        <Card className="w-full max-w-md">
          <div className="flex flex-col items-center gap-2 py-2 text-center">
            <div className="mb-2 grid size-11 place-items-center rounded-full border bg-muted">
              <ShieldAlert className="size-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <h1 className="font-heading text-lg font-semibold tracking-tight">We could not load your profile</h1>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
              {authNotice ?? "Please try again in a moment."}
            </p>
            <div className="mt-4 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button onClick={() => window.location.reload()}>Retry</Button>
              <Button variant="secondary" onClick={() => void signOut()}>
                Sign out
              </Button>
            </div>
          </div>
        </Card>
      </main>
    )
  }
  return <>{children}</>
}

/** Admin-only pages. Non-admins are sent back to the dashboard. */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth()
  if (!isAdmin) return <Navigate to="/" replace />
  return <>{children}</>
}

/** Login/register pages: signed-in users go straight to the app. */
export function GuestRoute({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullScreenLoader />
  if (session && profile) {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from && from !== "/login" ? from : "/"} replace />
  }
  return <>{children}</>
}
