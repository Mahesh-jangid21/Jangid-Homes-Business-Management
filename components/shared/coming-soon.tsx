"use client"

import { usePortal } from "@/lib/contexts/portal-context"
import { Construction } from "lucide-react"

export function ComingSoon() {
  const { currentBusiness } = usePortal()

  return (
    <div className="flex-1 flex items-center justify-center py-10 md:py-20">
      <div className="text-center max-w-xl p-6 md:p-8 bg-card border border-border rounded-2xl shadow-sm relative overflow-hidden group mx-4">
        <div className="relative z-10">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
            <Construction className="w-8 h-8 md:w-10 md:h-10 text-primary" />
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 md:mb-4">
            {currentBusiness.name}
          </h2>

          <p className="text-sm md:text-base text-muted-foreground mb-6 md:mb-8 leading-relaxed">
            We're building the management system for <span className="text-foreground font-semibold">{currentBusiness.name}</span>.
            This module will be available soon.
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-lg text-sm font-semibold text-primary border border-primary/10">
            <div className="w-2 h-2 bg-primary rounded-full" />
            Under Active Development
          </div>
        </div>
      </div>
    </div>
  )
}
