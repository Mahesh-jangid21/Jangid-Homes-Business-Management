"use client"

import { useState } from "react"
import { useInteriors, type InteriorExpense } from "@/lib/contexts/interiors-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Receipt, Trash2, Filter, Loader2 } from "lucide-react"

const expenseTypes = ["Material", "Labour", "Transport", "Site Expenses", "Designer Fee", "Vendor Payment", "Misc"] as const
const paymentModes = ["Cash", "Bank", "UPI", "Cheque"] as const

export function InteriorsExpensesModule() {
    const { expenses, projects, loading, addExpense, deleteExpense } = useInteriors()
    const [showAddExpense, setShowAddExpense] = useState(false)
    const [filterType, setFilterType] = useState<string>("all")
    const [filterProject, setFilterProject] = useState<string>("all")
    const [saving, setSaving] = useState(false)

    const [newExpense, setNewExpense] = useState<Partial<InteriorExpense>>({
        projectId: "",
        date: new Date().toISOString().split("T")[0],
        type: "Material",
        description: "",
        amount: 0,
        paymentMode: "Cash",
        vendor: "",
    })

    const handleAddExpense = async () => {
        setSaving(true)
        try {
            await addExpense({
                projectId: newExpense.projectId === "none" ? "" : (newExpense.projectId || ""),
                date: newExpense.date || "",
                type: newExpense.type as InteriorExpense["type"],
                description: newExpense.description || "",
                amount: newExpense.amount || 0,
                paymentMode: newExpense.paymentMode as InteriorExpense["paymentMode"],
                vendor: newExpense.vendor || "",
            })

            setShowAddExpense(false)
            setNewExpense({
                projectId: "",
                date: new Date().toISOString().split("T")[0],
                type: "Material",
                description: "",
                amount: 0,
                paymentMode: "Cash",
                vendor: "",
            })
        } catch (error) {
            console.error("Failed to add expense:", error)
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteExpense = async (id: string) => {
        try {
            await deleteExpense(id)
        } catch (error) {
            console.error("Failed to delete expense:", error)
        }
    }

    const filteredExpenses = expenses.filter((e) => {
        const matchesType = filterType === "all" || e.type === filterType
        const matchesProject = filterProject === "all" || e.projectId === filterProject
        return matchesType && matchesProject
    })

    // Sort by date descending
    const sortedExpenses = [...filteredExpenses].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)

    // Group by type for summary
    const expensesByType = expenseTypes.map((type) => ({
        type,
        total: expenses.filter((e) => e.type === type).reduce((sum, e) => sum + e.amount, 0),
    })).filter((e) => e.total > 0)

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
                    <h2 className="text-2xl font-bold text-foreground">Expenses</h2>
                    <p className="text-sm text-muted-foreground">Track project and business expenses</p>
                </div>
                <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
                    <DialogTrigger asChild>
                        <Button className="w-full sm:w-auto">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Expense
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg w-[95vw] rounded-2xl">
                        <DialogHeader>
                            <DialogTitle>Add New Expense</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Date *</Label>
                                    <Input
                                        type="date"
                                        value={newExpense.date}
                                        onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Expense Type *</Label>
                                    <Select
                                        value={newExpense.type}
                                        onValueChange={(v) => setNewExpense({ ...newExpense, type: v as InteriorExpense["type"] })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {expenseTypes.map((t) => (
                                                <SelectItem key={t} value={t}>
                                                    {t}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Link to Project (Optional)</Label>
                                <Select
                                    value={newExpense.projectId}
                                    onValueChange={(v) => setNewExpense({ ...newExpense, projectId: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select project (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No Project</SelectItem>
                                        {projects.map((p) => {
                                            const projectId = p.id || p._id;
                                            if (!projectId) return null;
                                            return (
                                                <SelectItem key={projectId} value={projectId}>
                                                    {p.projectName} - {p.projectNumber}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Description *</Label>
                                <Input
                                    value={newExpense.description}
                                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                                    placeholder="What was this expense for?"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Amount (₹) *</Label>
                                    <Input
                                        type="number"
                                        value={newExpense.amount}
                                        onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Payment Mode</Label>
                                    <Select
                                        value={newExpense.paymentMode}
                                        onValueChange={(v) => setNewExpense({ ...newExpense, paymentMode: v as InteriorExpense["paymentMode"] })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {paymentModes.map((m) => (
                                                <SelectItem key={m} value={m}>
                                                    {m}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Vendor/Payee</Label>
                                <Input
                                    value={newExpense.vendor}
                                    onChange={(e) => setNewExpense({ ...newExpense, vendor: e.target.value })}
                                    placeholder="Who was paid?"
                                />
                            </div>

                            <Button onClick={handleAddExpense} className="w-full" disabled={!newExpense.date || !newExpense.description || !newExpense.amount || saving}>
                                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Add Expense
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{(totalExpenses || 0).toLocaleString("en-IN")}</div>
                        <p className="text-xs text-muted-foreground">{(filteredExpenses?.length || 0)} entries</p>
                    </CardContent>
                </Card>

                {expensesByType.slice(0, 3).map((item) => (
                    <Card key={item.type}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{item.type}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold">₹{(item.total || 0).toLocaleString("en-IN")}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3 p-3 bg-muted/50 rounded-xl border border-border/50">
                <div className="flex items-center gap-2 px-1">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Filters</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="h-10">
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {expenseTypes.map((t) => (
                                <SelectItem key={t} value={t}>
                                    {t}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filterProject} onValueChange={setFilterProject}>
                        <SelectTrigger className="h-10">
                            <SelectValue placeholder="All Projects" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Projects</SelectItem>
                            {projects.map((p) => {
                                const projectId = p.id || p._id;
                                if (!projectId) return null;
                                return (
                                    <SelectItem key={projectId} value={projectId}>
                                        {p.projectName}
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Expenses List */}
            {sortedExpenses.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No expenses found.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {sortedExpenses.map((expense) => {
                        const project = projects.find((p) => (p.id || p._id) === expense.projectId)
                        const expenseId = expense.id || expense._id || ""
                        return (
                            <Card key={expenseId} className="overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 md:w-11 md:h-11 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                                                <Receipt className="w-5 h-5 text-red-600" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-bold text-base truncate">{expense.description}</p>
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                                                    <span className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-bold uppercase">{expense.type}</span>
                                                    <span>{expense.date ? new Date(expense.date).toLocaleDateString("en-IN") : "No date"}</span>
                                                    {project && <span className="truncate max-w-[120px]">@ {project.projectName}</span>}
                                                    {expense.vendor && <span className="truncate max-w-[100px]">vi: {expense.vendor}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/50">
                                            <div className="text-left sm:text-right">
                                                <p className="text-lg md:text-xl font-black text-red-600">-₹{(expense.amount || 0).toLocaleString("en-IN")}</p>
                                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{expense.paymentMode}</p>
                                            </div>
                                            <Button variant="outline" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteExpense(expenseId)}>
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
        </div>
    )
}
