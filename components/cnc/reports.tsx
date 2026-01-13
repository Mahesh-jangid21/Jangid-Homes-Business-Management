"use client"

import { useState } from "react"
import { useCNC } from "@/lib/contexts/cnc-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown, Package, Users, IndianRupee, Loader2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export function CNCReports() {
  const { materials, clients, orders, expenses, wastages, loading } = useCNC()
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
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
      const client = clients.find((c) => (c.id || c._id) === o.clientId)
      return { ...o, clientName: client?.name || "Unknown" }
    })

  // Payment Breakdown
  const allPayments = orders.flatMap(o => {
    if (o.payments && o.payments.length > 0) {
      return o.payments.map(p => ({ ...p, orderNumber: o.orderNumber }))
    }
    // Fallback for orders created before detailed payment tracking
    if (o.advanceReceived > 0) {
      return [{
        amount: o.advanceReceived,
        date: String(o.date),
        method: 'Cash' as const,
        orderNumber: o.orderNumber
      }]
    }
    return []
  })
  const monthPayments = allPayments.filter(p => {
    try {
      return p.date && new Date(p.date).toISOString().startsWith(filterMonth)
    } catch {
      return false
    }
  })

  const paymentsByMethod = monthPayments.reduce((acc, p) => {
    acc[p.method] = (acc[p.method] || 0) + p.amount
    return acc
  }, {} as Record<string, number>)

  const paymentsByAccount = monthPayments.reduce((acc, p) => {
    const key = p.account || 'Cash'
    acc[key] = (acc[key] || 0) + p.amount
    return acc
  }, {} as Record<string, number>)

  const expensesByAccount = monthExpenses.reduce((acc, e) => {
    const key = (e as any).account || 'Cash'
    acc[key] = (acc[key] || 0) + e.amount
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-5">
      {/* Header - matching dashboard style */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Reports</h2>
          <span className="text-sm text-muted-foreground">
            {new Date(filterMonth + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="h-9 w-36 text-sm"
          />
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => {
              const doc = new jsPDF()
              const monthLabel = new Date(filterMonth + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" })

              doc.setFontSize(20)
              doc.text("CNC Shop Business Report", 14, 22)
              doc.setFontSize(12)
              doc.text(`Period: ${monthLabel}`, 14, 30)
              doc.text(`Generated on: ${new Date().toLocaleDateString("en-IN")}`, 14, 37)

              // Add P&L Summary
              doc.setFontSize(16)
              doc.text("Profit & Loss Statement", 14, 50)
              autoTable(doc, {
                startY: 55,
                head: [['Category', 'Amount (INR)']],
                body: [
                  ['Total Sales Revenue', `Rs. ${totalSales.toLocaleString("en-IN")}`],
                  ['Material Cost', `Rs. ${totalMaterialCost.toLocaleString("en-IN")}`],
                  ['Gross Profit', `Rs. ${grossProfit.toLocaleString("en-IN")}`],
                  ['Labour Cost', `Rs. ${totalLabourCost.toLocaleString("en-IN")}`],
                  ['Other Expenses', `Rs. ${totalExpenses.toLocaleString("en-IN")}`],
                  ['Net Profit', `Rs. ${netProfit.toLocaleString("en-IN")}`],
                ],
                theme: 'striped',
                headStyles: { fillColor: [79, 70, 229] }
              })

              // Add Payment Summary
              doc.addPage()
              doc.setFontSize(16)
              doc.text("Cash Flow Summary", 14, 22)

              // Collections by Recipient
              doc.setFontSize(14)
              doc.text("1. Collections (Received)", 14, 32)
              autoTable(doc, {
                startY: 35,
                head: [['Recipient', 'Total Received (INR)']],
                body: Object.entries(paymentsByAccount).map(([acc, amt]) => [
                  acc, `Rs. ${amt.toLocaleString("en-IN")}`
                ]),
                theme: 'striped',
                headStyles: { fillColor: [16, 185, 129] }
              })

              // Expenses by Recipient
              const currentY = (doc as any).lastAutoTable.finalY + 15
              doc.text("2. Expenses (Paid Out)", 14, currentY)
              autoTable(doc, {
                startY: currentY + 3,
                head: [['Recipient', 'Total Paid (INR)']],
                body: Object.entries(expensesByAccount).map(([acc, amt]) => [
                  acc, `Rs. ${amt.toLocaleString("en-IN")}`
                ]),
                theme: 'striped',
                headStyles: { fillColor: [239, 68, 68] }
              })

              // Net Balance
              const finalY = (doc as any).lastAutoTable.finalY + 15
              doc.text("3. Net Cash Flow", 14, finalY)
              autoTable(doc, {
                startY: finalY + 3,
                head: [['Recipient', 'Net Balance (INR)']],
                body: Array.from(new Set([...Object.keys(paymentsByAccount), ...Object.keys(expensesByAccount)])).map(acc => {
                  const net = (paymentsByAccount[acc] || 0) - (expensesByAccount[acc] || 0)
                  return [acc, `Rs. ${net.toLocaleString("en-IN")}`]
                }),
                theme: 'striped',
                headStyles: { fillColor: [59, 130, 246] }
              })

              // Add Stock Summary on new page
              doc.addPage()
              doc.text("Inventory Status Report", 14, 22)
              autoTable(doc, {
                startY: 30,
                head: [['Material', 'Stock', 'Rate', 'Total Value']],
                body: materials.map(m => [
                  `${m.type} ${m.size} (${m.thickness}mm)`,
                  `${m.currentStock} sheets`,
                  `Rs. ${m.rate}`,
                  `Rs. ${(m.currentStock * m.rate).toLocaleString("en-IN")}`
                ]),
                foot: [['', '', 'Total Stock Value:', `Rs. ${totalStockValue.toLocaleString("en-IN")}`]],
                theme: 'grid'
              })

              doc.save(`CNC_Report_${filterMonth}.pdf`)
            }}
          >
            <Download className="w-3.5 h-3.5" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Report Tabs */}
      <Tabs defaultValue="pnl">
        <TabsList className="h-9 p-1 overflow-x-auto">
          <TabsTrigger value="pnl" className="text-xs px-3 h-7">P&L</TabsTrigger>
          <TabsTrigger value="stock" className="text-xs px-3 h-7">Stock</TabsTrigger>
          <TabsTrigger value="clients" className="text-xs px-3 h-7">Clients</TabsTrigger>
          <TabsTrigger value="pending" className="text-xs px-3 h-7">Pending</TabsTrigger>
          <TabsTrigger value="collections" className="text-xs px-3 h-7">Cash Flow</TabsTrigger>
        </TabsList>

        <TabsContent value="pnl" className="mt-4 space-y-4">
          {/* P&L Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                  <IndianRupee className="w-4 h-4" />
                  <span className="text-[10px] font-medium uppercase">Sales</span>
                </div>
                <p className="text-lg font-bold text-foreground">₹{(totalSales || 0).toLocaleString("en-IN")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{monthOrders.length} orders</p>
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                  <Package className="w-4 h-4" />
                  <span className="text-[10px] font-medium uppercase">Material Cost</span>
                </div>
                <p className="text-lg font-bold text-foreground">₹{(totalMaterialCost || 0).toLocaleString("en-IN")}</p>
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-green-600 mb-1.5">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-[10px] font-medium uppercase">Gross Profit</span>
                </div>
                <p className={`text-lg font-bold ${grossProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                  ₹{(grossProfit || 0).toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {totalSales > 0 ? Math.round((grossProfit / totalSales) * 100) : 0}% margin
                </p>
              </CardContent>
            </Card>
            <Card className={`border shadow-sm ${netProfit >= 0 ? 'bg-green-50/50 dark:bg-green-950/20' : 'bg-red-50/50 dark:bg-red-950/20'}`}>
              <CardContent className="p-4">
                <div className={`flex items-center gap-2 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'} mb-1.5`}>
                  {netProfit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span className="text-[10px] font-medium uppercase">Net Profit</span>
                </div>
                <p className={`text-lg font-bold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                  ₹{(netProfit || 0).toLocaleString("en-IN")}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* P&L Statement */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Profit & Loss Statement</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="font-medium">Total Sales Revenue</span>
                  <span className="font-bold text-green-600">₹{(totalSales || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between py-1.5 text-muted-foreground">
                  <span>Less: Material Cost</span>
                  <span>₹{(totalMaterialCost || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="font-medium">Gross Profit</span>
                  <span className={`font-semibold ${grossProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                    ₹{grossProfit.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 text-muted-foreground">
                  <span>Less: Labour Cost</span>
                  <span>₹{totalLabourCost.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between py-1.5 text-muted-foreground">
                  <span>Less: Other Expenses</span>
                  <span>₹{totalExpenses.toLocaleString("en-IN")}</span>
                </div>
                <div className={`flex justify-between py-3 border-t-2 ${netProfit >= 0 ? 'border-green-200' : 'border-red-200'}`}>
                  <span className="text-base font-bold">Net Profit</span>
                  <span className={`text-base font-bold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                    ₹{netProfit.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock" className="mt-4 space-y-4">
          {/* Stock Value Card */}
          <Card className="border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                <Package className="w-4 h-4" />
                <span className="text-[10px] font-medium uppercase">Total Stock Value</span>
              </div>
              <p className="text-lg font-bold text-foreground">₹{totalStockValue.toLocaleString("en-IN")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{materials.length} materials</p>
            </CardContent>
          </Card>

          {/* Stock Table */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Inventory Status</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr className="text-[10px] uppercase font-semibold tracking-wide text-muted-foreground">
                      <th className="text-left p-3">Material</th>
                      <th className="text-right p-3">Stock</th>
                      <th className="text-right p-3">Rate</th>
                      <th className="text-right p-3">Value</th>
                      <th className="text-center p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {materials.map((m) => (
                      <tr key={m.id}>
                        <td className="p-3 font-medium">
                          {m.type} <span className="text-muted-foreground">({m.size}, {m.thickness}mm)</span>
                        </td>
                        <td className="p-3 text-right">{m.currentStock} sheets</td>
                        <td className="p-3 text-right text-muted-foreground">₹{m.rate.toLocaleString("en-IN")}</td>
                        <td className="p-3 text-right font-semibold">
                          ₹{(m.currentStock * m.rate).toLocaleString("en-IN")}
                        </td>
                        <td className="p-3 text-center">
                          {m.currentStock <= m.lowStockAlert ? (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 text-[10px] font-medium uppercase rounded-full">Low</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400 text-[10px] font-medium uppercase rounded-full">OK</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Material Usage */}
          {materialUsage.length > 0 && (
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Material Usage This Month</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr className="text-[10px] uppercase font-semibold tracking-wide text-muted-foreground">
                        <th className="text-left p-3">Material</th>
                        <th className="text-right p-3">Used</th>
                        <th className="text-right p-3">Wastage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {materialUsage.map((m) => (
                        <tr key={m.id}>
                          <td className="p-3 font-medium">
                            {m.type} <span className="text-muted-foreground">({m.size}, {m.thickness}mm)</span>
                          </td>
                          <td className="p-3 text-right">{m.used} sheets</td>
                          <td className="p-3 text-right text-red-600 font-medium">{m.wasted} sheets</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="clients" className="mt-4 space-y-4">
          {clientSales.length === 0 ? (
            <Card className="border shadow-sm">
              <CardContent className="py-10 text-center">
                <Users className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No sales this month</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Client-wise Sales</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr className="text-[10px] uppercase font-semibold tracking-wide text-muted-foreground">
                        <th className="text-left p-3">Client</th>
                        <th className="text-left p-3">Type</th>
                        <th className="text-right p-3">Orders</th>
                        <th className="text-right p-3">Sales</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {clientSales.map((c) => (
                        <tr key={c.id}>
                          <td className="p-3 font-medium">{c.name}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-muted rounded-full text-[10px] font-medium uppercase">{c.type}</span>
                          </td>
                          <td className="p-3 text-right text-muted-foreground">{c.orderCount}</td>
                          <td className="p-3 text-right font-bold text-green-600">₹{c.sales.toLocaleString("en-IN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-4 space-y-4">
          {pendingPayments.length === 0 ? (
            <Card className="border shadow-sm">
              <CardContent className="py-10 text-center">
                <IndianRupee className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No pending payments</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Pending Total Card */}
              <Card className="border shadow-sm bg-amber-50/50 dark:bg-amber-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-amber-600 mb-1.5">
                    <IndianRupee className="w-4 h-4" />
                    <span className="text-[10px] font-medium uppercase">Total Pending</span>
                  </div>
                  <p className="text-lg font-bold text-amber-600">
                    ₹{pendingPayments.reduce((sum, o) => sum + o.balanceAmount, 0).toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{pendingPayments.length} orders</p>
                </CardContent>
              </Card>

              {/* Pending Table */}
              <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Pending Payments</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr className="text-[10px] uppercase font-semibold tracking-wide text-muted-foreground">
                          <th className="text-left p-3">Order</th>
                          <th className="text-left p-3">Client</th>
                          <th className="text-left p-3">Date</th>
                          <th className="text-right p-3">Total</th>
                          <th className="text-right p-3">Paid</th>
                          <th className="text-right p-3">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {pendingPayments.map((o) => (
                          <tr key={o.id}>
                            <td className="p-3 font-medium">{o.orderNumber}</td>
                            <td className="p-3 text-muted-foreground">{o.clientName}</td>
                            <td className="p-3 text-muted-foreground">{new Date(o.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                            <td className="p-3 text-right">₹{o.totalValue.toLocaleString("en-IN")}</td>
                            <td className="p-3 text-right text-green-600">
                              ₹{o.advanceReceived.toLocaleString("en-IN")}
                            </td>
                            <td className="p-3 text-right font-bold text-amber-600">
                              ₹{o.balanceAmount.toLocaleString("en-IN")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="collections" className="mt-4 space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Collections by Person</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {Object.entries(paymentsByAccount).map(([acc, amt]) => (
                    <div key={acc} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
                      <span className="text-sm text-muted-foreground">{acc}</span>
                      <span className="text-base font-bold">₹{amt.toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 border-t text-green-600">
                    <span className="text-sm font-semibold">Total</span>
                    <span className="text-base font-bold">₹{monthPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">By Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {Object.entries(paymentsByMethod).map(([method, amt]) => (
                    <div key={method} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
                      <span className="px-2 py-0.5 bg-muted rounded-full text-[10px] font-medium uppercase">{method}</span>
                      <span className="text-base font-bold">₹{amt.toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Expenses by Person</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {Object.entries(expensesByAccount).map(([acc, amt]) => (
                    <div key={acc} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
                      <span className="text-sm text-muted-foreground">{acc}</span>
                      <span className="text-base font-bold text-red-600">₹{amt.toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 border-t text-red-600">
                    <span className="text-sm font-semibold">Total</span>
                    <span className="text-base font-bold">₹{monthExpenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Net Cash Flow</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {Array.from(new Set([...Object.keys(paymentsByAccount), ...Object.keys(expensesByAccount)])).map(acc => {
                    const received = paymentsByAccount[acc] || 0
                    const paid = expensesByAccount[acc] || 0
                    const net = received - paid
                    return (
                      <div key={acc} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
                        <span className="text-sm text-muted-foreground">{acc}</span>
                        <span className={`text-base font-bold ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₹{net.toLocaleString("en-IN")}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transactions Table */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr className="text-[10px] uppercase font-semibold tracking-wide text-muted-foreground">
                      <th className="text-left p-3">Order</th>
                      <th className="text-left p-3">Date</th>
                      <th className="text-left p-3">Method</th>
                      <th className="text-left p-3">Person</th>
                      <th className="text-right p-3">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {monthPayments.sort((a, b) => b.date.localeCompare(a.date)).map((p, idx) => (
                      <tr key={idx}>
                        <td className="p-3 font-medium">{(p as any).orderNumber}</td>
                        <td className="p-3 text-muted-foreground">{new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-muted rounded-full text-[10px] font-medium uppercase">{p.method}</span>
                        </td>
                        <td className="p-3 text-muted-foreground">{p.account || "Cash"}</td>
                        <td className="p-3 text-right font-bold text-green-600">₹{p.amount.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
