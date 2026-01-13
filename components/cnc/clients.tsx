"use client"

import { useState } from "react"
import { useCNC, type Client } from "@/lib/contexts/cnc-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Users, Search, Phone, MapPin, Trash2, Edit2, Loader2, AlertCircle } from "lucide-react"

const clientTypes = ["Architect", "Contractor", "Shop", "Individual", "Other"] as const

export function CNCClients() {
  const { clients, orders, loading, addClient, updateClient, deleteClient } = useCNC()
  const [showAddClient, setShowAddClient] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [saving, setSaving] = useState(false)

  const [newClient, setNewClient] = useState<Partial<Client>>({
    name: "",
    mobile: "",
    address: "",
    gst: "",
    type: "Individual",
    outstandingBalance: 0,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateClient = () => {
    const newErrors: Record<string, string> = {}
    if (!newClient.name?.trim()) newErrors.name = "Name is required"
    if (!newClient.mobile?.trim()) {
      newErrors.mobile = "Mobile number is required"
    } else if (!/^\d{10}$/.test(newClient.mobile.trim())) {
      newErrors.mobile = "Must be exactly 10 digits"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddClient = async () => {
    if (!validateClient()) return
    setSaving(true)
    try {
      await addClient({
        name: newClient.name || "",
        mobile: newClient.mobile || "",
        address: newClient.address || "",
        gst: newClient.gst || "",
        type: newClient.type as Client["type"],
        outstandingBalance: newClient.outstandingBalance || 0,
      })
      setShowAddClient(false)
      setNewClient({
        name: "",
        mobile: "",
        address: "",
        gst: "",
        type: "Individual",
        outstandingBalance: 0,
      })
      setErrors({})
    } catch (error) {
      console.error("Failed to add client:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateClient = async () => {
    if (!editingClient) return
    setSaving(true)
    try {
      await updateClient(editingClient.id || editingClient._id || "", editingClient)
      setEditingClient(null)
    } catch (error) {
      console.error("Failed to update client:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClient = async (id: string) => {
    try {
      await deleteClient(id)
    } catch (error) {
      console.error("Failed to delete client:", error)
    }
  }

  const getClientOrders = (clientId: string) => {
    return orders.filter((o) => o.clientId === clientId)
  }

  const getClientTotal = (clientId: string) => {
    return getClientOrders(clientId).reduce((sum, o) => sum + o.totalValue, 0)
  }

  const filteredClients = clients.filter(
    (c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.mobile.includes(searchQuery),
  )

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
          <h2 className="text-xl font-semibold text-foreground">Clients</h2>
          <span className="text-sm text-muted-foreground">
            {clients.length} {clients.length === 1 ? 'client' : 'clients'} registered
          </span>
        </div>
        <Dialog open={showAddClient} onOpenChange={setShowAddClient}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 text-xs">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg w-[95vw] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); handleAddClient(); }} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className={errors.name ? "text-destructive" : ""}>Client Name</Label>
                <Input
                  value={newClient.name}
                  onChange={(e) => {
                    setNewClient({ ...newClient, name: e.target.value })
                    if (errors.name) setErrors({ ...errors, name: "" })
                  }}
                  placeholder="Enter client name"
                  autoFocus
                  className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-xs font-medium text-destructive flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.name}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={errors.mobile ? "text-destructive" : ""}>Mobile Number</Label>
                  <Input
                    value={newClient.mobile}
                    onChange={(e) => {
                      setNewClient({ ...newClient, mobile: e.target.value })
                      if (errors.mobile) setErrors({ ...errors, mobile: "" })
                    }}
                    placeholder="9876543210"
                    className={errors.mobile ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {errors.mobile && (
                    <p className="text-xs font-medium text-destructive flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.mobile}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Client Type</Label>
                  <Select
                    value={newClient.type}
                    onValueChange={(v) => setNewClient({ ...newClient, type: v as Client["type"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {clientTypes.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={newClient.address}
                  onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                  placeholder="Full address"
                />
              </div>
              <div className="space-y-2">
                <Label>GST Number (Optional)</Label>
                <Input
                  value={newClient.gst}
                  onChange={(e) => setNewClient({ ...newClient, gst: e.target.value })}
                  placeholder="GST number"
                />
              </div>
              <Button type="submit" className="w-full" disabled={!newClient.name || saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add Client
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search - Professional compact style */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          className="pl-9 h-9 text-sm"
          placeholder="Search by name or mobile..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Client Cards */}
      {filteredClients.length === 0 ? (
        <Card className="border shadow-sm">
          <CardContent className="py-10 text-center">
            <Users className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              {clients.length === 0 ? "No clients added yet" : "No clients found"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredClients.map((client) => {
            const clientId = client.id || client._id || ""
            const clientOrders = getClientOrders(clientId)
            const totalBusiness = getClientTotal(clientId)
            const outstanding = clientOrders.reduce((sum, o) => sum + o.balanceAmount, 0)

            return (
              <Card key={clientId} className="border shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-4">
                  {/* Main Content */}
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary">{client.name.charAt(0).toUpperCase()}</span>
                    </div>

                    {/* Client Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-semibold text-foreground truncate">{client.name}</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide bg-muted text-muted-foreground">
                          {client.type}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {client.mobile}
                        </span>
                        {client.address && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate max-w-32">{client.address}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats - Desktop */}
                    <div className="hidden sm:flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-foreground">₹{totalBusiness.toLocaleString("en-IN")}</p>
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{clientOrders.length} orders</p>
                      </div>
                      {outstanding > 0 && (
                        <div className="text-right">
                          <p className="text-base font-bold text-amber-600">₹{outstanding.toLocaleString("en-IN")}</p>
                          <p className="text-[10px] font-medium uppercase tracking-wide text-amber-600/70">pending</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stats - Mobile */}
                  <div className="flex sm:hidden items-center justify-between mt-3 pt-3 border-t border-border/50">
                    <div>
                      <p className="text-base font-bold text-foreground">₹{totalBusiness.toLocaleString("en-IN")}</p>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{clientOrders.length} orders</p>
                    </div>
                    {outstanding > 0 && (
                      <div className="text-right">
                        <p className="text-sm font-bold text-amber-600">₹{outstanding.toLocaleString("en-IN")}</p>
                        <p className="text-[10px] font-medium uppercase tracking-wide text-amber-600/70">pending</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1.5 mt-3 pt-3 border-t border-border/50">
                    <Button variant="outline" size="sm" className="h-8 px-3 text-xs gap-1.5" onClick={() => setEditingClient(client)}>
                      <Edit2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteClient(clientId)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={!!editingClient} onOpenChange={() => setEditingClient(null)}>
        <DialogContent className="max-w-lg w-[95vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
          </DialogHeader>
          {editingClient && (
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateClient(); }} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Client Name</Label>
                <Input
                  value={editingClient.name}
                  onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mobile Number</Label>
                  <Input
                    value={editingClient.mobile}
                    onChange={(e) => setEditingClient({ ...editingClient, mobile: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Client Type</Label>
                  <Select
                    value={editingClient.type}
                    onValueChange={(v) => setEditingClient({ ...editingClient, type: v as Client["type"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {clientTypes.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={editingClient.address}
                  onChange={(e) => setEditingClient({ ...editingClient, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>GST Number</Label>
                <Input
                  value={editingClient.gst}
                  onChange={(e) => setEditingClient({ ...editingClient, gst: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div >
  )
}
