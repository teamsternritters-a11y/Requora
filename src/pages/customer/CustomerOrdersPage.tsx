import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, ChevronRight, Clock, CheckCircle, AlertCircle, Package, ArrowRight } from 'lucide-react'
import { DashboardLayout } from '../../components/DashboardLayout'
import { ordersService } from '../../services/ordersService'
import { useAuth } from '../../hooks/useAuth'
import type { OrderWithDetails, OrderStatus } from '../../types/database'
import { formatCurrency, formatRelativeTime } from '../../utils/formatters'

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending:            { label: 'Pending Payment',    color: 'badge-yellow',  icon: Clock },
  paid:               { label: 'Paid',               color: 'badge-brand',   icon: CheckCircle },
  escrowed:           { label: 'In Escrow',          color: 'badge-brand',   icon: CheckCircle },
  in_progress:        { label: 'In Progress',        color: 'badge-brand',   icon: Clock },
  delivered:          { label: 'Delivered',          color: 'badge-green',   icon: Package },
  revision_requested: { label: 'Revision Requested', color: 'badge-yellow',  icon: AlertCircle },
  approved:           { label: 'Approved',           color: 'badge-green',   icon: CheckCircle },
  completed:          { label: 'Completed',          color: 'badge-green',   icon: CheckCircle },
  cancelled:          { label: 'Cancelled',          color: 'badge-gray',    icon: AlertCircle },
  refunded:           { label: 'Refunded',           color: 'badge-gray',    icon: AlertCircle },
  disputed:           { label: 'Disputed',           color: 'badge-red',     icon: AlertCircle },
}

export default function CustomerOrdersPage() {
  const { profile } = useAuth()
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    ordersService.getForCustomer(profile.id)
      .then(setOrders)
      .finally(() => setLoading(false))
  }, [profile])

  const totalSpend = orders
    .filter(o => ['completed', 'in_progress', 'escrowed', 'delivered', 'approved'].includes(o.status))
    .reduce((sum, o) => sum + o.amount, 0)

  const activeOrders = orders.filter(o => !['completed', 'cancelled', 'refunded'].includes(o.status))

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold text-surface-50">My Orders</h1>
          <p className="text-surface-400 text-sm mt-1">Track your orders, payments, and deliveries.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Total Orders', value: orders.length, color: 'text-brand-400', bg: 'bg-brand-500/15', icon: ShoppingBag },
            { label: 'Active Orders', value: activeOrders.length, color: 'text-accent-400', bg: 'bg-accent-500/15', icon: Clock },
            { label: 'Total Spent', value: formatCurrency(totalSpend), color: 'text-emerald-400', bg: 'bg-emerald-500/15', icon: CheckCircle },
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

        {/* Orders List */}
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
                <ShoppingBag size={32} className="text-brand-400" />
              </div>
              <div>
                <p className="text-surface-50 font-semibold">No orders yet</p>
                <p className="text-surface-400 text-sm mt-1">Select a provider offer to create your first order.</p>
              </div>
              <Link to="/dashboard/customer/requirements" className="btn-primary">
                <ArrowRight size={16} />
                View My Requirements
              </Link>
            </div>
          ) : (
            orders.map(order => {
              const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG['pending']
              const StatusIcon = cfg.icon
              const isPending = order.status === 'pending'

              return (
                <Link
                  key={order.id}
                  to={isPending ? `/dashboard/customer/orders/${order.id}/pay` : `/dashboard/customer/orders/${order.id}`}
                  className="flex items-center gap-4 p-5 hover:bg-surface-50/5 transition-colors"
                  id={`order-${order.id}`}
                >
                  <div className="w-12 h-12 rounded-xl bg-brand-500/15 flex items-center justify-center text-xl flex-shrink-0">
                    {(order.requirements as any)?.categories?.icon || '📋'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-surface-50 text-sm truncate">
                      {(order.requirements as any)?.title || 'Requirement'}
                    </p>
                    <p className="text-xs text-surface-400 mt-0.5">
                      Provider: {(order.provider as any)?.full_name} · {formatRelativeTime(order.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-surface-50">{formatCurrency(order.amount)}</p>
                      <span className={`badge text-xs ${cfg.color} mt-1`}>
                        <StatusIcon size={10} />
                        {cfg.label}
                      </span>
                    </div>
                    {isPending && (
                      <span className="btn-primary text-xs px-3 py-1.5">Pay Now</span>
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
