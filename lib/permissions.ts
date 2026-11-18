// Centralized permissions - single source of truth for role-based access
export type UserRole = 'admin' | 'user' | 'staff'

// Define what each permission means
export const PERMISSIONS = {
  canViewReports: (role: UserRole) => role !== 'staff',
  canViewExpenses: (role: UserRole) => role !== 'staff',
  canViewInventory: (role: UserRole) => true,
  canViewDashboard: (role: UserRole) => true,
  canViewFinancials: (role: UserRole) => role !== 'staff',
  canViewUserManagement: (role: UserRole) => role === 'admin',
} as const

export type Permissions = { [K in keyof typeof PERMISSIONS]: boolean }

export function getPermissions(role: UserRole): Permissions {
  return Object.fromEntries(
    Object.entries(PERMISSIONS).map(([key, fn]) => [key, (fn as (r: UserRole) => boolean)(role)])
  ) as Permissions
}

// Modules staff cannot access - used in page routing and sidebar
export const STAFF_RESTRICTED_MODULES = ['expenses', 'reports', 'users', 'audit-logs'] as const
export type StaffRestrictedModule = typeof STAFF_RESTRICTED_MODULES[number]

// API route prefixes staff cannot access
export const STAFF_RESTRICTED_API_PATHS = [
  '/api/cnc/reports',
  '/api/cnc/expenses',
  '/api/users',
  '/api/admin/audit-logs',
] as const
