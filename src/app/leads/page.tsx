"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Search, Radar, FileEdit, CheckCircle2, Loader2, Users,
    ExternalLink, Globe
} from "lucide-react"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { leadApi } from "@/lib/api"
import { toast } from "sonner"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"

interface Lead {
    id: number
    name: string
    email: string
    company: string
    website: string
    score: string
    status: string
    tech_stack: Record<string, unknown>
    social_links: Record<string, unknown>
    notes: string
    campaign: number
    created_at: string
}

export default function LeadsPage() {
    const queryClient = useQueryClient()
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

    const { data, isLoading } = useQuery({
        queryKey: ["all-leads"],
        queryFn: () => leadApi.list().then((r) => r.data),
    })

    const leads: Lead[] = data?.results ?? data ?? []

    const filtered = leads.filter((l) => {
        const matchesSearch =
            l.name.toLowerCase().includes(search.toLowerCase()) ||
            l.email.toLowerCase().includes(search.toLowerCase()) ||
            l.company?.toLowerCase().includes(search.toLowerCase())
        const matchesStatus = statusFilter === "all" || l.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const auditMutation = useMutation({
        mutationFn: (id: number) => leadApi.audit(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["all-leads"] })
            toast.success("Audit completed!")
        },
        onError: () => toast.error("Audit failed"),
    })

    const draftMutation = useMutation({
        mutationFn: (id: number) => leadApi.generateDraft(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["all-leads"] })
            toast.success("Draft generated!")
        },
        onError: () => toast.error("Draft generation failed"),
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

    const statuses = ["all", "new", "enriched", "audited", "drafted", "emailed", "replied", "converted"]

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
                <p className="text-muted-foreground mt-1">
                    All your leads across campaigns. Audit, generate drafts, and track status.
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, email, or company..."
                        className="pl-9 bg-muted/30"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-1 flex-wrap">
                    {statuses.map((s) => (
                        <Button
                            key={s}
                            variant={statusFilter === s ? "default" : "outline"}
                            size="sm"
                            onClick={() => setStatusFilter(s)}
                            className="capitalize text-xs h-8"
                        >
                            {s}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: "Total", value: leads.length },
                    { label: "New", value: leads.filter((l) => l.status === "new").length },
                    { label: "Drafted", value: leads.filter((l) => l.status === "drafted").length },
                    { label: "Replied", value: leads.filter((l) => l.status === "replied" || l.status === "converted").length },
                ].map((s) => (
                    <Card key={s.label}>
                        <CardContent className="py-3 px-4 flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">{s.label}</span>
                            <span className="text-xl font-bold">{s.value}</span>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Table */}
            <div className="border rounded-xl bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                            <tr>
                                <th className="px-4 py-3">Lead</th>
                                <th className="px-4 py-3 hidden md:table-cell">Company</th>
                                <th className="px-4 py-3">Score</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={5} className="px-4 py-4">
                                            <div className="h-5 bg-muted/50 rounded animate-pulse" />
                                        </td>
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                                        <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                        <p>{search || statusFilter !== "all" ? "No leads match your filters." : "No leads yet. Start hunting via Campaigns or Hawk AI Chat."}</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((lead) => (
                                    <tr
                                        key={lead.id}
                                        className="hover:bg-muted/20 transition-colors cursor-pointer"
                                        onClick={() => setSelectedLead(lead)}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{lead.name}</div>
                                            <div className="text-xs text-muted-foreground">{lead.email}</div>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                                            {lead.company || "—"}
                                        </td>
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
                                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex gap-1 justify-end">
                                                <Button
                                                    variant="ghost" size="sm" className="h-7 text-xs gap-1"
                                                    onClick={() => auditMutation.mutate(lead.id)}
                                                    disabled={auditMutation.isPending}
                                                >
                                                    {auditMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Radar className="h-3 w-3" />}
                                                    Audit
                                                </Button>
                                                <Button
                                                    variant="ghost" size="sm" className="h-7 text-xs gap-1"
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

            {/* Lead Detail Dialog */}
            <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {selectedLead?.name}
                            <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${scoreColors[selectedLead?.score || "C"]}`}>
                                {selectedLead?.score}
                            </span>
                        </DialogTitle>
                    </DialogHeader>
                    {selectedLead && (
                        <div className="space-y-4">
                            <div className="grid gap-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Email</span>
                                    <span className="font-medium">{selectedLead.email}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Company</span>
                                    <span className="font-medium">{selectedLead.company || "—"}</span>
                                </div>
                                {selectedLead.website && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Website</span>
                                        <a
                                            href={selectedLead.website}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-primary flex items-center gap-1 hover:underline"
                                        >
                                            <Globe className="h-3 w-3" />
                                            {selectedLead.website.replace(/https?:\/\//, "").slice(0, 30)}
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Status</span>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${statusColors[selectedLead.status]}`}>
                                        {selectedLead.status}
                                    </span>
                                </div>
                            </div>

                            {Object.keys(selectedLead.tech_stack || {}).length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold mb-2">Audit / Tech Stack</h4>
                                    <pre className="text-xs bg-muted/50 p-3 rounded-lg overflow-x-auto max-h-40">
                                        {JSON.stringify(selectedLead.tech_stack, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {selectedLead.notes && (
                                <div>
                                    <h4 className="text-sm font-semibold mb-1">Notes</h4>
                                    <p className="text-sm text-muted-foreground">{selectedLead.notes}</p>
                                </div>
                            )}

                            <div className="flex gap-2 pt-2">
                                <Button
                                    className="flex-1 gap-2" size="sm"
                                    onClick={() => { auditMutation.mutate(selectedLead.id); setSelectedLead(null) }}
                                >
                                    <Radar className="h-3.5 w-3.5" /> Run Audit
                                </Button>
                                <Button
                                    className="flex-1 gap-2" size="sm" variant="outline"
                                    onClick={() => { draftMutation.mutate(selectedLead.id); setSelectedLead(null) }}
                                >
                                    <FileEdit className="h-3.5 w-3.5" /> Generate Draft
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
