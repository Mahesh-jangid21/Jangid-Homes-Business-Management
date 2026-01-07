"use client"

import { usePortal, businesses } from "@/lib/contexts/portal-context"
import { cn } from "@/lib/utils"
import { Scissors, Home, Blinds, ChevronDown, Check } from "lucide-react"
import { useState, useRef, useEffect } from "react"

const iconMap = {
  Scissors,
  Home,
  Blinds,
}

export function BusinessSelector() {
  const { activeBusiness, setActiveBusiness, currentBusiness } = usePortal()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const CurrentIcon = iconMap[currentBusiness.icon as keyof typeof iconMap]

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-accent/50 hover:bg-accent border border-border transition-colors group"
      >
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shadow-sm", currentBusiness.color)}>
          <CurrentIcon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 text-left overflow-hidden">
          <p className="font-bold text-foreground text-sm truncate">{currentBusiness.name}</p>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">Switch Business</p>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-xl overflow-hidden z-[100]">
          {businesses.map((business) => {
            const Icon = iconMap[business.icon as keyof typeof iconMap]
            const isActive = activeBusiness === business.id
            return (
              <button
                key={business.id}
                onClick={() => {
                  setActiveBusiness(business.id)
                  setOpen(false)
                }}
                className={cn(
                  "w-full flex items-center gap-3 p-3 hover:bg-accent transition-colors border-b border-border last:border-0",
                  isActive && "bg-accent/50",
                )}
              >
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shadow-sm", business.color)}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 text-left overflow-hidden">
                  <p className="font-bold text-foreground text-sm">{business.name}</p>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase truncate">{business.description}</p>
                </div>
                {isActive && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
