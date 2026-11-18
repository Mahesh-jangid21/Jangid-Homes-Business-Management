"use client"

import { useState } from "react"
import { signOut, useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { usePortal } from "@/lib/contexts/portal-context"
import Image from "next/image"
import {
  LayoutDashboard,
  Package,
  Users,
  ClipboardList,
  Receipt,
  BarChart3,
  Menu,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
  Search,
  History,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

// CNC Shop menu
const cncMenuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "client-search", label: "Client Search", icon: Search },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "clients", label: "Clients", icon: Users },
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "expenses", label: "Expenses", icon: Receipt, staffHidden: true },
  { id: "reports", label: "Reports", icon: BarChart3, staffHidden: true },
  { id: "users", label: "User Management", icon: Shield, adminOnly: true },
  { id: "audit-logs", label: "Audit Logs", icon: History, adminOnly: true },
]

type PortalSidebarProps = {
  activeModule: string
  setActiveModule: (m: string) => void
  collapsed?: boolean
}

function SidebarContent({
  activeModule,
  setActiveModule,
  onSelect,
  collapsed,
}: PortalSidebarProps & { onSelect?: () => void }) {
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role

  const menuItems = cncMenuItems.filter((item) => {
    if ((item as any).adminOnly && userRole !== "admin") return false
    if ((item as any).staffHidden && userRole === "staff") return false
    return true
  })

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div className={cn("flex items-center justify-center border-b border-border", collapsed ? "p-3" : "p-4")}>
        {collapsed ? (
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-200">
            <span className="text-amber-600 font-black text-xs">SS</span>
          </div>
        ) : (
          <Image
            src="/shri-shyam-cnc-logo.jpg"
            alt="Shri Shyam CNC"
            width={140}
            height={70}
            className="object-contain"
            priority
          />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-auto scrollbar-none">
        {!collapsed && (
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3 px-3">
            Menu
          </p>
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
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 shrink-0",
                    activeModule === item.id
                      ? "text-primary-foreground"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className={cn("border-t border-border", collapsed ? "p-3" : "p-4")}>
        <div className={cn("flex items-center gap-2 text-xs text-muted-foreground mb-3", collapsed ? "justify-center" : "")}>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          {!collapsed && <span className="font-medium">Database Active</span>}
        </div>

        <Button
          variant="outline"
          size={collapsed ? "icon" : "default"}
          className={cn(
            "w-full border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-colors",
            collapsed ? "" : "justify-start gap-2"
          )}
          onClick={() => signOut({ callbackUrl: "/login" })}
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
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        <SidebarContent
          collapsed={isCollapsed}
          activeModule={activeModule}
          setActiveModule={setActiveModule}
        />

        {/* Collapse Toggle */}
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
        <div className="flex items-center gap-2">
          <Image
            src="/shri-shyam-cnc-logo.jpg"
            alt="Shri Shyam CNC"
            width={90}
            height={45}
            className="object-contain"
            priority
          />
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
