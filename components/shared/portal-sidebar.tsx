"use client"

import { useState } from "react"
import { signOut, useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { usePortal } from "@/lib/contexts/portal-context"
import { BusinessSelector } from "./business-selector"
import {
  LayoutDashboard,
  Package,
  Users,
  ClipboardList,
  Receipt,
  BarChart3,
  Home,
  Building2,
  Menu,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

// CNC Shop menu
const cncMenuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "client-search", label: "Client Search", icon: Search },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "clients", label: "Clients", icon: Users },
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "expenses", label: "Expenses", icon: Receipt },
  { id: "reports", label: "Reports", icon: BarChart3 },
]

// Placeholder menus for other businesses
const interiorsMenuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "projects", label: "Projects", icon: Building2 },
  { id: "clients", label: "Clients", icon: Users },
  { id: "expenses", label: "Expenses", icon: Receipt },
  { id: "reports", label: "Reports", icon: BarChart3 },
]

const drapesMenuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "clients", label: "Clients", icon: Users },
  { id: "expenses", label: "Expenses", icon: Receipt },
  { id: "reports", label: "Reports", icon: BarChart3 },
]

type PortalSidebarProps = {
  activeModule: string
  setActiveModule: (m: string) => void
  collapsed?: boolean
}

function SidebarContent({ activeModule, setActiveModule, onSelect, collapsed }: PortalSidebarProps & { onSelect?: () => void }) {
  const { activeBusiness } = usePortal()

  const menuItems =
    activeBusiness === "cnc-shop" ? cncMenuItems : activeBusiness === "interiors" ? interiorsMenuItems : drapesMenuItems

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Portal Header */}
      <div className={cn("p-4 border-b border-border transition-all duration-300 flex flex-col items-center", collapsed ? "p-2" : "p-5")}>
        <div className={cn("flex items-center gap-3 transition-all duration-300", collapsed ? "mb-0" : "mb-5 w-full")}>
          <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
            <Home className="w-6 h-6 text-white" strokeWidth={1.5} />
          </div>
          {!collapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <h1 className="font-bold text-xl text-foreground tracking-tight leading-none mb-1">Jangid Homes</h1>
              <p className="text-[9px] font-bold text-muted-foreground/80 uppercase tracking-[0.15em] leading-none">Business Portal</p>
            </div>
          )}
        </div>
        {!collapsed && <BusinessSelector />}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-auto scrollbar-none mt-2">
        {!collapsed && (
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4 px-4 opacity-50">Menu</p>
        )}
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => {
                  setActiveModule(item.id)
                  onSelect?.()
                }}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "w-full flex items-center rounded-lg text-left transition-colors duration-200 group relative",
                  collapsed ? "justify-center p-3" : "gap-3 px-4 py-2.5",
                  activeModule === item.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 shrink-0 transition-transform duration-200",
                  activeModule === item.id ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
                )} />
                {!collapsed && <span className="font-medium">{item.label}</span>}
                {!collapsed && activeModule === item.id && (
                  <div className="absolute left-0 w-1 h-5 bg-white rounded-full" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border bg-muted/20 space-y-3">
        <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", collapsed ? "justify-center" : "justify-center")}>
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
          {!collapsed && <span>Database Active</span>}
        </div>
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          className={cn("w-full text-muted-foreground hover:text-foreground", collapsed ? "justify-center" : "justify-start gap-2")}
          onClick={() => signOut({ callbackUrl: '/login' })}
          title={collapsed ? "Sign Out" : undefined}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </div>
    </div>
  )
}

export function PortalSidebar({ activeModule, setActiveModule }: PortalSidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col h-screen sticky top-0 border-r border-border bg-card transition-all duration-300 ease-in-out relative",
          isCollapsed ? "w-20" : "w-72"
        )}
      >
        <SidebarContent collapsed={isCollapsed} activeModule={activeModule} setActiveModule={setActiveModule} />

        {/* Collapse Toggle Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-background border border-border shadow-sm z-10 hover:bg-accent"
        >
          {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </Button>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-2.5 bg-card border-b border-border sticky top-0 z-50 w-full shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-zinc-900 rounded-lg flex items-center justify-center shrink-0">
            <Home className="w-5 h-5 text-white" strokeWidth={1.5} />
          </div>
          <div className="flex flex-col">
            <h1 className="font-bold text-base text-foreground leading-tight">Jangid Homes</h1>
            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest leading-tight">Business Portal</p>
          </div>
        </div>

        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-accent">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[280px]">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation Menu</SheetTitle>
            </SheetHeader>
            <SidebarContent
              activeModule={activeModule}
              setActiveModule={setActiveModule}
              onSelect={() => setIsMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
