"use client"

import { useState } from "react"
import { useCNC, type Material, type Purchase, type Wastage, type StockAdjustment } from "@/lib/contexts/cnc-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Package, ShoppingCart, Trash2, Loader2, ClipboardCheck, History } from "lucide-react"
import { cn } from "@/lib/utils"

const materialTypes = ["Acrylic", "WPC", "MDF", "HDMR", "Plywood", "Wood"] as const
const sheetSizes = ["8x4", "9x4", "6x4", "Custom"]

export function CNCInventory() {
  const { materials, purchases, wastages, adjustments, loading, addMaterial, addPurchase, addWastage, deleteMaterial, reconcileStock } = useCNC()
  const [showAddMaterial, setShowAddMaterial] = useState(false)
  const [showAddPurchase, setShowAddPurchase] = useState(false)
  const [showAddWastage, setShowAddWastage] = useState(false)
  const [showReconcile, setShowReconcile] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [auditData, setAuditData] = useState({
    newStock: 0,
    reason: "Manual Stock Audit",
    date: new Date().toISOString().split("T")[0],
  })

  const [newMaterial, setNewMaterial] = useState<Partial<Material>>({
    type: "Acrylic",
    size: "8x4",
    thickness: 18,
    openingStock: 0,
    currentStock: 0,
    lowStockAlert: 5,
    rate: 0,
  })

  const [newPurchase, setNewPurchase] = useState<Partial<Purchase>>({
    materialId: "",
    date: new Date().toISOString().split("T")[0],
    supplier: "",
    quantity: 0,
    rate: 0,
  })

  const [newWastage, setNewWastage] = useState<Partial<Wastage>>({
    materialId: "",
    date: new Date().toISOString().split("T")[0],
    quantity: 0,
    reason: "",
  })

  const handleAddMaterial = async () => {
    setSaving(true)
    try {
      await addMaterial({
        type: newMaterial.type as Material["type"],
        size: newMaterial.size || "8x4",
        thickness: newMaterial.thickness || 18,
        openingStock: newMaterial.openingStock || 0,
        currentStock: newMaterial.openingStock || 0,
        lowStockAlert: newMaterial.lowStockAlert || 5,
        rate: newMaterial.rate || 0,
      })
      setShowAddMaterial(false)
      setNewMaterial({
        type: "Acrylic",
        size: "8x4",
        thickness: 18,
        openingStock: 0,
        currentStock: 0,
        lowStockAlert: 5,
        rate: 0,
      })
    } catch (error) {
      console.error("Failed to add material:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleAddPurchase = async () => {
    setSaving(true)
    try {
      await addPurchase({
        materialId: newPurchase.materialId || "",
        date: newPurchase.date || "",
        supplier: newPurchase.supplier || "",
        quantity: newPurchase.quantity || 0,
        rate: newPurchase.rate || 0,
        total: (newPurchase.quantity || 0) * (newPurchase.rate || 0),
      })
      setShowAddPurchase(false)
      setNewPurchase({
        materialId: "",
        date: new Date().toISOString().split("T")[0],
        supplier: "",
        quantity: 0,
        rate: 0,
      })
    } catch (error) {
      console.error("Failed to add purchase:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleAddWastage = async () => {
    setSaving(true)
    try {
      await addWastage({
        materialId: newWastage.materialId || "",
        date: newWastage.date || "",
        quantity: newWastage.quantity || 0,
        reason: newWastage.reason || "",
      })
      setShowAddWastage(false)
      setNewWastage({
        materialId: "",
        date: new Date().toISOString().split("T")[0],
        quantity: 0,
        reason: "",
      })
    } catch (error) {
      console.error("Failed to add wastage:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleReconcile = async () => {
    if (!showReconcile) return
    setSaving(true)
    try {
      await reconcileStock({
        materialId: showReconcile,
        newStock: auditData.newStock,
        reason: auditData.reason,
        date: auditData.date,
      })
      setShowReconcile(null)
      setAuditData({
        newStock: 0,
        reason: "Manual Stock Audit",
        date: new Date().toISOString().split("T")[0],
      })
    } catch (error) {
      console.error("Failed to reconcile stock:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMaterial = async (id: string) => {
    try {
      await deleteMaterial(id)
    } catch (error) {
      console.error("Failed to delete material:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header - matching dashboard style */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Inventory</h2>
          <span className="text-sm text-muted-foreground">
            {materials.length} materials tracked
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showAddMaterial} onOpenChange={setShowAddMaterial}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-xs">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Material
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg w-[95vw] rounded-2xl">
              <DialogHeader>
                <DialogTitle>Add New Material</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Material Type</Label>
                    <Select
                      value={newMaterial.type}
                      onValueChange={(v) => setNewMaterial({ ...newMaterial, type: v as Material["type"] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {materialTypes.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Sheet Size</Label>
                    <Select value={newMaterial.size} onValueChange={(v) => setNewMaterial({ ...newMaterial, size: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sheetSizes.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Thickness (mm)</Label>
                    <Input
                      type="number"
                      value={newMaterial.thickness}
                      onChange={(e) => setNewMaterial({ ...newMaterial, thickness: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Opening Stock</Label>
                    <Input
                      type="number"
                      value={newMaterial.openingStock}
                      onChange={(e) =>
                        setNewMaterial({
                          ...newMaterial,
                          openingStock: Number(e.target.value),
                          currentStock: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Rate per Sheet (₹)</Label>
                    <Input
                      type="number"
                      value={newMaterial.rate}
                      onChange={(e) => setNewMaterial({ ...newMaterial, rate: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Low Stock Alert</Label>
                    <Input
                      type="number"
                      value={newMaterial.lowStockAlert}
                      onChange={(e) => setNewMaterial({ ...newMaterial, lowStockAlert: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <Button onClick={handleAddMaterial} className="w-full" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Material
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showAddPurchase} onOpenChange={setShowAddPurchase}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                Purchase
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg w-[95vw] rounded-2xl">
              <DialogHeader>
                <DialogTitle>Record Purchase</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Material</Label>
                  <Select
                    value={newPurchase.materialId}
                    onValueChange={(v) => setNewPurchase({ ...newPurchase, materialId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials.map((m) => {
                        if (!m.id) return null;
                        return (
                          <SelectItem key={m.id} value={m.id}>
                            {m.type} - {m.size} ({m.thickness}mm)
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={newPurchase.date}
                      onChange={(e) => setNewPurchase({ ...newPurchase, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Supplier</Label>
                    <Input
                      value={newPurchase.supplier}
                      onChange={(e) => setNewPurchase({ ...newPurchase, supplier: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quantity (sheets)</Label>
                    <Input
                      type="number"
                      value={newPurchase.quantity}
                      onChange={(e) => setNewPurchase({ ...newPurchase, quantity: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rate per Sheet (₹)</Label>
                    <Input
                      type="number"
                      value={newPurchase.rate}
                      onChange={(e) => setNewPurchase({ ...newPurchase, rate: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Total:{" "}
                    <span className="font-bold text-foreground">
                      ₹{((newPurchase.quantity || 0) * (newPurchase.rate || 0)).toLocaleString("en-IN")}
                    </span>
                  </p>
                </div>
                <Button onClick={handleAddPurchase} className="w-full" disabled={!newPurchase.materialId || saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Record Purchase
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showAddWastage} onOpenChange={setShowAddWastage}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Wastage
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg w-[95vw] rounded-2xl">
              <DialogHeader>
                <DialogTitle>Record Wastage</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Material</Label>
                  <Select
                    value={newWastage.materialId}
                    onValueChange={(v) => setNewWastage({ ...newWastage, materialId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials.map((m) => {
                        if (!m.id) return null;
                        return (
                          <SelectItem key={m.id} value={m.id}>
                            {m.type} - {m.size} ({m.thickness}mm) - Stock: {m.currentStock}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={newWastage.date}
                      onChange={(e) => setNewWastage({ ...newWastage, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity (sheets)</Label>
                    <Input
                      type="number"
                      value={newWastage.quantity}
                      onChange={(e) => setNewWastage({ ...newWastage, quantity: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Input
                    value={newWastage.reason}
                    onChange={(e) => setNewWastage({ ...newWastage, reason: e.target.value })}
                    placeholder="Damaged, defective, cutting error..."
                  />
                </div>
                <Button onClick={handleAddWastage} className="w-full" disabled={!newWastage.materialId || saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Record Wastage
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Inventory Tabs */}
      <Tabs defaultValue="stock">
        <TabsList className="h-9 p-1 overflow-x-auto">
          <TabsTrigger value="stock" className="text-xs px-3 h-7">Stock</TabsTrigger>
          <TabsTrigger value="purchases" className="text-xs px-3 h-7">Purchases</TabsTrigger>
          <TabsTrigger value="wastage" className="text-xs px-3 h-7">Wastage</TabsTrigger>
          <TabsTrigger value="adjustments" className="text-xs px-3 h-7">Audits</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="mt-4 space-y-3">
          {materials.length === 0 ? (
            <Card className="border shadow-sm">
              <CardContent className="py-10 text-center">
                <Package className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No materials added yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {materials.map((m) => (
                <Card key={m.id} className={cn(
                  "border shadow-sm hover:shadow-md transition-all",
                  m.currentStock <= m.lowStockAlert && "border-amber-300 bg-amber-50/30 dark:bg-amber-950/10"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4 text-primary" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-semibold text-foreground">{m.type}</h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide bg-muted text-muted-foreground">
                            {m.size} • {m.thickness}mm
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">₹{m.rate.toLocaleString("en-IN")}/sheet</p>
                      </div>

                      {/* Stock & Actions */}
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-lg font-bold text-foreground">{m.currentStock}</p>
                          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">sheets</p>
                        </div>
                        {m.currentStock <= m.lowStockAlert && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 text-[10px] font-medium uppercase rounded-full">Low</span>
                        )}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary hover:bg-primary/10"
                            onClick={() => {
                              setShowReconcile(m.id || null)
                              setAuditData({ ...auditData, newStock: m.currentStock })
                            }}
                          >
                            <ClipboardCheck className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteMaterial(m.id || "")}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Dialog open={!!showReconcile} onOpenChange={(o) => !o && setShowReconcile(null)}>
                <DialogContent className="max-w-md w-[95vw] rounded-2xl">
                  <DialogHeader>
                    <DialogTitle>Stock Audit / Reconciliation</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <p className="text-sm text-muted-foreground">
                      Enter the actual count of sheets currently available in your shop.
                      This will correct the system record and create an audit trail.
                    </p>
                    <div className="space-y-2">
                      <Label>Actual Physical Stock (sheets)</Label>
                      <Input
                        type="number"
                        value={auditData.newStock}
                        onChange={(e) => setAuditData({ ...auditData, newStock: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Audit Date</Label>
                      <Input
                        type="date"
                        value={auditData.date}
                        onChange={(e) => setAuditData({ ...auditData, date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Note / Reason</Label>
                      <Input
                        value={auditData.reason}
                        onChange={(e) => setAuditData({ ...auditData, reason: e.target.value })}
                        placeholder="e.g., Monthly inventory check"
                      />
                    </div>
                    <Button onClick={handleReconcile} className="w-full" disabled={saving}>
                      {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Update Stock Record
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </TabsContent>

        <TabsContent value="purchases" className="mt-4 space-y-3">
          {purchases.length === 0 ? (
            <Card className="border shadow-sm">
              <CardContent className="py-10 text-center">
                <ShoppingCart className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No purchases recorded yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {purchases.map((p) => {
                const material = materials.find((m) => m.id === p.materialId)
                return (
                  <Card key={p.id} className="border shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-950/30 rounded-full flex items-center justify-center shrink-0">
                          <ShoppingCart className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-semibold text-foreground">
                              {material ? `${material.type} - ${material.size}` : "Unknown"}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide bg-muted text-muted-foreground">
                              {p.quantity} sheets
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{p.date ? new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "No date"}</span>
                            {p.supplier && <span>{p.supplier}</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">₹{p.total.toLocaleString("en-IN")}</p>
                          <p className="text-xs text-muted-foreground">@₹{p.rate}/sheet</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="wastage" className="mt-4 space-y-3">
          {wastages.length === 0 ? (
            <Card className="border shadow-sm">
              <CardContent className="py-10 text-center">
                <Trash2 className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No wastage recorded yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {wastages.map((w) => {
                const material = materials.find((m) => m.id === w.materialId)
                return (
                  <Card key={w.id} className="border shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-950/30 rounded-full flex items-center justify-center shrink-0">
                          <Trash2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-semibold text-foreground">
                              {material ? `${material.type} - ${material.size}` : "Unknown"}
                            </h3>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{new Date(w.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                            <span className="text-amber-600">{w.reason}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-amber-600">-{w.quantity}</p>
                          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">sheets</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="adjustments" className="mt-4 space-y-3">
          {adjustments.length === 0 ? (
            <Card className="border shadow-sm">
              <CardContent className="py-10 text-center">
                <History className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No audit adjustments yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {adjustments.map((a) => {
                const material = materials.find((m) => m.id === a.materialId)
                return (
                  <Card key={a.id} className="border shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                          a.adjustment > 0 ? "bg-green-100 dark:bg-green-950/30" : "bg-amber-100 dark:bg-amber-950/30"
                        )}>
                          <History className={cn("w-4 h-4", a.adjustment > 0 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400")} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-semibold text-foreground">
                              {material ? `${material.type} - ${material.size}` : "Unknown"}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide bg-muted text-muted-foreground">
                              Audit
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{new Date(a.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                            <span>{a.reason}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn("text-lg font-bold", a.adjustment > 0 ? "text-green-600" : "text-amber-600")}>
                            {a.adjustment > 0 ? "+" : ""}{a.adjustment}
                          </p>
                          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">sheets</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
