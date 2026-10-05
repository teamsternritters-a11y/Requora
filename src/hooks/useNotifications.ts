import { useState, useEffect, useCallback } from 'react'
import { notificationsService } from '../services/notificationsService'
import type { Notification } from '../types/database'
import { useAuth } from './useAuth'

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await notificationsService.getByUser(user.id)
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.read).length)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!user) return
    let channel: ReturnType<typeof notificationsService.subscribeToNotifications> | null = null
    try {
      channel = notificationsService.subscribeToNotifications(user.id, (notif) => {
        setNotifications(prev => [notif, ...prev])
        setUnreadCount(prev => prev + 1)
      })
    } catch (e) {
      console.warn('Realtime subscription failed:', e)
    }
    return () => { channel?.unsubscribe() }
  }, [user])

  const markRead = async (id: string) => {
    await notificationsService.markRead(id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllRead = async () => {
    if (!user) return
    await notificationsService.markAllRead(user.id)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  return { notifications, unreadCount, loading, markRead, markAllRead, refresh: load }
}
