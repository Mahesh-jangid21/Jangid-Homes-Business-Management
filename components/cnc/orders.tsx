"use client"

import { useState } from "react"
import { useCNC, type Order } from "@/lib/contexts/cnc-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, ClipboardList, Trash2, X, Loader2, Printer, FileText, IndianRupee, Search } from "lucide-react"

const designTypes = [
  "Mandir Jali",
  "Traditional Jali",
  "3D Wall Panel",
  "Engraving",
  "Carving",
  "CNC Cutting",
  "Custom Design",
]

const orderStatuses = ["Pending", "In Progress", "Completed", "Billed"] as const

export function CNCOrders() {
  const { orders, clients, materials, loading, addOrder, updateOrder, deleteOrder } = useCNC()
  const [showAddOrder, setShowAddOrder] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [saving, setSaving] = useState(false)
  const [showJobCard, setShowJobCard] = useState<Order | null>(null)
  const [showPaymentDialog, setShowPaymentDialog] = useState<Order | null>(null)
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [materialWidth, setMaterialWidth] = useState<number>(0)
  const [materialHeight, setMaterialHeight] = useState<number>(0)
  const [useCustomSize, setUseCustomSize] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card' | 'Bank'>('Cash')
  const [paymentAccount, setPaymentAccount] = useState<'Kamal Jangid' | 'Hiralal Jangid' | ''>('')

  const generateOrderNumber = () => {
    const date = new Date()
    const prefix = `ORD${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`
    const count = orders.filter((o) => o.orderNumber.startsWith(prefix)).length + 1
    return `${prefix}-${String(count).padStart(3, "0")}`
  }

  const getSheetArea = (size: string) => {
    const parts = size.toLowerCase().split("x")
    if (parts.length === 2) {
      const w = parseFloat(parts[0])
      const h = parseFloat(parts[1])
      if (!isNaN(w) && !isNaN(h)) return w * h
    }
    return 32 // Default 8x4
  }

  const [newOrder, setNewOrder] = useState<Partial<Order>>({
    orderNumber: generateOrderNumber(),
    date: new Date().toISOString().split("T")[0],
    clientId: "",
    designType: "",
    materials: [],
    labourCost: 0,
    totalValue: 0,
    advanceReceived: 0,
    balanceAmount: 0,
    deliveryDate: "",
    status: "Pending",
  })

  const [selectedMaterial, setSelectedMaterial] = useState("")
  const [materialQty, setMaterialQty] = useState(1)

  const addMaterialToOrder = () => {
    if (!selectedMaterial) return
    const material = materials.find((m) => (m.id || m._id) === selectedMaterial)
    if (!material) return

    const updatedMaterials = [...(newOrder.materials || [])]

    let finalQty = materialQty
    let itemCost = materialQty * material.rate

    if (useCustomSize && materialWidth > 0 && materialHeight > 0) {
      const sheetArea = getSheetArea(material.size)
      const customArea = materialWidth * materialHeight
      finalQty = (customArea / sheetArea) * materialQty
      itemCost = finalQty * material.rate
    }

    updatedMaterials.push({
      materialId: selectedMaterial,
      quantity: finalQty,
      width: useCustomSize ? materialWidth : undefined,
      height: useCustomSize ? materialHeight : undefined,
      cost: itemCost,
    })

    const materialCost = updatedMaterials.reduce((sum, m) => sum + m.cost, 0)
    const totalValue = materialCost + (newOrder.labourCost || 0)
    const balanceAmount = totalValue - (newOrder.advanceReceived || 0)

    setNewOrder({
      ...newOrder,
      materials: updatedMaterials,
      totalValue,
      balanceAmount,
    })
    setSelectedMaterial("")
    setMaterialQty(1)
    setMaterialWidth(0)
    setMaterialHeight(0)
    setUseCustomSize(false)
  }

  const removeMaterialFromOrder = (materialId: string) => {
    const updatedMaterials = newOrder.materials?.filter((m) => m.materialId !== materialId) || []
    const materialCost = updatedMaterials.reduce((sum, m) => sum + m.cost, 0)
    const totalValue = materialCost + (newOrder.labourCost || 0)
    const balanceAmount = totalValue - (newOrder.advanceReceived || 0)

    setNewOrder({
      ...newOrder,
      materials: updatedMaterials,
      totalValue,
      balanceAmount,
    })
  }

  const updateLabourCost = (cost: number) => {
    const materialCost = newOrder.materials?.reduce((sum, m) => sum + m.cost, 0) || 0
    const totalValue = materialCost + cost
    const balanceAmount = totalValue - (newOrder.advanceReceived || 0)
    setNewOrder({ ...newOrder, labourCost: cost, totalValue, balanceAmount })
  }

  const updateAdvance = (advance: number) => {
    const balanceAmount = (newOrder.totalValue || 0) - advance
    setNewOrder({ ...newOrder, advanceReceived: advance, balanceAmount })
  }

  const handleAddOrder = async () => {
    setSaving(true)
    try {
      await addOrder({
        orderNumber: newOrder.orderNumber || generateOrderNumber(),
        date: newOrder.date || "",
        clientId: newOrder.clientId || "",
        designType: newOrder.designType || "",
        materials: newOrder.materials || [],
        labourCost: newOrder.labourCost || 0,
        totalValue: newOrder.totalValue || 0,
        advanceReceived: newOrder.advanceReceived || 0,
        payments: (newOrder.advanceReceived || 0) > 0 ? [{
          amount: newOrder.advanceReceived || 0,
          date: new Date().toISOString(),
          method: paymentMethod,
          account: (paymentMethod !== 'Cash') ? (paymentAccount as any) : undefined
        }] : [],
        balanceAmount: newOrder.balanceAmount || 0,
        deliveryDate: newOrder.deliveryDate || "",
        status: newOrder.status as Order["status"],
      })
      setShowAddOrder(false)
      setNewOrder({
        orderNumber: generateOrderNumber(),
        date: new Date().toISOString().split("T")[0],
        clientId: "",
        designType: "",
        materials: [],
        labourCost: 0,
        totalValue: 0,
        advanceReceived: 0,
        balanceAmount: 0,
        deliveryDate: "",
        status: "Pending",
      })
      setPaymentMethod('Cash')
      setPaymentAccount('')
    } catch (error) {
      console.error("Failed to add order:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateOrderStatus = async (orderId: string, status: Order["status"]) => {
    try {
      await updateOrder(orderId, { status })
    } catch (error) {
      console.error("Failed to update order:", error)
    }
  }

  const handleDeleteOrder = async (id: string) => {
    try {
      await deleteOrder(id)
    } catch (error) {
      console.error("Failed to delete order:", error)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleRecordPayment = async () => {
    if (!showPaymentDialog || paymentAmount <= 0) return
    setSaving(true)
    try {
      const orderId = showPaymentDialog.id || showPaymentDialog._id || ""
      const currentAdvance = showPaymentDialog.advanceReceived || 0
      const newAdvance = currentAdvance + paymentAmount
      const newBalance = (showPaymentDialog.totalValue || 0) - newAdvance

      const newPayment = {
        amount: paymentAmount,
        date: new Date().toISOString(),
        method: paymentMethod,
        account: (paymentMethod !== 'Cash') ? (paymentAccount as any) : undefined
      }

      await updateOrder(orderId, {
        advanceReceived: newAdvance,
        payments: [...(showPaymentDialog.payments || []), newPayment],
        balanceAmount: Math.max(0, newBalance),
      })
      setShowPaymentDialog(null)
      setPaymentAmount(0)
      setPaymentMethod('Cash')
      setPaymentAccount('')
    } catch (error) {
      console.error("Failed to record payment:", error)
    } finally {
      setSaving(false)
    }
  }

  // Filter orders by tab and search
  const filteredOrders = orders.filter((o) => {
    // Tab filter
    const matchesTab = activeTab === "all" || o.status === activeTab

    // Search filter
    if (!searchQuery.trim()) return matchesTab

    const query = searchQuery.toLowerCase()
    const client = clients.find(c => (c.id || c._id) === o.clientId)
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(query) ||
      (client?.name?.toLowerCase().includes(query) ?? false) ||
      (client?.mobile?.includes(query) ?? false) ||
      o.designType.toLowerCase().includes(query)

    return matchesTab && matchesSearch
  })

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "Pending":
        return "bg-amber-100 text-amber-800"
      case "In Progress":
        return "bg-blue-100 text-blue-800"
      case "Completed":
        return "bg-green-100 text-green-800"
      case "Billed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Orders</h2>
          <p className="text-sm text-muted-foreground">Manage your CNC jobs and orders</p>
        </div>
        <Dialog open={showAddOrder} onOpenChange={setShowAddOrder}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              New Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle>Create New Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Order Number</Label>
                  <Input value={newOrder.orderNumber} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Order Date</Label>
                  <Input
                    type="date"
                    value={newOrder.date}
                    onChange={(e) => setNewOrder({ ...newOrder, date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client</Label>
                  <Select value={newOrder.clientId} onValueChange={(v) => setNewOrder({ ...newOrder, clientId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => {
                        const clientId = c.id || c._id;
                        if (!clientId) return null;
                        return (
                          <SelectItem key={clientId} value={clientId}>
                            {c.name}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Design Type</Label>
                  <Select
                    value={newOrder.designType}
                    onValueChange={(v) => setNewOrder({ ...newOrder, designType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select design" />
                    </SelectTrigger>
                    <SelectContent>
                      {designTypes.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Materials Used</Label>
                <div className="flex gap-2">
                  <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials.map((m) => {
                        const materialId = m.id || m._id;
                        if (!materialId) return null;
                        return (
                          <SelectItem key={materialId} value={materialId}>
                            {m.type} - {m.size} ({m.thickness}mm) - Stock: {m.currentStock}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    className="w-20"
                    value={materialQty}
                    onChange={(e) => setMaterialQty(Number(e.target.value))}
                    min={1}
                  />
                  <Button onClick={addMaterialToOrder} disabled={!selectedMaterial}>
                    Add
                  </Button>
                </div>
                {selectedMaterial && (
                  <div className="flex items-center gap-4 p-2 bg-primary/5 rounded-lg border border-primary/10">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="customSize"
                        checked={useCustomSize}
                        onChange={(e) => setUseCustomSize(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Label htmlFor="customSize" className="text-xs font-medium cursor-pointer">
                        Custom Size (Width x Height)
                      </Label>
                    </div>
                    {useCustomSize && (
                      <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                        <Input
                          type="number"
                          placeholder="W"
                          className="w-16 h-8 text-xs"
                          value={materialWidth || ""}
                          onChange={(e) => setMaterialWidth(Number(e.target.value))}
                        />
                        <span className="text-xs text-muted-foreground">x</span>
                        <Input
                          type="number"
                          placeholder="H"
                          className="w-16 h-8 text-xs"
                          value={materialHeight || ""}
                          onChange={(e) => setMaterialHeight(Number(e.target.value))}
                        />
                      </div>
                    )}
                  </div>
                )}
                {newOrder.materials && newOrder.materials.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {newOrder.materials.map((m) => {
                      const material = materials.find((mat) => (mat.id || mat._id) === m.materialId)
                      return (
                        <div key={m.materialId} className="flex justify-between items-center p-2 bg-muted rounded">
                          <span>
                            {material ? (
                              <>
                                {material.type} - {material.size} ({material.thickness}mm)
                                {m.width && m.height && (
                                  <span className="ml-1 text-primary font-medium">
                                    [{m.width}x{m.height}]
                                  </span>
                                )}
                                <span className="ml-1 text-muted-foreground">x {m.quantity.toFixed(2)} sheets</span>
                              </>
                            ) : "Unknown"}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">₹{m.cost.toLocaleString("en-IN")}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => removeMaterialFromOrder(m.materialId)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Labour Cost (₹)</Label>
                  <Input
                    type="number"
                    value={newOrder.labourCost}
                    onChange={(e) => updateLabourCost(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Delivery Date</Label>
                  <Input
                    type="date"
                    value={newOrder.deliveryDate}
                    onChange={(e) => setNewOrder({ ...newOrder, deliveryDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Material Cost:</span>
                  <span>₹{(newOrder.materials?.reduce((sum, m) => sum + m.cost, 0) || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Labour Cost:</span>
                  <span>₹{(newOrder.labourCost || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total Value:</span>
                  <span>₹{(newOrder.totalValue || 0).toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Advance Received (₹)</Label>
                  <Input
                    type="number"
                    value={newOrder.advanceReceived}
                    onChange={(e) => updateAdvance(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Balance Amount</Label>
                  <Input
                    value={`₹${(newOrder.balanceAmount || 0).toLocaleString("en-IN")}`}
                    disabled
                    className="bg-muted font-bold"
                  />
                </div>
              </div>

              {(newOrder.advanceReceived || 0) > 0 && (
                <div className="grid grid-cols-2 gap-4 p-3 bg-primary/5 rounded-lg border border-primary/10 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="UPI">UPI</SelectItem>
                        <SelectItem value="Bank">Bank Transfer</SelectItem>
                        <SelectItem value="Card">Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {paymentMethod !== 'Cash' && (
                    <div className="space-y-2">
                      <Label className="text-xs">Received By</Label>
                      <Select value={paymentAccount} onValueChange={(v: any) => setPaymentAccount(v)}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select Account" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Kamal Jangid">Kamal Jangid</SelectItem>
                          <SelectItem value="Hiralal Jangid">Hiralal Jangid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              <Button onClick={handleAddOrder} className="w-full" disabled={!newOrder.clientId || !newOrder.designType || saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Order
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Box */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by order number, client name, or design type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => setSearchQuery("")}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({orders.length})</TabsTrigger>
          <TabsTrigger value="Pending">Pending ({orders.filter((o) => o.status === "Pending").length})</TabsTrigger>
          <TabsTrigger value="In Progress">
            In Progress ({orders.filter((o) => o.status === "In Progress").length})
          </TabsTrigger>
          <TabsTrigger value="Completed">
            Completed ({orders.filter((o) => o.status === "Completed").length})
          </TabsTrigger>
          <TabsTrigger value="Billed">Billed ({orders.filter((o) => o.status === "Billed").length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No orders found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order) => {
            const orderId = order.id || order._id || ""
            const client = clients.find((c) => (c.id || c._id) === order.clientId)
            return (
              <Card key={orderId} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col p-4 gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-bold text-base md:text-lg truncate">{order.orderNumber}</h3>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                          <span className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-bold uppercase">{order.designType || "Job"}</span>
                          <span>{order.date ? new Date(order.date).toLocaleDateString("en-IN") : "No date"}</span>
                        </div>
                        <p className="text-sm font-medium text-foreground">{client?.name || "Unknown Client"}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {order.designType} • {new Date(order.date).toLocaleDateString("en-IN")}
                        </p>
                        {order.materials.length > 0 && (
                          <div className="mt-2 text-[10px] md:text-xs text-muted-foreground bg-muted/50 p-2 rounded border border-border/30">
                            <span className="font-bold uppercase tracking-wider block mb-1">Materials Used:</span>
                            <div className="flex flex-wrap gap-1">
                              {order.materials.map((m, idx) => {
                                const mat = materials.find((mat) => (mat.id || mat._id) === m.materialId)
                                return (
                                  <span key={idx} className="bg-background px-1.5 py-0.5 rounded border border-border/50">
                                    {mat?.type || "Mat"} {m.width && m.height ? `[${m.width}x${m.height}]` : ""} x{m.quantity.toFixed(1)}
                                  </span>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4 p-3 bg-muted/30 rounded-xl sm:bg-transparent sm:p-0">
                        <div className="text-left sm:text-right">
                          <p className="text-sm font-medium">₹{(order.totalValue || 0).toLocaleString("en-IN")}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 font-bold uppercase tracking-wider">{order.status}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-amber-600">
                            Due: ₹{(order.balanceAmount || 0).toLocaleString("en-IN")}
                          </p>
                          <p className="text-[10px] text-muted-foreground">Adv: ₹{(order.advanceReceived || 0).toLocaleString("en-IN")}</p>
                        </div>
                      </div>
                    </div>

                    {order.payments && order.payments.length > 0 && (
                      <div className="px-4 py-2 bg-primary/5 border-y border-primary/10">
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          {order.payments.map((p, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-[10px]">
                              <span className="text-muted-foreground">{new Date(p.date).toLocaleDateString("en-IN")}:</span>
                              <span className="font-bold">₹{p.amount.toLocaleString("en-IN")}</span>
                              <span className="px-1.5 py-0.5 bg-background border border-border rounded uppercase font-bold text-[9px]">
                                {p.method}
                                {p.account && (
                                  <span className="ml-1 text-primary">({p.account.split(' ')[0]})</span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-3">
                      <div className="flex-1 sm:flex-none">
                        <Select
                          value={order.status}
                          onValueChange={(v) => handleUpdateOrderStatus(orderId, v as Order["status"])}
                        >
                          <SelectTrigger className="h-9 w-full sm:w-40 font-medium">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {orderStatuses.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 sm:flex-none h-9 px-4 gap-2"
                          onClick={() => setShowJobCard(order)}
                        >
                          <FileText className="w-4 h-4" />
                          Job Card
                        </Button>
                        {order.balanceAmount > 0 && (
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1 sm:flex-none h-9 px-4 gap-2 bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              setShowPaymentDialog(order)
                              setPaymentAmount(order.balanceAmount)
                            }}
                          >
                            <IndianRupee className="w-4 h-4" />
                            Record Payment
                          </Button>
                        )}
                        <Button variant="outline" size="icon" className="h-9 w-9 text-destructive" onClick={() => handleDeleteOrder(orderId)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
      {/* Job Card Dialog */}
      <Dialog open={!!showJobCard} onOpenChange={(o) => !o && setShowJobCard(null)}>
        <DialogContent className="max-w-2xl w-[95vw] rounded-2xl printing-area">
          <DialogHeader className="print:hidden">
            <DialogTitle>Order Job Card</DialogTitle>
          </DialogHeader>

          {showJobCard && (
            <div className="space-y-6 pt-4">
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h2 className="text-3xl font-black tracking-tight">{showJobCard.orderNumber}</h2>
                  <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs mt-1">CNC Workshop Job Card</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{new Date(showJobCard.date).toLocaleDateString("en-IN")}</p>
                  <p className="text-xs text-muted-foreground">Generated on {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Client Details</h4>
                  <p className="font-bold text-lg">{clients.find(c => (c.id || c._id) === showJobCard.clientId)?.name || "N/A"}</p>
                  <p className="text-sm text-muted-foreground">{clients.find(c => (c.id || c._id) === showJobCard.clientId)?.mobile}</p>
                </div>
                <div className="text-right">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Target Delivery</h4>
                  <p className="font-bold text-lg text-primary">{showJobCard.deliveryDate ? new Date(showJobCard.deliveryDate).toLocaleDateString("en-IN") : "TBD"}</p>
                </div>
              </div>

              <div className="p-6 bg-primary/5 rounded-2xl border-2 border-primary/10">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Job Description / Design Type</h4>
                <p className="text-4xl font-black text-primary">{showJobCard.designType}</p>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Material Cutting List</h4>
                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted text-[10px] uppercase font-bold text-muted-foreground">
                      <tr>
                        <th className="text-left p-3">Material Type</th>
                        <th className="text-center p-3">Size/Thick</th>
                        <th className="text-right p-3">Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {showJobCard?.materials?.map((m, idx) => {
                        const mat = materials.find((mt) => (mt.id || mt._id) === m.materialId)
                        return (
                          <tr key={idx}>
                            <td className="p-3 font-bold">{mat?.type}</td>
                            <td className="p-3 text-center">
                              {m.width && m.height ? (
                                <span className="font-bold text-primary">{m.width} x {m.height}</span>
                              ) : mat?.size}
                              <span className="text-muted-foreground ml-1">@ {mat?.thickness}mm</span>
                            </td>
                            <td className="p-3 text-right">
                              <span className="font-black text-lg">{m.quantity.toFixed(2)}</span>
                              <span className="text-xs text-muted-foreground ml-1">Sheets</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {showJobCard?.payments && showJobCard.payments.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Payment History</h4>
                  <div className="border border-border rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted text-[10px] uppercase font-bold text-muted-foreground">
                        <tr>
                          <th className="text-left p-3">Date</th>
                          <th className="text-left p-3">Method</th>
                          <th className="text-right p-3">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {showJobCard?.payments?.map((p, idx) => (
                          <tr key={idx}>
                            <td className="p-3">{new Date(p.date).toLocaleDateString("en-IN")}</td>
                            <td className="p-3">
                              {p.method}
                              {p.account && (
                                <span className="ml-2 px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase">
                                  {p.account}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right font-bold">₹{p.amount.toLocaleString("en-IN")}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-muted/50">
                        <tr>
                          <td colSpan={2} className="p-3 text-right font-bold">Total Received</td>
                          <td className="p-3 text-right font-black text-green-600">₹{(showJobCard?.advanceReceived || 0).toLocaleString("en-IN")}</td>
                        </tr>
                        {(showJobCard?.balanceAmount || 0) > 0 && (
                          <tr>
                            <td colSpan={2} className="p-3 text-right font-bold">Pending Balance</td>
                            <td className="p-3 text-right font-black text-amber-600">₹{(showJobCard?.balanceAmount || 0).toLocaleString("en-IN")}</td>
                          </tr>
                        )}
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="h-24 border-2 border-dashed border-border rounded-xl p-3">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Workshop Notes</p>
                </div>
                <div className="h-24 border-2 border-dashed border-border rounded-xl p-3 flex flex-col justify-end">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground text-center border-t pt-2">Operator Signature</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 print:hidden pt-4">
                <Button variant="outline" onClick={() => setShowJobCard(null)}>Cancel</Button>
                <Button onClick={handlePrint} className="gap-2">
                  <Printer className="w-4 h-4" />
                  Print Job Card
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={!!showPaymentDialog} onOpenChange={(o) => !o && setShowPaymentDialog(null)}>
        <DialogContent className="max-w-md w-[95vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>

          {showPaymentDialog && (
            <div className="space-y-4 pt-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Order Number:</span>
                  <span className="font-bold">{showPaymentDialog?.orderNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Client:</span>
                  <span className="font-medium">{clients.find(c => (c.id || c._id) === showPaymentDialog.clientId)?.name || "Unknown"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Value:</span>
                  <span>₹{(showPaymentDialog?.totalValue || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Already Paid:</span>
                  <span className="text-green-600">₹{(showPaymentDialog?.advanceReceived || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t pt-2">
                  <span>Pending Balance:</span>
                  <span className="text-amber-600">₹{(showPaymentDialog?.balanceAmount || 0).toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payment Amount (₹)</Label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Math.min(Number(e.target.value), showPaymentDialog?.balanceAmount || 0))}
                  max={showPaymentDialog?.balanceAmount}
                  min={0}
                  className="text-lg font-bold"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPaymentAmount(Math.round((showPaymentDialog?.balanceAmount || 0) * 0.5))}
                  >
                    50%
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPaymentAmount(showPaymentDialog?.balanceAmount || 0)}
                  >
                    Full Amount
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Bank">Bank Transfer</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {paymentMethod !== 'Cash' && (
                  <div className="space-y-2">
                    <Label>Received By</Label>
                    <Select value={paymentAccount} onValueChange={(v: any) => setPaymentAccount(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Account" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Kamal Jangid">Kamal Jangid</SelectItem>
                        <SelectItem value="Hiralal Jangid">Hiralal Jangid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>New Balance After Payment:</span>
                  <span className="font-bold text-green-700">
                    ₹{Math.max(0, (showPaymentDialog.balanceAmount || 0) - paymentAmount).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowPaymentDialog(null)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handleRecordPayment}
                  disabled={paymentAmount <= 0 || saving}
                >
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Confirm Payment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printing-area, .printing-area * {
            visibility: visible;
          }
          .printing-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            margin: 0;
            box-shadow: none;
            border: none;
          }
        }
      `}</style>
    </div >
  )
}
