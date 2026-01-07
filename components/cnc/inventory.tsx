"use client"

import { useState } from "react"
import { useCNC, type Material, type Purchase, type Wastage } from "@/lib/contexts/cnc-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Package, ShoppingCart, Trash2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const materialTypes = ["Acrylic", "WPC", "MDF", "HDMR", "Plywood", "Wood"] as const
const sheetSizes = ["8x4", "9x4", "6x4", "Custom"]

export function CNCInventory() {
  const { materials, purchases, wastages, loading, addMaterial, addPurchase, addWastage, deleteMaterial } = useCNC()
  const [showAddMaterial, setShowAddMaterial] = useState(false)
  const [showAddPurchase, setShowAddPurchase] = useState(false)
  const [showAddWastage, setShowAddWastage] = useState(false)
  const [saving, setSaving] = useState(false)

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

  const handleDeleteMaterial = async (id: string) => {
    try {
      await deleteMaterial(id)
    } catch (error) {
      console.error("Failed to delete material:", error)
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
          <h2 className="text-2xl font-bold text-foreground">Inventory</h2>
          <p className="text-sm text-muted-foreground">Manage your sheets and materials</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Dialog open={showAddMaterial} onOpenChange={setShowAddMaterial}>
            <DialogTrigger asChild>
              <Button className="flex-1 sm:flex-none">
                <Plus className="w-4 h-4 mr-2" />
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
              <Button variant="outline" className="flex-1 sm:flex-none">
                <ShoppingCart className="w-4 h-4 mr-2" />
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
              <Button variant="outline" className="flex-1 sm:flex-none">
                <Trash2 className="w-4 h-4 mr-2" />
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

      <Tabs defaultValue="stock">
        <TabsList>
          <TabsTrigger value="stock">Current Stock</TabsTrigger>
          <TabsTrigger value="purchases">Purchase History</TabsTrigger>
          <TabsTrigger value="wastage">Wastage Log</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="mt-4">
          {materials.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No materials added yet.</p>
                <p className="text-sm text-muted-foreground">Click "Add Material" to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {materials.map((m) => (
                <Card key={m.id} className={cn("overflow-hidden", m.currentStock <= m.lowStockAlert ? "border-amber-300 bg-amber-50/10" : "")}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-base md:text-lg truncate">
                            {m.type} - {m.size}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs md:text-sm text-muted-foreground">
                            <span>{m.thickness}mm</span>
                            <span className="hidden md:inline">•</span>
                            <span>₹{m.rate.toLocaleString("en-IN")}/sheet</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/50">
                        <div className="text-left sm:text-right">
                          <p className="text-xl md:text-2xl font-black leading-none">{m.currentStock}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-1">Sheets Left</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {m.currentStock <= m.lowStockAlert && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded uppercase tracking-wider">Low</span>
                          )}
                          <Button variant="outline" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteMaterial(m.id || "")}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="purchases" className="mt-4">
          {purchases.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No purchases recorded yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {purchases.map((p) => {
                const material = materials.find((m) => m.id === p.materialId)
                return (
                  <Card key={p.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{p.date ? new Date(p.date).toLocaleDateString("en-IN") : "No date"}</p>
                          <h3 className="font-bold text-base mt-0.5">{material ? `${material.type} - ${material.size}` : "Unknown"}</h3>
                          <p className="text-xs text-muted-foreground">{p.supplier}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-black">₹{p.total.toLocaleString("en-IN")}</p>
                          <p className="text-[10px] text-muted-foreground font-bold mt-0.5">{p.quantity} sheets @ ₹{p.rate}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="wastage" className="mt-4">
          {wastages.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Trash2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No wastage recorded yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {wastages.map((w) => {
                const material = materials.find((m) => m.id === w.materialId)
                return (
                  <Card key={w.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{new Date(w.date).toLocaleDateString("en-IN")}</p>
                          <h3 className="font-bold text-base mt-0.5">{material ? `${material.type} - ${material.size}` : "Unknown"}</h3>
                          <p className="text-xs text-amber-700 font-medium mt-1 italic">Reason: {w.reason}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-black text-amber-600">{w.quantity} sheets</p>
                          <p className="text-[10px] text-muted-foreground font-bold mt-0.5 uppercase tracking-wider">Wastage</p>
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
