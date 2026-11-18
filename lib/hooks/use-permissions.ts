"use client"

import { useSession } from "next-auth/react"
import { getPermissions, type UserRole, type Permissions } from "@/lib/permissions"

export function usePermissions(): Permissions & { role: UserRole } {
  const { data: session } = useSession()
  const role = ((session?.user as any)?.role ?? 'user') as UserRole
  return { role, ...getPermissions(role) }
}
