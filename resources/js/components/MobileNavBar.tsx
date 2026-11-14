import { useEffect, useState } from "react"
import { NavLink, useLocation, useNavigate } from "@/lib/router"
import { LogOut, MoreHorizontal, UserRound } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/shadcn/sheet"
import { ADMIN_NAV, MOBILE_MORE, MOBILE_TABS, isActivePath, type NavItem } from "@/components/navigation"
import { cn } from "@/lib/utils"

const tabClass =
  "flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 text-xs leading-none text-muted-foreground outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-[current=page]:font-semibold aria-[current=page]:text-foreground"

/** Small amber dot with an accessible label (paused interview sessions). */
export function PausedDot({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null
  return (
    <span
      role="img"
      aria-label={`${count} paused ${count === 1 ? "session" : "sessions"}`}
      className={cn("size-[7px] shrink-0 rounded-full bg-amber-400", className)}
    />
  )
}

/**
 * Fixed bottom bar for phones (below 768px): Home, Resume, Interview, Learning and More.
 * "More" opens a bottom sheet with the remaining destinations, the profile and sign out.
 */
export function MobileNavBar({
  pausedCount,
  isAdmin,
  onLogout,
}: {
  pausedCount: number
  isAdmin: boolean
  onLogout: () => void
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const [moreOpen, setMoreOpen] = useState(false)
  const tabs: NavItem[] = isAdmin ? ADMIN_NAV : MOBILE_TABS
  const moreItems: NavItem[] = isAdmin ? [] : MOBILE_MORE
  const moreActive = moreItems.some((item) => isActivePath(location.pathname, item)) || location.pathname.startsWith("/profile")

  // Close the sheet after navigating.
  useEffect(() => setMoreOpen(false), [location.pathname])

  const go = (to: string) => {
    setMoreOpen(false)
    navigate(to)
  }

  return (
    <>
      <nav
        aria-label="Main"
        style={{ gridTemplateColumns: `repeat(${tabs.length + 1}, minmax(0, 1fr))` }}
        className="fixed inset-x-0 bottom-0 z-40 grid gap-0.5 border-t bg-sidebar px-1.5 pt-1 pb-[max(env(safe-area-inset-bottom),0.375rem)] text-sidebar-foreground md:hidden"
      >
        {tabs.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={tabClass}>
            <span className="relative">
              <item.icon className="size-5" aria-hidden="true" />
              {item.to === "/interview" && <PausedDot count={pausedCount} className="absolute -top-0.5 -right-1 size-1.5" />}
            </span>
            {item.label}
          </NavLink>
        ))}
        <button
          type="button"
          className={tabClass}
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          aria-current={moreActive ? "page" : undefined}
          onClick={() => setMoreOpen(true)}
        >
          <MoreHorizontal className="size-5" aria-hidden="true" />
          More
        </button>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl pb-[max(env(safe-area-inset-bottom),1rem)] [&>button]:top-2 [&>button]:right-2 [&>button]:grid [&>button]:size-11 [&>button]:place-items-center [&>button>svg]:size-5"
        >
          <SheetHeader className="pb-1">
            <SheetTitle>More</SheetTitle>
            <SheetDescription className="sr-only">Other pages, your profile and sign out</SheetDescription>
          </SheetHeader>
          <ul className="flex flex-col gap-0.5 px-2">
            {moreItems.map((item) => {
              const active = isActivePath(location.pathname, item)
              return (
                <li key={item.to}>
                  <button
                    type="button"
                    aria-current={active ? "page" : undefined}
                    onClick={() => go(item.to)}
                    className={cn(
                      "flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left text-[15px] outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50",
                      active && "bg-accent font-medium",
                    )}
                  >
                    <item.icon className="size-5 text-muted-foreground" aria-hidden="true" />
                    {item.label}
                  </button>
                </li>
              )
            })}
            {moreItems.length > 0 && <li className="my-1 border-t" role="presentation" />}
            <li>
              <button
                type="button"
                aria-current={location.pathname.startsWith("/profile") ? "page" : undefined}
                onClick={() => go("/profile")}
                className="flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left text-[15px] outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <UserRound className="size-5 text-muted-foreground" aria-hidden="true" />
                Profile &amp; settings
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false)
                  onLogout()
                }}
                className="flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left text-[15px] text-destructive outline-none hover:bg-destructive/10 focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <LogOut className="size-5" aria-hidden="true" />
                Log out
              </button>
            </li>
          </ul>
        </SheetContent>
      </Sheet>
    </>
  )
}
