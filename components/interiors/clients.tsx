"use client"

import { useState } from "react"
import { useInteriors, type InteriorClient } from "@/lib/contexts/interiors-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Users, Search, Phone, MapPin, Trash2, Edit2, Mail, UserCheck, Loader2 } from "lucide-react"

const referralSources = ["Client", "Architect", "Contractor", "Website", "Social Media", "Walk-in", "Other"] as const

interface ClientFormProps {
    client: Partial<InteriorClient>
    setClient: (c: Partial<InteriorClient>) => void
    onSave: () => void
    buttonText: string
    isSaving: boolean
}

const ClientForm = ({ client, setClient, onSave, buttonText, isSaving }: ClientFormProps) => (
    <div className="space-y-4 pt-4">
        <div className="space-y-2">
            <Label>Client Name *</Label>
            <Input
                value={client.name}
                onChange={(e) => setClient({ ...client, name: e.target.value })}
                placeholder="Enter client name"
            />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>Mobile Number *</Label>
                <Input
                    value={client.mobile}
                    onChange={(e) => setClient({ ...client, mobile: e.target.value })}
                    placeholder="9876543210"
                />
            </div>
            <div className="space-y-2">
                <Label>Email</Label>
                <Input
                    type="email"
                    value={client.email}
                    onChange={(e) => setClient({ ...client, email: e.target.value })}
                    placeholder="email@example.com"
                />
            </div>
        </div>
        <div className="space-y-2">
            <Label>Address</Label>
            <Input
                value={client.address}
                onChange={(e) => setClient({ ...client, address: e.target.value })}
                placeholder="Full address"
            />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>Referral Source</Label>
                <Select
                    value={client.referralType}
                    onValueChange={(v) => setClient({ ...client, referralType: v as InteriorClient["referralType"] })}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {referralSources.map((t) => (
                            <SelectItem key={t} value={t}>
                                {t}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Referred By</Label>
                <Input
                    value={client.referredBy}
                    onChange={(e) => setClient({ ...client, referredBy: e.target.value })}
                    placeholder="Name of referrer"
                />
            </div>
        </div>
        <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
                value={client.notes}
                onChange={(e) => setClient({ ...client, notes: e.target.value })}
                placeholder="Additional notes about the client..."
                rows={3}
            />
        </div>
        <Button onClick={onSave} className="w-full" disabled={!client.name || !client.mobile || isSaving}>
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {buttonText}
        </Button>
    </div>
)

export function InteriorsClients() {
    const { clients, loading, addClient, updateClient, deleteClient } = useInteriors()
    const [showAddClient, setShowAddClient] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterReferral, setFilterReferral] = useState<string>("all")
    const [editingClient, setEditingClient] = useState<InteriorClient | null>(null)
    const [saving, setSaving] = useState(false)

    const [newClient, setNewClient] = useState<Partial<InteriorClient>>({
        name: "",
        mobile: "",
        email: "",
        address: "",
        referredBy: "",
        referralType: "Walk-in",
        notes: "",
    })

    const handleAddClient = async () => {
        setSaving(true)
        try {
            await addClient({
                name: newClient.name || "",
                mobile: newClient.mobile || "",
                email: newClient.email || "",
                address: newClient.address || "",
                referredBy: newClient.referredBy || "",
                referralType: newClient.referralType as InteriorClient["referralType"],
                notes: newClient.notes || "",
            })
            setShowAddClient(false)
            setNewClient({
                name: "",
                mobile: "",
                email: "",
                address: "",
                referredBy: "",
                referralType: "Walk-in",
                notes: "",
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

    const filteredClients = clients.filter((c) => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.mobile.includes(searchQuery) ||
            c.email.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesFilter = filterReferral === "all" || c.referralType === filterReferral
        return matchesSearch && matchesFilter
    })

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
                    <p className="text-sm text-muted-foreground">Manage your interior design clients</p>
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
                        <ClientForm
                            client={newClient}
                            setClient={setNewClient}
                            onSave={handleAddClient}
                            buttonText="Add Client"
                            isSaving={saving}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        className="pl-10 h-10"
                        placeholder="Search clients..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Select value={filterReferral} onValueChange={setFilterReferral}>
                    <SelectTrigger className="w-full md:w-48 h-10">
                        <SelectValue placeholder="All Sources" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Sources</SelectItem>
                        {referralSources.map((t) => (
                            <SelectItem key={t} value={t}>
                                {t}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Client List */}
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

                        return (
                            <Card key={clientId} className="overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                                                <span className="text-base md:text-lg font-bold text-emerald-600">{client.name.charAt(0).toUpperCase()}</span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-semibold text-base md:text-lg truncate">{client.name}</h3>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs md:text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="w-3 h-3" />
                                                        {client.mobile}
                                                    </span>
                                                    {client.email && (
                                                        <span className="flex items-center gap-1">
                                                            <Mail className="w-3 h-3" />
                                                            {client.email}
                                                        </span>
                                                    )}
                                                </div>
                                                {client.address && (
                                                    <p className="text-xs md:text-sm text-muted-foreground mt-1 flex items-center gap-1 truncate">
                                                        <MapPin className="w-3 h-3 shrink-0" />
                                                        {client.address}
                                                    </p>
                                                )}
                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-medium">
                                                        {client.referralType}
                                                    </span>
                                                    {client.referredBy && (
                                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                                                            <UserCheck className="w-3 h-3" />
                                                            {client.referredBy}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-end gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/50">
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

            {/* Edit Dialog */}
            <Dialog open={!!editingClient} onOpenChange={() => setEditingClient(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Client</DialogTitle>
                    </DialogHeader>
                    {editingClient && (
                        <ClientForm
                            client={editingClient}
                            setClient={(c) => setEditingClient(c as InteriorClient)}
                            onSave={handleUpdateClient}
                            buttonText="Save Changes"
                            isSaving={saving}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
