"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Lock, Eye, EyeOff, Loader2, ShieldCheck, ArrowLeft } from "lucide-react"

interface ReportsGuardProps {
    children: React.ReactNode
    onCancel?: () => void
}

export function ReportsGuard({ children, onCancel }: ReportsGuardProps) {
    // Always locked every time Reports is opened
    const [isUnlocked, setIsUnlocked] = useState(false)
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!password.trim()) {
            setError("Please enter your password")
            return
        }

        setLoading(true)
        setError(null)

        try {
            const res = await fetch("/api/auth/verify-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Incorrect password")
            }

            setIsUnlocked(true)
            setPassword("")
        } catch (err: any) {
            setError(err.message || "Incorrect password. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const handleLock = () => {
        setIsUnlocked(false)
        setPassword("")
    }

    if (isUnlocked) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center bg-muted/40 px-3.5 py-1.5 rounded-lg border border-border/50 text-xs">
                    <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                        <ShieldCheck className="w-4 h-4 text-green-600" />
                        Reports Section Unlocked
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1 hover:bg-muted"
                        onClick={handleLock}
                        title="Lock Reports Section"
                    >
                        <Lock className="w-3.5 h-3.5" />
                        Lock
                    </Button>
                </div>
                {children}
            </div>
        )
    }

    return (
        <div className="flex items-center justify-center min-h-[60vh] p-4">
            <Card className="w-full max-w-md border shadow-lg rounded-2xl">
                <CardHeader className="text-center pb-2">
                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-primary/20 shadow-sm">
                        <Lock className="w-7 h-7 text-primary" />
                    </div>
                    <CardTitle className="text-xl font-bold">Reports Security Verification</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-1.5">
                        This section contains sensitive business revenue, financial breakdown, and collection reports. Enter your password to unlock.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                    <form onSubmit={handleUnlock} className="space-y-4">
                        {error && (
                            <div className="p-3 text-xs rounded-lg bg-destructive/10 text-destructive border border-destructive/20 font-medium">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="report-password">Account Password</Label>
                            <div className="relative">
                                <Input
                                    id="report-password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value)
                                        if (error) setError(null)
                                    }}
                                    className="pr-10"
                                    autoFocus
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full w-10 text-muted-foreground hover:text-foreground"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            {onCancel && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={onCancel}
                                >
                                    <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                                    Cancel
                                </Button>
                            )}
                            <Button type="submit" className="flex-1" disabled={loading || !password}>
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Unlock Reports
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

