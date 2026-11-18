"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
// Shared components
import { PortalSidebar } from "@/components/shared/portal-sidebar"
import { ReportsGuard } from "@/components/shared/reports-guard"
// CNC Shop components
import { CNCDashboard } from "@/components/cnc/dashboard"
import { CNCInventory } from "@/components/cnc/inventory"
import { CNCClients } from "@/components/cnc/clients"
import { CNCOrders } from "@/components/cnc/orders"
import { CNCExpenses } from "@/components/cnc/expenses"
import { CNCReports } from "@/components/cnc/reports"
import { ClientSearch } from "@/components/cnc/client-search"
// Shared admin components
import { UsersManagement } from "@/components/shared/users"
import { AuditLogsManagement } from "@/components/admin/audit-logs"
// Context providers
import { CNCProvider } from "@/lib/contexts/cnc-context"
import { PortalProvider } from "@/lib/contexts/portal-context"
import { STAFF_RESTRICTED_MODULES } from "@/lib/permissions"

function PortalContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role as string | undefined

  const defaultModule = "dashboard"
  const rawModule = searchParams.get("module") || defaultModule

  // Guard: redirect staff and non-admins away from restricted modules
  const isRestrictedForStaff = userRole === 'staff' && STAFF_RESTRICTED_MODULES.includes(rawModule as any)
  const isRestrictedForNonAdmin = userRole !== 'admin' && (rawModule === 'users' || rawModule === 'audit-logs')
  const activeModule = (isRestrictedForStaff || isRestrictedForNonAdmin)
    ? 'dashboard'
    : rawModule

  // Security key to force fresh password prompt whenever Reports is clicked
  const [reportAccessKey, setReportAccessKey] = useState(0)

  const setActiveModule = (module: string) => {
    if (module === "reports") {
      setReportAccessKey((prev) => prev + 1)
    }
    const params = new URLSearchParams(searchParams.toString())
    params.set("module", module)
    router.replace(`${pathname}?${params.toString()}`)
  }

  const renderModule = () => {
    switch (activeModule) {
      case "dashboard":
        return <CNCDashboard onNavigate={setActiveModule} />
      case "client-search":
        return <ClientSearch />
      case "inventory":
        return <CNCInventory />
      case "clients":
        return <CNCClients />
      case "orders":
        return <CNCOrders />
      case "expenses":
        return <CNCExpenses />
      case "reports":
        return (
          <ReportsGuard key={`cnc-reports-${reportAccessKey}`} onCancel={() => setActiveModule("dashboard")}>
            <CNCReports />
          </ReportsGuard>
        )
      case "users":
        return <UsersManagement />
      case "audit-logs":
        return <AuditLogsManagement />
      default:
        return <CNCDashboard />
    }
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-background">
      <PortalSidebar activeModule={activeModule} setActiveModule={setActiveModule} />
      <main className="flex-1 p-3 lg:p-6 overflow-auto">
        <div className="space-y-4 lg:space-y-6 w-full">
          {renderModule()}
        </div>
      </main>
    </div>
  )
}

export default function Home() {
  return (
    <PortalProvider>
      <CNCProvider>
        <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
          <PortalContent />
        </Suspense>
      </CNCProvider>
    </PortalProvider>
  )
}
