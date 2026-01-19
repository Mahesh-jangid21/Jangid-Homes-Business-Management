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
  paymentMethod?: 'Cash' | 'UPI' | 'Card' | 'Bank'
  paidBy?: 'Kamal Jangid' | 'Hiralal Jangid'
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
  clientSnapshot?: {  // Snapshot of client data at order time
    name: string
    mobile: string
    type?: string
    address?: string
  }
  designType: string
  materials: {
    materialId: string
    materialSnapshot?: {  // Snapshot of material data at order time
      type: string
      size: string
      thickness: number
    }
    quantity: number
    width?: number
    height?: number
    cost: number
  }[]
  labourCost: number
  totalValue: number
  advanceReceived: number
  payments?: {
    amount: number;
    date: string;
    method: 'Cash' | 'UPI' | 'Card' | 'Bank';
    account?: 'Kamal Jangid' | 'Hiralal Jangid'
  }[]
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
  paymentMode: "Cash" | "Bank" | "UPI" | "Card"
  account?: "Kamal Jangid" | "Hiralal Jangid"
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
  // Order filtering by month
  fetchOrdersByMonth: (month: number, year: number) => Promise<void>
  ordersLoading: boolean
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
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Note: Orders are NOT fetched here - they are fetched by month in the Orders component
      const [materialsRes, purchasesRes, clientsRes, expensesRes, wastagesRes, adjustmentsRes] = await Promise.all([
        fetch('/api/cnc/materials'),
        fetch('/api/cnc/purchases'),
        fetch('/api/cnc/clients'),
        fetch('/api/cnc/expenses'),
        fetch('/api/cnc/wastages'), 
        fetch('/api/cnc/adjustments'),
      ])

      const [materialsData, purchasesData, clientsData, expensesData, wastagesData, adjustmentsData] = await Promise.all([
        materialsRes.json(),
        purchasesRes.json(),
        clientsRes.json(),
        expensesRes.json(),
        wastagesRes.json(),
        adjustmentsRes.json(),
      ])

      setMaterials(Array.isArray(materialsData) ? materialsData.map(normalizeId) : [])
      setPurchases(Array.isArray(purchasesData) ? purchasesData.map(normalizeId) : [])
      setClients(Array.isArray(clientsData) ? clientsData.map(normalizeId) : [])
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

  // Fetch current month's orders on initial load (for Dashboard stats)
  const fetchCurrentMonthOrders = useCallback(async () => {
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()

    try {
      const res = await fetch(`/api/cnc/orders?month=${month}&year=${year}`)
      if (res.ok) {
        const data = await res.json()
        setOrders(Array.isArray(data) ? data.map(normalizeId) : [])
      }
    } catch (err) {
      console.error('Error fetching current month orders:', err)
    }
  }, [])

  useEffect(() => {
    const initData = async () => {
      await refreshData()
      await fetchCurrentMonthOrders()
    }
    initData()
  }, [refreshData, fetchCurrentMonthOrders])

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

  // Fetch orders for a specific month/year
  const fetchOrdersByMonth = async (month: number, year: number) => {
    setOrdersLoading(true)
    try {
      const res = await fetch(`/api/cnc/orders?month=${month}&year=${year}`)
      const data = await res.json()
      setOrders(Array.isArray(data) ? data.map(normalizeId) : [])
    } catch (err) {
      console.error('Error fetching orders by month:', err)
    } finally {
      setOrdersLoading(false)
    }
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
        fetchOrdersByMonth,
        ordersLoading,
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
                                                                                                          