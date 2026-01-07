"use client"

import { useState } from "react"
import { useCNC, type Client } from "@/lib/contexts/cnc-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Users, Search, Phone, MapPin, Trash2, Edit2, Loader2 } from "lucide-react"

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

  const handleAddClient = async () => {
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Clients</h2>
          <p className="text-sm text-muted-foreground">Manage your customers</p>
        </div>
        <Dialog open={showAddClient} onOpenChange={setShowAddClient}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg w-[95vw] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Client Name</Label>
                <Input
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  placeholder="Enter client name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mobile Number</Label>
                  <Input
                    value={newClient.mobile}
                    onChange={(e) => setNewClient({ ...newClient, mobile: e.target.value })}
                    placeholder="9876543210"
                  />
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
              <Button onClick={handleAddClient} className="w-full" disabled={!newClient.name || saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add Client
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-10 h-10"
          placeholder="Search clients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredClients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {clients.length === 0 ? "No clients added yet." : "No clients found."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredClients.map((client) => {
            const clientId = client.id || client._id || ""
            const clientOrders = getClientOrders(clientId)
            const totalBusiness = getClientTotal(clientId)
            const outstanding = clientOrders.reduce((sum, o) => sum + o.balanceAmount, 0)

            return (
              <Card key={clientId} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col p-4 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-base md:text-lg font-bold text-primary">{client.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-base md:text-lg truncate">{client.name}</h3>
                          <span className="px-2 py-0.5 bg-muted rounded text-[10px] font-medium shrink-0">{client.type}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs md:text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {client.mobile}
                          </span>
                        </div>
                        {client.address && (
                          <p className="text-xs md:text-sm text-muted-foreground mt-1 flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 shrink-0" />
                            {client.address}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-3 border-y border-border/50">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Total Sales</p>
                        <p className="text-sm md:text-base font-bold">₹{totalBusiness.toLocaleString("en-IN")}</p>
                        <p className="text-[10px] text-muted-foreground">{clientOrders.length} orders</p>
                      </div>
                      {outstanding > 0 && (
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Pending</p>
                          <p className="text-sm md:text-base font-bold text-amber-600">₹{outstanding.toLocaleString("en-IN")}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" className="h-8 md:h-9" onClick={() => setEditingClient(client)}>
                        <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 md:h-9 text-destructive hover:text-destructive" onClick={() => handleDeleteClient(clientId)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={!!editingClient} onOpenChange={() => setEditingClient(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
          </DialogHeader>
          {editingClient && (
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Client Name</Label>
                <Input
                  value={editingClient.name}
                  onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
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
              <Button onClick={handleUpdateClient} className="w-full" disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
