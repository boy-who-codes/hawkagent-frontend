"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight, Play, Plus, Search, Users, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { campaignApi } from "@/lib/api"
import { toast } from "sonner"

interface Campaign {
    id: number
    name: string
    description: string
    sender_mode: string
    auto_mode: boolean
    created_at: string
    leads_count?: number
}

export default function CampaignsPage() {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)
    const [newCampaign, setNewCampaign] = useState({
        name: "", description: "", sender_mode: "brand"
    })

    const { data, isLoading } = useQuery({
        queryKey: ["campaigns"],
        queryFn: () => campaignApi.list().then((r) => r.data),
    })

    const campaigns: Campaign[] = data?.results ?? data ?? []

    const createMutation = useMutation({
        mutationFn: () => campaignApi.create(newCampaign),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["campaigns"] })
            setNewCampaign({ name: "", description: "", sender_mode: "brand" })
            setOpen(false)
            toast.success("Campaign created!")
        },
        onError: () => toast.error("Failed to create campaign"),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => campaignApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["campaigns"] })
            toast.success("Campaign deleted")
        },
    })

    return (
        <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Outreach Campaigns</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your targeted outreach campaigns and track performance.
                    </p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 glow-sm">
                            <Plus className="h-4 w-4" /> New Campaign
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader>
                            <DialogTitle>Create Campaign</DialogTitle>
                            <DialogDescription>
                                Define your targeted audience and outreach strategy.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Campaign Name</Label>
                                <Input
                                    id="name"
                                    value={newCampaign.name}
                                    onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                                    placeholder="e.g. NYC SaaS Founders SEO"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="desc">Description</Label>
                                <Input
                                    id="desc"
                                    value={newCampaign.description}
                                    onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                                    placeholder="Target audience, goals, etc."
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Sender Mode</Label>
                                <div className="flex gap-2">
                                    {["brand", "anonymous"].map((mode) => (
                                        <Button
                                            key={mode}
                                            type="button"
                                            variant={newCampaign.sender_mode === mode ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setNewCampaign({ ...newCampaign, sender_mode: mode })}
                                            className="flex-1 capitalize"
                                        >
                                            {mode === "brand" ? "🏢 Brand" : "🕵️ Anonymous"}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                onClick={() => createMutation.mutate()}
                                disabled={!newCampaign.name || createMutation.isPending}
                            >
                                {createMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : null}
                                Create Campaign
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {isLoading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader className="pb-2">
                                <div className="h-5 bg-muted rounded w-3/4" />
                                <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                            </CardHeader>
                            <CardContent>
                                <div className="h-20 bg-muted/50 rounded" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : campaigns.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="p-12 text-center">
                        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                        <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
                        <p className="text-muted-foreground mb-4">
                            Create your first campaign to start hunting leads and sending outreach.
                        </p>
                        <Button onClick={() => setOpen(true)} className="gap-2">
                            <Plus className="h-4 w-4" /> Create Campaign
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {campaigns.map((c) => (
                        <Card key={c.id} className="group hover:shadow-lg transition-all duration-200">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <CardTitle className="text-lg">{c.name}</CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive"
                                        onClick={() => deleteMutation.mutate(c.id)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                                <CardDescription className="line-clamp-2">
                                    {c.description || "No description"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium">
                                        {c.sender_mode === "brand" ? "🏢 Brand" : "🕵️ Anonymous"}
                                    </span>
                                    {c.auto_mode && (
                                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                                            Auto
                                        </span>
                                    )}
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Link href={`/campaigns/${c.id}`} className="flex-1">
                                        <Button variant="outline" className="w-full gap-2 text-primary border-primary/20 hover:bg-primary/5" size="sm">
                                            <Search className="h-3.5 w-3.5" /> View & Hunt
                                        </Button>
                                    </Link>
                                    <Button className="flex-1 gap-2" size="sm">
                                        <Play className="h-3.5 w-3.5" /> Outreach
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
