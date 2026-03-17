"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
    Megaphone,
    Users,
    FileEdit,
    Mail,
    ArrowRight,
    Zap,
    MessageSquare,
    Target,
    TrendingUp,
    Bird,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { campaignApi, leadApi, draftApi } from "@/lib/api"

export default function DashboardPage() {
    const { data: campaigns } = useQuery({
        queryKey: ["campaigns"],
        queryFn: () => campaignApi.list().then((r) => r.data),
    })
    const { data: leads } = useQuery({
        queryKey: ["leads"],
        queryFn: () => leadApi.list().then((r) => r.data),
    })
    const { data: drafts } = useQuery({
        queryKey: ["drafts"],
        queryFn: () => draftApi.list().then((r) => r.data),
    })

    const campaignCount = campaigns?.results?.length ?? campaigns?.length ?? 0
    const leadCount = leads?.results?.length ?? leads?.length ?? 0
    const draftCount = drafts?.results?.length ?? drafts?.length ?? 0
    const sentCount = Array.isArray(leads?.results ?? leads)
        ? (leads?.results ?? leads)?.filter((l: Record<string, string>) => l.status === "emailed").length ?? 0
        : 0

    const stats = [
        { label: "Active Campaigns", value: campaignCount, icon: Megaphone },
        { label: "Total Leads", value: leadCount, icon: Users },
        { label: "Drafts Ready", value: draftCount, icon: FileEdit },
        { label: "Emails Sent", value: sentCount, icon: Mail },
    ]

    const quickActions = [
        { label: "New Campaign", href: "/campaigns", icon: Megaphone, desc: "Target a new audience" },
        { label: "Hunt Leads", href: "/leads", icon: Target, desc: "Scrape & enrich leads" },
        { label: "Chat with Hawk", href: "/chat", icon: MessageSquare, desc: "AI-powered outreach assist" },
        { label: "View Analytics", href: "/analytics", icon: TrendingUp, desc: "Campaign performance" },
    ]

    return (
        <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
            {/* Hero Banner */}
            <div className="relative overflow-hidden rounded-xl bg-muted/50 border p-8 md:p-10">
                <div className="relative z-10 flex items-start justify-between">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                                <Bird className="h-6 w-6 text-primary-foreground" />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                                Command Center
                            </h1>
                        </div>
                        <p className="text-muted-foreground text-lg max-w-lg">
                            Your AI-powered outreach headquarters. Hunt leads, audit websites, generate proposals, and
                            close deals — all from one dashboard.
                        </p>
                    </div>
                    <Link href="/chat" className="hidden md:block">
                        <Button size="lg" className="gap-2">
                            <Zap className="h-4 w-4" />
                            Launch Hawk AI
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.label}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {stat.label}
                            </CardTitle>
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {quickActions.map((action) => (
                        <Link key={action.href} href={action.href}>
                            <Card className="cursor-pointer hover:bg-muted/50 transition-colors group h-full">
                                <CardContent className="p-5 flex flex-col gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                        <action.icon className="h-5 w-5 text-foreground" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold flex items-center gap-2">
                                            {action.label}
                                            <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </h3>
                                        <p className="text-sm text-muted-foreground">{action.desc}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recent Campaigns */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Recent Campaigns</h2>
                    <Link href="/campaigns">
                        <Button variant="ghost" size="sm" className="gap-1">
                            View all <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                    </Link>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {(campaigns?.results ?? campaigns ?? []).slice(0, 3).map((c: Record<string, unknown>) => (
                        <Card key={c.id as number}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">{c.name as string}</CardTitle>
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                    {(c.description as string) || "No description"}
                                </p>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-3 text-sm">
                                    <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium">
                                        {(c.sender_mode as string) === "brand" ? "Brand" : "Anonymous"}
                                    </span>
                                    {Boolean(c.auto_mode) && (
                                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                                            Auto
                                        </span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {campaignCount === 0 && (
                        <Card className="col-span-full">
                            <CardContent className="p-8 text-center text-muted-foreground">
                                <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                <p>No campaigns yet. Create your first one to start hunting!</p>
                                <Link href="/campaigns" className="mt-4 inline-block">
                                    <Button size="sm" className="gap-2 mt-3">
                                        <Megaphone className="h-3.5 w-3.5" /> New Campaign
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
