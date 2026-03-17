"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "next-themes"
import { useAuthStore } from "@/lib/auth-store"

function AuthHydrator({ children }: { children: React.ReactNode }) {
    const loadFromStorage = useAuthStore((s) => s.loadFromStorage)
    const [hydrated, setHydrated] = useState(false)

    useEffect(() => {
        loadFromStorage().finally(() => setHydrated(true))
    }, [loadFromStorage])

    if (!hydrated) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-background">
                <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        retry: 1,
                        refetchOnWindowFocus: false,
                    },
                },
            })
    )

    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
        >
            <QueryClientProvider client={queryClient}>
                <AuthHydrator>{children}</AuthHydrator>
                <Toaster richColors position="top-right" />
            </QueryClientProvider>
        </ThemeProvider>
    )
}
