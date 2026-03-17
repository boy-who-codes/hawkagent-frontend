"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/lib/auth-store"
import { Button } from "@/components/ui/button"
import {
    LayoutDashboard,
    MessageSquare,
    Megaphone,
    Users,
    FileEdit,
    BarChart3,
    Settings,
    LogOut,
    PanelLeftClose,
    PanelLeft,
    Bird,
    Moon,
    Sun,
} from "lucide-react"
import { useTheme } from "next-themes"

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/chat", label: "Hawk AI", icon: MessageSquare },
    { href: "/campaigns", label: "Campaigns", icon: Megaphone },
    { href: "/leads", label: "Leads", icon: Users },
    { href: "/drafts", label: "Draft Center", icon: FileEdit },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/settings", label: "Settings", icon: Settings },
]

export function AppShell({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const pathname = usePathname()
    const logout = useAuthStore((s) => s.logout)
    const user = useAuthStore((s) => s.user)
    const { theme, setTheme } = useTheme()

    const isActive = (href: string) => {
        if (href === "/dashboard") return pathname === "/dashboard"
        return pathname.startsWith(href)
    }

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background">
            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed md:relative z-50 flex flex-col h-full border-r bg-sidebar transition-all duration-300",
                    collapsed ? "w-[68px]" : "w-64",
                    mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                )}
            >
                {/* Brand */}
                <div className="flex items-center gap-3 p-4 border-b min-h-[60px]">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-chart-3 flex items-center justify-center shrink-0 glow-sm">
                        <Bird className="h-5 w-5 text-white" />
                    </div>
                    {!collapsed && (
                        <span className="font-bold text-lg tracking-tight whitespace-nowrap gradient-text">
                            Hawk Agent
                        </span>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCollapsed(!collapsed)}
                        className={cn("ml-auto shrink-0 hidden md:flex", collapsed && "ml-0")}
                    >
                        {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                    </Button>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const active = isActive(item.href)
                        return (
                            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                                <div
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                                        active
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                >
                                    <item.icon
                                        className={cn(
                                            "h-[18px] w-[18px] shrink-0 transition-colors",
                                            active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                        )}
                                    />
                                    {!collapsed && <span className="truncate">{item.label}</span>}
                                    {active && !collapsed && (
                                        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                                    )}
                                </div>
                            </Link>
                        )
                    })}
                </nav>

                {/* Bottom section */}
                <div className="p-3 border-t space-y-1">
                    <Button
                        variant="ghost"
                        size={collapsed ? "icon" : "default"}
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className={cn("w-full gap-3", !collapsed && "justify-start")}
                    >
                        {theme === "dark" ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
                        {!collapsed && <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
                    </Button>

                    {!collapsed && user && (
                        <div className="px-3 py-2 text-xs text-muted-foreground truncate">
                            {user.email}
                        </div>
                    )}

                    <Button
                        variant="ghost"
                        size={collapsed ? "icon" : "default"}
                        onClick={logout}
                        className={cn(
                            "w-full gap-3 text-muted-foreground hover:text-destructive",
                            !collapsed && "justify-start"
                        )}
                    >
                        <LogOut className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>Log out</span>}
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 h-full">
                {/* Top Bar */}
                <header className="flex items-center gap-4 px-6 border-b min-h-[60px] bg-background/80 backdrop-blur-md sticky top-0 z-30">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setMobileOpen(true)}
                    >
                        <PanelLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex-1" />
                    {user && (
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-chart-3 flex items-center justify-center text-xs font-bold text-white">
                                {user.email?.[0]?.toUpperCase() || "H"}
                            </div>
                        </div>
                    )}
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto">
                    <div className="transition-page">{children}</div>
                </main>
            </div>
        </div>
    )
}
