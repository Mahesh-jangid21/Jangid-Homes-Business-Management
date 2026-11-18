"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type BusinessType = "cnc-shop"

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
]

type PortalContextType = {
  activeBusiness: BusinessType
  setActiveBusiness: (b: BusinessType) => void
  currentBusiness: Business
}

const PortalContext = createContext<PortalContextType | null>(null)

export function PortalProvider({ children }: { children: ReactNode }) {
  const [activeBusiness] = useState<BusinessType>("cnc-shop")

  const currentBusiness = businesses[0]

  return (
    <PortalContext.Provider value={{ activeBusiness, setActiveBusiness: () => {}, currentBusiness }}>
      {children}
    </PortalContext.Provider>
  )
}

export function usePortal() {
  const ctx = useContext(PortalContext)
  if (!ctx) throw new Error("usePortal must be used within PortalProvider")
  return ctx
}
