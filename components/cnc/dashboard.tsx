"use client"

import { useCNC } from "@/lib/contexts/cnc-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Package, Users, ClipboardList, TrendingUp, AlertTriangle, IndianRupee, Loader2, Plus, Receipt, Calendar } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"

const orderStatuses = ["Pending", "In Progress", "Completed", "Billed"] as const

interface CNCDashboardProps {
  onNavigate?: (module: string) => void
}

export function CNCDashboard({ onNavigate }: CNCDashboardProps) {
  const { materials, clients, orders, loading, updateOrder } = useCNC()
  const router = useRouter()

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
  const pendingOrders = orders.filter((o) => o.status === "Pending" || o.status === "In Progress")
  const pendingPayments = orders.filter((o) => o.balanceAmount > 0).reduce((sum, o) => sum + o.balanceAmount, 0)

  return (
    <div className="space-y-5">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Dashboard</h2>
          <span className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={() => onNavigate?.("expenses")}
          >
            <Receipt className="w-3.5 h-3.5 mr-1.5" />
            Add Expense
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs"
            onClick={() => onNavigate?.("orders")}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            New Order
          </Button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
              <IndianRupee className="w-4 h-4" />
              <span className="text-[10px] font-medium uppercase">Today</span>
            </div>
            <p className="text-lg font-bold text-foreground">₹{(todaySales || 0).toLocaleString("en-IN")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{todayOrders.length} orders</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
              <TrendingUp className="w-4 h-4" />
              <span className="text-[10px] font-medium uppercase">Month</span>
            </div>
            <p className="text-lg font-bold text-foreground">₹{(monthSales || 0).toLocaleString("en-IN")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{monthOrders.length} orders</p>
          </CardContent>
        </Card>

        <Card
          className="border shadow-sm cursor-pointer hover:border-amber-300 hover:shadow-md transition-all"
          onClick={() => onNavigate?.("orders")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-600 mb-1.5">
              <IndianRupee className="w-4 h-4" />
              <span className="text-[10px] font-medium uppercase">Pending</span>
            </div>
            <p className="text-lg font-bold text-amber-600">₹{(pendingPayments || 0).toLocaleString("en-IN")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">to collect</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
              <Package className="w-4 h-4" />
              <span className="text-[10px] font-medium uppercase">Stock</span>
            </div>
            <p className="text-lg font-bold text-foreground">{materials.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">items</p>
          </CardContent>
        </Card>

        <Card
          className="border shadow-sm cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
          onClick={() => onNavigate?.("clients")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
              <Users className="w-4 h-4" />
              <span className="text-[10px] font-medium uppercase">Clients</span>
            </div>
            <p className="text-lg font-bold text-foreground">{clients.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">registered</p>
          </CardContent>
        </Card>

        <Card
          className="border shadow-sm cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
          onClick={() => onNavigate?.("orders")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
              <ClipboardList className="w-4 h-4" />
              <span className="text-[10px] font-medium uppercase">Orders</span>
            </div>
            <p className="text-lg font-bold text-foreground">{pendingOrders.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800 dark:text-amber-400">Low Stock</span>
            </div>
            <div className="space-y-1.5">
              {lowStockItems.slice(0, 3).map((m) => (
                <div key={m.id} className="flex justify-between text-sm">
                  <span className="text-amber-800 dark:text-amber-300">{m.type} - {m.size}</span>
                  <span className="font-medium text-amber-700 dark:text-amber-400">{m.currentStock} left</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Orders */}
      {pendingOrders.length > 0 && (
        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Pending Orders</span>
            </div>
            <div className="space-y-2">
              {pendingOrders.slice(0, 5).map((order) => {
                // Use clientSnapshot if available, fallback to lookup
                const clientName = order.clientSnapshot?.name || clients.find((c) => (c.id || c._id) === order.clientId)?.name || "Unknown"
                return (
                  <div key={order.id} className="group flex justify-between items-center text-sm py-3 border-b border-border last:border-0 hover:bg-muted/30 px-2 -mx-2 rounded-lg transition-colors">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (onNavigate) {
                              onNavigate("orders")
                              // We use the search parameter we added to CNCOrders
                              const params = new URLSearchParams(window.location.search)
                              params.set("module", "orders")
                              params.set("search", order.orderNumber)
                              window.history.replaceState(null, "", `?${params.toString()}`)
                            }
                          }}
                          className="font-semibold text-primary hover:underline transition-all truncate"
                        >
                          {order.orderNumber}
                        </button>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {order.date ? new Date(order.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-foreground font-medium truncate max-w-[120px]">{clientName}</p>
                        <span className="text-muted-foreground text-[10px]">•</span>
                        <p className="text-muted-foreground text-xs truncate italic">{order.designType || "Job"}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3 shrink-0">
                      <span className="font-bold text-foreground tabular-nums">₹{(order.totalValue || 0).toLocaleString("en-IN")}</span>
                      <Select
                        value={order.status}
                        onValueChange={(newStatus) => updateOrder(order.id!, { status: newStatus as any })}
                      >
                        <SelectTrigger className={`h-7 w-28 text-[10px] font-medium uppercase tracking-wider ${order.status === "Pending"
                          ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800"
                          : "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800"
                          }`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {orderStatuses.map((s) => (
                            <SelectItem key={s} value={s} className="text-[10px] uppercase font-medium">
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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

