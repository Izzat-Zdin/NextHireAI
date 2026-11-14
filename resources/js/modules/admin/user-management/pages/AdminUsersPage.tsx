import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "@/lib/router"
import { ChevronLeft, ChevronRight, RefreshCw, Search, ShieldCheck, UserCheck, UserPlus, Users, UserX } from "lucide-react"
import { Alert, Button, Card, EmptyState, Field, LoadingState, PageIntro, SelectField, StatCard } from "@/components/ui"
import { Avatar } from "@/components/AppShell"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table"
import { cn } from "@/lib/utils"
import { errorMessage, formatDate } from "@/lib/format"
import type { UserProfile, UserRole, UserStatus } from "@/lib/types"
import { UserRoleBadge, UserStatusBadge } from "../components/UserStatusBadge"
import { getUserStats, listUsers, type UserStats } from "../services/adminUserService"

const PAGE_SIZE = 20

const ROLE_OPTIONS = [
  { value: "all", label: "All roles" },
  { value: "user", label: "Users" },
  { value: "admin", label: "Admins" },
]

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
]

function useDebounced<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(id)
  }, [value, delay])
  return debounced
}

export default function AdminUsersPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [role, setRole] = useState<UserRole | "all">("all")
  const [status, setStatus] = useState<UserStatus | "all">("all")
  const [rows, setRows] = useState<UserProfile[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [statsError, setStatsError] = useState<string | null>(null)
  const debouncedSearch = useDebounced(search)
  const requestId = useRef(0)

  // The page number is tied to the filters it was chosen for, so changing a filter
  // goes straight back to page 1 without a wasted request for the old page.
  const filterKey = `${debouncedSearch}|${role}|${status}`
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 })
  const page = pageState.key === filterKey ? pageState.page : 1
  const setPage = (update: (current: number) => number) => setPageState({ key: filterKey, page: update(page) })

  const loadUsers = useCallback(async () => {
    const id = ++requestId.current
    setLoading(true)
    setError(null)
    try {
      const result = await listUsers({ search: debouncedSearch, role, status, page, pageSize: PAGE_SIZE })
      if (id !== requestId.current) return // a newer request is in flight
      setRows(result.rows)
      setTotal(result.total)
    } catch (err) {
      if (id === requestId.current) setError(errorMessage(err, "Could not load users."))
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [debouncedSearch, role, status, page])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  useEffect(() => {
    getUserStats()
      .then(setStats)
      .catch((err) => setStatsError(errorMessage(err, "Could not load user statistics.")))
  }, [])

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const first = total ? (page - 1) * PAGE_SIZE + 1 : 0
  const last = Math.min(page * PAGE_SIZE, total)
  const filtered = !!debouncedSearch.trim() || role !== "all" || status !== "all"
  const open = (userId: string) => navigate(`/admin/users/${userId}`)

  return (
    <div className="@container/page">
      <PageIntro
        eyebrow="Admin · Module 1"
        title="User management"
        description="Search, review and manage every NextHire account. Open a user to see their activity, change their role or deactivate access."
      />

      {statsError && <Alert tone="error">{statsError}</Alert>}
      <div className="mb-6 grid gap-3 @md/page:grid-cols-2 @5xl/page:grid-cols-4">
        <StatCard icon={Users} label="Total users" value={stats ? String(stats.total) : "—"} meta={stats ? `${stats.newThisWeek} new in last 7 days` : "Loading…"} />
        <StatCard icon={UserCheck} tone="green" label="Active" value={stats ? String(stats.active) : "—"} meta="Can sign in" />
        <StatCard icon={UserX} tone="amber" label="Inactive" value={stats ? String(stats.inactive) : "—"} meta="Access blocked" />
        <StatCard icon={ShieldCheck} tone="violet" label="Admins" value={stats ? String(stats.admins) : "—"} meta="Full management access" />
      </div>

      <Card className="overflow-hidden p-0 sm:p-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:p-5 @3xl/page:flex-row @3xl/page:items-end">
          <div className="min-w-0 flex-1">
            <Field label="Search" value={search} onChange={setSearch} placeholder="Search by name or email" />
          </div>
          <div className="grid grid-cols-2 gap-3 @3xl/page:w-80">
            <SelectField label="Role" value={role} options={ROLE_OPTIONS} onChange={(value) => setRole(value as UserRole | "all")} />
            <SelectField
              label="Status"
              value={status}
              options={STATUS_OPTIONS}
              onChange={(value) => setStatus(value as UserStatus | "all")}
            />
          </div>
        </div>

        {error ? (
          <div className="p-4 sm:p-5">
            <Alert tone="error">{error}</Alert>
            <Button variant="secondary" onClick={() => void loadUsers()}>
              <RefreshCw /> Try again
            </Button>
          </div>
        ) : loading && !rows.length ? (
          <LoadingState label="Loading users…" />
        ) : !rows.length ? (
          <EmptyState
            icon={filtered ? Search : UserPlus}
            title={filtered ? "No matching users" : "No users yet"}
            text={filtered ? "Try a different search term or clear the filters." : "Accounts will appear here as people sign up."}
            action={
              filtered ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch("")
                    setRole("all")
                    setStatus("all")
                  }}
                >
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className={cn("transition-opacity", loading && "opacity-60")} aria-busy={loading}>
            {/* Phones: stacked rows. */}
            <ul className="divide-y @3xl/page:hidden">
              {rows.map((row) => (
                <li key={row.user_id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-3 text-left outline-none hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset"
                    onClick={() => open(row.user_id)}
                  >
                    <Avatar name={row.full_name || row.email} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{row.full_name || "Unnamed user"}</p>
                      <p className="truncate text-sm text-muted-foreground">{row.email}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <UserRoleBadge role={row.role} />
                        <UserStatusBadge status={row.status} />
                        <span className="text-xs text-muted-foreground">Joined {formatDate(row.created_at)}</span>
                      </div>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>

            {/* Tablet and desktop: table. */}
            <Table className="hidden @3xl/page:table">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5 text-muted-foreground">User</TableHead>
                  <TableHead className="text-muted-foreground">Role</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Joined</TableHead>
                  <TableHead className="pr-5 text-muted-foreground">Last updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    key={row.user_id}
                    className="cursor-pointer outline-none focus-visible:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset"
                    tabIndex={0}
                    onClick={() => open(row.user_id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        open(row.user_id)
                      }
                    }}
                  >
                    <TableCell className="py-3 pl-5">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={row.full_name || row.email} />
                        <div className="min-w-0">
                          <p className="max-w-64 truncate font-medium">{row.full_name || "Unnamed user"}</p>
                          <p className="max-w-64 truncate text-muted-foreground">{row.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <UserRoleBadge role={row.role} />
                    </TableCell>
                    <TableCell>
                      <UserStatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(row.created_at)}</TableCell>
                    <TableCell className="pr-5 text-muted-foreground">{row.updated_at ? formatDate(row.updated_at) : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {!error && total > 0 && (
        <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing {first}–{last} of {total} user{total === 1 ? "" : "s"}
          </span>
          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading}>
              <ChevronLeft /> Prev
            </Button>
            <span className="tabular-nums">
              Page {page} of {pageCount}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page >= pageCount || loading}
            >
              Next <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
