"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, CheckCircle2, Search, FileEdit, Radar, Loader2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { useParams } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { campaignApi, leadApi } from "@/lib/api"
import { toast } from "sonner"

interface Lead {
    id: number
    name: string
    email: string
    company: string
    website: string
    score: string
    status: string
    campaign?: number
}

export default function CampaignDetailsPage() {
    const params = useParams()
    const campaignId = Number(params.id)
    const queryClient = useQueryClient()
    const [search, setSearch] = useState("")

    const { data: campaign } = useQuery({
        queryKey: ["campaign", campaignId],
        queryFn: () => campaignApi.get(campaignId).then((r) => r.data),
    })

    const { data: leadsData, isLoading: leadsLoading } = useQuery({
        queryKey: ["leads", campaignId],
        queryFn: () => leadApi.list({ campaign: String(campaignId) }).then((r) => r.data),
    })

    const leads: Lead[] = (leadsData?.results ?? leadsData ?? []).filter(
        (l: Lead) => l.campaign === campaignId || !campaignId
    )

    const filteredLeads = leads.filter(
        (l) =>
            l.name.toLowerCase().includes(search.toLowerCase()) ||
            l.email.toLowerCase().includes(search.toLowerCase()) ||
            l.company?.toLowerCase().includes(search.toLowerCase())
    )

    const auditMutation = useMutation({
        mutationFn: (leadId: number) => leadApi.audit(leadId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leads"] })
            toast.success("Audit completed!")
        },
        onError: () => toast.error("Audit failed. Check if website is accessible."),
    })

    const draftMutation = useMutation({
        mutationFn: (leadId: number) => leadApi.generateDraft(leadId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leads"] })
            toast.success("Draft generated!")
        },
        onError: () => toast.error("Draft generation failed. Check your LLM provider settings."),
    })

    const statusColors: Record<string, string> = {
        new: "bg-secondary text-secondary-foreground",
        enriched: "bg-muted text-muted-foreground",
        audited: "bg-muted text-muted-foreground",
        drafted: "bg-muted text-muted-foreground",
        emailed: "bg-primary/10 text-primary",
        replied: "bg-primary/20 text-primary",
        converted: "bg-primary text-primary-foreground",
        lost: "bg-destructive text-destructive-foreground",
    }

    const scoreColors: Record<string, string> = {
        A: "bg-primary text-primary-foreground border-primary",
        B: "bg-secondary text-secondary-foreground border-border",
        C: "bg-destructive/10 text-destructive border-destructive/30",
    }

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/campaigns">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{campaign?.name || "Campaign"}</h1>
                    <p className="text-sm text-muted-foreground">
                        {campaign?.description || "No description"} • Mode: {campaign?.sender_mode === "brand" ? "🏢 Brand" : "🕵️ Anonymous"}
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                {[
                    { label: "Total Leads", value: leads.length },
                    { label: "Audited", value: leads.filter((l) => ["audited", "drafted", "emailed"].includes(l.status)).length },
                    { label: "Emails Sent", value: leads.filter((l) => l.status === "emailed").length },
                    { label: "Replies", value: leads.filter((l) => l.status === "replied" || l.status === "converted").length },
                ].map((s) => (
                    <Card key={s.label}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{s.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center bg-card p-4 rounded-xl border">
                <div className="flex-1 w-full">
                    <Input
                        placeholder="Search leads by name, email, or company..."
                        className="bg-muted/30"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Leads Table */}
            <div className="border rounded-xl bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                            <tr>
                                <th className="px-4 py-3">Lead</th>
                                <th className="px-4 py-3">Company</th>
                                <th className="px-4 py-3">Score</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {leadsLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={5} className="px-4 py-4">
                                            <div className="h-5 bg-muted/50 rounded animate-pulse" />
                                        </td>
                                    </tr>
                                ))
                            ) : filteredLeads.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                                        <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                        <p>No leads found. Use &quot;Hunt Leads&quot; in Hawk AI chat to discover leads.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredLeads.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-muted/20 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{lead.name}</div>
                                            <div className="text-xs text-muted-foreground">{lead.email}</div>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{lead.company || "—"}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${scoreColors[lead.score] || scoreColors.C}`}>
                                                {lead.score}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${statusColors[lead.status] || ""}`}>
                                                {lead.status === "emailed" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                                {lead.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex gap-1 justify-end">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-xs gap-1"
                                                    onClick={() => auditMutation.mutate(lead.id)}
                                                    disabled={auditMutation.isPending}
                                                >
                                                    {auditMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Radar className="h-3 w-3" />}
                                                    Audit
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-xs gap-1"
                                                    onClick={() => draftMutation.mutate(lead.id)}
                                                    disabled={draftMutation.isPending}
                                                >
                                                    {draftMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileEdit className="h-3 w-3" />}
                                                    Draft
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
