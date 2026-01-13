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
    <div ref={ref} className="relative w-full">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-2 rounded-xl bg-card hover:bg-accent/50 border border-border shadow-sm transition-all duration-200 group text-left ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shadow-inner shrink-0 transition-transform group-hover:scale-105", currentBusiness.color)}>
          <CurrentIcon className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Current Workspace</p>
          <p className="font-bold text-sm text-foreground truncate leading-tight">{currentBusiness.name}</p>
        </div>

        <div className="flex flex-col gap-0.5 px-1">
          <ChevronDown className={cn("w-4 h-4 text-muted-foreground/70 transition-transform duration-300", open && "rotate-180 text-primary")} />
        </div>
      </button>

      <div className={cn(
        "absolute top-full left-0 right-0 mt-2 bg-popover/95 backdrop-blur-md border border-border/50 rounded-xl shadow-xl overflow-hidden z-[100] transition-all duration-200 origin-top",
        open ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
      )}>
        <div className="max-h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted">
          <div className="p-1.5 space-y-1">
            <p className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Switch Workspace</p>
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
                    "w-full flex items-center gap-3 p-2 rounded-lg transition-all group/item",
                    isActive ? "bg-accent shadow-sm" : "hover:bg-accent/50 hover:pl-2.5"
                  )}
                >
                  <div className={cn("w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-colors",
                    isActive ? business.color : "bg-muted text-muted-foreground group-hover/item:text-foreground group-hover/item:bg-muted/80"
                  )}>
                    <Icon className={cn("w-4 h-4", isActive ? "text-white" : "")} strokeWidth={2} />
                  </div>
                  <div className="flex-1 text-left overflow-hidden">
                    <p className={cn("text-sm font-medium truncate", isActive ? "text-foreground font-semibold" : "text-muted-foreground group-hover/item:text-foreground")}>
                      {business.name}
                    </p>
                  </div>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mr-1" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
