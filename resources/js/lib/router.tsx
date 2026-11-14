// Small React Router–compatible layer over Inertia so the pages copied from the
// Vite + React Router version of NextHire keep their imports and props unchanged.
// Only the subset used by the app is implemented: Link, NavLink, Navigate,
// useNavigate, useParams, useLocation, useSearchParams.
import { useEffect, useMemo, type AnchorHTMLAttributes, type ReactNode } from "react"
import { Link as InertiaLink, router, usePage } from "@inertiajs/react"
import { isActivePath } from "@/components/navigation"

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: string
  replace?: boolean
  state?: unknown
  end?: boolean
  children?: ReactNode
}

/** `<Link to="/x">` → Inertia `<Link href="/x">`. In-page anchors (#hash) stay plain anchors. */
export function Link({ to, replace, state: _state, end: _end, children, ...rest }: LinkProps) {
  if (to.startsWith("#")) {
    return (
      <a href={to} {...rest}>
        {children}
      </a>
    )
  }
  return (
    <InertiaLink href={to} replace={replace} {...(rest as object)}>
      {children}
    </InertiaLink>
  )
}

/** NavLink sets aria-current="page" when the path matches (what the nav styles key on). */
export function NavLink({ to, end, ...rest }: LinkProps) {
  const { pathname } = useLocation()
  const active = isActivePath(pathname, { to, end })
  return <Link to={to} end={end} aria-current={active ? "page" : undefined} {...rest} />
}

export function Navigate({ to, replace = true }: { to: string; replace?: boolean; state?: unknown }) {
  useEffect(() => {
    router.visit(to, { replace })
  }, [to, replace])
  return null
}

/**
 * React Router's `navigate(to, { state })` → `useLocation().state`. Inertia has no
 * per-visit state, so the value is parked here until the visit to `to` renders, and
 * stays readable (e.g. the "file could not be stored" warning on the resume result
 * page) until the location changes again.
 */
let pendingState: { pathname: string; state: unknown } | null = null
let currentState: { pathname: string; state: unknown } | null = null

function stateFor(pathname: string): unknown {
  if (pendingState && pendingState.pathname === pathname) {
    currentState = pendingState
    pendingState = null
  } else if (currentState && currentState.pathname !== pathname) {
    currentState = null
  }
  return currentState?.pathname === pathname ? currentState.state : null
}

export function useNavigate() {
  return (to: string | number, options?: { replace?: boolean; state?: unknown }) => {
    if (typeof to === "number") {
      window.history.go(to)
      return
    }
    if (to.startsWith("#")) {
      window.location.hash = to
      return
    }
    const pathname = to.split(/[?#]/)[0]
    pendingState = options?.state === undefined ? null : { pathname, state: options.state }
    router.visit(to, { replace: options?.replace })
  }
}

interface LocationLike {
  pathname: string
  search: string
  hash: string
  state: unknown
}

export function useLocation(): LocationLike {
  const { url } = usePage()
  return useMemo(() => {
    const parsed = new URL(url, typeof window === "undefined" ? "http://localhost" : window.location.origin)
    const hash = typeof window === "undefined" ? "" : window.location.hash
    return { pathname: parsed.pathname, search: parsed.search, hash, state: stateFor(parsed.pathname) }
  }, [url])
}

/** Route parameters are shared by HandleInertiaRequests as `params` (route key → value). */
export function useParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>(): T {
  const { props } = usePage<{ params?: Record<string, string> }>()
  return (props.params ?? {}) as T
}

export function useSearchParams(): [URLSearchParams, (next: URLSearchParams) => void] {
  const { search, pathname } = useLocation()
  const params = useMemo(() => new URLSearchParams(search), [search])
  const setParams = (next: URLSearchParams) => {
    const qs = next.toString()
    router.visit(qs ? `${pathname}?${qs}` : pathname, { replace: true, preserveState: true })
  }
  return [params, setParams]
}
