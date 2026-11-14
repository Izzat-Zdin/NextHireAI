import { Badge } from "@/components/ui"
import type { UserRole, UserStatus } from "@/lib/types"

export function UserStatusBadge({ status }: { status: UserStatus }) {
  return <Badge tone={status === "active" ? "green" : "red"}>{status === "active" ? "Active" : "Inactive"}</Badge>
}

export function UserRoleBadge({ role }: { role: UserRole }) {
  return <Badge tone={role === "admin" ? "violet" : "slate"}>{role === "admin" ? "Admin" : "User"}</Badge>
}

export default UserStatusBadge
