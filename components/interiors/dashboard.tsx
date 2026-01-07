"use client"

import { useInteriors } from "@/lib/contexts/interiors-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Building2, TrendingUp, IndianRupee, AlertTriangle, Clock, CheckCircle2, Loader2 } from "lucide-react"

export function InteriorsDashboard() {
    const { clients, projects, expenses, loading } = useInteriors()

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    const today = new Date().toISOString().split("T")[0]
    const thisMonth = new Date().toISOString().slice(0, 7)

    // Project stats
    const activeProjects = projects.filter((p) =>
        ["Confirmed", "In Progress"].includes(p.status)
    )
    const enquiries = projects.filter((p) => p.status === "Enquiry")
    const completedProjects = projects.filter((p) => p.status === "Completed")
    const onHoldProjects = projects.filter((p) => p.status === "On Hold")

    // Financial stats
    const totalEstimatedValue = projects.reduce((sum, p) => sum + p.estimatedValue, 0)
    const totalReceived = projects.reduce((sum, p) => sum + p.advanceReceived, 0)
    const pendingPayments = projects.reduce((sum, p) => sum + p.balanceAmount, 0)

    // This month stats
    const newClientsThisMonth = clients.filter((c) => c.createdAt.startsWith(thisMonth)).length
    const newProjectsThisMonth = projects.filter((p) => p.createdAt.startsWith(thisMonth)).length
    const monthExpenses = expenses.filter((e) => e.date.startsWith(thisMonth)).reduce((sum, e) => sum + e.amount, 0)

    // Pending enquiries (older than 3 days)
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    const pendingEnquiries = enquiries.filter((p) =>
        new Date(p.createdAt) < threeDaysAgo
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
                    <p className="text-muted-foreground">Jangid Homes Interiors - Business Overview</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] md:text-sm font-medium text-muted-foreground bg-muted/50 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full border border-border/50">
                    <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <Card className="hover-lift border border-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 p-3 md:p-6">
                        <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Revenue</CardTitle>
                        <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                    </CardHeader>
                    <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
                        <div className="text-lg md:text-2xl font-bold">₹{(totalReceived || 0).toLocaleString("en-IN")}</div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Received</p>
                    </CardContent>
                </Card>

                <Card className="hover-lift border border-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 p-3 md:p-6">
                        <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Pending</CardTitle>
                        <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                    </CardHeader>
                    <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
                        <div className="text-lg md:text-2xl font-bold text-amber-600">₹{(pendingPayments || 0).toLocaleString("en-IN")}</div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Collect</p>
                    </CardContent>
                </Card>

                <Card className="hover-lift border border-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 p-3 md:p-6">
                        <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active</CardTitle>
                        <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    </CardHeader>
                    <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
                        <div className="text-lg md:text-2xl font-bold">{activeProjects.length}</div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{enquiries.length} enquiries</p>
                    </CardContent>
                </Card>

                <Card className="hover-lift border border-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 p-3 md:p-6">
                        <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Clients</CardTitle>
                        <Users className="w-3.5 h-3.5 text-purple-600" />
                    </CardHeader>
                    <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
                        <div className="text-lg md:text-2xl font-bold">{clients.length}</div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Registered</p>
                    </CardContent>
                </Card>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <Card className="border border-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 p-4 md:p-6">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Month Overview</CardTitle>
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
                        <div className="space-y-1.5">
                            <div className="flex justify-between">
                                <span className="text-xs text-muted-foreground">Projects</span>
                                <span className="text-sm font-medium">{newProjectsThisMonth}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-xs text-muted-foreground">Expenses</span>
                                <span className="text-sm font-medium">₹{(monthExpenses || 0).toLocaleString("en-IN")}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 p-4 md:p-6">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Completed</CardTitle>
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
                        <div className="text-xl md:text-2xl font-bold text-green-600">{completedProjects.length}</div>
                        <p className="text-[10px] text-muted-foreground">Projects done</p>
                    </CardContent>
                </Card>

                <Card className="border border-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 p-4 md:p-6">
                        <CardTitle className="text-xs font-medium text-muted-foreground">On Hold</CardTitle>
                        <Clock className="w-4 h-4 text-amber-600" />
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
                        <div className="text-xl md:text-2xl font-bold text-amber-600">{onHoldProjects.length}</div>
                        <p className="text-[10px] text-muted-foreground">Paused</p>
                    </CardContent>
                </Card>
            </div>

            {/* Alerts */}
            {pendingEnquiries.length > 0 && (
                <Card className="border-amber-200 bg-amber-50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-amber-800 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Pending Enquiries - Follow up required
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {pendingEnquiries.slice(0, 5).map((project) => {
                                const client = clients.find((c) => c.id === project.clientId)
                                return (
                                    <div key={project.id} className="flex justify-between text-sm">
                                        <span className="text-amber-900">
                                            {project.projectName} - {client?.name || "Unknown"}
                                        </span>
                                        <span className="font-medium text-amber-800">
                                            ₹{(project.estimatedValue || 0).toLocaleString("en-IN")}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Active Projects List */}
            {activeProjects.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Active Projects</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {activeProjects.slice(0, 5).map((project) => {
                                const client = clients.find((c) => c.id === project.clientId)
                                return (
                                    <div key={project.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                                        <div>
                                            <p className="font-medium">{project.projectName}</p>
                                            <p className="text-sm text-muted-foreground">{client?.name || "Unknown"} • {project.projectType}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium">₹{(project.estimatedValue || 0).toLocaleString("en-IN")}</p>
                                            <span
                                                className={`text-xs px-2 py-1 rounded ${project.status === "In Progress" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                                                    }`}
                                            >
                                                {project.status}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
