"use client"

import { useState, useMemo } from "react"
import { useCNC, type Order, type Client } from "@/lib/contexts/cnc-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Search,
    User,
    Phone,
    MapPin,
    FileText,
    IndianRupee,
    Package,
    Clock,
    CheckCircle2,
    AlertCircle,
    Loader2,
    X
} from "lucide-react"

export function ClientSearch() {
    const { clients, orders, materials, loading, updateOrder } = useCNC()
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedClient, setSelectedClient] = useState<Client | null>(null)
    const [showPaymentDialog, setShowPaymentDialog] = useState<Order | null>(null)
    const [paymentAmount, setPaymentAmount] = useState(0)
    const [saving, setSaving] = useState(false)

    // Filter clients based on search
    const filteredClients = useMemo(() => {
        if (!searchQuery.trim()) return []
        const query = searchQuery.toLowerCase()
        return clients.filter(c =>
            c.name.toLowerCase().includes(query) ||
            c.mobile.includes(query)
        ).slice(0, 10) // Limit to 10 results
    }, [clients, searchQuery])

    // Get orders for selected client
    const clientOrders = useMemo(() => {
        if (!selectedClient) return []
        const clientId = selectedClient.id || selectedClient._id
        return orders.filter(o => o.clientId === clientId)
    }, [selectedClient, orders])

    // Calculate summary
    const summary = useMemo(() => {
        const totalOrders = clientOrders.length
        const totalValue = clientOrders.reduce((sum, o) => sum + (o.totalValue || 0), 0)
        const totalPaid = clientOrders.reduce((sum, o) => sum + (o.advanceReceived || 0), 0)
        const totalPending = clientOrders.reduce((sum, o) => sum + (o.balanceAmount || 0), 0)
        const pendingOrders = clientOrders.filter(o => (o.balanceAmount || 0) > 0)
        const completedOrders = clientOrders.filter(o => o.status === "Completed" || o.status === "Billed")

        return { totalOrders, totalValue, totalPaid, totalPending, pendingOrders, completedOrders }
    }, [clientOrders])

    const handleRecordPayment = async () => {
        if (!showPaymentDialog || paymentAmount <= 0) return
        setSaving(true)
        try {
            const orderId = showPaymentDialog.id || showPaymentDialog._id || ""
            const currentAdvance = showPaymentDialog.advanceReceived || 0
            const newAdvance = currentAdvance + paymentAmount
            const newBalance = (showPaymentDialog.totalValue || 0) - newAdvance

            await updateOrder(orderId, {
                advanceReceived: newAdvance,
                balanceAmount: Math.max(0, newBalance),
            })
            setShowPaymentDialog(null)
            setPaymentAmount(0)
        } catch (error) {
            console.error("Failed to record payment:", error)
        } finally {
            setSaving(false)
        }
    }

    const getStatusColor = (status: Order["status"]) => {
        switch (status) {
            case "Pending": return "bg-amber-100 text-amber-800"
            case "In Progress": return "bg-blue-100 text-blue-800"
            case "Completed": return "bg-green-100 text-green-800"
            case "Billed": return "bg-gray-100 text-gray-800"
            default: return "bg-gray-100 text-gray-800"
        }
    }

    const handleUpdateOrderStatus = async (orderId: string, status: Order["status"]) => {
        try {
            await updateOrder(orderId, { status })
        } catch (error) {
            console.error("Failed to update order status:", error)
        }
    }

    const orderStatuses: Order["status"][] = ["Pending", "In Progress", "Completed", "Billed"]

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-foreground">Client Search</h2>
                <p className="text-sm text-muted-foreground">Search clients and manage their orders & payments</p>
            </div>

            {/* Search Box */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                    placeholder="Search by client name or mobile number..."
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value)
                        if (!e.target.value.trim()) setSelectedClient(null)
                    }}
                    className="pl-10 h-12 text-lg"
                />

                {/* Search Results Dropdown */}
                {filteredClients.length > 0 && !selectedClient && (
                    <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        {filteredClients.map(client => {
                            const clientId = client.id || client._id || ""
                            return (
                                <button
                                    key={clientId}
                                    className="w-full p-3 text-left hover:bg-muted flex items-center gap-3 border-b border-border/50 last:border-0"
                                    onClick={() => {
                                        setSelectedClient(client)
                                        setSearchQuery(client.name)
                                    }}
                                >
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{client.name}</p>
                                        <p className="text-sm text-muted-foreground">{client.mobile}</p>
                                    </div>
                                    <span className="ml-auto text-xs px-2 py-1 bg-muted rounded">{client.type}</span>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Selected Client Details */}
            {selectedClient && (
                <div className="space-y-6">
                    {/* Client Info Card */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row md:items-start gap-6">
                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <User className="w-8 h-8 text-primary" />
                                </div>
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-2xl font-bold">{selectedClient.name}</h3>
                                            <span className="text-xs px-2 py-1 bg-muted rounded">{selectedClient.type}</span>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => {
                                            setSelectedClient(null)
                                            setSearchQuery("")
                                        }}>
                                            <X className="w-5 h-5" />
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-muted-foreground" />
                                            <span>{selectedClient.mobile}</span>
                                        </div>
                                        {selectedClient.address && (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                                <span>{selectedClient.address}</span>
                                            </div>
                                        )}
                                        {selectedClient.gst && (
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-muted-foreground" />
                                                <span>GST: {selectedClient.gst}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <Package className="w-8 h-8 text-blue-500" />
                                    <div>
                                        <p className="text-2xl font-bold">{summary.totalOrders}</p>
                                        <p className="text-xs text-muted-foreground">Total Orders</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <IndianRupee className="w-8 h-8 text-primary" />
                                    <div>
                                        <p className="text-2xl font-bold">₹{summary.totalValue.toLocaleString("en-IN")}</p>
                                        <p className="text-xs text-muted-foreground">Total Business</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                                    <div>
                                        <p className="text-2xl font-bold text-green-600">₹{summary.totalPaid.toLocaleString("en-IN")}</p>
                                        <p className="text-xs text-muted-foreground">Amount Paid</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className={summary.totalPending > 0 ? "border-amber-200 bg-amber-50/50" : ""}>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className={`w-8 h-8 ${summary.totalPending > 0 ? "text-amber-500" : "text-gray-400"}`} />
                                    <div>
                                        <p className={`text-2xl font-bold ${summary.totalPending > 0 ? "text-amber-600" : ""}`}>
                                            ₹{summary.totalPending.toLocaleString("en-IN")}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Pending Amount</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Pending Payments Section */}
                    {summary.pendingOrders.length > 0 && (
                        <Card className="border-amber-200">
                            <CardHeader className="bg-amber-50/50 border-b border-amber-200">
                                <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
                                    <Clock className="w-5 h-5" />
                                    Pending Payments ({summary.pendingOrders.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-border">
                                    {summary.pendingOrders.map(order => {
                                        const orderId = order.id || order._id || ""
                                        return (
                                            <div key={orderId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div>
                                                    <p className="font-bold">{order.orderNumber}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {order.designType} • {new Date(order.date).toLocaleDateString("en-IN")}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-1 text-sm">
                                                        <span>Total: ₹{(order.totalValue || 0).toLocaleString("en-IN")}</span>
                                                        <span className="text-green-600">Paid: ₹{(order.advanceReceived || 0).toLocaleString("en-IN")}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <p className="text-lg font-bold text-amber-600">₹{(order.balanceAmount || 0).toLocaleString("en-IN")}</p>
                                                        <p className="text-xs text-muted-foreground">Due</p>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700"
                                                        onClick={() => {
                                                            setShowPaymentDialog(order)
                                                            setPaymentAmount(order.balanceAmount || 0)
                                                        }}
                                                    >
                                                        <IndianRupee className="w-4 h-4 mr-1" />
                                                        Pay
                                                    </Button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* All Orders */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Order History ({clientOrders.length})</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {clientOrders.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>No orders found for this client</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {clientOrders.map(order => {
                                        const orderId = order.id || order._id || ""
                                        return (
                                            <div key={orderId} className="p-4 flex flex-col gap-3">
                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="font-bold">{order.orderNumber}</p>
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusColor(order.status)}`}>
                                                                {order.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            {order.designType} • {new Date(order.date).toLocaleDateString("en-IN")}
                                                        </p>
                                                        {order.materials.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {order.materials.map((m, idx) => {
                                                                    const mat = materials.find(mt => (mt.id || mt._id) === m.materialId)
                                                                    return (
                                                                        <span key={idx} className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                                                            {mat?.type || "Material"} x{m.quantity}
                                                                        </span>
                                                                    )
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold">₹{(order.totalValue || 0).toLocaleString("en-IN")}</p>
                                                        {(order.balanceAmount || 0) > 0 ? (
                                                            <p className="text-sm text-amber-600">Due: ₹{(order.balanceAmount || 0).toLocaleString("en-IN")}</p>
                                                        ) : (
                                                            <p className="text-sm text-green-600">Paid ✓</p>
                                                        )}
                                                    </div>
                                                </div>
                                                {/* Order Actions */}
                                                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
                                                    <Select
                                                        value={order.status}
                                                        onValueChange={(v) => handleUpdateOrderStatus(orderId, v as Order["status"])}
                                                    >
                                                        <SelectTrigger className="h-8 w-32 text-xs">
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
                                                    {(order.balanceAmount || 0) > 0 && (
                                                        <Button
                                                            size="sm"
                                                            className="h-8 bg-green-600 hover:bg-green-700"
                                                            onClick={() => {
                                                                setShowPaymentDialog(order)
                                                                setPaymentAmount(order.balanceAmount || 0)
                                                            }}
                                                        >
                                                            <IndianRupee className="w-3 h-3 mr-1" />
                                                            Record Payment
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Empty State */}
            {!selectedClient && !searchQuery && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Search for a client to view their details and manage payments</p>
                    </CardContent>
                </Card>
            )}

            {/* Payment Dialog */}
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
                                    <span className="font-bold">{showPaymentDialog.orderNumber}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Total Value:</span>
                                    <span>₹{(showPaymentDialog.totalValue || 0).toLocaleString("en-IN")}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Already Paid:</span>
                                    <span className="text-green-600">₹{(showPaymentDialog.advanceReceived || 0).toLocaleString("en-IN")}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold border-t pt-2">
                                    <span>Pending Balance:</span>
                                    <span className="text-amber-600">₹{(showPaymentDialog.balanceAmount || 0).toLocaleString("en-IN")}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Payment Amount (₹)</Label>
                                <Input
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(Math.min(Number(e.target.value), showPaymentDialog.balanceAmount || 0))}
                                    max={showPaymentDialog.balanceAmount}
                                    min={0}
                                    className="text-lg font-bold"
                                />
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPaymentAmount(Math.round((showPaymentDialog.balanceAmount || 0) * 0.5))}
                                    >
                                        50%
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPaymentAmount(showPaymentDialog.balanceAmount || 0)}
                                    >
                                        Full Amount
                                    </Button>
                                </div>
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
        </div>
    )
}
