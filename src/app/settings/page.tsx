"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Save, Trash2, Plus, Loader2, Key, Mail, Building2, Shield } from "lucide-react"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { providerApi, smtpApi } from "@/lib/api"
import { toast } from "sonner"
import { useAuthStore } from "@/lib/auth-store"

interface LLMProvider {
    id: number
    provider: string
    default_model: string
    base_url?: string
    created_at: string
}

interface SMTPServer {
    id: number
    name: string
    host: string
    port: number
    from_email: string
    is_active: boolean
}

export default function SettingsPage() {
    const queryClient = useQueryClient()
    const user = useAuthStore((s) => s.user)
    const [activeTab, setActiveTab] = useState<"providers" | "smtp" | "agency" | "account">("providers")

    // LLM Provider state
    const [newProvider, setNewProvider] = useState({ provider: "groq", api_key: "", default_model: "", base_url: "" })
    const { data: providersData, isLoading: providersLoading } = useQuery({
        queryKey: ["providers"],
        queryFn: () => providerApi.list().then((r) => r.data),
    })
    const providers: LLMProvider[] = providersData?.results ?? providersData ?? []

    const addProviderMutation = useMutation({
        mutationFn: () => providerApi.create(newProvider),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["providers"] })
            setNewProvider({ provider: "groq", api_key: "", default_model: "", base_url: "" })
            toast.success("Provider added!")
        },
        onError: () => toast.error("Failed to add provider. It may already exist."),
    })

    const deleteProviderMutation = useMutation({
        mutationFn: (id: number) => providerApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["providers"] })
            toast.success("Provider removed")
        },
    })

    // SMTP state
    const [newSMTP, setNewSMTP] = useState({
        name: "", host: "", port: 587, username: "", password: "",
        use_tls: true, from_name: "", from_email: "",
    })
    const { data: smtpData } = useQuery({
        queryKey: ["smtp"],
        queryFn: () => smtpApi.list().then((r) => r.data),
    })
    const smtpServers: SMTPServer[] = smtpData?.results ?? smtpData ?? []

    const addSMTPMutation = useMutation({
        mutationFn: () => smtpApi.create(newSMTP),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["smtp"] })
            setNewSMTP({ name: "", host: "", port: 587, username: "", password: "", use_tls: true, from_name: "", from_email: "" })
            toast.success("SMTP server added!")
        },
        onError: () => toast.error("Failed to add SMTP server"),
    })

    const deleteSMTPMutation = useMutation({
        mutationFn: (id: number) => smtpApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["smtp"] })
            toast.success("SMTP server removed")
        },
    })

    const tabs = [
        { id: "providers" as const, label: "API Keys & Providers", icon: Key },
        { id: "smtp" as const, label: "SMTP Servers", icon: Mail },
        { id: "agency" as const, label: "Agency Profile", icon: Building2 },
        { id: "account" as const, label: "Account", icon: Shield },
    ]

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-1">Manage your providers, SMTP, and account settings.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-[220px_1fr]">
                {/* Tab Navigation */}
                <nav className="flex md:flex-col gap-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                                activeTab === tab.id
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            }`}
                        >
                            <tab.icon className="h-4 w-4 shrink-0" />
                            <span className="hidden md:inline">{tab.label}</span>
                        </button>
                    ))}
                </nav>

                {/* Content */}
                <div className="space-y-6">
                    {/* LLM Providers */}
                    {activeTab === "providers" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Bring Your Own API</CardTitle>
                                <CardDescription>
                                    This platform uses a BYOK model. Your keys are encrypted on the server.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Existing Providers */}
                                {providersLoading ? (
                                    <div className="space-y-3">
                                        {[1, 2].map((i) => (
                                            <div key={i} className="h-14 bg-muted/50 rounded-lg animate-pulse" />
                                        ))}
                                    </div>
                                ) : providers.length > 0 ? (
                                    providers.map((p) => (
                                        <div key={p.id} className="rounded-xl border p-4 flex items-center justify-between">
                                            <div className="grid gap-0.5">
                                                <p className="font-medium text-sm capitalize">{p.provider}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Model: {p.default_model || "default"} {p.base_url && `• URL: ${p.base_url}`} • Added {new Date(p.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost" size="icon"
                                                className="text-destructive"
                                                onClick={() => deleteProviderMutation.mutate(p.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-4 text-muted-foreground text-sm">
                                        No providers configured yet.
                                    </div>
                                )}

                                {/* Add New */}
                                <div className="space-y-4 pt-4 border-t">
                                    <h4 className="font-medium text-sm">Add New Provider</h4>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Provider</Label>
                                            <select
                                                className="flex h-10 w-full rounded-md border border-input bg-zinc-950 px-3 py-2 text-sm text-zinc-100 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                value={newProvider.provider}
                                                onChange={(e) => setNewProvider({ ...newProvider, provider: e.target.value })}
                                            >
                                                <option value="groq">Groq</option>
                                                <option value="anthropic">Anthropic (Claude)</option>
                                                <option value="openai">OpenAI</option>
                                                <option value="gemini">Google Gemini</option>
                                                <option value="deepseek">DeepSeek</option>
                                                <option value="grok">Grok (xAI)</option>
                                                <option value="sarvam">Sarvam AI</option>
                                                <option value="openrouter">OpenRouter</option>
                                                <option value="custom">Custom (BYOK URL)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Default Model</Label>
                                            <Input
                                                placeholder="e.g. llama3-8b-8192"
                                                value={newProvider.default_model}
                                                onChange={(e) => setNewProvider({ ...newProvider, default_model: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    
                                    {(["custom", "deepseek", "grok", "sarvam", "openrouter"].includes(newProvider.provider)) && (
                                        <div className="space-y-2">
                                            <Label>Optional Base URL / API Target</Label>
                                            <Input
                                                placeholder="https://api.yourprovider.com/v1"
                                                value={newProvider.base_url}
                                                onChange={(e) => setNewProvider({ ...newProvider, base_url: e.target.value })}
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label>API Key</Label>
                                        <Input
                                            type="password"
                                            placeholder="Enter your API key"
                                            value={newProvider.api_key}
                                            onChange={(e) => setNewProvider({ ...newProvider, api_key: e.target.value })}
                                        />
                                    </div>
                                    <Button
                                        className="w-full gap-2"
                                        onClick={() => addProviderMutation.mutate()}
                                        disabled={!newProvider.api_key || addProviderMutation.isPending}
                                    >
                                        {addProviderMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                        Add Provider
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* SMTP */}
                    {activeTab === "smtp" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>SMTP Servers</CardTitle>
                                <CardDescription>
                                    Configure your email sending servers for outreach campaigns.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {smtpServers.length > 0 && smtpServers.map((s) => (
                                    <div key={s.id} className="rounded-xl border p-4 flex items-center justify-between">
                                        <div className="grid gap-0.5">
                                            <p className="font-medium text-sm">{s.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {s.host}:{s.port} • {s.from_email}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost" size="icon" className="text-destructive"
                                            onClick={() => deleteSMTPMutation.mutate(s.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}

                                <div className="space-y-4 pt-4 border-t">
                                    <h4 className="font-medium text-sm">Add SMTP Server</h4>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Name</Label>
                                            <Input placeholder="My Gmail" value={newSMTP.name} onChange={(e) => setNewSMTP({ ...newSMTP, name: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Host</Label>
                                            <Input placeholder="smtp.gmail.com" value={newSMTP.host} onChange={(e) => setNewSMTP({ ...newSMTP, host: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Port</Label>
                                            <Input type="number" value={newSMTP.port} onChange={(e) => setNewSMTP({ ...newSMTP, port: Number(e.target.value) })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Username</Label>
                                            <Input placeholder="your@email.com" value={newSMTP.username} onChange={(e) => setNewSMTP({ ...newSMTP, username: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Password</Label>
                                            <Input type="password" value={newSMTP.password} onChange={(e) => setNewSMTP({ ...newSMTP, password: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>From Email</Label>
                                            <Input type="email" placeholder="hello@agency.com" value={newSMTP.from_email} onChange={(e) => setNewSMTP({ ...newSMTP, from_email: e.target.value })} />
                                        </div>
                                        <div className="space-y-2 sm:col-span-2">
                                            <Label>From Name</Label>
                                            <Input placeholder="Agency Name" value={newSMTP.from_name} onChange={(e) => setNewSMTP({ ...newSMTP, from_name: e.target.value })} />
                                        </div>
                                    </div>
                                    <Button
                                        className="w-full gap-2"
                                        onClick={() => addSMTPMutation.mutate()}
                                        disabled={!newSMTP.host || !newSMTP.username || addSMTPMutation.isPending}
                                    >
                                        {addSMTPMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                        Add SMTP Server
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Agency Profile */}
                    {activeTab === "agency" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Agency Profile</CardTitle>
                                <CardDescription>
                                    This information is used in branded outreach emails and proposals.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Agency Name</Label>
                                        <Input placeholder="Your Agency Name" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Website</Label>
                                        <Input placeholder="https://youragency.com" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Region</Label>
                                        <Input placeholder="e.g. North America" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Starting Price</Label>
                                        <Input placeholder="e.g. $1,000" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Services Offered</Label>
                                    <Textarea placeholder="Web Development, SEO, Marketing, Automation..." className="min-h-[80px]" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Value Proposition</Label>
                                    <Textarea placeholder="Brief pitch used in outreach..." className="min-h-[80px]" />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="ml-auto gap-2">
                                    <Save className="h-4 w-4" /> Save Profile
                                </Button>
                            </CardFooter>
                        </Card>
                    )}

                    {/* Account */}
                    {activeTab === "account" && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Account Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Email</Label>
                                            <Input value={user?.email || ""} disabled />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Username</Label>
                                            <Input value={user?.username || ""} disabled />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Change Password</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Current Password</Label>
                                        <Input type="password" placeholder="••••••••" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>New Password</Label>
                                        <Input type="password" placeholder="••••••••" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Confirm New Password</Label>
                                        <Input type="password" placeholder="••••••••" />
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button className="ml-auto gap-2">
                                        <Save className="h-4 w-4" /> Update Password
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
