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
import { Plus, ClipboardList, Trash2, X, Loader2 } from "lucide-react"

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

  const generateOrderNumber = () => {
    const date = new Date()
    const prefix = `ORD${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`
    const count = orders.filter((o) => o.orderNumber.startsWith(prefix)).length + 1
    return `${prefix}-${String(count).padStart(3, "0")}`
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

    const existingIdx = newOrder.materials?.findIndex((m) => m.materialId === selectedMaterial)
    const updatedMaterials = [...(newOrder.materials || [])]

    if (existingIdx !== undefined && existingIdx >= 0) {
      updatedMaterials[existingIdx].quantity += materialQty
      updatedMaterials[existingIdx].cost = updatedMaterials[existingIdx].quantity * material.rate
    } else {
      updatedMaterials.push({
        materialId: selectedMaterial,
        quantity: materialQty,
        cost: materialQty * material.rate,
      })
    }

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

  const filteredOrders = activeTab === "all" ? orders : orders.filter((o) => o.status === activeTab)

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
                {newOrder.materials && newOrder.materials.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {newOrder.materials.map((m) => {
                      const material = materials.find((mat) => (mat.id || mat._id) === m.materialId)
                      return (
                        <div key={m.materialId} className="flex justify-between items-center p-2 bg-muted rounded">
                          <span>
                            {material ? `${material.type} - ${material.size} (${material.thickness}mm) x ${m.quantity}` : "Unknown"}
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

              <Button onClick={handleAddOrder} className="w-full" disabled={!newOrder.clientId || !newOrder.designType || saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Order
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
                                    {mat?.type || "Mat"} x{m.quantity}
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
                          <p className="text-[10px] text-muted-foreground">Adv: ₹{((order.totalValue || 0) - (order.balanceAmount || 0)).toLocaleString("en-IN")}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-3 border-t border-border/50">
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
                        <Button variant="outline" size="sm" className="flex-1 sm:flex-none h-9 px-4">
                          Job Card
                        </Button>
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
    </div>
  )
}
