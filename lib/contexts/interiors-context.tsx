"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

// Interior Client with referral tracking
export type InteriorClient = {
    _id?: string
    id?: string
    name: string
    mobile: string
    email: string
    address: string
    referredBy: string
    referralType: "Client" | "Architect" | "Contractor" | "Website" | "Social Media" | "Walk-in" | "Other"
    notes: string
    createdAt: string
}

// Interior Project with full details
export type InteriorProject = {
    _id?: string
    id?: string
    projectNumber: string
    clientId: string
    projectName: string
    siteAddress: string
    projectType: "Full Home" | "Kitchen" | "Bedroom" | "Living Room" | "Bathroom" | "Office" | "Commercial" | "Other"
    estimatedValue: number
    advanceReceived: number
    balanceAmount: number
    startDate: string | null
    expectedEndDate: string | null
    actualEndDate: string | null
    status: "Enquiry" | "Quotation Sent" | "Confirmed" | "In Progress" | "On Hold" | "Completed" | "Cancelled"
    description: string
    createdAt: string
}

// Interior Expense
export type InteriorExpense = {
    _id?: string
    id?: string
    projectId: string
    date: string
    type: "Material" | "Labour" | "Transport" | "Site Expenses" | "Designer Fee" | "Vendor Payment" | "Misc"
    description: string
    amount: number
    paymentMode: "Cash" | "Bank" | "UPI" | "Cheque"
    vendor: string
}

type InteriorsContextType = {
    clients: InteriorClient[]
    projects: InteriorProject[]
    expenses: InteriorExpense[]
    loading: boolean
    error: string | null
    // Client operations
    addClient: (client: Omit<InteriorClient, '_id' | 'id' | 'createdAt'>) => Promise<void>
    updateClient: (id: string, client: Partial<InteriorClient>) => Promise<void>
    deleteClient: (id: string) => Promise<void>
    // Project operations
    addProject: (project: Omit<InteriorProject, '_id' | 'id' | 'createdAt'>) => Promise<void>
    updateProject: (id: string, project: Partial<InteriorProject>) => Promise<void>
    deleteProject: (id: string) => Promise<void>
    // Expense operations
    addExpense: (expense: Omit<InteriorExpense, '_id' | 'id'>) => Promise<void>
    updateExpense: (id: string, expense: Partial<InteriorExpense>) => Promise<void>
    deleteExpense: (id: string) => Promise<void>
    // Refresh data
    refreshData: () => Promise<void>
}

const InteriorsContext = createContext<InteriorsContextType | null>(null)

// Helper to normalize MongoDB _id to id
const normalizeId = <T extends { _id?: string; id?: string }>(item: T): T & { id: string } => ({
    ...item,
    id: item._id || item.id || '',
})

export function InteriorsProvider({ children }: { children: ReactNode }) {
    const [clients, setClients] = useState<InteriorClient[]>([])
    const [projects, setProjects] = useState<InteriorProject[]>([])
    const [expenses, setExpenses] = useState<InteriorExpense[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Fetch all data
    const refreshData = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const [clientsRes, projectsRes, expensesRes] = await Promise.all([
                fetch('/api/interiors/clients'),
                fetch('/api/interiors/projects'),
                fetch('/api/interiors/expenses'),
            ])

            if (!clientsRes.ok || !projectsRes.ok || !expensesRes.ok) {
                throw new Error('Failed to fetch data')
            }

            const [clientsData, projectsData, expensesData] = await Promise.all([
                clientsRes.json(),
                projectsRes.json(),
                expensesRes.json(),
            ])

            setClients(clientsData.map(normalizeId))
            setProjects(projectsData.map(normalizeId))
            setExpenses(expensesData.map(normalizeId))
        } catch (err) {
            console.error('Error fetching data:', err)
            setError(err instanceof Error ? err.message : 'Failed to fetch data')
        } finally {
            setLoading(false)
        }
    }, [])

    // Load data on mount
    useEffect(() => {
        refreshData()
    }, [refreshData])

    // Client operations
    const addClient = async (client: Omit<InteriorClient, '_id' | 'id' | 'createdAt'>) => {
        try {
            const res = await fetch('/api/interiors/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(client),
            })
            if (!res.ok) throw new Error('Failed to add client')
            const newClient = await res.json()
            setClients((prev) => [normalizeId(newClient), ...prev])
        } catch (err) {
            console.error('Error adding client:', err)
            throw err
        }
    }

    const updateClient = async (id: string, client: Partial<InteriorClient>) => {
        try {
            const res = await fetch(`/api/interiors/clients/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(client),
            })
            if (!res.ok) throw new Error('Failed to update client')
            const updatedClient = await res.json()
            setClients((prev) => prev.map((c) => (c.id === id || c._id === id) ? normalizeId(updatedClient) : c))
        } catch (err) {
            console.error('Error updating client:', err)
            throw err
        }
    }

    const deleteClient = async (id: string) => {
        try {
            const res = await fetch(`/api/interiors/clients/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to delete client')
            setClients((prev) => prev.filter((c) => c.id !== id && c._id !== id))
        } catch (err) {
            console.error('Error deleting client:', err)
            throw err
        }
    }

    // Project operations
    const addProject = async (project: Omit<InteriorProject, '_id' | 'id' | 'createdAt'>) => {
        try {
            const res = await fetch('/api/interiors/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(project),
            })
            if (!res.ok) {
                const errorData = await res.json()
                throw new Error(errorData.error || 'Failed to add project')
            }
            const newProject = await res.json()
            setProjects((prev) => [normalizeId(newProject), ...prev])
        } catch (err) {
            console.error('Error adding project:', err)
            throw err
        }
    }

    const updateProject = async (id: string, project: Partial<InteriorProject>) => {
        try {
            const res = await fetch(`/api/interiors/projects/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(project),
            })
            if (!res.ok) throw new Error('Failed to update project')
            const updatedProject = await res.json()
            setProjects((prev) => prev.map((p) => (p.id === id || p._id === id) ? normalizeId(updatedProject) : p))
        } catch (err) {
            console.error('Error updating project:', err)
            throw err
        }
    }

    const deleteProject = async (id: string) => {
        try {
            const res = await fetch(`/api/interiors/projects/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to delete project')
            setProjects((prev) => prev.filter((p) => p.id !== id && p._id !== id))
        } catch (err) {
            console.error('Error deleting project:', err)
            throw err
        }
    }

    // Expense operations
    const addExpense = async (expense: Omit<InteriorExpense, '_id' | 'id'>) => {
        try {
            const res = await fetch('/api/interiors/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(expense),
            })
            if (!res.ok) throw new Error('Failed to add expense')
            const newExpense = await res.json()
            setExpenses((prev) => [normalizeId(newExpense), ...prev])
        } catch (err) {
            console.error('Error adding expense:', err)
            throw err
        }
    }

    const updateExpense = async (id: string, expense: Partial<InteriorExpense>) => {
        try {
            const res = await fetch(`/api/interiors/expenses/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(expense),
            })
            if (!res.ok) throw new Error('Failed to update expense')
            const updatedExpense = await res.json()
            setExpenses((prev) => prev.map((e) => (e.id === id || e._id === id) ? normalizeId(updatedExpense) : e))
        } catch (err) {
            console.error('Error updating expense:', err)
            throw err
        }
    }

    const deleteExpense = async (id: string) => {
        try {
            const res = await fetch(`/api/interiors/expenses/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to delete expense')
            setExpenses((prev) => prev.filter((e) => e.id !== id && e._id !== id))
        } catch (err) {
            console.error('Error deleting expense:', err)
            throw err
        }
    }

    return (
        <InteriorsContext.Provider
            value={{
                clients,
                projects,
                expenses,
                loading,
                error,
                addClient,
                updateClient,
                deleteClient,
                addProject,
                updateProject,
                deleteProject,
                addExpense,
                updateExpense,
                deleteExpense,
                refreshData,
            }}
        >
            {children}
        </InteriorsContext.Provider>
    )
}

export function useInteriors() {
    const ctx = useContext(InteriorsContext)
    if (!ctx) throw new Error("useInteriors must be used within InteriorsProvider")
    return ctx
}
