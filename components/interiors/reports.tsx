"use client"

import { useInteriors } from "@/lib/contexts/interiors-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, TrendingUp, Users, PieChart } from "lucide-react"

export function InteriorsReportsModule() {
    const { clients, projects, expenses } = useInteriors()

    // Calculate monthly data
    const months = Array.from({ length: 6 }, (_, i) => {
        const date = new Date()
        date.setMonth(date.getMonth() - (5 - i))
        return date.toISOString().slice(0, 7)
    })

    const monthlyData = months.map((month) => {
        const monthProjects = (projects || []).filter((p) => (p.createdAt || "").startsWith(month))
        const monthExpenses = (expenses || []).filter((e) => (e.date || "").startsWith(month))
        return {
            month,
            label: new Date(month + "-01").toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
            projectsCount: monthProjects.length,
            projectsValue: monthProjects.reduce((sum, p) => sum + (p.estimatedValue || 0), 0),
            expenses: monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0),
        }
    })

    // Referral breakdown
    const referralStats = clients.reduce((acc, client) => {
        acc[client.referralType] = (acc[client.referralType] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    const referralData = Object.entries(referralStats)
        .map(([type, count]) => ({ type, count, percentage: Math.round((count / clients.length) * 100) || 0 }))
        .sort((a, b) => b.count - a.count)

    // Project status breakdown
    const statusStats = projects.reduce((acc, project) => {
        acc[project.status] = (acc[project.status] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    const statusData = Object.entries(statusStats)
        .map(([status, count]) => ({ status, count, percentage: Math.round((count / projects.length) * 100) || 0 }))
        .sort((a, b) => b.count - a.count)

    // Expense breakdown by type
    const expenseStats = expenses.reduce((acc, expense) => {
        acc[expense.type] = (acc[expense.type] || 0) + expense.amount
        return acc
    }, {} as Record<string, number>)

    const totalExpenses = (expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0)
    const expenseData = Object.entries(expenseStats)
        .map(([type, amount]) => ({ type, amount, percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0 }))
        .sort((a, b) => b.amount - a.amount)

    // Overall stats
    const totalRevenue = projects.reduce((sum, p) => sum + p.advanceReceived, 0)
    const totalEstimated = projects.reduce((sum, p) => sum + p.estimatedValue, 0)
    const pendingPayments = projects.reduce((sum, p) => sum + p.balanceAmount, 0)
    const netProfit = totalRevenue - totalExpenses

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            "Enquiry": "bg-purple-500",
            "Quotation Sent": "bg-indigo-500",
            "Confirmed": "bg-green-500",
            "In Progress": "bg-blue-500",
            "On Hold": "bg-amber-500",
            "Completed": "bg-emerald-500",
            "Cancelled": "bg-red-500",
        }
        return colors[status] || "bg-gray-500"
    }

    const getReferralColor = (type: string) => {
        const colors: Record<string, string> = {
            "Client": "bg-blue-500",
            "Architect": "bg-purple-500",
            "Contractor": "bg-orange-500",
            "Website": "bg-green-500",
            "Social Media": "bg-pink-500",
            "Walk-in": "bg-amber-500",
            "Other": "bg-gray-500",
        }
        return colors[type] || "bg-gray-500"
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold text-foreground">Reports</h2>
                <p className="text-sm text-muted-foreground">Business analytics and insights</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Project Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{(totalEstimated || 0).toLocaleString("en-IN")}</div>
                        <p className="text-xs text-muted-foreground">Total Budget</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Revenue Collected</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">₹{(totalRevenue || 0).toLocaleString("en-IN")}</div>
                        <p className="text-xs text-muted-foreground">Received</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">₹{(totalExpenses || 0).toLocaleString("en-IN")}</div>
                        <p className="text-xs text-muted-foreground">Total Spent</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                            ₹{(netProfit || 0).toLocaleString("en-IN")}
                        </div>
                        <p className="text-xs text-muted-foreground">Revenue - Expenses</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="monthly" className="space-y-4">
                <TabsList className="flex-wrap h-auto gap-1 p-1">
                    <TabsTrigger value="monthly" className="flex items-center gap-2 flex-1 sm:flex-none">
                        <BarChart3 className="w-4 h-4" />
                        Monthly
                    </TabsTrigger>
                    <TabsTrigger value="referrals" className="flex items-center gap-2 flex-1 sm:flex-none">
                        <Users className="w-4 h-4" />
                        Referrals
                    </TabsTrigger>
                    <TabsTrigger value="projects" className="flex items-center gap-2 flex-1 sm:flex-none">
                        <PieChart className="w-4 h-4" />
                        Projects
                    </TabsTrigger>
                    <TabsTrigger value="expenses" className="flex items-center gap-2 flex-1 sm:flex-none">
                        <TrendingUp className="w-4 h-4" />
                        Expenses
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="monthly" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Monthly Performance (Last 6 Months)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {monthlyData.map((month) => (
                                    <div key={month.month} className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium">{month.label}</span>
                                            <span className="text-muted-foreground">
                                                {month.projectsCount} projects • ₹{month.projectsValue.toLocaleString("en-IN")}
                                            </span>
                                        </div>
                                        <div className="flex gap-2 h-6">
                                            <div
                                                className="bg-emerald-500 rounded"
                                                style={{ width: `${Math.max(5, (month.projectsValue / (Math.max(...monthlyData.map(m => m.projectsValue)) || 1)) * 100)}%` }}
                                                title={`Revenue: ₹${month.projectsValue.toLocaleString("en-IN")}`}
                                            />
                                            <div
                                                className="bg-red-400 rounded"
                                                style={{ width: `${Math.max(2, (month.expenses / (Math.max(...monthlyData.map(m => m.expenses)) || 1)) * 50)}%` }}
                                                title={`Expenses: ₹${month.expenses.toLocaleString("en-IN")}`}
                                            />
                                        </div>
                                    </div>
                                ))}
                                <div className="flex gap-4 text-xs text-muted-foreground pt-2">
                                    <span className="flex items-center gap-1">
                                        <div className="w-3 h-3 bg-emerald-500 rounded" />
                                        Project Value
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <div className="w-3 h-3 bg-red-400 rounded" />
                                        Expenses
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="referrals" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Client Acquisition by Referral Source</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {referralData.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">No client data available</p>
                            ) : (
                                <div className="space-y-3">
                                    {referralData.map((item) => (
                                        <div key={item.type} className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium">{item.type}</span>
                                                <span className="text-muted-foreground">{item.count} clients ({item.percentage}%)</span>
                                            </div>
                                            <div className="h-3 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${getReferralColor(item.type)} rounded-full`}
                                                    style={{ width: `${item.percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="projects" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Projects by Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {statusData.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">No project data available</p>
                            ) : (
                                <div className="space-y-3">
                                    {statusData.map((item) => (
                                        <div key={item.status} className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium">{item.status}</span>
                                                <span className="text-muted-foreground">{item.count} projects ({item.percentage}%)</span>
                                            </div>
                                            <div className="h-3 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${getStatusColor(item.status)} rounded-full`}
                                                    style={{ width: `${item.percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="expenses" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Expense Breakdown by Category</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {expenseData.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">No expense data available</p>
                            ) : (
                                <div className="space-y-3">
                                    {expenseData.map((item) => (
                                        <div key={item.type} className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium">{item.type}</span>
                                                <span className="text-muted-foreground">
                                                    ₹{item.amount.toLocaleString("en-IN")} ({item.percentage}%)
                                                </span>
                                            </div>
                                            <div className="h-3 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-red-500 rounded-full"
                                                    style={{ width: `${item.percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
