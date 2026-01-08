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
          <p className="text-sm text-muted-foreground">Track your business expenses</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <Input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="h-10 w-full sm:w-40" />
          <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg w-[95vw] rounded-2xl">
              <DialogHeader>
                <DialogTitle>Add Expense</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
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
                <Button onClick={handleAddExpense} className="w-full" disabled={!newExpense.amount || saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Expense
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-2xl font-bold">₹{(totalExpenses || 0).toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>
        {Object.entries(expensesByType)
          .filter(([, amount]) => amount > 0)
          .slice(0, 3)
          .map(([type, amount]) => (
            <Card key={type}>
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground">{type}</p>
                <p className="text-2xl font-bold">₹{(amount || 0).toLocaleString("en-IN")}</p>
              </CardContent>
            </Card>
          ))}
      </div>

      {
        filteredExpenses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No expenses recorded for this month.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {filteredExpenses.map((expense) => {
              const expenseId = expense.id || expense._id || ""
              return (
                <Card key={expenseId} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                          <Receipt className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-base truncate">{expense.description || "No description"}</p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                            <span className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-bold uppercase">{expense.type}</span>
                            <span>{expense.date ? new Date(expense.date).toLocaleDateString("en-IN") : "No date"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/50">
                        <div className="text-left sm:text-right">
                          <p className="text-lg md:text-xl font-black text-red-600">-₹{(expense.amount || 0).toLocaleString("en-IN")}</p>
                          <div className="flex items-center justify-end gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                            <span>{expense.paymentMode}</span>
                            {expense.account && (
                              <span className="px-1.5 py-0.5 bg-red-50 text-red-600 border border-red-100 rounded">
                                {expense.account.split(' ')[0]}
                              </span>
                            )}
                          </div>
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
        )
      }
    </div >
  )
}
