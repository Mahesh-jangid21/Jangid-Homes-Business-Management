"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  History,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Shield,
  Filter,
  Calendar,
  User,
  Activity,
  Layers,
  ClipboardList,
  Package,
  Receipt,
  Users as UsersIcon,
  Trash2,
  Lock,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AuditLogItem {
  _id: string
  action: string
  module: string
  description: string
  userName: string
  userEmail: string
  userRole: string
  metadata?: Record<string, any>
  createdAt: string
}

interface PaginationInfo {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

const MODULE_OPTIONS = [
  { value: "all", label: "All Modules" },
  { value: "Orders", label: "Orders" },
  { value: "Inventory", label: "Inventory" },
  { value: "Clients", label: "Clients" },
  { value: "Purchases", label: "Purchases" },
  { value: "Expenses", label: "Expenses" },
  { value: "Wastage", label: "Wastage" },
]

export function AuditLogsManagement() {
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role

  const [logs, setLogs] = useState<AuditLogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedModule, setSelectedModule] = useState("all")
  const [searchInput, setSearchInput] = useState("")
  const [activeSearch, setActiveSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  })

  // Fetch audit logs with pagination and filters
  const fetchLogs = useCallback(
    async (targetPage: number = page, targetModule: string = selectedModule, query: string = activeSearch) => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        params.set("page", targetPage.toString())
        params.set("limit", "20")
        if (targetModule && targetModule !== "all") {
          params.set("module", targetModule)
        }
        if (query.trim()) {
          params.set("search", query.trim())
        }

        const res = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })

        if (!res.ok) {
          if (res.status === 403) {
            throw new Error("Access denied. Admin privileges required.")
          }
          throw new Error("Failed to load audit logs.")
        }

        const data = await res.json()
        setLogs(data.logs || [])
        setPagination(
          data.pagination || {
            page: targetPage,
            limit: 20,
            totalCount: 0,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          }
        )
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred while fetching logs.")
      } finally {
        setLoading(false)
      }
    },
    [page, selectedModule, activeSearch]
  )

  useEffect(() => {
    fetchLogs(page, selectedModule, activeSearch)
  }, [page, selectedModule, activeSearch, fetchLogs])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    setActiveSearch(searchInput)
  }

  const handleModuleChange = (newModule: string) => {
    setSelectedModule(newModule)
    setPage(1)
  }

  const handleClearSearch = () => {
    setSearchInput("")
    setActiveSearch("")
    setPage(1)
  }

  // Get module badge styling
  const getModuleBadge = (mod: string) => {
    switch (mod) {
      case "Orders":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
      case "Inventory":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
      case "Purchases":
        return "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-800"
      case "Expenses":
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800"
      case "Wastage":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
      case "Clients":
        return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800"
      case "Users":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300"
      case "staff":
        return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300"
      default:
        return "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300"
    }
  }

  if (userRole !== "admin") {
    return (
      <Card className="border border-border shadow-xs">
        <CardContent className="py-16 text-center space-y-3">
          <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/40 rounded-full flex items-center justify-center mx-auto text-rose-600">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Admin Access Restricted</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Activity audit logs are strictly reserved for Administrator accounts.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-card rounded-2xl border border-border shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">Audit & Activity Logs</h1>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs px-2 py-0.5">
                Admin Only
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live chronological activity tracking for orders, materials, stock adjustments, and shop operations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs(page, selectedModule, activeSearch)}
            disabled={loading}
            className="h-8 text-xs gap-1.5 shadow-xs"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border border-border/80 shadow-xs">
        <CardContent className="p-3 sm:p-4 space-y-3">
          <div className="flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-center justify-between">
            {/* Module Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {MODULE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleModuleChange(opt.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                    selectedModule === opt.value
                      ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search action, user, order #..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="h-8 pl-8 pr-7 text-xs bg-background"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                  >
                    ×
                  </button>
                )}
              </div>
              <Button type="submit" size="sm" className="h-8 px-3 text-xs">
                Search
              </Button>
            </form>
          </div>

          {activeSearch && (
            <div className="text-xs text-muted-foreground flex items-center justify-between pt-1 border-t border-border/40">
              <span>
                Showing results matching: <strong>"{activeSearch}"</strong>
              </span>
              <button
                type="button"
                onClick={handleClearSearch}
                className="text-primary hover:underline font-medium text-xs"
              >
                Clear Search
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logs Table / Cards */}
      <Card className="border border-border shadow-xs overflow-hidden">
        {loading ? (
          <CardContent className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 mx-auto text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Fetching activity logs...</p>
          </CardContent>
        ) : error ? (
          <CardContent className="py-16 text-center space-y-2 text-destructive">
            <p className="font-semibold text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={() => fetchLogs()} className="text-xs">
              Try Again
            </Button>
          </CardContent>
        ) : logs.length === 0 ? (
          <CardContent className="py-20 text-center space-y-2">
            <History className="w-10 h-10 mx-auto text-muted-foreground/60" />
            <h3 className="font-semibold text-base text-foreground">No Audit Logs Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {activeSearch || selectedModule !== "all"
                ? "No logs match the current filters. Try resetting the search or module."
                : "Activity logs will start appearing here as orders, materials, and expenses are created."}
            </p>
          </CardContent>
        ) : (
          <div className="divide-y divide-border/60">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border/60">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-3">Module</th>
                    <th className="py-3 px-3">Action</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-3">Performed By</th>
                    <th className="py-3 px-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-normal">
                  {logs.map((log) => {
                    const dateObj = new Date(log.createdAt)
                    const formattedDate = dateObj.toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                    const formattedTime = dateObj.toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })

                    return (
                      <tr key={log._id} className="hover:bg-muted/30 transition-colors">
                        {/* Timestamp */}
                        <td className="py-3 px-4 whitespace-nowrap text-muted-foreground">
                          <div className="font-medium text-foreground">{formattedDate}</div>
                          <div className="text-[11px] text-muted-foreground">{formattedTime}</div>
                        </td>

                        {/* Module */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5 font-semibold", getModuleBadge(log.module))}>
                            {log.module}
                          </Badge>
                        </td>

                        {/* Action Code */}
                        <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] font-medium text-muted-foreground">
                          {log.action}
                        </td>

                        {/* Description */}
                        <td className="py-3 px-4">
                          <p className="font-medium text-foreground text-xs leading-relaxed max-w-md">
                            {log.description}
                          </p>
                        </td>

                        {/* User & Role */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-foreground text-xs">{log.userName}</span>
                            <Badge variant="outline" className={cn("text-[9.5px] px-1.5 py-0 font-medium", getRoleBadge(log.userRole))}>
                              {log.userRole}
                            </Badge>
                          </div>
                          {log.userEmail && (
                            <div className="text-[10.5px] text-muted-foreground truncate max-w-[130px]">
                              {log.userEmail}
                            </div>
                          )}
                        </td>

                        {/* Metadata Details */}
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          {log.metadata && Object.keys(log.metadata).length > 0 ? (
                            <div className="flex flex-col items-end gap-0.5 text-[10.5px] text-muted-foreground">
                              {Object.entries(log.metadata).slice(0, 2).map(([k, v]) => (
                                <span key={k}>
                                  {k}: <strong className="text-foreground font-mono">{String(v)}</strong>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] text-muted-foreground/50">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Card View */}
            <div className="md:hidden divide-y divide-border/50">
              {logs.map((log) => {
                const dateObj = new Date(log.createdAt)
                const formattedDate = dateObj.toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                })
                const formattedTime = dateObj.toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })

                return (
                  <div key={log._id} className="p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5 font-semibold", getModuleBadge(log.module))}>
                          {log.module}
                        </Badge>
                        <span className="text-[10px] font-mono text-muted-foreground">{log.action}</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                        {formattedDate}, {formattedTime}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-foreground leading-snug">
                      {log.description}
                    </p>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="font-semibold text-foreground text-xs">{log.userName}</span>
                        <Badge variant="outline" className={cn("text-[9px] px-1 py-0", getRoleBadge(log.userRole))}>
                          {log.userRole}
                        </Badge>
                      </div>

                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {Object.entries(log.metadata).slice(0, 1).map(([k, v]) => (
                            <span key={k}>{k}: {String(v)}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-3 sm:p-4 bg-muted/30 border-t border-border/60 flex items-center justify-between flex-wrap gap-2 text-xs">
            <span className="text-muted-foreground">
              Showing page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.totalCount} total entries)
            </span>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPrevPage || loading}
                className="h-8 text-xs gap-1 shadow-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={!pagination.hasNextPage || loading}
                className="h-8 text-xs gap-1 shadow-xs"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
