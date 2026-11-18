"use client"

import { useCNC } from "@/lib/contexts/cnc-context"
import { usePermissions } from "@/lib/hooks/use-permissions"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Package, Users, ClipboardList, TrendingUp, AlertTriangle,
  IndianRupee, Loader2, Plus, Receipt, Clock, Layers, ChevronRight,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const orderStatuses = [
  "Pending",
  "Quotation Sent",
  "Design Pending",
  "Design Sent",
  "Design Approved",
  "In Progress",
  "Ready for Pickup",
  "Completed",
  "Delivered",
  "Billed",
  "Cancelled",
] as const

const ACTIVE_STATUSES = [
  "Pending",
  "Quotation Sent",
  "Design Pending",
  "Design Sent",
  "Design Approved",
  "In Progress",
  "Ready for Pickup",
  "Completed",
  "Delivered",
]

// Round to max 2 decimal places, strip trailing zeros
function formatStock(val: number) {
  return parseFloat(val.toFixed(2)).toString()
}

interface CNCDashboardProps {
  onNavigate?: (module: string) => void
}

export function CNCDashboard({ onNavigate }: CNCDashboardProps) {
  const { materials, clients, orders, loading, updateOrder } = useCNC()
  const { canViewFinancials, canViewExpenses } = usePermissions()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const today = new Date().toISOString().split("T")[0]
  const thisMonth = new Date().toISOString().slice(0, 7)

  const todayOrders = orders.filter((o) => o.date?.startsWith(today))
  const todaySales = todayOrders.reduce((sum, o) => sum + o.totalValue, 0)
  const monthOrders = orders.filter((o) => o.date?.startsWith(thisMonth))
  const monthSales = monthOrders.reduce((sum, o) => sum + o.totalValue, 0)

  const lowStockItems = materials.filter((m) => m.currentStock <= m.lowStockAlert)
  const pendingOrders = orders.filter((o) => (ACTIVE_STATUSES as readonly string[]).includes(o.status))
  const pendingOnlyOrders = orders.filter((o) => o.status === "Pending")
  const inProgressOrders = orders.filter((o) => o.status === "In Progress")
  const pendingPayments = orders.filter((o) => o.balanceAmount > 0).reduce((sum, o) => sum + o.balanceAmount, 0)

  const dateStr = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })

  return (
    <div className="space-y-4 pb-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground leading-tight">Dashboard</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{dateStr}</p>
        </div>
        {/* Quick actions */}
        <div className="flex items-center gap-2">
          {canViewExpenses && (
            <Button size="sm" variant="outline" className="h-9 px-3 text-xs gap-1.5" onClick={() => onNavigate?.("expenses")}>
              <Receipt className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Expense</span>
            </Button>
          )}
          <Button size="sm" variant="outline" className="h-9 px-3 text-xs gap-1.5" onClick={() => onNavigate?.("inventory")}>
            <Package className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Inventory</span>
          </Button>
          <Button size="sm" className="h-9 px-3 text-xs gap-1.5" onClick={() => onNavigate?.("orders")}>
            <Plus className="w-3.5 h-3.5" />
            New Order
          </Button>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      {canViewFinancials ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Today's Sales */}
          <Card className="border shadow-sm">
            <CardContent className="p-3.5">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
                <IndianRupee className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">Today</span>
              </div>
              <p className="text-base font-bold text-foreground">₹{(todaySales || 0).toLocaleString("en-IN")}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{todayOrders.length} orders</p>
            </CardContent>
          </Card>

          {/* Month Sales */}
          <Card className="border shadow-sm">
            <CardContent className="p-3.5">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
                <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">This Month</span>
              </div>
              <p className="text-base font-bold text-foreground">₹{(monthSales || 0).toLocaleString("en-IN")}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{monthOrders.length} orders</p>
            </CardContent>
          </Card>

          {/* Pending Payments */}
          <Card className="border shadow-sm cursor-pointer active:scale-95 transition-transform col-span-2 sm:col-span-1" onClick={() => onNavigate?.("orders")}>
            <CardContent className="p-3.5">
              <div className="flex items-center gap-1.5 text-amber-600 mb-2">
                <IndianRupee className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">To Collect</span>
              </div>
              <p className="text-base font-bold text-amber-600">₹{(pendingPayments || 0).toLocaleString("en-IN")}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">outstanding balance</p>
            </CardContent>
          </Card>

          {/* Stock */}
          <Card className="border shadow-sm cursor-pointer active:scale-95 transition-transform" onClick={() => onNavigate?.("inventory")}>
            <CardContent className="p-3.5">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
                <Package className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">Stock</span>
              </div>
              <p className="text-base font-bold text-foreground">{materials.length}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">items in stock</p>
            </CardContent>
          </Card>

          {/* Clients */}
          <Card className="border shadow-sm cursor-pointer active:scale-95 transition-transform" onClick={() => onNavigate?.("clients")}>
            <CardContent className="p-3.5">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">Clients</span>
              </div>
              <p className="text-base font-bold text-foreground">{clients.length}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">registered</p>
            </CardContent>
          </Card>

          {/* Active Orders */}
          <Card className="border shadow-sm cursor-pointer active:scale-95 transition-transform" onClick={() => onNavigate?.("orders")}>
            <CardContent className="p-3.5">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
                <ClipboardList className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">Active</span>
              </div>
              <p className="text-base font-bold text-foreground">{pendingOrders.length}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">orders pending</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* ── Staff View ── */
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Card className="border shadow-sm cursor-pointer active:scale-95 transition-transform border-amber-200" onClick={() => onNavigate?.("orders")}>
            <CardContent className="p-3.5">
              <div className="flex items-center gap-1.5 text-amber-600 mb-2">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">Pending</span>
              </div>
              <p className="text-2xl font-bold text-amber-600">{pendingOnlyOrders.length}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">orders waiting</p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm cursor-pointer active:scale-95 transition-transform border-blue-200" onClick={() => onNavigate?.("orders")}>
            <CardContent className="p-3.5">
              <div className="flex items-center gap-1.5 text-blue-600 mb-2">
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">In Progress</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{inProgressOrders.length}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">in production</p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm cursor-pointer active:scale-95 transition-transform" onClick={() => onNavigate?.("orders")}>
            <CardContent className="p-3.5">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
                <ClipboardList className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">Today</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{todayOrders.length}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">booked today</p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm cursor-pointer active:scale-95 transition-transform" onClick={() => onNavigate?.("inventory")}>
            <CardContent className="p-3.5">
              <div className="flex items-center gap-1.5 text-primary mb-2">
                <Package className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">Stock</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{materials.length}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">materials</p>
            </CardContent>
          </Card>

          <Card
            className={cn(
              "border shadow-sm cursor-pointer active:scale-95 transition-transform",
              lowStockItems.length > 0 ? "border-amber-400 bg-amber-50/60 dark:bg-amber-950/20" : ""
            )}
            onClick={() => onNavigate?.("inventory")}
          >
            <CardContent className="p-3.5">
              <div className="flex items-center gap-1.5 text-amber-600 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">Low Stock</span>
              </div>
              <p className={`text-2xl font-bold ${lowStockItems.length > 0 ? "text-amber-600" : "text-foreground"}`}>
                {lowStockItems.length}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">needs reorder</p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm cursor-pointer active:scale-95 transition-transform" onClick={() => onNavigate?.("clients")}>
            <CardContent className="p-3.5">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">Clients</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{clients.length}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">registered</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Low Stock Alert ── */}
      {lowStockItems.length > 0 && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="p-4">
            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-sm font-semibold text-amber-800 dark:text-amber-400">
                  Low Stock ({lowStockItems.length} {lowStockItems.length === 1 ? "item" : "items"})
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 shrink-0"
                onClick={() => onNavigate?.("inventory")}
              >
                Manage →
              </Button>
            </div>

            {/* Items — stacked for readability */}
            <div className="space-y-2">
              {lowStockItems.slice(0, 5).map((m) => (
                <div
                  key={m.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-2 py-2 border-b border-amber-200 dark:border-amber-800/50 last:border-0"
                >
                  <span className="text-sm font-medium text-amber-900 dark:text-amber-300">
                    {m.type} — {m.size} ({m.thickness}mm)
                  </span>
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400 whitespace-nowrap">
                    {formatStock(m.currentStock)} left &nbsp;·&nbsp; Alert ≤{m.lowStockAlert}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Pending Orders ── */}
      {pendingOrders.length > 0 && (
        <Card className="border shadow-sm">
          <CardContent className="p-4">
            {/* Section header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">
                  Active Orders
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">({pendingOrders.length})</span>
                </span>
              </div>
              <button
                onClick={() => onNavigate?.("orders")}
                className="text-xs text-primary flex items-center gap-0.5 hover:underline"
              >
                See all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Order cards */}
            <div className="space-y-2">
              {pendingOrders.slice(0, 5).map((order) => {
                const clientName =
                  order.clientSnapshot?.name ||
                  clients.find((c) => (c.id || c._id) === order.clientId)?.name ||
                  "Unknown"

                const orderDate = order.date
                  ? new Date(order.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                  : "—"

                const statusColorMap: Record<string, string> = {
                  "Pending": "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300",
                  "Quotation Sent": "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/40 dark:text-purple-300",
                  "Design Pending": "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/40 dark:text-orange-300",
                  "Design Sent": "bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-900/40 dark:text-sky-300",
                  "Design Approved": "bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-900/40 dark:text-teal-300",
                  "In Progress": "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300",
                  "Ready for Pickup": "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300",
                  "Completed": "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-300",
                  "Delivered": "bg-lime-100 text-lime-700 border-lime-300 dark:bg-lime-900/40 dark:text-lime-300",
                  "Billed": "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/40 dark:text-slate-400",
                  "Cancelled": "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300",
                }
                const statusBadgeClass = statusColorMap[order.status] ?? statusColorMap["Billed"]

                return (
                  <div
                    key={order.id}
                    className="rounded-xl border border-border bg-muted/20 p-3 space-y-2.5"
                  >
                    {/* Row 1 — Order # + Date + Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          onClick={() => {
                            if (onNavigate) {
                              const params = new URLSearchParams(window.location.search)
                              params.set("module", "orders")
                              params.set("search", order.orderNumber)
                              window.history.replaceState(null, "", `?${params.toString()}`)
                              onNavigate("orders")
                            }
                          }}
                          className="font-bold text-sm text-primary hover:underline truncate max-w-[130px]"
                        >
                          {order.orderNumber}
                        </button>
                        <span className="text-[11px] text-muted-foreground shrink-0">{orderDate}</span>
                      </div>

                      {/* Status badge/select */}
                      <Select
                        value={order.status}
                        onValueChange={(v) => updateOrder(order.id!, { status: v as any })}
                      >
                        <SelectTrigger
                          className={cn(
                            "h-7 w-auto min-w-[90px] px-2.5 text-[11px] font-semibold uppercase tracking-wide rounded-full border shrink-0",
                            statusBadgeClass
                          )}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {orderStatuses.map((s) => (
                            <SelectItem key={s} value={s} className="text-xs font-medium">
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Row 2 — Client + Design + Amount */}
                    <div className="flex items-end justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-tight truncate">
                          {clientName}
                        </p>
                        {order.designType && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                            {order.designType}
                          </p>
                        )}
                      </div>
                      {canViewFinancials && (
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-foreground tabular-nums">
                            ₹{(order.totalValue || 0).toLocaleString("en-IN")}
                          </p>
                          {order.balanceAmount > 0 && (
                            <p className="text-[10px] text-amber-600 font-medium">
                              ₹{order.balanceAmount.toLocaleString("en-IN")} due
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
