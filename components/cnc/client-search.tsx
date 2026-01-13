"use client"

import { useState, useMemo, useRef, useCallback } from "react"
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
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card' | 'Bank'>('Cash')
    const [paymentAccount, setPaymentAccount] = useState<'Kamal Jangid' | 'Hiralal Jangid' | ''>('')
    const [saving, setSaving] = useState(false)
    const [highlightedIndex, setHighlightedIndex] = useState(-1)
    const listRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Filter clients based on search
    const filteredClients = useMemo(() => {
        if (!searchQuery.trim()) return []
        const query = searchQuery.toLowerCase()
        return clients.filter(c =>
            c.name.toLowerCase().includes(query) ||
            c.mobile.includes(query)
        ).slice(0, 10) // Limit to 10 results
    }, [clients, searchQuery])

    // Reset highlighted index when filtered results change
    const handleSearchChange = useCallback((value: string) => {
        setSearchQuery(value)
        setHighlightedIndex(-1)
        if (!value.trim()) setSelectedClient(null)
    }, [])

    // Handle selecting a client
    const handleSelectClient = useCallback((client: Client) => {
        setSelectedClient(client)
        setSearchQuery(client.name)
        setHighlightedIndex(-1)
    }, [])

    // Keyboard navigation handler
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (filteredClients.length === 0 || selectedClient) return

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault()
                setHighlightedIndex(prev => {
                    const next = prev < filteredClients.length - 1 ? prev + 1 : 0
                    // Scroll into view
                    const item = listRef.current?.children[next] as HTMLElement
                    item?.scrollIntoView({ block: "nearest", behavior: "smooth" })
                    return next
                })
                break
            case "ArrowUp":
                e.preventDefault()
                setHighlightedIndex(prev => {
                    const next = prev > 0 ? prev - 1 : filteredClients.length - 1
                    // Scroll into view
                    const item = listRef.current?.children[next] as HTMLElement
                    item?.scrollIntoView({ block: "nearest", behavior: "smooth" })
                    return next
                })
                break
            case "Enter":
                e.preventDefault()
                if (highlightedIndex >= 0 && highlightedIndex < filteredClients.length) {
                    handleSelectClient(filteredClients[highlightedIndex])
                } else if (filteredClients.length === 1) {
                    // Auto-select if only one result
                    handleSelectClient(filteredClients[0])
                }
                break
            case "Escape":
                e.preventDefault()
                setSearchQuery("")
                setHighlightedIndex(-1)
                inputRef.current?.blur()
                break
        }
    }, [filteredClients, selectedClient, highlightedIndex, handleSelectClient])

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
        if (paymentMethod !== 'Cash' && !paymentAccount) return
        setSaving(true)
        try {
            const orderId = showPaymentDialog.id || showPaymentDialog._id || ""
            const currentAdvance = showPaymentDialog.advanceReceived || 0
            const newAdvance = currentAdvance + paymentAmount
            const newBalance = (showPaymentDialog.totalValue || 0) - newAdvance
            const existingPayments = showPaymentDialog.payments || []

            await updateOrder(orderId, {
                advanceReceived: newAdvance,
                balanceAmount: Math.max(0, newBalance),
                payments: [...existingPayments, {
                    amount: paymentAmount,
                    date: new Date().toISOString(),
                    method: paymentMethod,
                    account: paymentMethod !== 'Cash' ? paymentAccount as any : undefined
                }]
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

    const getStatusColor = (status: Order["status"]) => {
        switch (status) {
            case "Pending": return "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
            case "In Progress": return "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
            case "Completed": return "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400"
            case "Billed": return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
            default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
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
            <div className="flex items-center justify-center h-48">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-5">
            {/* Header - matching dashboard style */}
            <div>
                <h2 className="text-xl font-semibold text-foreground">Client Search</h2>
                <span className="text-sm text-muted-foreground">Search clients and manage orders & payments</span>
            </div>

            {/* Search Box - Professional compact style */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    ref={inputRef}
                    placeholder="Search by client name or mobile..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pl-10 h-10 text-sm"
                    autoComplete="off"
                />

                {/* Search Results Dropdown */}
                {filteredClients.length > 0 && !selectedClient && (
                    <div
                        ref={listRef}
                        className="absolute z-10 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto"
                        role="listbox"
                    >
                        {filteredClients.map((client, index) => {
                            const clientId = client.id || client._id || ""
                            const isHighlighted = index === highlightedIndex
                            return (
                                <button
                                    key={clientId}
                                    role="option"
                                    aria-selected={isHighlighted}
                                    className={`w-full p-3 text-left flex items-center gap-3 border-b border-border/50 last:border-0 transition-colors ${isHighlighted ? "bg-accent" : "hover:bg-muted"
                                        }`}
                                    onClick={() => handleSelectClient(client)}
                                    onMouseEnter={() => setHighlightedIndex(index)}
                                >
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        <User className="w-4 h-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{client.name}</p>
                                        <p className="text-xs text-muted-foreground">{client.mobile}</p>
                                    </div>
                                    <span className="text-[10px] px-2 py-0.5 bg-muted rounded-full font-medium uppercase">{client.type}</span>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Selected Client Details */}
            {selectedClient && (
                <div className="space-y-4">
                    {/* Client Info Card */}
                    <Card className="border shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <User className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-lg font-semibold">{selectedClient.name}</h3>
                                                <span className="text-[10px] px-2 py-0.5 bg-muted rounded-full font-medium uppercase">{selectedClient.type}</span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Phone className="w-3 h-3" />
                                                    {selectedClient.mobile}
                                                </span>
                                                {selectedClient.address && (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {selectedClient.address}
                                                    </span>
                                                )}
                                                {selectedClient.gst && (
                                                    <span className="flex items-center gap-1">
                                                        <FileText className="w-3 h-3" />
                                                        GST: {selectedClient.gst}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                            setSelectedClient(null)
                                            setSearchQuery("")
                                        }}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Summary Cards - Dashboard style */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Card className="border shadow-sm">
                            <CardContent className="p-4">
                                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Total Orders</p>
                                <p className="text-lg font-bold text-foreground">{summary.totalOrders}</p>
                            </CardContent>
                        </Card>
                        <Card className="border shadow-sm">
                            <CardContent className="p-4">
                                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Total Business</p>
                                <p className="text-lg font-bold text-foreground">₹{summary.totalValue.toLocaleString("en-IN")}</p>
                            </CardContent>
                        </Card>
                        <Card className="border shadow-sm">
                            <CardContent className="p-4">
                                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Amount Paid</p>
                                <p className="text-lg font-bold text-green-600">₹{summary.totalPaid.toLocaleString("en-IN")}</p>
                            </CardContent>
                        </Card>
                        <Card className={`border shadow-sm ${summary.totalPending > 0 ? "bg-amber-50/50 dark:bg-amber-950/20" : ""}`}>
                            <CardContent className="p-4">
                                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Pending</p>
                                <p className={`text-lg font-bold ${summary.totalPending > 0 ? "text-amber-600" : "text-foreground"}`}>
                                    ₹{summary.totalPending.toLocaleString("en-IN")}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Pending Payments Section */}
                    {summary.pendingOrders.length > 0 && (
                        <Card className="border shadow-sm bg-amber-50/30 dark:bg-amber-950/10">
                            <CardHeader className="py-3 px-4 border-b">
                                <CardTitle className="text-base font-semibold flex items-center gap-2 text-amber-700 dark:text-amber-400">
                                    <Clock className="w-4 h-4" />
                                    Pending Payments ({summary.pendingOrders.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-border">
                                    {summary.pendingOrders.map(order => {
                                        const orderId = order.id || order._id || ""
                                        return (
                                            <div key={orderId} className="p-3 flex items-center justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold">{order.orderNumber}</p>
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {order.designType} • {new Date(order.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                                    </p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-base font-bold text-amber-600">₹{(order.balanceAmount || 0).toLocaleString("en-IN")}</p>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    className="h-8 text-xs bg-green-600 hover:bg-green-700 shrink-0"
                                                    onClick={() => {
                                                        setShowPaymentDialog(order)
                                                        setPaymentAmount(order.balanceAmount || 0)
                                                    }}
                                                >
                                                    <IndianRupee className="w-3 h-3 mr-1" />
                                                    Pay
                                                </Button>
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* All Orders */}
                    <Card className="border shadow-sm">
                        <CardHeader className="py-3 px-4 border-b">
                            <CardTitle className="text-base font-semibold">Order History ({clientOrders.length})</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {clientOrders.length === 0 ? (
                                <div className="py-8 text-center">
                                    <Package className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                                    <p className="text-sm text-muted-foreground">No orders found</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {clientOrders.map(order => {
                                        const orderId = order.id || order._id || ""
                                        return (
                                            <div key={orderId} className="p-3 hover:bg-muted/50 transition-colors">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="text-sm font-semibold">{order.orderNumber}</p>
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(order.status)}`}>
                                                                {order.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">
                                                            {order.designType} • {new Date(order.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                                        </p>
                                                        {order.materials.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-1.5">
                                                                {order.materials.slice(0, 3).map((m, idx) => {
                                                                    const mat = materials.find(mt => (mt.id || mt._id) === m.materialId)
                                                                    return (
                                                                        <span key={idx} className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">
                                                                            {mat?.type || "Material"} x{m.quantity}
                                                                        </span>
                                                                    )
                                                                })}
                                                                {order.materials.length > 3 && (
                                                                    <span className="text-[10px] text-muted-foreground">+{order.materials.length - 3} more</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <p className="text-sm font-bold">₹{(order.totalValue || 0).toLocaleString("en-IN")}</p>
                                                        {(order.balanceAmount || 0) > 0 ? (
                                                            <p className="text-xs text-amber-600">Due: ₹{(order.balanceAmount || 0).toLocaleString("en-IN")}</p>
                                                        ) : (
                                                            <p className="text-xs text-green-600">Paid ✓</p>
                                                        )}
                                                    </div>
                                                </div>
                                                {/* Order Actions */}
                                                <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-border/50">
                                                    <Select
                                                        value={order.status}
                                                        onValueChange={(v) => handleUpdateOrderStatus(orderId, v as Order["status"])}
                                                    >
                                                        <SelectTrigger className="h-7 w-28 text-xs">
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
                                                            className="h-7 text-xs bg-green-600 hover:bg-green-700"
                                                            onClick={() => {
                                                                setShowPaymentDialog(order)
                                                                setPaymentAmount(order.balanceAmount || 0)
                                                            }}
                                                        >
                                                            <IndianRupee className="w-3 h-3 mr-1" />
                                                            Pay
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
                <Card className="border shadow-sm">
                    <CardContent className="py-10 text-center">
                        <Search className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground">Search for a client to view details and manage payments</p>
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
                        <form onSubmit={(e) => { e.preventDefault(); handleRecordPayment(); }} className="space-y-4 pt-4">
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
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-xs"
                                        onClick={() => setPaymentAmount(Math.round((showPaymentDialog.balanceAmount || 0) * 0.5))}
                                    >
                                        50%
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-xs"
                                        onClick={() => setPaymentAmount(showPaymentDialog.balanceAmount || 0)}
                                    >
                                        Full Amount
                                    </Button>
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label className="text-xs">Payment Method</Label>
                                    <Select value={paymentMethod} onValueChange={(v) => {
                                        setPaymentMethod(v as any)
                                        if (v === 'Cash') setPaymentAccount('')
                                    }}>
                                        <SelectTrigger className="h-9 text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Cash">Cash</SelectItem>
                                            <SelectItem value="UPI">UPI</SelectItem>
                                            <SelectItem value="Card">Card</SelectItem>
                                            <SelectItem value="Bank">Bank Transfer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {paymentMethod !== 'Cash' && (
                                    <div className="space-y-2">
                                        <Label className="text-xs">Account Holder</Label>
                                        <Select value={paymentAccount} onValueChange={(v) => setPaymentAccount(v as any)}>
                                            <SelectTrigger className={`h-9 text-sm ${!paymentAccount ? 'border-red-300' : ''}`}>
                                                <SelectValue placeholder="Select..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Kamal Jangid">Kamal Jangid</SelectItem>
                                                <SelectItem value="Hiralal Jangid">Hiralal Jangid</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>

                            <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                                <div className="flex justify-between text-sm">
                                    <span>New Balance After Payment:</span>
                                    <span className="font-bold text-green-700 dark:text-green-400">
                                        ₹{Math.max(0, (showPaymentDialog.balanceAmount || 0) - paymentAmount).toLocaleString("en-IN")}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" className="flex-1 h-9" onClick={() => {
                                    setShowPaymentDialog(null)
                                    setPaymentMethod('Cash')
                                    setPaymentAccount('')
                                }}>
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 h-9 bg-green-600 hover:bg-green-700"
                                    disabled={paymentAmount <= 0 || saving || (paymentMethod !== 'Cash' && !paymentAccount)}
                                >
                                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Confirm
                                </Button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
