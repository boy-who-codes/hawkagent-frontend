"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PlusCircle, MessageSquare, Settings, LogOut, PanelLeftClose, PanelLeft, Trash2, Edit2, Users } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(false)

    return (
        <div
            className={cn(
                "bg-muted/30 border-r flex flex-col transition-all duration-300 relative",
                collapsed ? "w-0 overflow-hidden md:w-16" : "w-64 md:w-72"
            )}
        >
            <div className="p-4 flex items-center justify-between border-b">
                {!collapsed && <span className="font-semibold text-lg overflow-hidden whitespace-nowrap">Chats</span>}
                <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className={cn("ml-auto", collapsed && "md:block hidden")}>
                    {collapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                </Button>
            </div>

            <div className="p-4">
                <Button className="w-full justify-start gap-2" variant="default" size={collapsed ? "icon" : "default"}>
                    <PlusCircle className="h-4 w-4" />
                    {!collapsed && <span>New Chat</span>}
                </Button>
            </div>

            <ScrollArea className="flex-1 px-3">
                <div className="space-y-2 pb-4">
                    <div className="text-xs font-semibold text-muted-foreground mb-2 px-2 mt-4 hidden md:block">
                        {!collapsed ? "Recent" : "..."}
                    </div>
                    {/* Mock history items */}
                    {[1, 2, 3].map((i) => (
                        <Link href={`/chat/${i}`} key={i}>
                            <div className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer text-sm group transition-colors">
                                <MessageSquare className="h-4 w-4 shrink-0" />
                                {!collapsed && (
                                    <>
                                        <span className="flex-1 truncate">How to build a chat API</span>
                                        <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                                            <Button variant="ghost" size="icon" className="h-6 w-6"><Edit2 className="h-3 w-3" /></Button>
                                            <Button variant="ghost" size="icon" className="h-6 w-6"><Trash2 className="h-3 w-3 text-destructive" /></Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            </ScrollArea>

            <div className="mt-auto p-4 border-t flex flex-col gap-2">
                <Link href="/campaigns">
                    <Button variant="ghost" className="w-full justify-start gap-3" size={collapsed ? "icon" : "default"}>
                        <Users className="h-4 w-4" />
                        {!collapsed && <span>Campaigns</span>}
                    </Button>
                </Link>
                <Link href="/settings">
                    <Button variant="ghost" className="w-full justify-start gap-3" size={collapsed ? "icon" : "default"}>
                        <Settings className="h-4 w-4" />
                        {!collapsed && <span>Settings</span>}
                    </Button>
                </Link>
                <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground justify-start" size={collapsed ? "icon" : "default"}>
                    <LogOut className="h-4 w-4" />
                    {!collapsed && <span>Log out</span>}
                </Button>
            </div>
        </div>
    )
}
