"use client"

import { useCNC } from "@/lib/contexts/cnc-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Users, ClipboardList, TrendingUp, AlertTriangle, IndianRupee, Loader2 } from "lucide-react"

export function CNCDashboard() {
  const { materials, clients, orders, expenses, loading } = useCNC()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const today = new Date().toISOString().split("T")[0]
  const thisMonth = new Date().toISOString().slice(0, 7)

  const todayOrders = orders.filter((o) => o.date === today)
  const todaySales = todayOrders.reduce((sum, o) => sum + o.totalValue, 0)

  const monthOrders = orders.filter((o) => o.date.startsWith(thisMonth))
  const monthSales = monthOrders.reduce((sum, o) => sum + o.totalValue, 0)
  const monthExpenses = expenses.filter((e) => e.date.startsWith(thisMonth)).reduce((sum, e) => sum + e.amount, 0)
  const monthMaterialCost = monthOrders.reduce((sum, o) => sum + o.materials.reduce((s, m) => s + m.cost, 0), 0)
  const monthProfit = monthSales - monthExpenses - monthMaterialCost

  const lowStockItems = materials.filter((m) => m.currentStock <= m.lowStockAlert)
  const pendingOrders = orders.filter((o) => o.status === "Pending" || o.status === "In Progress")
  const pendingPayments = orders.filter((o) => o.balanceAmount > 0).reduce((sum, o) => sum + o.balanceAmount, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
          <p className="text-muted-foreground">Welcome back! Here's your CNC business overview.</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] md:text-sm font-semibold text-primary bg-primary/5 px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg border border-primary/10">
          <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-primary rounded-full" />
          Live Overview
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="hover-lift border border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 p-3 md:p-6">
            <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Today</CardTitle>
            <IndianRupee className="w-3.5 h-3.5 text-primary" />
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
            <div className="text-lg md:text-2xl font-bold">₹{(todaySales || 0).toLocaleString("en-IN")}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{todayOrders.length} orders</p>
          </CardContent>
        </Card>

        <Card className="hover-lift border border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 p-3 md:p-6">
            <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Month</CardTitle>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
            <div className="text-lg md:text-2xl font-bold">₹{(monthSales || 0).toLocaleString("en-IN")}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{monthOrders.length} orders</p>
          </CardContent>
        </Card>

        <Card className="hover-lift border border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 p-3 md:p-6">
            <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Profit</CardTitle>
            <TrendingUp className={`w-3.5 h-3.5 ${monthProfit >= 0 ? "text-green-600" : "text-red-600"}`} />
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
            <div className={`text-lg md:text-2xl font-bold ${monthProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
              ₹{(monthProfit || 0).toLocaleString("en-IN")}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Net</p>
          </CardContent>
        </Card>

        <Card className="hover-lift border border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 p-3 md:p-6">
            <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Payments</CardTitle>
            <IndianRupee className="w-3.5 h-3.5 text-amber-600" />
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
            <div className="text-lg md:text-2xl font-bold text-amber-600">₹{(pendingPayments || 0).toLocaleString("en-IN")}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Pending</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <Card className="border border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 p-4 md:p-6">
            <CardTitle className="text-xs font-medium text-muted-foreground">Inventory</CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            <div className="text-xl md:text-2xl font-bold">{materials.length}</div>
            <p className="text-[10px] text-muted-foreground">Items</p>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 p-4 md:p-6">
            <CardTitle className="text-xs font-medium text-muted-foreground">Clients</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            <div className="text-xl md:text-2xl font-bold">{clients.length}</div>
            <p className="text-[10px] text-muted-foreground">Registered</p>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 p-4 md:p-6">
            <CardTitle className="text-xs font-medium text-muted-foreground">Pending</CardTitle>
            <ClipboardList className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            <div className="text-xl md:text-2xl font-bold">{pendingOrders.length}</div>
            <p className="text-[10px] text-muted-foreground">Orders</p>
          </CardContent>
        </Card>
      </div>

      {lowStockItems.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockItems.map((m) => (
                <div key={m.id} className="flex justify-between text-sm">
                  <span className="text-amber-900">
                    {m.type} - {m.size} ({m.thickness}mm)
                  </span>
                  <span className="font-medium text-amber-800">{m.currentStock} sheets left</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {pendingOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingOrders.slice(0, 5).map((order) => {
                const client = clients.find((c) => c.id === order.clientId)
                return (
                  <div key={order.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">{client?.name || "Unknown"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{order.totalValue.toLocaleString("en-IN")}</p>
                      <span
                        className={`text-xs px-2 py-1 rounded ${order.status === "Pending" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                          }`}
                      >
                        {order.status}
                      </span>
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
