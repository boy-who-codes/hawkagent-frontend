"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Send, Bot, User, Copy, Loader2, StopCircle,
    PlusCircle, MessageSquare, Trash2, Bird
} from "lucide-react"
import { toast } from "sonner"
import { chatApi } from "@/lib/api"

interface ChatSession {
    id: number
    title: string
    created_at: string
}

interface Message {
    id: number | string
    role: "user" | "assistant" | "system"
    content: string
}

export default function ChatPage() {
    const [sessions, setSessions] = useState<ChatSession[]>([])
    const [activeSession, setActiveSession] = useState<number | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [sessionsLoading, setSessionsLoading] = useState(true)
    const bottomRef = useRef<HTMLDivElement>(null)

    const loadSessions = useCallback(async () => {
        try {
            const resp = await chatApi.listSessions()
            const data = resp.data?.results ?? resp.data ?? []
            setSessions(data)
            if (data.length > 0 && !activeSession) {
                setActiveSession(data[0].id)
            }
        } catch {
            // Backend may not have chat endpoints yet
            setSessions([])
        } finally {
            setSessionsLoading(false)
        }
    }, [activeSession])

    useEffect(() => {
        loadSessions()
    }, [loadSessions])

    useEffect(() => {
        if (activeSession) {
            chatApi.getMessages(activeSession).then((r) => {
                setMessages(r.data?.results ?? r.data ?? [])
            }).catch(() => setMessages([]))
        }
    }, [activeSession])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    const handleNewChat = async () => {
        try {
            const resp = await chatApi.createSession("New Chat")
            const newSession = resp.data
            setSessions((prev) => [newSession, ...prev])
            setActiveSession(newSession.id)
            setMessages([])
        } catch {
            toast.error("Could not create new chat")
        }
    }

    const handleDeleteChat = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation()
        try {
            await chatApi.deleteSession(id)
            setSessions((prev) => prev.filter((s) => s.id !== id))
            if (activeSession === id) {
                setActiveSession(sessions[0]?.id ?? null)
            }
        } catch {
            toast.error("Could not delete chat")
        }
    }

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading) return

        const userMsg: Message = { id: `temp-${Date.now()}`, role: "user", content: input }
        setMessages((prev) => [...prev, userMsg])
        setInput("")
        setIsLoading(true)

        try {
            if (activeSession) {
                const resp = await chatApi.sendMessage(activeSession, input)
                const botMsg = resp.data?.response || resp.data?.content || "I received your message."
                setMessages((prev) => [
                    ...prev,
                    { id: `bot-${Date.now()}`, role: "assistant", content: botMsg },
                ])
            } else {
                // Create session first
                const sessResp = await chatApi.createSession("New Chat")
                const newSession = sessResp.data
                setSessions((prev) => [newSession, ...prev])
                setActiveSession(newSession.id)

                const resp = await chatApi.sendMessage(newSession.id, input)
                const botMsg = resp.data?.response || resp.data?.content || "I received your message."
                setMessages((prev) => [
                    ...prev,
                    { id: `bot-${Date.now()}`, role: "assistant", content: botMsg },
                ])
            }
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    id: `err-${Date.now()}`,
                    role: "assistant",
                    content: "⚠️ Could not get a response. Please check your LLM provider settings and try again.",
                },
            ])
        } finally {
            setIsLoading(false)
        }
    }

    const copyMessage = (content: string) => {
        navigator.clipboard.writeText(content)
        toast.success("Copied to clipboard!")
    }

    return (
        <div className="flex h-[calc(100vh-65px)] w-full overflow-hidden">
            {/* Chat Sessions Sidebar */}
            <div className="w-64 border-r bg-muted/10 flex flex-col shrink-0 hidden md:flex">
                <div className="p-3 border-b">
                    <Button onClick={handleNewChat} className="w-full gap-2" size="sm">
                        <PlusCircle className="h-4 w-4" /> New Chat
                    </Button>
                </div>
                <ScrollArea className="flex-1 p-2">
                    {sessionsLoading ? (
                        <div className="space-y-2 p-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-9 bg-muted/50 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="text-center text-xs text-muted-foreground p-4 mt-8">
                            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                            No chats yet
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {sessions.map((s) => (
                                <div
                                    key={s.id}
                                    onClick={() => {
                                        setActiveSession(s.id)
                                        setMessages([])
                                    }}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm group transition-colors ${
                                        activeSession === s.id
                                            ? "bg-primary/10 text-primary"
                                            : "hover:bg-muted/50 text-muted-foreground"
                                    }`}
                                >
                                    <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                                    <span className="flex-1 truncate">{s.title}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                                        onClick={(e) => handleDeleteChat(s.id, e)}
                                    >
                                        <Trash2 className="h-3 w-3 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h2 className="text-base font-semibold flex items-center gap-2">
                        <Bird className="h-4 w-4 text-primary" />
                        Hawk AI Chat
                    </h2>
                    <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
                        Powered by your LLM
                    </span>
                </div>

                <ScrollArea className="flex-1 p-4">
                    {messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center flex-col text-muted-foreground gap-4 mt-32">
                            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-chart-3/20 flex items-center justify-center">
                                <Bird className="h-8 w-8 text-primary/60" />
                            </div>
                            <p className="text-lg font-medium">How can Hawk help you today?</p>
                            <p className="text-sm text-muted-foreground max-w-md text-center">
                                Ask me to generate outreach emails, analyze leads, audit websites, or create proposals.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6 pb-10 max-w-3xl mx-auto">
                            {messages.map((m) => (
                                <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                                    <div className={`flex gap-3 max-w-[85%] ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                                        <div
                                            className={`mt-1 h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                                                m.role === "user"
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-gradient-to-br from-primary/20 to-chart-3/20"
                                            }`}
                                        >
                                            {m.role === "user" ? (
                                                <User className="h-4 w-4" />
                                            ) : (
                                                <Bot className="h-4 w-4 text-primary" />
                                            )}
                                        </div>
                                        <div className={`flex flex-col gap-1 ${m.role === "user" ? "items-end" : "items-start"}`}>
                                            <div
                                                className={`text-sm leading-relaxed p-4 rounded-2xl whitespace-pre-wrap ${
                                                    m.role === "user"
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-muted/50"
                                                }`}
                                            >
                                                {m.content}
                                            </div>
                                            {m.role === "assistant" && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 opacity-50 hover:opacity-100"
                                                    onClick={() => copyMessage(m.content)}
                                                >
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-3">
                                    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary/20 to-chart-3/20 flex items-center justify-center shrink-0">
                                        <Bot className="h-4 w-4 text-primary animate-pulse" />
                                    </div>
                                    <div className="flex items-center gap-1.5 px-4 py-3 bg-muted/50 rounded-2xl">
                                        <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </div>
                    )}
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t bg-background">
                    <form
                        onSubmit={handleSend}
                        className="flex gap-2 max-w-3xl mx-auto relative items-end"
                    >
                        <Textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    if (input.trim() && !isLoading) {
                                        handleSend(e as unknown as React.FormEvent)
                                    }
                                }
                            }}
                            disabled={isLoading}
                            placeholder="Message Hawk AI..."
                            className="min-h-[52px] max-h-[200px] resize-none pr-14 py-4 rounded-2xl bg-muted/30 border-input/50 focus-visible:ring-1 focus-visible:ring-primary/50 scrollbar-thin overflow-y-auto"
                            rows={1}
                        />
                        {isLoading ? (
                            <Button
                                type="button"
                                onClick={() => setIsLoading(false)}
                                size="icon"
                                variant="destructive"
                                className="absolute right-2 bottom-2.5 h-9 w-9 rounded-xl"
                            >
                                <StopCircle className="h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                disabled={!input?.trim()}
                                size="icon"
                                className="absolute right-2 bottom-2.5 h-9 w-9 rounded-xl"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        )}
                    </form>
                    <div className="text-center text-xs text-muted-foreground mt-2">
                        AI can make mistakes. Verify important information.
                    </div>
                </div>
            </div>
        </div>
    )
}
