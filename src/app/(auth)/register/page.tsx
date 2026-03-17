"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { Bird, ArrowRight, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useAuthStore } from "@/lib/auth-store"
import { useRedirectIfAuth } from "@/hooks/use-auth"

export default function RegisterPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const register = useAuthStore((s) => s.register)
    const router = useRouter()
    useRedirectIfAuth()

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await register(email, password)
            toast.success("Account created successfully!")
            router.push("/dashboard")
        } catch {
            toast.error("Failed to register. Email might already be in use.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            {/* Left side */}
            <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 bg-zinc-950 text-white relative overflow-hidden">
                <div className="relative z-10">
                    <Link href="/" className="flex items-center gap-3 font-bold text-2xl tracking-tight">
                        <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md border border-white/20">
                            <Bird className="h-6 w-6 text-white" />
                        </div>
                        Hawk Agent
                    </Link>
                </div>

                <div className="relative z-10 space-y-6 max-w-lg mb-12">
                    <h1 className="text-5xl font-extrabold tracking-tight leading-[1.1]">
                        Start hunting leads with boundless potential.
                    </h1>
                    <p className="text-lg text-zinc-400 font-medium">
                        Create an account to run AI-powered cold outreach campaigns and close high-value deals.
                    </p>
                </div>

                <div className="relative z-10 text-sm font-medium text-zinc-500">
                    © 2026 Hawk Agent. All rights reserved.
                </div>
            </div>

            {/* Right side */}
            <div className="flex-1 flex flex-col justify-center px-4 sm:px-12 lg:px-24 xl:px-32 relative">                <div className="mx-auto w-full max-w-sm sm:max-w-md space-y-8">
                    <div className="lg:hidden flex justify-center mb-8">
                        <div className="bg-primary/10 p-3 rounded-2xl">
                            <Bird className="h-8 w-8 text-primary" />
                        </div>
                    </div>

                    <div className="space-y-3 text-center lg:text-left">
                        <h2 className="text-3xl font-bold tracking-tight">Create an account</h2>
                        <p className="text-muted-foreground">Sign up to start your AI outreach journey.</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2 group">
                                <Label htmlFor="email" className="text-sm font-medium transition-colors group-focus-within:text-primary">
                                    Email Address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    className="h-12 bg-muted/20 border-border/50 focus:bg-background transition-all"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2 group">
                                <Label htmlFor="password" className="text-sm font-medium transition-colors group-focus-within:text-primary">
                                    Password
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    className="h-12 bg-muted/20 border-border/50 focus:bg-background transition-all"
                                    placeholder="Create a strong password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            className="w-full h-12 text-base font-medium transition-all"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            ) : (
                                <>Sign Up <ArrowRight className="ml-2 h-5 w-5" /></>
                            )}
                        </Button>
                    </form>

                    <div className="text-center text-sm font-medium text-muted-foreground">
                        Already have an account?{" "}
                        <Link href="/login" className="text-primary hover:underline font-semibold transition-colors">
                            Sign in here
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
