"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"

export function useRequireAuth() {
    const { isAuthenticated, isLoading, loadFromStorage } = useAuthStore()
    const router = useRouter()

    useEffect(() => {
        loadFromStorage()
    }, [loadFromStorage])

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/login")
        }
    }, [isLoading, isAuthenticated, router])

    return { isAuthenticated, isLoading }
}

export function useRedirectIfAuth() {
    const { isAuthenticated, isLoading, loadFromStorage } = useAuthStore()
    const router = useRouter()

    useEffect(() => {
        loadFromStorage()
    }, [loadFromStorage])

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.push("/dashboard")
        }
    }, [isLoading, isAuthenticated, router])

    return { isAuthenticated, isLoading }
}
