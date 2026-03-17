"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Search, CheckCircle2, XCircle, Mail, Edit, Eye, Trash2,
    FileEdit, Loader2
} from "lucide-react"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { draftApi } from "@/lib/api"
import { toast } from "sonner"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Draft {
    id: number
    lead: number
    subject: string
    body: string
    hook: string
    mode: string
    is_approved: boolean
    sent_at: string | null
    created_at: string
}

export default function DraftsPage() {
    const queryClient = useQueryClient()
    const [search, setSearch] = useState("")
    const [filter, setFilter] = useState<"all" | "pending" | "approved" | "sent">("all")
    const [editDraft, setEditDraft] = useState<Draft | null>(null)
    const [previewDraft, setPreviewDraft] = useState<Draft | null>(null)
    const [editSubject, setEditSubject] = useState("")
    const [editBody, setEditBody] = useState("")
    const [editHook, setEditHook] = useState("")

    const { data, isLoading } = useQuery({
        queryKey: ["drafts"],
        queryFn: () => draftApi.list().then((r) => r.data),
    })

    const drafts: Draft[] = data?.results ?? data ?? []

    const filtered = drafts.filter((d) => {
        const matchesSearch = d.subject.toLowerCase().includes(search.toLowerCase()) || d.body.toLowerCase().includes(search.toLowerCase())
        if (filter === "pending") return matchesSearch && !d.is_approved && !d.sent_at
        if (filter === "approved") return matchesSearch && d.is_approved && !d.sent_at
        if (filter === "sent") return matchesSearch && !!d.sent_at
        return matchesSearch
    })

    const approveMutation = useMutation({
        mutationFn: (id: number) => draftApi.approve(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["drafts"] })
            toast.success("Draft approved!")
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data: updateData }: { id: number; data: Record<string, unknown> }) =>
            draftApi.update(id, updateData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["drafts"] })
            setEditDraft(null)
            toast.success("Draft updated!")
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => draftApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["drafts"] })
            toast.success("Draft deleted")
        },
    })

    const openEdit = (draft: Draft) => {
        setEditDraft(draft)
        setEditSubject(draft.subject)
        setEditBody(draft.body)
        setEditHook(draft.hook || "")
    }

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Draft Center</h1>
                <p className="text-muted-foreground mt-1">
                    Review, edit, and approve AI-generated outreach drafts before sending.
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search drafts..."
                        className="pl-9 bg-muted/30"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-1">
                    {(["all", "pending", "approved", "sent"] as const).map((f) => (
                        <Button
                            key={f}
                            variant={filter === f ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilter(f)}
                            className="capitalize text-xs h-8"
                        >
                            {f}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: "Total", value: drafts.length },
                    { label: "Pending", value: drafts.filter((d) => !d.is_approved && !d.sent_at).length },
                    { label: "Approved", value: drafts.filter((d) => d.is_approved && !d.sent_at).length },
                    { label: "Sent", value: drafts.filter((d) => !!d.sent_at).length },
                ].map((s) => (
                    <Card key={s.label}>
                        <CardContent className="py-3 px-4 flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">{s.label}</span>
                            <span className="text-xl font-bold">{s.value}</span>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Drafts Grid */}
            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader><div className="h-5 bg-muted rounded w-3/4" /></CardHeader>
                            <CardContent><div className="h-20 bg-muted/50 rounded" /></CardContent>
                        </Card>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="p-12 text-center">
                        <FileEdit className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                        <h3 className="text-lg font-semibold mb-2">No drafts found</h3>
                        <p className="text-muted-foreground">
                            Generate drafts from the Leads page or Hawk AI Chat.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {filtered.map((draft) => (
                        <Card key={draft.id} className="group hover:shadow-lg transition-all">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-base truncate">{draft.subject}</CardTitle>
                                        <CardDescription className="flex items-center gap-2 mt-1">
                                            <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                                                draft.mode === "brand" ? "bg-primary/10 text-primary" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                            }`}>
                                                {draft.mode === "brand" ? "🏢 Brand" : "🕵️ Anon"}
                                            </span>
                                            {draft.is_approved && (
                                                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-xs">
                                                    <CheckCircle2 className="h-3 w-3" /> Approved
                                                </span>
                                            )}
                                            {draft.sent_at && (
                                                <span className="text-primary flex items-center gap-1 text-xs">
                                                    <Mail className="h-3 w-3" /> Sent
                                                </span>
                                            )}
                                        </CardDescription>
                                    </div>
                                    <Button
                                        variant="ghost" size="icon"
                                        className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive shrink-0"
                                        onClick={() => deleteMutation.mutate(draft.id)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-sm text-muted-foreground line-clamp-3">{draft.body}</p>
                                {draft.hook && (
                                    <div className="text-xs bg-primary/5 text-primary p-2 rounded-lg">
                                        <span className="font-semibold">Hook:</span> {draft.hook}
                                    </div>
                                )}
                                <div className="flex gap-2 pt-1">
                                    <Button variant="outline" size="sm" className="gap-1 text-xs flex-1" onClick={() => setPreviewDraft(draft)}>
                                        <Eye className="h-3 w-3" /> Preview
                                    </Button>
                                    <Button variant="outline" size="sm" className="gap-1 text-xs flex-1" onClick={() => openEdit(draft)}>
                                        <Edit className="h-3 w-3" /> Edit
                                    </Button>
                                    {!draft.is_approved && (
                                        <Button
                                            size="sm" className="gap-1 text-xs flex-1"
                                            onClick={() => approveMutation.mutate(draft.id)}
                                            disabled={approveMutation.isPending}
                                        >
                                            {approveMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                                            Approve
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Preview Dialog */}
            <Dialog open={!!previewDraft} onOpenChange={() => setPreviewDraft(null)}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Email Preview — {previewDraft?.mode === "brand" ? "Brand Mode" : "Anonymous Mode"}</DialogTitle>
                    </DialogHeader>
                    {previewDraft && (
                        <div className="space-y-4">
                            <div className="bg-muted/30 rounded-xl p-6 space-y-3">
                                <div className="text-sm text-muted-foreground">Subject:</div>
                                <div className="text-lg font-semibold">{previewDraft.subject}</div>
                                <div className="border-t pt-4 whitespace-pre-wrap text-sm leading-relaxed">
                                    {previewDraft.body}
                                </div>
                            </div>
                            {previewDraft.hook && (
                                <div className="text-sm bg-primary/5 p-3 rounded-lg">
                                    <span className="font-semibold text-primary">Personalization Hook:</span> {previewDraft.hook}
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={!!editDraft} onOpenChange={() => setEditDraft(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Draft</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Subject</Label>
                            <Input value={editSubject} onChange={(e) => setEditSubject(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Body</Label>
                            <Textarea
                                value={editBody}
                                onChange={(e) => setEditBody(e.target.value)}
                                className="min-h-[200px]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Hook (Optional)</Label>
                            <Input value={editHook} onChange={(e) => setEditHook(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={() => editDraft && updateMutation.mutate({
                                id: editDraft.id,
                                data: { subject: editSubject, body: editBody, hook: editHook },
                            })}
                            disabled={updateMutation.isPending}
                        >
                            {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
