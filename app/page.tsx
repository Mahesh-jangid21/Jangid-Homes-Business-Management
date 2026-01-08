"use client"

import { useState, useEffect } from "react"
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
// Context providers
import { CNCProvider } from "@/lib/contexts/cnc-context"
import { PortalProvider, usePortal } from "@/lib/contexts/portal-context"
import { InteriorsProvider } from "@/lib/contexts/interiors-context"

function PortalContent() {
  const { activeBusiness } = usePortal()
  const [activeModule, setActiveModule] = useState("dashboard")

  // Reset to dashboard when switching businesses
  useEffect(() => {
    setActiveModule("dashboard")
  }, [activeBusiness])

  // Render CNC Shop modules
  const renderCNCModule = () => {
    switch (activeModule) {
      case "dashboard":
        return <CNCDashboard />
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
          <PortalContent />
        </InteriorsProvider>
      </CNCProvider>
    </PortalProvider>
  )
}
