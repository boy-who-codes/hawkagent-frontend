"use client"

import { AppShell } from "@/components/layout/app-shell"
import { useRequireAuth } from "@/hooks/use-auth"

export default function ChatLayout({ children }: { children: React.ReactNode }) {
    const { isLoading } = useRequireAuth()
    if (isLoading) return null
    return <AppShell>{children}</AppShell>
}
