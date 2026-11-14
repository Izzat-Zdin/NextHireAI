import { useCallback, useEffect, useState, type CSSProperties } from "react"
import { Link, NavLink, useLocation, useNavigate } from "@/lib/router"
import type { ReactNode } from "react"
import { ChevronsUpDown, LogOut, Settings, UserRound } from "lucide-react"
import { Avatar as UiAvatar, AvatarFallback, AvatarImage } from "@/components/shadcn/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/shadcn/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { MobileNavBar, PausedDot } from "@/components/MobileNavBar"
import { NavChromeProvider, useNavChrome } from "@/components/nav-chrome"
import { ADMIN_NAV, HOME_NAV, MODULE_NAV, isActivePath, pageTitle, type NavItem } from "@/components/navigation"
import { initials } from "@/lib/format"
import { usePausedSessionCount } from "@/lib/usePausedSessions"
import { cn } from "@/lib/utils"
import { useAuth } from "@/modules/user-management/context/AuthContext"

// Kept for pages that import it (admin user detail, dashboard cards).
export { MODULE_NAV } from "@/components/navigation"

/** Initials or provider photo (shadcn Avatar). `large` is used on profile headers. */
export function Avatar({ name, url, large }: { name: string; url?: string | null; large?: boolean }) {
  return (
    <UiAvatar className={cn("shrink-0 rounded-lg", large ? "size-16 text-lg" : "size-8")}>
      {url && <AvatarImage src={url} alt="" referrerPolicy="no-referrer" />}
      <AvatarFallback className="rounded-lg bg-muted font-semibold">{initials(name)}</AvatarFallback>
    </UiAvatar>
  )
}

// ---------------------------------------------------------------- collapse state (localStorage)
const SIDEBAR_KEY = "nexthire-sidebar"

function readSidebarOpen(): boolean {
  try {
    const value = window.localStorage.getItem(SIDEBAR_KEY)
    return value === null ? true : value === "open"
  } catch {
    return true
  }
}

function writeSidebarOpen(open: boolean) {
  try {
    window.localStorage.setItem(SIDEBAR_KEY, open ? "open" : "closed")
  } catch {
    /* private mode or storage blocked: the choice just is not remembered */
  }
}

// ---------------------------------------------------------------- nav rows
const rowClass =
  // 40px rows, rounded, icon + one-word label; active = subtle grey background + white text (dark) / foreground (light)
  "h-10 gap-3 rounded-[10px] px-2.5 text-sm text-sidebar-foreground/80 hover:text-sidebar-foreground " +
  "data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground " +
  // collapsed: 44px square, centred icon
  "group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! " +
  "focus-visible:ring-[3px] focus-visible:ring-ring/50 [&>svg]:size-[18px]"

function NavEntry({ item, pausedCount = 0 }: { item: NavItem; pausedCount?: number }) {
  const location = useLocation()
  const active = isActivePath(location.pathname, item)
  const showDot = item.to === "/interview" && pausedCount > 0
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} tooltip={item.label} className={rowClass}>
        <NavLink to={item.to} end={item.end} aria-label={item.label} className="relative">
          <item.icon aria-hidden="true" />
          <span className="group-data-[collapsible=icon]:sr-only">{item.label}</span>
          {showDot && (
            <PausedDot
              count={pausedCount}
              className="ml-auto group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:top-2 group-data-[collapsible=icon]:right-2 group-data-[collapsible=icon]:ml-0 group-data-[collapsible=icon]:size-1.5"
            />
          )}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

/** Thin rule between nav groups. A plain div: shadcn's Separator forces w-full, which plus margins overflows the sidebar. */
function NavDivider() {
  return <div role="separator" aria-orientation="horizontal" className="mx-2 my-2.5 h-px shrink-0 bg-sidebar-border group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:w-7" />
}

/** Scrolls to the top after navigating. */
function ScrollToTop() {
  const location = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [location.pathname])
  return null
}

// ---------------------------------------------------------------- shell
function Shell({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children?: ReactNode }) {
  const { profile, user, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { immersive } = useNavChrome()
  const pausedCount = usePausedSessionCount(profile?.user_id, location.pathname)

  // Avatar comes from the auth provider (e.g. Google); the ERD users table has no avatar column.
  const avatarUrl = (user?.user_metadata?.avatar_url as string | undefined) ?? null
  const name = profile?.full_name || profile?.email || "User"
  const homePath = isAdmin ? "/admin/users" : "/"

  const logout = async () => {
    await signOut()
    navigate("/login", { replace: true })
  }

  const userMenu = (
    <DropdownMenuContent align="start" side="top" sideOffset={8} className="w-60">
      <DropdownMenuLabel className="font-normal">
        <div className="flex flex-col gap-0.5">
          <span className="truncate text-sm font-medium">{name}</span>
          <span className="truncate text-xs text-muted-foreground">{profile?.email}</span>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="min-h-10" onSelect={() => navigate("/profile")}>
        <UserRound aria-hidden="true" /> Profile
      </DropdownMenuItem>
      <DropdownMenuItem className="min-h-10" onSelect={() => navigate("/profile#settings")}>
        <Settings aria-hidden="true" /> Settings
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="min-h-10" variant="destructive" onSelect={() => void logout()}>
        <LogOut aria-hidden="true" /> Log out
      </DropdownMenuItem>
    </DropdownMenuContent>
  )

  return (
    // While the interview room is open the sidebar stays collapsed; the user's own choice is kept
    // in `open` and comes back untouched when the room closes.
    <SidebarProvider
      open={immersive ? false : open}
      onOpenChange={(next) => {
        if (!immersive) onOpenChange(next)
      }}
      style={{ "--sidebar-width": "220px", "--sidebar-width-icon": "64px" } as CSSProperties}
    >
      <ScrollToTop />
      <Sidebar collapsible="icon" aria-label="Main" className="no-print">
        <SidebarHeader className="px-3 pt-4 pb-3 group-data-[collapsible=icon]:px-0">
          <Link
            to={homePath}
            className="flex h-10 items-center gap-2.5 rounded-[10px] px-2 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:w-11 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
            aria-label="NextHire home"
          >
            <span
              aria-hidden="true"
              className="grid size-[30px] shrink-0 place-items-center rounded-lg bg-primary font-heading text-[15px] font-semibold text-primary-foreground"
            >
              N
            </span>
            <span className="truncate font-heading text-base font-semibold group-data-[collapsible=icon]:sr-only">NextHire</span>
          </Link>
        </SidebarHeader>

        <SidebarContent className="overflow-x-hidden px-3 group-data-[collapsible=icon]:px-0">
          {isAdmin ? (
            // Admins get the admin workspace only: user management and learning resources.
            <SidebarMenu className="gap-1">
              {ADMIN_NAV.map((item) => (
                <NavEntry key={item.to} item={item} />
              ))}
            </SidebarMenu>
          ) : (
            <>
              <SidebarMenu className="gap-1">
                <NavEntry item={HOME_NAV} />
              </SidebarMenu>
              <NavDivider />
              <SidebarMenu className="gap-1">
                {MODULE_NAV.map((item) => (
                  <NavEntry key={item.to} item={item} pausedCount={pausedCount} />
                ))}
              </SidebarMenu>
            </>
          )}
        </SidebarContent>

        <SidebarFooter className="border-t px-3 py-2.5 group-data-[collapsible=icon]:px-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-12 w-full items-center gap-2.5 rounded-[10px] px-2 text-left outline-none hover:bg-sidebar-accent/60 focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=open]:bg-sidebar-accent group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:w-11 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
                aria-label={`Account menu for ${name}`}
              >
                <Avatar name={name} url={avatarUrl} />
                <span className="flex min-w-0 flex-1 flex-col leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate text-sm font-medium">{name}</span>
                  <span className="truncate text-xs text-muted-foreground">Profile &amp; settings</span>
                </span>
                <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            {userMenu}
          </DropdownMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-w-0">
        <header className="no-print sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/90 px-3 backdrop-blur sm:px-4">
          {!immersive && <SidebarTrigger className="-ml-1 hidden size-9 md:inline-flex" aria-label="Collapse or expand the sidebar" />}
          <Link
            to={homePath}
            className="-ml-1.5 grid size-11 shrink-0 place-items-center rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:hidden"
            aria-label="NextHire home"
          >
            <span aria-hidden="true" className="grid size-8 place-items-center rounded-lg bg-primary font-heading text-sm font-semibold text-primary-foreground">
              N
            </span>
          </Link>
          <strong className="min-w-0 flex-1 truncate font-heading text-sm font-semibold sm:text-base">{pageTitle(location.pathname)}</strong>
          <ThemeToggle className="size-9 pointer-coarse:size-11" />
        </header>
        <div
          className={cn(
            "mx-auto w-full max-w-[1400px] min-w-0 px-4 py-6 sm:px-6 lg:px-8",
            // room for the fixed bottom bar on phones
            !immersive && "max-md:pb-[calc(4.5rem+env(safe-area-inset-bottom))]",
          )}
        >
          {children}
        </div>
      </SidebarInset>

      {!immersive && <MobileNavBar pausedCount={pausedCount} isAdmin={isAdmin} onLogout={() => void logout()} />}
    </SidebarProvider>
  )
}

export default function AppShell({ children }: { children?: ReactNode }) {
  const [open, setOpenState] = useState(readSidebarOpen)
  const setOpen = useCallback((next: boolean) => {
    setOpenState(next)
    writeSidebarOpen(next)
  }, [])
  return (
    <NavChromeProvider>
      <Shell open={open} onOpenChange={setOpen}>{children}</Shell>
    </NavChromeProvider>
  )
}
