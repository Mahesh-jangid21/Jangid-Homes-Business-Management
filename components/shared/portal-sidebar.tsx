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
      <div className={cn("relative transition-all duration-300", collapsed ? "p-3" : "px-4 pt-6 pb-4")}>
        {/* Logo & Title */}
        <div className={cn("flex items-center gap-3 transition-all duration-300 mb-6", collapsed ? "justify-center mb-4" : "")}>
          <div className="relative">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 border border-primary/20 shadow-sm overflow-hidden group-hover:shadow-md transition-all">
              <Home className="w-5 h-5 text-primary fill-primary/20" strokeWidth={2.5} />
            </div>
            {!collapsed && <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full animate-pulse" />}
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <h1 className="font-bold text-xl tracking-tight text-foreground leading-none">Jangid Homes</h1>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60"></span>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Business Portal</p>
              </div>
            </div>
          )}
        </div>

        {/* Business Selector - Fixed width matching header */}
        {!collapsed && (
          <div className="relative z-20">
            <BusinessSelector />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-auto scrollbar-none">
        {!collapsed && (
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3 px-3">Menu</p>
        )}
        <ul className="space-y-0.5">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => {
                  setActiveModule(item.id)
                  onSelect?.()
                }}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "w-full flex items-center rounded-lg text-left transition-all duration-200 group",
                  collapsed ? "justify-center p-3" : "gap-3 px-3 py-2.5",
                  activeModule === item.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 shrink-0",
                  activeModule === item.id ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                )} />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer with Sign Out */}
      <div className={cn("border-t border-border", collapsed ? "p-3" : "p-4")}>
        {/* Database Status */}
        <div className={cn("flex items-center gap-2 text-xs text-muted-foreground mb-3", collapsed ? "justify-center" : "")}>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          {!collapsed && <span className="font-medium">Database Active</span>}
        </div>

        {/* Sign Out Button */}
        <Button
          variant="outline"
          size={collapsed ? "icon" : "default"}
          className={cn(
            "w-full border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-colors",
            collapsed ? "" : "justify-start gap-2"
          )}
          onClick={() => signOut({ callbackUrl: '/login' })}
          title={collapsed ? "Sign Out" : undefined}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span className="font-medium">Sign Out</span>}
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
      <div className="lg:hidden flex items-center justify-between p-3 bg-card border-b border-border sticky top-0 z-50 w-full shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
            <Home className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
          <div className="flex flex-col">
            <h1 className="font-bold text-base text-foreground leading-tight">Jangid Homes</h1>
            <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">Business Portal</p>
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
