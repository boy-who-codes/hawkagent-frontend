import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
    baseURL: API_URL + "/api",
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor — attach JWT
api.interceptors.request.use(
    (config) => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("accessToken");
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — auto-refresh on 401
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = localStorage.getItem("refreshToken");
                if (refreshToken) {
                    const resp = await axios.post(`${API_URL}/api/auth/login/refresh/`, {
                        refresh: refreshToken,
                    });
                    const newAccess = resp.data.access;
                    localStorage.setItem("accessToken", newAccess);
                    originalRequest.headers.Authorization = `Bearer ${newAccess}`;
                    return api(originalRequest);
                }
            } catch {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                if (typeof window !== "undefined") {
                    window.location.href = "/login";
                }
            }
        }
        return Promise.reject(error);
    }
);

// ─── Auth API ────────────────────────────────────────────────────
export const authApi = {
    login: (email: string, password: string) =>
        api.post("/auth/login/", { username: email, password }),
    register: (email: string, password: string) =>
        api.post("/auth/register/", { email, password }),
    getMe: () => api.get("/auth/me/"),
    refreshToken: (refresh: string) =>
        api.post("/auth/login/refresh/", { refresh }),
    forgotPassword: (email: string) => 
        api.post("/auth/forgot-password/", { email }),
};

// ─── Campaign API ────────────────────────────────────────────────
export const campaignApi = {
    list: () => api.get("/campaigns/list/"),
    get: (id: number) => api.get(`/campaigns/list/${id}/`),
    create: (data: { name: string; description?: string; sender_mode?: string; auto_mode?: boolean }) =>
        api.post("/campaigns/list/", data),
    update: (id: number, data: Record<string, unknown>) =>
        api.patch(`/campaigns/list/${id}/`, data),
    delete: (id: number) => api.delete(`/campaigns/list/${id}/`),
};

// ─── Lead API ────────────────────────────────────────────────────
export const leadApi = {
    list: (params?: Record<string, string>) =>
        api.get("/campaigns/leads/", { params }),
    get: (id: number) => api.get(`/campaigns/leads/${id}/`),
    create: (data: Record<string, unknown>) =>
        api.post("/campaigns/leads/", data),
    update: (id: number, data: Record<string, unknown>) =>
        api.patch(`/campaigns/leads/${id}/`, data),
    delete: (id: number) => api.delete(`/campaigns/leads/${id}/`),
    audit: (id: number, roleConfig?: Record<string, boolean>) =>
        api.post(`/campaigns/leads/${id}/audit/`, { role_config: roleConfig }),
    generateDraft: (id: number, mode?: string) =>
        api.post(`/campaigns/leads/${id}/generate_draft/`, { mode }),
};

// ─── Draft API ───────────────────────────────────────────────────
export const draftApi = {
    list: () => api.get("/campaigns/drafts/"),
    get: (id: number) => api.get(`/campaigns/drafts/${id}/`),
    update: (id: number, data: Record<string, unknown>) =>
        api.patch(`/campaigns/drafts/${id}/`, data),
    delete: (id: number) => api.delete(`/campaigns/drafts/${id}/`),
    approve: (id: number) =>
        api.post(`/campaigns/drafts/${id}/approve/`),
};

// ─── Provider API ────────────────────────────────────────────────
export const providerApi = {
    list: () => api.get("/providers/"),
    create: (data: { provider: string; api_key: string; default_model?: string; base_url?: string }) =>
        api.post("/providers/", data),
    delete: (id: number) => api.delete(`/providers/${id}/`),
};

// ─── SMTP API ────────────────────────────────────────────────────
export const smtpApi = {
    list: () => api.get("/smtp/"),
    create: (data: Record<string, unknown>) => api.post("/smtp/", data),
    update: (id: number, data: Record<string, unknown>) =>
        api.patch(`/smtp/${id}/`, data),
    delete: (id: number) => api.delete(`/smtp/${id}/`),
};

// ─── Chat API ────────────────────────────────────────────────────
export const chatApi = {
    listSessions: () => api.get("/chat/sessions/"),
    createSession: (title?: string) =>
        api.post("/chat/sessions/", { title: title || "New Chat" }),
    deleteSession: (id: number) => api.delete(`/chat/sessions/${id}/`),
    getMessages: (sessionId: number) =>
        api.get(`/chat/sessions/${sessionId}/messages/`),
    sendMessage: (sessionId: number, content: string) =>
        api.post(`/chat/sessions/${sessionId}/messages/`, { content }),
};
