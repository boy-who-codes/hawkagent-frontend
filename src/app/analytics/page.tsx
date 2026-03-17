"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Mail, MousePointerClick, Reply, Target,
    TrendingUp, BarChart3, ArrowUpRight, ArrowDownRight,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { leadApi, campaignApi, draftApi } from "@/lib/api"

export default function AnalyticsPage() {
    const { data: leadsData } = useQuery({
        queryKey: ["analytics-leads"],
        queryFn: () => leadApi.list().then((r) => r.data),
    })

    const { data: campaignsData } = useQuery({
        queryKey: ["analytics-campaigns"],
        queryFn: () => campaignApi.list().then((r) => r.data),
    })

    const { data: draftsData } = useQuery({
        queryKey: ["analytics-drafts"],
        queryFn: () => draftApi.list().then((r) => r.data),
    })

    const leads = leadsData?.results ?? leadsData ?? []
    const campaigns = campaignsData?.results ?? campaignsData ?? []
    const drafts = draftsData?.results ?? draftsData ?? []

    const totalLeads = leads.length
    const emailed = leads.filter((l: Record<string, string>) => ["emailed", "replied", "converted"].includes(l.status)).length
    const replied = leads.filter((l: Record<string, string>) => ["replied", "converted"].includes(l.status)).length
    const converted = leads.filter((l: Record<string, string>) => l.status === "converted").length

    const openRate = emailed > 0 ? Math.round((replied / emailed) * 100) : 0
    const conversionRate = totalLeads > 0 ? Math.round((converted / totalLeads) * 100) : 0

    const funnelSteps = [
        { label: "Total Leads", value: totalLeads, icon: Target, color: "bg-primary", pct: 100 },
        { label: "Emails Sent", value: emailed, icon: Mail, color: "bg-blue-500", pct: totalLeads > 0 ? Math.round((emailed / totalLeads) * 100) : 0 },
        { label: "Replied", value: replied, icon: Reply, color: "bg-emerald-500", pct: emailed > 0 ? Math.round((replied / emailed) * 100) : 0 },
        { label: "Converted", value: converted, icon: MousePointerClick, color: "bg-amber-500", pct: replied > 0 ? Math.round((converted / replied) * 100) : 0 },
    ]

    const kpis = [
        { label: "Reply Rate", value: `${openRate}%`, trend: openRate > 20 ? "up" : "down", icon: Reply },
        { label: "Conversion Rate", value: `${conversionRate}%`, trend: conversionRate > 5 ? "up" : "down", icon: TrendingUp },
        { label: "Active Campaigns", value: campaigns.length, trend: "up" as const, icon: BarChart3 },
        { label: "Drafts Ready", value: drafts.filter((d: Record<string, unknown>) => d.is_approved && !d.sent_at).length, trend: "up" as const, icon: Mail },
    ]

    return (
        <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
                <p className="text-muted-foreground mt-1">
                    Track your outreach performance and conversion funnel.
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {kpis.map((kpi) => (
                    <Card key={kpi.label} className="group hover:shadow-lg transition-all">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
                            <kpi.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-bold">{kpi.value}</span>
                                <span className={`flex items-center text-xs font-medium mb-1 ${
                                    kpi.trend === "up" ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
                                }`}>
                                    {kpi.trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Conversion Funnel */}
            <Card>
                <CardHeader>
                    <CardTitle>Conversion Funnel</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {funnelSteps.map((step, i) => (
                            <div key={step.label} className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 font-medium">
                                        <div className={`h-8 w-8 rounded-lg ${step.color} flex items-center justify-center`}>
                                            <step.icon className="h-4 w-4 text-white" />
                                        </div>
                                        {step.label}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl font-bold">{step.value}</span>
                                        {i > 0 && (
                                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                                                {step.pct}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${step.color} rounded-full transition-all duration-1000`}
                                        style={{ width: `${Math.max(step.pct, 2)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Campaign Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle>Campaign Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                    {campaigns.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p>No campaigns yet. Create one to see analytics here.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b text-muted-foreground">
                                    <tr>
                                        <th className="text-left py-3 pr-4 font-medium">Campaign</th>
                                        <th className="text-right py-3 px-4 font-medium">Mode</th>
                                        <th className="text-right py-3 px-4 font-medium">Status</th>
                                        <th className="text-right py-3 pl-4 font-medium">Created</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {campaigns.map((c: Record<string, unknown>) => (
                                        <tr key={c.id as number} className="hover:bg-muted/20">
                                            <td className="py-3 pr-4 font-medium">{c.name as string}</td>
                                            <td className="py-3 px-4 text-right">
                                                <span className="px-2 py-0.5 rounded-md text-xs bg-primary/10 text-primary">
                                                    {(c.sender_mode as string) === "brand" ? "Brand" : "Anonymous"}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <span className="px-2 py-0.5 rounded-md text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                    Active
                                                </span>
                                            </td>
                                            <td className="py-3 pl-4 text-right text-muted-foreground">
                                                {new Date(c.created_at as string).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
