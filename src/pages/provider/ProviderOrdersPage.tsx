import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, ChevronRight, Clock, TrendingUp, DollarSign } from 'lucide-react'
import { DashboardLayout } from '../../components/DashboardLayout'
import { ordersService } from '../../services/ordersService'
import { useAuth } from '../../hooks/useAuth'
import type { OrderWithDetails, OrderStatus } from '../../types/database'
import { formatCurrency, formatRelativeTime } from '../../utils/formatters'

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string }> = {
  pending:            { label: 'Awaiting Payment',   color: 'badge-yellow' },
  paid:               { label: 'Paid',               color: 'badge-brand' },
  escrowed:           { label: 'In Escrow',          color: 'badge-brand' },
  in_progress:        { label: 'In Progress',        color: 'badge-brand' },
  delivered:          { label: 'Delivered',          color: 'badge-green' },
  revision_requested: { label: 'Revision Requested', color: 'badge-yellow' },
  approved:           { label: 'Approved',           color: 'badge-green' },
  completed:          { label: 'Completed',          color: 'badge-green' },
  cancelled:          { label: 'Cancelled',          color: 'badge-gray' },
  refunded:           { label: 'Refunded',           color: 'badge-gray' },
  disputed:           { label: 'Disputed',           color: 'badge-red' },
}

export default function ProviderOrdersPage() {
  const { profile } = useAuth()
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    ordersService.getForProvider(profile.id)
      .then(setOrders)
      .finally(() => setLoading(false))
  }, [profile])

  const totalEarned = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + o.amount, 0)

  const inEscrow = orders
    .filter(o => ['escrowed', 'in_progress', 'delivered', 'revision_requested'].includes(o.status))
    .reduce((sum, o) => sum + o.amount, 0)

  const activeOrders = orders.filter(o => !['completed', 'cancelled', 'refunded'].includes(o.status))

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold text-surface-50">My Orders</h1>
          <p className="text-surface-400 text-sm mt-1">Manage your active orders and deliveries.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Orders',  value: orders.length,          color: 'text-brand-400',   bg: 'bg-brand-500/15',   icon: Package },
            { label: 'Active Orders', value: activeOrders.length,    color: 'text-accent-400',  bg: 'bg-accent-500/15',  icon: Clock },
            { label: 'In Escrow',     value: formatCurrency(inEscrow),   color: 'text-yellow-400',  bg: 'bg-yellow-500/15',  icon: TrendingUp },
            { label: 'Total Earned',  value: formatCurrency(totalEarned), color: 'text-emerald-400', bg: 'bg-emerald-500/15', icon: DollarSign },
          ].map(({ label, value, color, bg, icon: Icon }) => (
            <div key={label} className="stat-card">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={20} className={color} />
              </div>
              <div>
                <p className="text-xl font-bold text-surface-50">{value}</p>
                <p className="text-xs text-surface-400">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Orders */}
        <div className="glass-card divide-y divide-surface-700">
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="p-5 flex gap-4 animate-pulse">
                <div className="w-12 h-12 shimmer rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 shimmer rounded w-2/3" />
                  <div className="h-3 shimmer rounded w-1/3" />
                </div>
              </div>
            ))
          ) : orders.length === 0 ? (
            <div className="empty-state py-16">
              <div className="w-16 h-16 rounded-2xl bg-brand-500/15 flex items-center justify-center">
                <Package size={32} className="text-brand-400" />
              </div>
              <div>
                <p className="text-surface-50 font-semibold">No orders yet</p>
                <p className="text-surface-400 text-sm mt-1">Your orders will appear here once a customer selects your offer.</p>
              </div>
            </div>
          ) : (
            orders.map(order => {
              const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG['pending']
              const needsDelivery = order.status === 'in_progress' || order.status === 'revision_requested'

              return (
                <Link
                  key={order.id}
                  to={`/dashboard/provider/orders/${order.id}`}
                  className="flex items-center gap-4 p-5 hover:bg-surface-50/5 transition-colors"
                  id={`provider-order-${order.id}`}
                >
                  <div className="w-12 h-12 rounded-xl bg-accent-500/15 flex items-center justify-center text-xl flex-shrink-0">
                    {(order.requirements as any)?.categories?.icon || '📋'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-surface-50 text-sm truncate">
                      {(order.requirements as any)?.title || 'Requirement'}
                    </p>
                    <p className="text-xs text-surface-400 mt-0.5">
                      Customer: {(order.customer as any)?.full_name} · {formatRelativeTime(order.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-surface-50">{formatCurrency(order.amount)}</p>
                      <span className={`badge text-xs ${cfg.color} mt-1`}>{cfg.label}</span>
                    </div>
                    {needsDelivery && (
                      <span className="btn-primary text-xs px-3 py-1.5">
                        {order.status === 'revision_requested' ? 'Re-deliver' : 'Deliver'}
                      </span>
                    )}
                    <ChevronRight size={16} className="text-surface-500" />
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
