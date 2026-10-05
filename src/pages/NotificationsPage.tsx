import { DashboardLayout } from '../components/DashboardLayout'
import { useNotifications } from '../hooks/useNotifications'
import { formatRelativeTime } from '../utils/formatters'
import { Bell, Star, Trophy, X, Info, Check, CheckCheck } from 'lucide-react'
import type { NotificationType } from '../types/database'
import { Link } from 'react-router-dom'

const notifIcons: Record<NotificationType, { icon: React.ElementType; color: string; bg: string }> = {
  new_offer:                    { icon: Bell,       color: 'text-brand-400',   bg: 'bg-brand-500/15' },
  shortlisted:                  { icon: Star,       color: 'text-yellow-400',  bg: 'bg-yellow-500/15' },
  selected:                     { icon: Trophy,     color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  closed:                       { icon: X,          color: 'text-red-400',     bg: 'bg-red-500/15' },
  new_requirement:              { icon: Info,       color: 'text-accent-400',  bg: 'bg-accent-500/15' },
  offer_rejected:               { icon: X,          color: 'text-red-400',     bg: 'bg-red-500/15' },
  // v2
  payment_received:             { icon: Check,      color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  order_created:                { icon: Bell,       color: 'text-brand-400',   bg: 'bg-brand-500/15' },
  delivery_submitted:           { icon: CheckCheck, color: 'text-brand-400',   bg: 'bg-brand-500/15' },
  delivery_approved:            { icon: Trophy,     color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  delivery_revision_requested:  { icon: Info,       color: 'text-yellow-400',  bg: 'bg-yellow-500/15' },
  order_completed:              { icon: Trophy,     color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  refund_issued:                { icon: Check,      color: 'text-accent-400',  bg: 'bg-accent-500/15' },
  dispute_raised:               { icon: X,          color: 'text-red-400',     bg: 'bg-red-500/15' },
}

interface NotificationsPageProps {
  role?: 'customer' | 'provider'
}

export default function NotificationsPage({ role }: NotificationsPageProps) {
  const { notifications, loading, markRead, markAllRead, unreadCount } = useNotifications()

  const getLink = (notif: any): string => {
    const d = notif.data as any
    if (d?.requirement_id && role === 'customer') return `/dashboard/customer/requirements/${d.requirement_id}`
    if (d?.requirement_id && role === 'provider') return `/requirements/${d.requirement_id}`
    return '#'
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-surface-50">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-surface-300 text-sm mt-1">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              id="mark-all-read"
              onClick={markAllRead}
              className="btn-ghost text-sm flex items-center gap-1.5"
            >
              <CheckCheck size={16} />
              Mark all read
            </button>
          )}
        </div>

        <div className="glass-card divide-y divide-surface-700">
          {loading ? (
            [1, 2, 3, 4].map(i => (
              <div key={i} className="flex gap-4 p-5">
                <div className="w-10 h-10 rounded-xl shimmer flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 shimmer rounded w-3/4" />
                  <div className="h-3 shimmer rounded w-1/2" />
                </div>
              </div>
            ))
          ) : notifications.length > 0 ? (
            notifications.map((notif: any) => {
              const config = notifIcons[notif.type as NotificationType] || notifIcons.new_offer
              const Icon = config.icon
              return (
                <div
                  key={notif.id}
                  className={`flex gap-4 p-5 transition-colors ${notif.read ? '' : 'bg-brand-50'}`}
                >
                  <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={18} className={config.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${notif.read ? 'text-surface-200' : 'text-surface-50'}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-surface-400 mt-0.5 leading-relaxed">{notif.message}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-surface-500">{formatRelativeTime(notif.created_at)}</span>
                      {(notif.data as any)?.requirement_id && (
                        <Link
                          to={getLink(notif)}
                          onClick={() => !notif.read && markRead(notif.id)}
                          className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                        >
                          View →
                        </Link>
                      )}
                    </div>
                  </div>
                  {!notif.read && (
                    <button
                      onClick={() => markRead(notif.id)}
                      className="flex-shrink-0 p-1.5 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-surface-50 transition-colors"
                      title="Mark as read"
                    >
                      <Check size={14} />
                    </button>
                  )}
                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-1" />
                  )}
                </div>
              )
            })
          ) : (
            <div className="empty-state py-20">
              <Bell size={40} className="text-surface-600" />
              <div>
                <p className="text-surface-50 font-semibold">No notifications</p>
                <p className="text-surface-400 text-sm mt-1">You're all caught up!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
