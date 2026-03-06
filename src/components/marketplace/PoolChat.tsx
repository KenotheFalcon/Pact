'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimePostgresInsertPayload } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Send } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatUser {
    id: string
    email?: string
    display_name?: string
    avatar_url?: string
}

interface PoolChatMessage {
    id: string
    pool_id: string
    user_id: string
    message: string
    created_at: string
    user?: {
        id: string
        full_name: string | null
        avatar_url: string | null
    } | null
}

interface PoolChatProps {
    poolId: string
    currentUser: ChatUser | null
}

export function PoolChat({ poolId, currentUser }: PoolChatProps) {
    const supabase = createClient()
    const [messages, setMessages] = useState<PoolChatMessage[]>([])
    const [newMessage, setNewMessage] = useState('')
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // 1. Initial Fetch
        const fetchMessages = async () => {
            const { data } = await supabase
                .from('pool_chat')
                .select(`
          *,
          user:profiles (
            id,
            full_name,
            avatar_url
          )
        `)
                .eq('pool_id', poolId)
                .order('created_at', { ascending: true })

            if (data) setMessages(data as unknown as PoolChatMessage[])
        }

        fetchMessages()

        // 2. Real-time Subscription
        const channel = supabase
            .channel(`pool_chat:${poolId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'pool_chat',
                filter: `pool_id=eq.${poolId}`
            }, async (payload: RealtimePostgresInsertPayload<any>) => {
                // Fetch full user details for the new message
                const { data: userProfile } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url')
                    .eq('id', payload.new.user_id)
                    .single()

                const newMsg = { ...payload.new, user: userProfile } as PoolChatMessage
                setMessages(prev => [...prev, newMsg])
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [poolId, supabase])

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !currentUser) return

        const { error } = await supabase
            .from('pool_chat')
            .insert({
                pool_id: poolId,
                user_id: currentUser.id,
                message: newMessage.trim()
            } as never)

if (error) {
            // Silent fail - message not sent
            return
        }

        setNewMessage('')
    }

    return (
        <div className="flex flex-col h-[400px] md:h-[600px] bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                <h3 className="font-bold text-zinc-900 dark:text-white">Pool Chat</h3>
                <p className="text-xs text-zinc-500">Discuss with other members</p>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                    const isMe = msg.user_id === currentUser?.id
                    return (
                        <div key={msg.id} className={cn("flex gap-3", isMe ? "flex-row-reverse" : "flex-row")}>
                            <Avatar className="w-8 h-8 flex-shrink-0">
                                <AvatarImage src={msg.user?.avatar_url ?? undefined} />
                                <AvatarFallback>{msg.user?.full_name?.[0] || '?'}</AvatarFallback>
                            </Avatar>

                            <div className={cn(
                                "max-w-[80%] p-3 rounded-2xl text-sm",
                                isMe
                                    ? "bg-pact-green text-white rounded-tr-sm"
                                    : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-tl-sm"
                            )}>
                                {!isMe && <span className="block text-xs font-bold mb-1 opacity-70">{msg.user?.full_name}</span>}
                                {msg.message}
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="p-4 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex gap-2">
                <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message…"
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                />
<Button onClick={handleSendMessage} size="icon" className="bg-pact-green hover:bg-pact-green/90" aria-label="Send message">
                    <Send className="w-4 h-4" />
                </Button>
            </div>
        </div>
    )
}
