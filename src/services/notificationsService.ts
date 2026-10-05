import { supabase } from '../lib/supabase'
import type { Notification } from '../types/database'

export const notificationsService = {
  async getByUser(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw error
    return data as Notification[]
  },

  async markRead(id: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true } as any)
      .eq('id', id)
    if (error) throw error
  },

  async markAllRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true } as any)
      .eq('user_id', userId)
      .eq('read', false)
    if (error) throw error
  },

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)
    if (error) return 0
    return count ?? 0
  },

  subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    const channelName = `notifications:${userId}`
    // Remove any existing channel with the same name before creating a new one
    supabase.getChannels().forEach(ch => {
      if (ch.topic === `realtime:${channelName}`) {
        supabase.removeChannel(ch)
      }
    })
    return supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => callback(payload.new as Notification)
      )
      .subscribe()
  },
}
