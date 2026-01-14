"use client"

import { useState } from "react"
import { useInteriors, type InteriorProject } from "@/lib/contexts/interiors-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Building2, Trash2, MapPin, Calendar, Loader2, IndianRupee } from "lucide-react"

const projectTypes = ["Full Home", "Kitchen", "Bedroom", "Living Room", "Bathroom", "Office", "Commercial", "Other"] as const
const projectStatuses = ["Enquiry", "Quotation Sent", "Confirmed", "In Progress", "On Hold", "Completed", "Cancelled"] as const

export function InteriorsProjectsModule() {
    const { projects, clients, loading, addProject, updateProject, deleteProject } = useInteriors()
    const { toast } = useToast()
    const [showAddProject, setShowAddProject] = useState(false)
    const [viewingProject, setViewingProject] = useState<InteriorProject | null>(null)
    const [activeTab, setActiveTab] = useState("all")
    const [updatingProject, setUpdatingProject] = useState<InteriorProject | null>(null)
    const [updateAmount, setUpdateAmount] = useState<number>(0)
    const [saving, setSaving] = useState(false)

    const generateProjectNumber = () => {
        const date = new Date()
        const prefix = `PRJ${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`
        const monthProjects = projects.filter((p) => p.projectNumber.startsWith(prefix))

        // Find the maximum sequence number for this month
        let maxSeq = 0
        monthProjects.forEach(p => {
            const parts = p.projectNumber.split("-")
            if (parts.length > 1) {
                const seq = parseInt(parts[1])
                if (!isNaN(seq) && seq > maxSeq) maxSeq = seq
            }
        })

        return `${prefix}-${String(maxSeq + 1).padStart(3, "0")}`
    }

    const [newProject, setNewProject] = useState<Partial<InteriorProject>>({
        projectNumber: generateProjectNumber(),
        clientId: "",
        projectName: "",
        siteAddress: "",
        projectType: "Full Home",
        estimatedValue: 0,
        advanceReceived: 0,
        balanceAmount: 0,
        startDate: new Date().toISOString().split("T")[0],
        expectedEndDate: "",
        actualEndDate: "",
        status: "Enquiry",
        description: "",
    })

    const updateFinancials = (field: "estimatedValue" | "advanceReceived", value: number) => {
        const estimated = field === "estimatedValue" ? value : newProject.estimatedValue || 0
        const advance = field === "advanceReceived" ? value : newProject.advanceReceived || 0
        setNewProject({
            ...newProject,
            [field]: value,
            balanceAmount: estimated - advance,
        })
    }

    const handleAddProject = async () => {
        setSaving(true)
        try {
            await addProject({
                projectNumber: newProject.projectNumber || generateProjectNumber(),
                clientId: newProject.clientId || "",
                projectName: newProject.projectName || "",
                siteAddress: newProject.siteAddress || "",
                projectType: newProject.projectType as InteriorProject["projectType"],
                estimatedValue: newProject.estimatedValue || 0,
                advanceReceived: newProject.advanceReceived || 0,
                balanceAmount: newProject.balanceAmount || 0,
                startDate: newProject.startDate || null,
                expectedEndDate: newProject.expectedEndDate || null,
                actualEndDate: newProject.actualEndDate || null,
                status: newProject.status as InteriorProject["status"],
                description: newProject.description || "",
            })

            setShowAddProject(false)
            toast({
                title: "Project Added",
                description: "The project has been created successfully.",
            })
            setNewProject({
                projectNumber: generateProjectNumber(),
                clientId: "",
                projectName: "",
                siteAddress: "",
                projectType: "Full Home",
                estimatedValue: 0,
                advanceReceived: 0,
                balanceAmount: 0,
                startDate: new Date().toISOString().split("T")[0],
                expectedEndDate: "",
                actualEndDate: "",
                status: "Enquiry",
                description: "",
            })
        } catch (error: any) {
            console.error("Failed to add project:", error)
            toast({
                title: "Error",
                description: error.message || "Failed to add project. Please try again.",
                variant: "destructive",
            })
        } finally {
            setSaving(false)
        }
    }

    const handleUpdateProjectStatus = async (projectId: string, status: InteriorProject["status"]) => {
        try {
            const updates: Partial<InteriorProject> = { status }
            if (status === "Completed") {
                updates.actualEndDate = new Date().toISOString().split("T")[0]
            }
            await updateProject(projectId, updates)
        } catch (error) {
            console.error("Failed to update project:", error)
        }
    }

    const handleUpdatePayment = async () => {
        if (!updatingProject) return
        setSaving(true)
        try {
            const projectId = updatingProject.id || updatingProject._id || ""
            const advanceReceived = (updatingProject.advanceReceived || 0) + updateAmount
            const balanceAmount = (updatingProject.estimatedValue || 0) - advanceReceived
            await updateProject(projectId, {
                advanceReceived,
                balanceAmount
            })
            setUpdatingProject(null)
            setUpdateAmount(0)
        } catch (error) {
            console.error("Failed to update payment:", error)
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteProject = async (id: string) => {
        try {
            await deleteProject(id)
            toast({
                title: "Project Deleted",
                description: "The project has been removed successfully.",
            })
        } catch (error) {
            console.error("Failed to delete project:", error)
            toast({
                title: "Error",
                description: "Failed to delete project. Please try again.",
                variant: "destructive",
            })
        }
    }

    const filteredProjects = activeTab === "all"
        ? projects
        : projects.filter((p) => p.status === activeTab)

    const getStatusColor = (status: InteriorProject["status"]) => {
        switch (status) {
            case "Enquiry":
                return "bg-purple-100 text-purple-800"
            case "Quotation Sent":
                return "bg-indigo-100 text-indigo-800"
            case "Confirmed":
                return "bg-green-100 text-green-800"
            case "In Progress":
                return "bg-blue-100 text-blue-800"
            case "On Hold":
                return "bg-amber-100 text-amber-800"
            case "Completed":
                return "bg-emerald-100 text-emerald-800"
            case "Cancelled":
                return "bg-red-100 text-red-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Projects</h2>
                    <p className="text-sm text-muted-foreground">Track your interior design projects</p>
                </div>
                <Dialog open={showAddProject} onOpenChange={setShowAddProject}>
                    <DialogTrigger asChild>
                        <Button className="w-full sm:w-auto">
                            <Plus className="w-4 h-4 mr-2" />
                            New Project
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl">
                        <DialogHeader>
                            <DialogTitle>Create New Project</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Project Number</Label>
                                    <Input
                                        value={newProject.projectNumber}
                                        onChange={(e) => setNewProject({ ...newProject, projectNumber: e.target.value })}
                                        placeholder="e.g., PRJ202601-001"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Client *</Label>
                                    <Select value={newProject.clientId} onValueChange={(v) => setNewProject({ ...newProject, clientId: v })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select client" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {clients.map((c) => {
                                                const clientId = c.id || c._id;
                                                if (!clientId) return null;
                                                return (
                                                    <SelectItem key={clientId} value={clientId}>
                                                        {c.name} - {c.mobile}
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Project Name *</Label>
                                    <Input
                                        value={newProject.projectName}
                                        onChange={(e) => setNewProject({ ...newProject, projectName: e.target.value })}
                                        placeholder="e.g., Kumar Villa Interior"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Project Type</Label>
                                    <Select
                                        value={newProject.projectType}
                                        onValueChange={(v) => setNewProject({ ...newProject, projectType: v as InteriorProject["projectType"] })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {projectTypes.map((t) => (
                                                <SelectItem key={t} value={t}>
                                                    {t}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Site Address</Label>
                                <Input
                                    value={newProject.siteAddress}
                                    onChange={(e) => setNewProject({ ...newProject, siteAddress: e.target.value })}
                                    placeholder="Full site address"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Estimated Value (₹)</Label>
                                    <Input
                                        type="number"
                                        value={newProject.estimatedValue}
                                        onChange={(e) => updateFinancials("estimatedValue", Number(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Advance Received (₹)</Label>
                                    <Input
                                        type="number"
                                        value={newProject.advanceReceived}
                                        onChange={(e) => updateFinancials("advanceReceived", Number(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Balance Amount</Label>
                                    <Input
                                        value={`₹${(newProject.balanceAmount || 0).toLocaleString("en-IN")}`}
                                        disabled
                                        className="bg-muted font-bold"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Start Date</Label>
                                    <Input
                                        type="date"
                                        value={newProject.startDate || ""}
                                        onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Expected End Date</Label>
                                    <Input
                                        type="date"
                                        value={newProject.expectedEndDate || ""}
                                        onChange={(e) => setNewProject({ ...newProject, expectedEndDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select
                                        value={newProject.status}
                                        onValueChange={(v) => setNewProject({ ...newProject, status: v as InteriorProject["status"] })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {projectStatuses.map((s) => (
                                                <SelectItem key={s} value={s}>
                                                    {s}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={newProject.description}
                                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                    placeholder="Project details, scope, requirements..."
                                    rows={3}
                                />
                            </div>

                            <Button onClick={handleAddProject} className="w-full" disabled={!newProject.clientId || !newProject.projectName || saving}>
                                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Create Project
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Status Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="flex-wrap h-auto gap-1">
                    <TabsTrigger value="all">All ({projects.length})</TabsTrigger>
                    <TabsTrigger value="Enquiry">Enquiry ({projects.filter((p) => p.status === "Enquiry").length})</TabsTrigger>
                    <TabsTrigger value="Quotation Sent">Quotation ({projects.filter((p) => p.status === "Quotation Sent").length})</TabsTrigger>
                    <TabsTrigger value="In Progress">In Progress ({projects.filter((p) => p.status === "In Progress").length})</TabsTrigger>
                    <TabsTrigger value="Completed">Completed ({projects.filter((p) => p.status === "Completed").length})</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Projects List */}
            {filteredProjects.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No projects found.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {filteredProjects.map((project) => {
                        const client = clients.find((c) => (c.id || c._id) === project.clientId)
                        const projectId = project.id || project._id || ""
                        return (
                            <Card key={projectId} className="overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="flex flex-col p-4 gap-4">
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <h3 className="font-bold text-base md:text-lg truncate">{project.projectName}</h3>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusColor(project.status)}`}>
                                                        {project.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs md:text-sm text-muted-foreground truncate">
                                                    {client?.name || "Unknown Client"} • {project.projectNumber}
                                                </p>
                                                {project.siteAddress && (
                                                    <p className="text-xs md:text-sm text-muted-foreground mt-1.5 flex items-center gap-1.5 truncate">
                                                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                                                        {project.siteAddress}
                                                    </p>
                                                )}
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider font-bold">
                                                    <span className="flex items-center gap-1.5">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {project.startDate ? new Date(project.startDate).toLocaleDateString("en-IN") : "No Start"}
                                                    </span>
                                                    <span className="px-2 py-0.5 bg-muted rounded">
                                                        {project.projectType}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4 p-3 bg-muted/30 rounded-xl sm:bg-transparent sm:p-0">
                                                <div className="text-left sm:text-right">
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Estimated Value</p>
                                                    <p className="text-lg md:text-xl font-black">₹{(project.estimatedValue || 0).toLocaleString("en-IN")}</p>
                                                </div>
                                                <div className="text-right flex flex-col items-end gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-xs md:text-sm font-bold text-emerald-600">
                                                            Received: ₹{(project.advanceReceived || 0).toLocaleString("en-IN")}
                                                        </p>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                            onClick={() => {
                                                                setUpdatingProject(project)
                                                                setUpdateAmount(0)
                                                            }}
                                                            title="Update Payment"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <p className="text-[10px] md:text-xs font-bold text-red-600">
                                                            Expenses: ₹{useInteriors().expenses
                                                                .filter((e) => (e.projectId === projectId))
                                                                .reduce((sum, e) => sum + e.amount, 0)
                                                                .toLocaleString("en-IN")}
                                                        </p>
                                                        <p className="text-[10px] md:text-xs font-bold text-blue-600">
                                                            Profit: ₹{(project.estimatedValue - (useInteriors().expenses
                                                                .filter((e) => (e.projectId === projectId))
                                                                .reduce((sum, e) => sum + e.amount, 0))).toLocaleString("en-IN")}
                                                        </p>
                                                    </div>
                                                    {(project.balanceAmount || 0) > 0 && (
                                                        <p className="text-xs md:text-sm font-bold text-amber-600 mt-1">
                                                            Due: ₹{(project.balanceAmount || 0).toLocaleString("en-IN")}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-3 border-t border-border/50">
                                            <div className="flex-1 sm:flex-none">
                                                <Select
                                                    value={project.status}
                                                    onValueChange={(v) => handleUpdateProjectStatus(projectId, v as InteriorProject["status"])}
                                                >
                                                    <SelectTrigger className="h-9 w-full sm:w-40 font-medium">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {projectStatuses.map((s) => (
                                                            <SelectItem key={s} value={s}>
                                                                {s}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1 sm:flex-none h-9 px-4 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 font-bold"
                                                    onClick={() => {
                                                        setUpdatingProject(project)
                                                        setUpdateAmount(0)
                                                    }}
                                                >
                                                    <IndianRupee className="w-3.5 h-3.5 mr-1.5" />
                                                    Update Payment
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1 sm:flex-none h-9 px-4"
                                                    onClick={() => setViewingProject(project)}
                                                >
                                                    Details
                                                </Button>
                                                <Button variant="outline" size="icon" className="h-9 w-9 text-destructive" onClick={() => handleDeleteProject(projectId)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
            {/* Project Details Dialog */}
            <Dialog open={!!viewingProject} onOpenChange={(open) => !open && setViewingProject(null)}>
                <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Project Details - {viewingProject?.projectName}</DialogTitle>
                    </DialogHeader>
                    {viewingProject && (
                        <div className="space-y-6 pt-4">
                            {/* Financial Summary */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-3 bg-muted rounded-xl">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Value</p>
                                    <p className="text-lg font-black">₹{(viewingProject.estimatedValue || 0).toLocaleString("en-IN")}</p>
                                </div>
                                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                                    <p className="text-[10px] text-emerald-700 uppercase font-bold tracking-wider">Received</p>
                                    <p className="text-lg font-black text-emerald-700">₹{(viewingProject.advanceReceived || 0).toLocaleString("en-IN")}</p>
                                </div>
                                <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                                    <p className="text-[10px] text-red-700 uppercase font-bold tracking-wider">Expenses</p>
                                    <p className="text-lg font-black text-red-700">
                                        ₹{useInteriors().expenses
                                            .filter((e) => (e.projectId === (viewingProject.id || viewingProject._id)))
                                            .reduce((sum, e) => sum + e.amount, 0)
                                            .toLocaleString("en-IN")}
                                    </p>
                                </div>
                                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                                    <p className="text-[10px] text-blue-700 uppercase font-bold tracking-wider">Net Profit</p>
                                    <p className="text-lg font-black text-blue-700">
                                        ₹{(viewingProject.estimatedValue - (useInteriors().expenses
                                            .filter((e) => (e.projectId === (viewingProject.id || viewingProject._id)))
                                            .reduce((sum, e) => sum + e.amount, 0))).toLocaleString("en-IN")}
                                    </p>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Project Info</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between py-1 border-b border-border/50">
                                                <span className="text-muted-foreground">Number</span>
                                                <span className="font-medium text-foreground">{viewingProject.projectNumber}</span>
                                            </div>
                                            <div className="flex justify-between py-1 border-b border-border/50">
                                                <span className="text-muted-foreground">Type</span>
                                                <span className="font-medium text-foreground">{viewingProject.projectType}</span>
                                            </div>
                                            <div className="flex justify-between py-1 border-b border-border/50">
                                                <span className="text-muted-foreground">Start Date</span>
                                                <span className="font-medium text-foreground">{viewingProject.startDate ? new Date(viewingProject.startDate).toLocaleDateString("en-IN") : "N/A"}</span>
                                            </div>
                                            <div className="flex justify-between py-1 border-b border-border/50">
                                                <span className="text-muted-foreground">Expected End</span>
                                                <span className="font-medium text-foreground">{viewingProject.expectedEndDate ? new Date(viewingProject.expectedEndDate).toLocaleDateString("en-IN") : "N/A"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Description</h4>
                                        <p className="text-sm text-foreground bg-muted/50 p-3 rounded-lg min-h-[80px]">
                                            {viewingProject.description || "No description provided."}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Expense Breakdown</h4>
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                        {useInteriors().expenses
                                            .filter((e) => (e.projectId === (viewingProject.id || viewingProject._id)))
                                            .length === 0 ? (
                                            <p className="text-xs text-muted-foreground italic py-4 text-center">No expenses recorded for this project.</p>
                                        ) : (
                                            useInteriors().expenses
                                                .filter((e) => (e.projectId === (viewingProject.id || viewingProject._id)))
                                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                                .map((expense) => (
                                                    <div key={expense.id || expense._id} className="flex flex-col p-2.5 bg-muted/50 rounded-lg gap-1 border border-border/50">
                                                        <div className="flex justify-between items-start">
                                                            <span className="text-xs font-bold text-foreground truncate max-w-[150px]">{expense.description}</span>
                                                            <span className="text-xs font-black text-red-600">₹{expense.amount.toLocaleString("en-IN")}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                                                            <span>{new Date(expense.date).toLocaleDateString("en-IN")} • {expense.type}</span>
                                                            <span className="px-1.5 py-0.5 bg-background rounded border border-border/50 uppercase font-bold">{expense.paymentMode}</span>
                                                        </div>
                                                    </div>
                                                ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-border/50 flex justify-end">
                                <Button onClick={() => setViewingProject(null)}>Close Details</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Update Payment Dialog */}
            <Dialog open={!!updatingProject} onOpenChange={(open) => !open && setUpdatingProject(null)}>
                <DialogContent className="max-w-md w-[95vw] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Update Payment - {updatingProject?.projectName}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="p-3 bg-muted rounded-lg space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Total Estimated:</span>
                                <span className="font-bold">₹{(updatingProject?.estimatedValue || 0).toLocaleString("en-IN")}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Previously Received:</span>
                                <span className="font-bold text-emerald-600">₹{(updatingProject?.advanceReceived || 0).toLocaleString("en-IN")}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Current Balance:</span>
                                <span className="font-bold text-amber-600">₹{(updatingProject?.balanceAmount || 0).toLocaleString("en-IN")}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>New Payment Amount (₹)</Label>
                            <Input
                                type="number"
                                placeholder="Enter amount received"
                                value={updateAmount || ""}
                                onChange={(e) => setUpdateAmount(Number(e.target.value))}
                            />
                            <p className="text-[10px] text-muted-foreground italic">
                                This amount will be added to the previously received total.
                            </p>
                        </div>

                        {updatingProject && updateAmount > 0 && (
                            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-emerald-800 font-medium">New Balance will be:</span>
                                    <span className="text-sm font-bold text-emerald-900">
                                        ₹{((updatingProject.balanceAmount || 0) - updateAmount).toLocaleString("en-IN")}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <Button variant="outline" className="flex-1" onClick={() => setUpdatingProject(null)}>
                                Cancel
                            </Button>
                            <Button
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                onClick={handleUpdatePayment}
                                disabled={saving || updateAmount <= 0}
                            >
                                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Save Payment
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
