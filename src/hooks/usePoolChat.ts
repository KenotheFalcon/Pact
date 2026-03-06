import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { RealtimePostgresInsertPayload } from '@supabase/supabase-js';
import type { PoolChat as PoolChatRow } from '@/types/database';

export function usePoolChat(poolId: string, currentUser: User | null) {
  const [messages, setMessages] = useState<PoolChatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!poolId) return;

    // Fetch initial messages
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('pool_chat')
        .select(`
          *,
          user:profiles (
            display_name,
            avatar_url
          )
        `)
        .eq('pool_id', poolId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data as PoolChatRow[]);
      }
      setLoading(false);
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`pool_chat:${poolId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pool_chat',
          filter: `pool_id=eq.${poolId}`,
        },
        async (payload: RealtimePostgresInsertPayload<any>) => {
          // Fetch the user details for the new message
          const { data: userData } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('id', payload.new.user_id)
            .single();

          const newMessage = {
            ...payload.new,
            user: userData,
          } as PoolChatRow;

          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [poolId, supabase]);

  const sendMessage = async (message: string) => {
    if (!currentUser) return;

    const { error } = await supabase
      .from('pool_chat')
      .insert({
        pool_id: poolId,
        user_id: currentUser.id,
        message,
      } as never);

    if (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  return { messages, loading, sendMessage };
}
