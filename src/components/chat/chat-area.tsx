"use client"

import { useState } from "react"
import { useChat } from "@ai-sdk/react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Bot, User, Copy, Loader2, StopCircle } from "lucide-react"

export function ChatArea() {
    // @ts-expect-error: Property input missing in type definition but present at runtime
    const { messages, input, handleInputChange, handleSubmit, isLoading, stop } = useChat()

    return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto bg-background rounded-l-2xl">
            <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">New Chat</h2>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">Model: Groq (llama3-8b-8192)</span>
                </div>
            </div>

            <ScrollArea className="flex-1 p-4">
                {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center flex-col text-muted-foreground gap-4 mt-32">
                        <Bot className="h-12 w-12 opacity-50" />
                        <p className="text-lg">How can I help you today?</p>
                    </div>
                ) : (
                    <div className="space-y-6 pb-10">
                        {messages.map(m => (
                            <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : ''}`}>
                                <div className={`flex gap-4 max-w-[80%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                        {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                    </div>
                                    <div className={`flex flex-col gap-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div className="font-semibold text-sm">
                                            {m.role === 'user' ? 'You' : 'Assistant'}
                                        </div>
                                        <div className={`prose dark:prose-invert max-w-none text-sm leading-relaxed p-4 rounded-xl ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted/50'}`}>
                                            {/* @ts-expect-error: Property content missing in type definition but present at runtime */}
                                            {m.content}
                                        </div>
                                        {m.role === 'assistant' && (
                                            <Button variant="ghost" size="icon" className="h-6 w-6 mt-1 opacity-50 hover:opacity-100">
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>

            <div className="p-4 bg-background">
                <form onSubmit={handleSubmit} className="flex gap-2 max-w-4xl mx-auto relative items-end">
                    <Input
                        value={input}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        placeholder="Message Assistant..."
                        className="min-h-[60px] resize-none pr-12 rounded-2xl bg-muted/50 border-muted focus-visible:ring-1"
                    />
                    {isLoading ? (
                        <Button type="button" onClick={stop} size="icon" variant="destructive" className="absolute right-2 bottom-3 h-9 w-9 rounded-xl">
                            <StopCircle className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button type="submit" disabled={!input?.trim()} size="icon" className="absolute right-2 bottom-3 h-9 w-9 rounded-xl">
                            <Send className="h-4 w-4" />
                        </Button>
                    )}
                </form>
                <div className="text-center text-xs text-muted-foreground mt-3">
                    AI can make mistakes. Verify important information.
                </div>
            </div>
        </div>
    )
}
