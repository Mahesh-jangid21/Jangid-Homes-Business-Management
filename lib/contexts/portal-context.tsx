"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type BusinessType = "cnc-shop" | "interiors" | "drapes"

export type Business = {
  id: BusinessType
  name: string
  description: string
  icon: string
  color: string
}

export const businesses: Business[] = [
  {
    id: "cnc-shop",
    name: "Shri Shyam CNC",
    description: "CNC cutting & manufacturing",
    icon: "Scissors",
    color: "bg-amber-500",
  },
  {
    id: "interiors",
    name: "Jangid Homes Interiors",
    description: "Interior design & execution",
    icon: "Home",
    color: "bg-emerald-500",
  },
  {
    id: "drapes",
    name: "Jangid Drapes",
    description: "Curtains & soft furnishing",
    icon: "Blinds",
    color: "bg-violet-500",
  },
]

type PortalContextType = {
  activeBusiness: BusinessType
  setActiveBusiness: (b: BusinessType) => void
  currentBusiness: Business
}

const PortalContext = createContext<PortalContextType | null>(null)

export function PortalProvider({ children }: { children: ReactNode }) {
  const [activeBusiness, setActiveBusiness] = useState<BusinessType>("cnc-shop")
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("jangid-active-business")
    if (saved && ["cnc-shop", "interiors", "drapes"].includes(saved)) {
      setActiveBusiness(saved as BusinessType)
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) {
      localStorage.setItem("jangid-active-business", activeBusiness)
    }
  }, [activeBusiness, loaded])

  const currentBusiness = businesses.find((b) => b.id === activeBusiness) || businesses[0]

  if (!loaded) return null

  return (
    <PortalContext.Provider value={{ activeBusiness, setActiveBusiness, currentBusiness }}>
      {children}
    </PortalContext.Provider>
  )
}

export function usePortal() {
  const ctx = useContext(PortalContext)
  if (!ctx) throw new Error("usePortal must be used within PortalProvider")
  return ctx
}
