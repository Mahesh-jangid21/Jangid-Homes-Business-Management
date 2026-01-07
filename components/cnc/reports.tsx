"use client"

import { useState } from "react"
import { useCNC } from "@/lib/contexts/cnc-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown, Package, Users, IndianRupee, Loader2 } from "lucide-react"

export function CNCReports() {
  const { materials, clients, orders, expenses, wastages, loading } = useCNC()
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Filter data by month
  const monthOrders = orders.filter((o) => o.date.startsWith(filterMonth))
  const monthExpenses = expenses.filter((e) => e.date.startsWith(filterMonth))
  const monthWastages = wastages.filter((w) => w.date.startsWith(filterMonth))

  // Calculate P&L
  const totalSales = monthOrders.reduce((sum, o) => sum + o.totalValue, 0)
  const totalMaterialCost = monthOrders.reduce((sum, o) => sum + o.materials.reduce((s, m) => s + m.cost, 0), 0)
  const totalLabourCost = monthOrders.reduce((sum, o) => sum + o.labourCost, 0)
  const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0)
  const grossProfit = totalSales - totalMaterialCost
  const netProfit = grossProfit - totalExpenses

  // Stock value
  const totalStockValue = materials.reduce((sum, m) => sum + m.currentStock * m.rate, 0)

  // Client-wise sales
  const clientSales = clients
    .map((c) => {
      const clientOrders = monthOrders.filter((o) => o.clientId === c.id)
      return {
        ...c,
        sales: clientOrders.reduce((sum, o) => sum + o.totalValue, 0),
        orderCount: clientOrders.length,
      }
    })
    .filter((c) => c.sales > 0)
    .sort((a, b) => b.sales - a.sales)

  // Material usage
  const materialUsage = materials
    .map((m) => {
      const used = monthOrders.reduce((sum, o) => {
        const matUsed = o.materials.find((om) => om.materialId === m.id)
        return sum + (matUsed?.quantity || 0)
      }, 0)
      const wasted = monthWastages.filter((w) => w.materialId === m.id).reduce((sum, w) => sum + w.quantity, 0)
      return { ...m, used, wasted }
    })
    .filter((m) => m.used > 0 || m.wasted > 0)

  // Pending payments
  const pendingPayments = orders
    .filter((o) => o.balanceAmount > 0)
    .map((o) => {
      const client = clients.find((c) => c.id === o.clientId)
      return { ...o, clientName: client?.name || "Unknown" }
    })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Reports</h2>
          <p className="text-muted-foreground">Business analytics and insights</p>
        </div>
        <Input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="w-40" />
      </div>

      <Tabs defaultValue="pnl">
        <TabsList>
          <TabsTrigger value="pnl">Profit & Loss</TabsTrigger>
          <TabsTrigger value="stock">Stock Report</TabsTrigger>
          <TabsTrigger value="clients">Client Sales</TabsTrigger>
          <TabsTrigger value="pending">Pending Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="pnl" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{(totalSales || 0).toLocaleString("en-IN")}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Material Cost</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{(totalMaterialCost || 0).toLocaleString("en-IN")}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${grossProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                  ₹{(grossProfit || 0).toLocaleString("en-IN")}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                {netProfit >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                )}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                  ₹{(netProfit || 0).toLocaleString("en-IN")}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profit & Loss Statement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">Total Sales Revenue</span>
                  <span className="font-bold text-green-600">₹{(totalSales || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between py-2 text-muted-foreground">
                  <span>Less: Material Cost</span>
                  <span>₹{(totalMaterialCost || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between py-2 border-b font-medium">
                  <span>Gross Profit</span>
                  <span className={grossProfit >= 0 ? "text-green-600" : "text-red-600"}>
                    ₹{grossProfit.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between py-2 text-muted-foreground">
                  <span>Less: Labour Cost (from orders)</span>
                  <span>₹{totalLabourCost.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between py-2 text-muted-foreground">
                  <span>Less: Other Expenses</span>
                  <span>₹{totalExpenses.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between py-3 border-t-2 text-lg font-bold">
                  <span>Net Profit</span>
                  <span className={netProfit >= 0 ? "text-green-600" : "text-red-600"}>
                    ₹{netProfit.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock" className="mt-4 space-y-4">
          <Card>
            <CardContent className="py-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Total Stock Value</p>
                  <p className="text-2xl font-bold">₹{totalStockValue.toLocaleString("en-IN")}</p>
                </div>
                <Package className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stock Report</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-4 font-medium">Material</th>
                    <th className="text-right p-4 font-medium">Current Stock</th>
                    <th className="text-right p-4 font-medium">Rate</th>
                    <th className="text-right p-4 font-medium">Value</th>
                    <th className="text-center p-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((m) => (
                    <tr key={m.id} className="border-t">
                      <td className="p-4">
                        {m.type} - {m.size} ({m.thickness}mm)
                      </td>
                      <td className="p-4 text-right">{m.currentStock} sheets</td>
                      <td className="p-4 text-right">₹{m.rate.toLocaleString("en-IN")}</td>
                      <td className="p-4 text-right font-medium">
                        ₹{(m.currentStock * m.rate).toLocaleString("en-IN")}
                      </td>
                      <td className="p-4 text-center">
                        {m.currentStock <= m.lowStockAlert ? (
                          <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded">Low Stock</span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">OK</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {materialUsage.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Material Usage This Month</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-4 font-medium">Material</th>
                      <th className="text-right p-4 font-medium">Used in Orders</th>
                      <th className="text-right p-4 font-medium">Wastage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materialUsage.map((m) => (
                      <tr key={m.id} className="border-t">
                        <td className="p-4">
                          {m.type} - {m.size} ({m.thickness}mm)
                        </td>
                        <td className="p-4 text-right">{m.used} sheets</td>
                        <td className="p-4 text-right text-red-600">{m.wasted} sheets</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="clients" className="mt-4">
          {clientSales.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No sales this month.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Client-wise Sales</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-4 font-medium">Client</th>
                      <th className="text-left p-4 font-medium">Type</th>
                      <th className="text-right p-4 font-medium">Orders</th>
                      <th className="text-right p-4 font-medium">Total Sales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientSales.map((c) => (
                      <tr key={c.id} className="border-t">
                        <td className="p-4 font-medium">{c.name}</td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-muted rounded text-xs">{c.type}</span>
                        </td>
                        <td className="p-4 text-right">{c.orderCount}</td>
                        <td className="p-4 text-right font-bold">₹{c.sales.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          {pendingPayments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <IndianRupee className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No pending payments.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="py-4">
                  <p className="text-sm text-amber-800">Total Pending Amount</p>
                  <p className="text-2xl font-bold text-amber-900">
                    ₹{pendingPayments.reduce((sum, o) => sum + o.balanceAmount, 0).toLocaleString("en-IN")}
                  </p>
                </CardContent>
              </Card>
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg">Pending Payments</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-4 font-medium">Order</th>
                        <th className="text-left p-4 font-medium">Client</th>
                        <th className="text-left p-4 font-medium">Date</th>
                        <th className="text-right p-4 font-medium">Total</th>
                        <th className="text-right p-4 font-medium">Received</th>
                        <th className="text-right p-4 font-medium">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingPayments.map((o) => (
                        <tr key={o.id} className="border-t">
                          <td className="p-4 font-medium">{o.orderNumber}</td>
                          <td className="p-4">{o.clientName}</td>
                          <td className="p-4">{new Date(o.date).toLocaleDateString("en-IN")}</td>
                          <td className="p-4 text-right">₹{o.totalValue.toLocaleString("en-IN")}</td>
                          <td className="p-4 text-right text-green-600">
                            ₹{o.advanceReceived.toLocaleString("en-IN")}
                          </td>
                          <td className="p-4 text-right font-bold text-amber-600">
                            ₹{o.balanceAmount.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
