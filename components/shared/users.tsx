"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Users, Trash2, Loader2, Pencil, Shield, User, Search, Eye, EyeOff } from "lucide-react"

interface UserData {
    id: string
    email: string
    name: string
    role: "admin" | "user"
    allowedBusinesses: string[]
    createdAt: string
}

const businessOptions = [
    { id: "cnc-shop", label: "Shri Shyam CNC" },
    { id: "interiors", label: "Jangid Homes Interiors" },
    { id: "drapes", label: "Jangid Drapes" },
]

interface FormData {
    email: string
    password: string
    name: string
    role: "admin" | "user"
    allowedBusinesses: string[]
}

const initialFormData: FormData = {
    email: "",
    password: "",
    name: "",
    role: "user",
    allowedBusinesses: ["cnc-shop"],
}

export function UsersManagement() {
    const { data: session } = useSession()
    const [users, setUsers] = useState<UserData[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [search, setSearch] = useState("")
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [editingUser, setEditingUser] = useState<UserData | null>(null)
    const [formData, setFormData] = useState<FormData>(initialFormData)
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const currentUserId = (session?.user as any)?.id

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true)
            const res = await fetch(`/api/users?search=${encodeURIComponent(search)}`)
            if (!res.ok) throw new Error("Failed to fetch users")
            const data = await res.json()
            setUsers(data.users || [])
        } catch (err) {
            console.error("Failed to fetch users:", err)
            setError("Failed to load users")
        } finally {
            setLoading(false)
        }
    }, [search])

    useEffect(() => {
        fetchUsers()
    }, [fetchUsers])

    const toggleBusiness = (businessId: string) => {
        setFormData((prev) => {
            const exists = prev.allowedBusinesses.includes(businessId)
            const newList = exists
                ? prev.allowedBusinesses.filter((b) => b !== businessId)
                : [...prev.allowedBusinesses, businessId]
            return { ...prev, allowedBusinesses: newList.length > 0 ? newList : [businessId] }
        })
    }

    const handleAddUser = async () => {
        if (!formData.email || !formData.password || !formData.name) {
            setError("Please fill in all required fields")
            return
        }
        if (formData.allowedBusinesses.length === 0) {
            setError("Please select at least one business access")
            return
        }

        setSaving(true)
        setError(null)

        try {
            const res = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Failed to create user")
            }

            await fetchUsers()
            setShowAddDialog(false)
            setFormData(initialFormData)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    const handleEditUser = async () => {
        if (!editingUser) return

        setSaving(true)
        setError(null)

        try {
            const updateData: Partial<FormData> = {
                email: formData.email,
                name: formData.name,
                role: formData.role,
                allowedBusinesses: formData.allowedBusinesses,
            }
            if (formData.password) updateData.password = formData.password

            const res = await fetch(`/api/users/${editingUser.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updateData),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Failed to update user")
            }

            await fetchUsers()
            setShowEditDialog(false)
            setEditingUser(null)
            setFormData(initialFormData)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteUser = async (userId: string) => {
        setDeleting(userId)
        setError(null)

        try {
            const res = await fetch(`/api/users/${userId}`, { method: "DELETE" })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Failed to delete user")
            }
            await fetchUsers()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setDeleting(null)
        }
    }

    const openEditDialog = (user: UserData) => {
        setEditingUser(user)
        setFormData({
            email: user.email,
            password: "",
            name: user.name,
            role: user.role,
            allowedBusinesses: user.allowedBusinesses,
        })
        setShowEditDialog(true)
    }

    if (loading && users.length === 0) {
        return (
            <div className="flex items-center justify-center h-48">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-semibold text-foreground">User Management</h2>
                    <span className="text-sm text-muted-foreground">{users.length} users</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-9 w-40 pl-9 text-sm"
                        />
                    </div>
                    <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="h-8 text-xs">
                                <Plus className="w-3.5 h-3.5 mr-1.5" />
                                Add User
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg w-[95vw] rounded-2xl">
                            <DialogHeader>
                                <DialogTitle>Add New User</DialogTitle>
                                <DialogDescription>Create a new user with business access permissions.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={(e) => { e.preventDefault(); handleAddUser() }} className="space-y-4 pt-4">
                                {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
                                <div className="space-y-2">
                                    <Label>Full Name *</Label>
                                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter name" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email *</Label>
                                    <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Enter email" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Password *</Label>
                                    <div className="relative">
                                        <Input type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Min 8 characters" className="pr-10" />
                                        <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full w-10" onClick={() => setShowPassword(!showPassword)}>
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v as "admin" | "user" })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="user">User</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-3">
                                    <Label>Business Access *</Label>
                                    <div className="space-y-2">
                                        {businessOptions.map((biz) => (
                                            <div key={biz.id} className="flex items-center space-x-2">
                                                <Checkbox id={`add-${biz.id}`} checked={formData.allowedBusinesses.includes(biz.id)} onCheckedChange={() => toggleBusiness(biz.id)} />
                                                <label htmlFor={`add-${biz.id}`} className="text-sm cursor-pointer">{biz.label}</label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <Button type="submit" className="w-full" disabled={saving}>
                                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Create User
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Error */}
            {error && !showAddDialog && !showEditDialog && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    {error}
                    <Button variant="ghost" size="sm" className="ml-2 h-auto p-1" onClick={() => setError(null)}>×</Button>
                </div>
            )}

            {/* User List */}
            {users.length === 0 ? (
                <Card className="border shadow-sm">
                    <CardContent className="py-10 text-center">
                        <Users className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground">No users found</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-3">
                    {users.map((user) => {
                        const isCurrentUser = user.id === currentUserId
                        return (
                            <Card key={user.id} className="border shadow-sm hover:shadow-md transition-all">
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${user.role === "admin" ? "bg-amber-100 dark:bg-amber-950/30" : "bg-blue-100 dark:bg-blue-950/30"}`}>
                                            {user.role === "admin" ? <Shield className="w-4 h-4 text-amber-600" /> : <User className="w-4 h-4 text-blue-600" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-base font-semibold truncate">{user.name}</p>
                                                <Badge variant={user.role === "admin" ? "default" : "secondary"} className="text-[10px] uppercase">{user.role}</Badge>
                                                {isCurrentUser && <Badge variant="outline" className="text-[10px]">You</Badge>}
                                            </div>
                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                            <div className="flex flex-wrap gap-1 mt-1.5">
                                                {user.allowedBusinesses.map((b) => (
                                                    <Badge key={b} variant="outline" className="text-[9px] px-1.5 py-0">
                                                        {businessOptions.find((o) => o.id === b)?.label || b}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(user)}>
                                                <Pencil className="w-3.5 h-3.5" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" disabled={isCurrentUser || deleting === user.id}>
                                                        {deleting === user.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                                                        <AlertDialogDescription>Delete &quot;{user.name}&quot;? This cannot be undone.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="max-w-lg w-[95vw] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>Update user details and business access.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); handleEditUser() }} className="space-y-4 pt-4">
                        {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
                        <div className="space-y-2">
                            <Label>Full Name *</Label>
                            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Email *</Label>
                            <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>New Password (optional)</Label>
                            <Input type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Leave empty to keep current" />
                        </div>
                        <div className="space-y-2">
                            <Label>Role</Label>
                            <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v as "admin" | "user" })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-3">
                            <Label>Business Access *</Label>
                            <div className="space-y-2">
                                {businessOptions.map((biz) => (
                                    <div key={biz.id} className="flex items-center space-x-2">
                                        <Checkbox id={`edit-${biz.id}`} checked={formData.allowedBusinesses.includes(biz.id)} onCheckedChange={() => toggleBusiness(biz.id)} />
                                        <label htmlFor={`edit-${biz.id}`} className="text-sm cursor-pointer">{biz.label}</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={saving}>
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save Changes
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
