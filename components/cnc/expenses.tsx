"use client"

import { useState } from "react"
import { useCNC, type Expense } from "@/lib/contexts/cnc-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Receipt, Trash2, Loader2 } from "lucide-react"

const expenseTypes = ["Raw Material", "Labour", "Electricity", "Rent", "Maintenance", "Transport", "Misc"] as const

const paymentModes = ["Cash", "Bank", "UPI", "Card"] as const

export function CNCExpenses() {
  const { expenses, loading, addExpense, deleteExpense } = useCNC()
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7))
  const [saving, setSaving] = useState(false)

  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    date: new Date().toISOString().split("T")[0],
    type: "Misc",
    description: "",
    amount: 0,
    paymentMode: "Cash",
    account: undefined,
  })

  const handleAddExpense = async () => {
    setSaving(true)
    try {
      await addExpense({
        date: newExpense.date || "",
        type: newExpense.type as Expense["type"],
        description: newExpense.description || "",
        amount: newExpense.amount || 0,
        paymentMode: newExpense.paymentMode as Expense["paymentMode"],
        account: (newExpense.paymentMode !== 'Cash') ? (newExpense.account as any) : undefined
      })
      setShowAddExpense(false)
      setNewExpense({
        date: new Date().toISOString().split("T")[0],
        type: "Misc",
        description: "",
        amount: 0,
        paymentMode: "Cash",
        account: undefined,
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

  const filteredExpenses = expenses.filter((e) => e.date.startsWith(filterMonth))
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)

  const expensesByType = expenseTypes.reduce(
    (acc, type) => {
      acc[type] = filteredExpenses.filter((e) => e.type === type).reduce((sum, e) => sum + e.amount, 0)
      return acc
    },
    {} as Record<string, number>,
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
          <h2 className="text-xl font-semibold text-foreground">Expenses</h2>
          <span className="text-sm text-muted-foreground">
            {filteredExpenses.length} expenses this month
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="h-9 w-36 text-sm"
          />
          <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-xs">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg w-[95vw] rounded-2xl">
              <DialogHeader>
                <DialogTitle>Add Expense</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); handleAddExpense(); }} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={newExpense.date}
                      onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expense Type</Label>
                    <Select
                      value={newExpense.type}
                      onValueChange={(v) => setNewExpense({ ...newExpense, type: v as Expense["type"] })}
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
                  <Label>Description</Label>
                  <Input
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    placeholder="What was this expense for?"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount (₹)</Label>
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
                      onValueChange={(v) => setNewExpense({ ...newExpense, paymentMode: v as Expense["paymentMode"] })}
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
                {newExpense.paymentMode !== 'Cash' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <Label>Paid From / By</Label>
                    <Select
                      value={newExpense.account}
                      onValueChange={(v) => setNewExpense({ ...newExpense, account: v as any })}
                    >
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
                <Button type="submit" className="w-full" disabled={!newExpense.amount || saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Expense
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Grid - matching dashboard style */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600 mb-1.5">
              <Receipt className="w-4 h-4" />
              <span className="text-[10px] font-medium uppercase">Total</span>
            </div>
            <p className="text-lg font-bold text-red-600">₹{(totalExpenses || 0).toLocaleString("en-IN")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{filteredExpenses.length} expenses</p>
          </CardContent>
        </Card>
        {Object.entries(expensesByType)
          .filter(([, amount]) => amount > 0)
          .slice(0, 3)
          .map(([type, amount]) => (
            <Card key={type} className="border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                  <span className="text-[10px] font-medium uppercase">{type}</span>
                </div>
                <p className="text-lg font-bold text-foreground">₹{(amount || 0).toLocaleString("en-IN")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {Math.round((amount / totalExpenses) * 100)}% of total
                </p>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Expense Cards */}
      {filteredExpenses.length === 0 ? (
        <Card className="border shadow-sm">
          <CardContent className="py-10 text-center">
            <Receipt className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No expenses recorded for this month</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredExpenses.map((expense) => {
            const expenseId = expense.id || expense._id || ""
            return (
              <Card key={expenseId} className="border shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-950/30 rounded-full flex items-center justify-center shrink-0">
                      <Receipt className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-base font-semibold text-foreground truncate">
                          {expense.description || "No description"}
                        </p>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide bg-muted text-muted-foreground">
                          {expense.type}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{expense.date ? new Date(expense.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "No date"}</span>
                        <span className="flex items-center gap-1">
                          {expense.paymentMode}
                          {expense.account && expense.paymentMode !== 'Cash' && (
                            <span className="text-primary font-medium">→ {expense.account}</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Amount & Actions */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600">-₹{(expense.amount || 0).toLocaleString("en-IN")}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteExpense(expenseId)}
                      >
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
    </div >
  )
}
