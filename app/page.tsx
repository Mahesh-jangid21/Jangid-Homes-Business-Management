"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
// Shared components
import { PortalSidebar } from "@/components/shared/portal-sidebar"
import { ComingSoon } from "@/components/shared/coming-soon"
// CNC Shop components
import { CNCDashboard } from "@/components/cnc/dashboard"
import { CNCInventory } from "@/components/cnc/inventory"
import { CNCClients } from "@/components/cnc/clients"
import { CNCOrders } from "@/components/cnc/orders"
import { CNCExpenses } from "@/components/cnc/expenses"
import { CNCReports } from "@/components/cnc/reports"
import { ClientSearch } from "@/components/cnc/client-search"
// Interiors components
import { InteriorsDashboard } from "@/components/interiors/dashboard"
import { InteriorsClients } from "@/components/interiors/clients"
import { InteriorsProjectsModule } from "@/components/interiors/projects"
import { InteriorsExpensesModule } from "@/components/interiors/expenses"
import { InteriorsReportsModule } from "@/components/interiors/reports"
// Shared admin components
import { UsersManagement } from "@/components/shared/users"
// Context providers
import { CNCProvider } from "@/lib/contexts/cnc-context"
import { PortalProvider, usePortal } from "@/lib/contexts/portal-context"
import { InteriorsProvider } from "@/lib/contexts/interiors-context"

function PortalContent() {
  const { activeBusiness } = usePortal()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const mounted = useRef(false)

  // Get active module from URL or default to dashboard
  const activeModule = searchParams.get("module") || "dashboard"

  const setActiveModule = (module: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("module", module)
    router.replace(`${pathname}?${params.toString()}`)
  }

  // Track previous business to detect changes
  const prevBusinessRef = useRef(activeBusiness)

  // Reset to dashboard when switching businesses
  useEffect(() => {
    // Only reset if business actually changed
    if (prevBusinessRef.current !== activeBusiness) {
      setActiveModule("dashboard")
      prevBusinessRef.current = activeBusiness
    }
  }, [activeBusiness])

  // Render CNC Shop modules
  const renderCNCModule = () => {
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
        return <CNCReports />
      case "users":
        return <UsersManagement />
      default:
        return <CNCDashboard />
    }
  }

  // Render Interiors modules
  const renderInteriorsModule = () => {
    switch (activeModule) {
      case "dashboard":
        return <InteriorsDashboard />
      case "projects":
        return <InteriorsProjectsModule />
      case "clients":
        return <InteriorsClients />
      case "expenses":
        return <InteriorsExpensesModule />
      case "reports":
        return <InteriorsReportsModule />
      case "users":
        return <UsersManagement />
      default:
        return <InteriorsDashboard />
    }
  }

  // Render the appropriate module based on active business
  const renderModule = () => {
    switch (activeBusiness) {
      case "cnc-shop":
        return renderCNCModule()
      case "interiors":
        return renderInteriorsModule()
      default:
        return <ComingSoon />
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
        <InteriorsProvider>
          <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
            <PortalContent />
          </Suspense>
        </InteriorsProvider>
      </CNCProvider>
    </PortalProvider>
  )
}
