// Single source of truth for the app navigation: short nav labels, routes, icons, and the full
// FYP module names shown as a small label above each page title.
import { BookOpen, FileText, Gauge, Home, Library, MessageSquare, TrendingUp, User, Users, type LucideIcon } from "lucide-react"

export interface NavItem {
  to: string
  /** One word, as shown in the sidebar and the mobile bar. */
  label: string
  icon: LucideIcon
  /** Match the path exactly (used for Home so it is not active everywhere). */
  end?: boolean
}

export const HOME_NAV: NavItem = { to: "/", label: "Home", icon: Home, end: true }

/** Progress page link. Kept separate so the dashboard still has its icon while it is hidden from the sidebar. */
export const PROGRESS_NAV: NavItem = { to: "/progress", label: "Progress", icon: TrendingUp }

/** Career modules, in sidebar order. Profile is also in the user menu. */
export const MODULE_NAV: NavItem[] = [
  { to: "/profile", label: "Profile", icon: User },
  { to: "/resume", label: "Resume", icon: FileText },
  { to: "/interview", label: "Interview", icon: MessageSquare },
  { to: "/assessment", label: "Readiness", icon: Gauge },
  { to: "/learning", label: "Learning", icon: BookOpen },
  // Hidden from the sidebar for now; /progress still works. To show it again, uncomment this line
  // and add MODULE_NAV[5] back to MOBILE_MORE below.
  // PROGRESS_NAV,

]

/** Admins only, below a second divider. */
export const ADMIN_NAV: NavItem[] = [
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/resources", label: "Resources", icon: Library },
]

/** Mobile bottom bar: four tabs plus "More". */
export const MOBILE_TABS: NavItem[] = [HOME_NAV, MODULE_NAV[1], MODULE_NAV[2], MODULE_NAV[4]]
/** Items inside the mobile "More" sheet (admin items are added there for admins). */
export const MOBILE_MORE: NavItem[] = [MODULE_NAV[0], MODULE_NAV[3] /* , MODULE_NAV[5] (Progress, hidden) */]

export interface ModuleInfo {
  number: number
  /** Full FYP module name. */
  name: string
  /** Route prefix. */
  to: string
}

export const MODULES: ModuleInfo[] = [
  { number: 1, name: "User Profile Management", to: "/profile" },
  { number: 2, name: "AI Resume Analyzer", to: "/resume" },
  { number: 3, name: "AI Mock Interview Engine", to: "/interview" },
  { number: 4, name: "Interview & Career Readiness", to: "/assessment" },
  { number: 5, name: "Learning Recommendation", to: "/learning" },
  // { number: 6, name: "Recommendation & Progress Tracking", to: "/progress" },
]

/** "Module 3 · AI Mock Interview Engine" */
export const moduleLabel = (number: number) => {
  const info = MODULES.find((m) => m.number === number)
  return info ? `Module ${info.number} · ${info.name}` : ""
}

export const moduleForPath = (pathname: string) => MODULES.find((m) => pathname === m.to || pathname.startsWith(`${m.to}/`)) ?? null

/** Short title for the top bar. */
export function pageTitle(pathname: string): string {
  if (pathname === "/") return "Home"
  if (pathname.startsWith("/admin/users")) return "Admin · Users"
  if (pathname.startsWith("/admin/resources")) return "Admin · Learning resources"
  const module = moduleForPath(pathname)
  return module ? moduleLabel(module.number) : "NextHire"
}

export const isActivePath = (pathname: string, item: Pick<NavItem, "to" | "end">) =>
  item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`)
