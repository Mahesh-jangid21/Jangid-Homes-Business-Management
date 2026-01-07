"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

export type Material = {
  _id?: string
  id?: string
  type: "Acrylic" | "WPC" | "MDF" | "HDMR" | "Plywood" | "Wood"
  size: string
  thickness: number
  openingStock: number
  currentStock: number
  lowStockAlert: number
  rate: number
}

export type Purchase = {
  _id?: string
  id?: string
  materialId: string
  date: string
  supplier: string
  quantity: number
  rate: number
  total: number
}

export type Client = {
  _id?: string
  id?: string
  name: string
  mobile: string
  address: string
  gst: string
  type: "Architect" | "Contractor" | "Shop" | "Individual" | "Other"
  outstandingBalance: number
}

export type Order = {
  _id?: string
  id?: string
  orderNumber: string
  date: string
  clientId: string
  designType: string
  materials: { materialId: string; quantity: number; cost: number }[]
  labourCost: number
  totalValue: number
  advanceReceived: number
  balanceAmount: number
  deliveryDate: string
  status: "Pending" | "In Progress" | "Completed" | "Billed"
}

export type Expense = {
  _id?: string
  id?: string
  date: string
  type: "Raw Material" | "Labour" | "Electricity" | "Rent" | "Maintenance" | "Transport" | "Misc"
  description: string
  amount: number
  paymentMode: "Cash" | "Bank" | "UPI"
}

export type Wastage = {
  _id?: string
  id?: string
  materialId: string
  date: string
  quantity: number
  reason: string
}

export type StockAdjustment = {
  _id?: string
  id?: string
  materialId: string
  date: string
  previousStock: number
  newStock: number
  adjustment: number
  reason: string
}

type CNCContextType = {
  materials: Material[]
  purchases: Purchase[]
  clients: Client[]
  orders: Order[]
  expenses: Expense[]
  wastages: Wastage[]
  adjustments: StockAdjustment[]
  loading: boolean
  error: string | null
  // Material operations
  addMaterial: (m: Omit<Material, '_id' | 'id'>) => Promise<void>
  updateMaterial: (id: string, m: Partial<Material>) => Promise<void>
  deleteMaterial: (id: string) => Promise<void>
  // Purchase operations
  addPurchase: (p: Omit<Purchase, '_id' | 'id'>) => Promise<void>
  // Client operations
  addClient: (c: Omit<Client, '_id' | 'id'>) => Promise<void>
  updateClient: (id: string, c: Partial<Client>) => Promise<void>
  deleteClient: (id: string) => Promise<void>
  // Order operations
  addOrder: (o: Omit<Order, '_id' | 'id'>) => Promise<void>
  updateOrder: (id: string, o: Partial<Order>) => Promise<void>
  deleteOrder: (id: string) => Promise<void>
  // Expense operations
  addExpense: (e: Omit<Expense, '_id' | 'id'>) => Promise<void>
  deleteExpense: (id: string) => Promise<void>
  // Wastage operations
  addWastage: (w: Omit<Wastage, '_id' | 'id'>) => Promise<void>
  // Stock Adjustment operations
  reconcileStock: (a: { materialId: string; newStock: number; reason: string; date: string }) => Promise<void>
  // Refresh
  refreshData: () => Promise<void>
}

const CNCContext = createContext<CNCContextType | null>(null)

const normalizeId = <T extends { _id?: string; id?: string }>(item: T): T & { id: string } => ({
  ...item,
  id: item._id || item.id || '',
})

export function CNCProvider({ children }: { children: ReactNode }) {
  const [materials, setMaterials] = useState<Material[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [wastages, setWastages] = useState<Wastage[]>([])
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [materialsRes, purchasesRes, clientsRes, ordersRes, expensesRes, wastagesRes, adjustmentsRes] = await Promise.all([
        fetch('/api/cnc/materials'),
        fetch('/api/cnc/purchases'),
        fetch('/api/cnc/clients'),
        fetch('/api/cnc/orders'),
        fetch('/api/cnc/expenses'),
        fetch('/api/cnc/wastages'),
        fetch('/api/cnc/adjustments'),
      ])

      const [materialsData, purchasesData, clientsData, ordersData, expensesData, wastagesData, adjustmentsData] = await Promise.all([
        materialsRes.json(),
        purchasesRes.json(),
        clientsRes.json(),
        ordersRes.json(),
        expensesRes.json(),
        wastagesRes.json(),
        adjustmentsRes.json(),
      ])

      setMaterials(Array.isArray(materialsData) ? materialsData.map(normalizeId) : [])
      setPurchases(Array.isArray(purchasesData) ? purchasesData.map(normalizeId) : [])
      setClients(Array.isArray(clientsData) ? clientsData.map(normalizeId) : [])
      setOrders(Array.isArray(ordersData) ? ordersData.map(normalizeId) : [])
      setExpenses(Array.isArray(expensesData) ? expensesData.map(normalizeId) : [])
      setWastages(Array.isArray(wastagesData) ? wastagesData.map(normalizeId) : [])
      setAdjustments(Array.isArray(adjustmentsData) ? adjustmentsData.map(normalizeId) : [])
    } catch (err) {
      console.error('Error fetching CNC data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  const addMaterial = async (m: Omit<Material, '_id' | 'id'>) => {
    const res = await fetch('/api/cnc/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(m),
    })
    if (!res.ok) throw new Error('Failed to add material')
    const newMaterial = await res.json()
    setMaterials((prev) => [normalizeId(newMaterial), ...prev])
  }

  const updateMaterial = async (id: string, m: Partial<Material>) => {
    const res = await fetch(`/api/cnc/materials/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(m),
    })
    if (!res.ok) throw new Error('Failed to update material')
    const updated = await res.json()
    setMaterials((prev) => prev.map((mat) => (mat.id === id || mat._id === id) ? normalizeId(updated) : mat))
  }

  const deleteMaterial = async (id: string) => {
    const res = await fetch(`/api/cnc/materials/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete material')
    setMaterials((prev) => prev.filter((m) => m.id !== id && m._id !== id))
  }

  const addPurchase = async (p: Omit<Purchase, '_id' | 'id'>) => {
    const res = await fetch('/api/cnc/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p),
    })
    if (!res.ok) throw new Error('Failed to add purchase')
    const newPurchase = await res.json()
    setPurchases((prev) => [normalizeId(newPurchase), ...prev])
    await refreshData()
  }

  const addClient = async (c: Omit<Client, '_id' | 'id'>) => {
    const res = await fetch('/api/cnc/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(c),
    })
    if (!res.ok) throw new Error('Failed to add client')
    const newClient = await res.json()
    setClients((prev) => [normalizeId(newClient), ...prev])
  }

  const updateClient = async (id: string, c: Partial<Client>) => {
    const res = await fetch(`/api/cnc/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(c),
    })
    if (!res.ok) throw new Error('Failed to update client')
    const updated = await res.json()
    setClients((prev) => prev.map((client) => (client.id === id || client._id === id) ? normalizeId(updated) : client))
  }

  const deleteClient = async (id: string) => {
    const res = await fetch(`/api/cnc/clients/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete client')
    setClients((prev) => prev.filter((c) => c.id !== id && c._id !== id))
  }

  const addOrder = async (o: Omit<Order, '_id' | 'id'>) => {
    const res = await fetch('/api/cnc/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(o),
    })
    if (!res.ok) throw new Error('Failed to add order')
    const newOrder = await res.json()
    setOrders((prev) => [normalizeId(newOrder), ...prev])
    await refreshData()
  }

  const updateOrder = async (id: string, o: Partial<Order>) => {
    const res = await fetch(`/api/cnc/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(o),
    })
    if (!res.ok) throw new Error('Failed to update order')
    const updated = await res.json()
    setOrders((prev) => prev.map((order) => (order.id === id || order._id === id) ? normalizeId(updated) : order))
  }

  const deleteOrder = async (id: string) => {
    const res = await fetch(`/api/cnc/orders/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete order')
    setOrders((prev) => prev.filter((o) => o.id !== id && o._id !== id))
  }

  const addExpense = async (e: Omit<Expense, '_id' | 'id'>) => {
    const res = await fetch('/api/cnc/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(e),
    })
    if (!res.ok) throw new Error('Failed to add expense')
    const newExpense = await res.json()
    setExpenses((prev) => [normalizeId(newExpense), ...prev])
  }

  const deleteExpense = async (id: string) => {
    const res = await fetch(`/api/cnc/expenses/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete expense')
    setExpenses((prev) => prev.filter((e) => e.id !== id && e._id !== id))
  }

  const addWastage = async (w: Omit<Wastage, '_id' | 'id'>) => {
    const res = await fetch('/api/cnc/wastages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(w),
    })
    if (!res.ok) throw new Error('Failed to add wastage')
    const newWastage = await res.json()
    setWastages((prev) => [normalizeId(newWastage), ...prev])
    await refreshData()
  }

  const reconcileStock = async (a: { materialId: string; newStock: number; reason: string; date: string }) => {
    const res = await fetch('/api/cnc/adjustments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(a),
    })
    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.error || 'Failed to reconcile stock')
    }
    const newAdjustment = await res.json()
    setAdjustments((prev) => [normalizeId(newAdjustment), ...prev])
    await refreshData()
  }

  return (
    <CNCContext.Provider
      value={{
        materials,
        purchases,
        clients,
        orders,
        expenses,
        wastages,
        adjustments,
        loading,
        error,
        addMaterial,
        updateMaterial,
        deleteMaterial,
        addPurchase,
        addClient,
        updateClient,
        deleteClient,
        addOrder,
        updateOrder,
        deleteOrder,
        addExpense,
        deleteExpense,
        addWastage,
        reconcileStock,
        refreshData,
      }}
    >
      {children}
    </CNCContext.Provider>
  )
}

export function useCNC() {
  const ctx = useContext(CNCContext)
  if (!ctx) throw new Error("useCNC must be used within CNCProvider")
  return ctx
}

export const useApp = useCNC
export const AppProvider = CNCProvider
