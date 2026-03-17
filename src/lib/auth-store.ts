"use client"

import { create } from "zustand"
import { authApi } from "./api"

interface User {
    id: number
    username: string
    email: string
}

interface AuthState {
    user: User | null
    isAuthenticated: boolean
    isLoading: boolean
    login: (email: string, password: string) => Promise<void>
    register: (email: string, password: string) => Promise<void>
    logout: () => void
    loadFromStorage: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,

    login: async (email, password) => {
        const resp = await authApi.login(email, password)
        localStorage.setItem("accessToken", resp.data.access)
        localStorage.setItem("refreshToken", resp.data.refresh)
        // Fetch user info
        try {
            const userResp = await authApi.getMe()
            set({ user: userResp.data, isAuthenticated: true, isLoading: false })
        } catch {
            set({ isAuthenticated: true, isLoading: false })
        }
    },

    register: async (email, password) => {
        await authApi.register(email, password)
        const loginResp = await authApi.login(email, password)
        localStorage.setItem("accessToken", loginResp.data.access)
        localStorage.setItem("refreshToken", loginResp.data.refresh)
        try {
            const userResp = await authApi.getMe()
            set({ user: userResp.data, isAuthenticated: true, isLoading: false })
        } catch {
            set({ isAuthenticated: true, isLoading: false })
        }
    },

    logout: () => {
        localStorage.removeItem("accessToken")
        localStorage.removeItem("refreshToken")
        set({ user: null, isAuthenticated: false, isLoading: false })
        if (typeof window !== "undefined") {
            window.location.href = "/login"
        }
    },

    loadFromStorage: async () => {
        const token = localStorage.getItem("accessToken")
        if (!token) {
            set({ isLoading: false })
            return
        }
        try {
            const userResp = await authApi.getMe()
            set({ user: userResp.data, isAuthenticated: true, isLoading: false })
        } catch {
            set({ isAuthenticated: false, isLoading: false })
        }
    },
}))
