import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Clock, CheckCircle, AlertCircle, Package, Truck,
  ExternalLink, GitBranch, FolderOpen, Download,
  MessageSquare, Shield, AlertTriangle, Star, DollarSign,
  Mail, Phone, MapPin, User
} from 'lucide-react'
import { DashboardLayout } from '../components/DashboardLayout'
import { ordersService } from '../services/ordersService'
import { reviewsService } from '../services/reviewsService'
import { useAuth } from '../hooks/useAuth'
import type { OrderWithDetails, OrderStatus, OrderEvent } from '../types/database'
import { formatCurrency, formatDate, formatRelativeTime, getInitials } from '../utils/formatters'
import toast from 'react-hot-toast'
import { ReviewModal } from '../components/ReviewModal'

// ─── Status Config ────────────────────────────────────────────

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: React.ElementType; step: number }> = {
  pending:            { label: 'Pending Payment',    color: 'text-yellow-400', icon: Clock,         step: 0 },
  paid:               { label: 'Paid',               color: 'text-brand-400',  icon: CheckCircle,   step: 1 },
  escrowed:           { label: 'In Escrow',          color: 'text-brand-400',  icon: Shield,        step: 1 },
  in_progress:        { label: 'In Progress',        color: 'text-brand-400',  icon: Clock,         step: 2 },
  delivered:          { label: 'Delivered',          color: 'text-emerald-400',icon: Package,       step: 3 },
  revision_requested: { label: 'Revision Requested', color: 'text-yellow-400', icon: AlertCircle,   step: 3 },
  approved:           { label: 'Approved',           color: 'text-emerald-400',icon: CheckCircle,   step: 4 },
  completed:          { label: 'Completed',          color: 'text-emerald-400',icon: CheckCircle,   step: 6 },
  cancelled:          { label: 'Cancelled',          color: 'text-surface-400',icon: AlertCircle,   step: -1 },
  refunded:           { label: 'Refunded',           color: 'text-surface-400',icon: AlertCircle,   step: -1 },
  disputed:           { label: 'Disputed',           color: 'text-red-400',    icon: AlertTriangle, step: -1 },
}

const STEPS = ['Order Created', 'Payment', 'In Progress', 'Delivered', 'Approved', 'Completed']

// ─── Main Component ───────────────────────────────────────────

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuth()

  const [order, setOrder] = useState<OrderWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [revisionNotes, setRevisionNotes] = useState('')
  const [disputeReason, setDisputeReason] = useState('')
  const [showRevisionForm, setShowRevisionForm] = useState(false)
  const [showDisputeForm, setShowDisputeForm] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [hasReviewed, setHasReviewed] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)

  const isCustomer = profile?.role === 'customer'
  const isProvider = profile?.role === 'provider'

  const load = useCallback(async () => {
    if (!id) return
    try {
      const o = await ordersService.getById(id)
      setOrder(o)
      if (o.status === 'completed' && profile?.id === o.customer_id) {
        const reviewed = await reviewsService.hasReviewed(o.id, profile.id)
        setHasReviewed(reviewed)
      }
    } catch {
      toast.error('Order not found')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const latestDelivery = order?.deliveries?.sort((a, b) =>
    new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
  )[0]

  const payment = order?.payments?.[0]

  const handleApprove = async () => {
    if (!order || !profile) return
    setActionLoading(true)
    try {
      await ordersService.approveDelivery({
        orderId: order.id,
        deliveryId: latestDelivery!.id,
        customerId: profile.id,
        providerId: order.provider_id,
        amount: order.amount,
      })
      toast.success('Delivery approved! Escrow released to provider.')
      await load()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRevision = async () => {
    if (!order || !profile || !revisionNotes.trim()) return
    setActionLoading(true)
    try {
      await ordersService.requestRevision({
        orderId: order.id,
        deliveryId: latestDelivery!.id,
        customerId: profile.id,
        providerId: order.provider_id,
        notes: revisionNotes,
      })
      toast.success('Revision requested. Provider has been notified.')
      setShowRevisionForm(false)
      setRevisionNotes('')
      await load()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDispute = async () => {
    if (!order || !profile || !disputeReason.trim()) return
    setActionLoading(true)
    try {
      await ordersService.raiseDispute({
        orderId: order.id,
        raisedBy: profile.id,
        providerId: order.provider_id,
        reason: disputeReason,
      })
      toast.success('Dispute raised. Our team will review it.')
      setShowDisputeForm(false)
      setDisputeReason('')
      await load()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-4 animate-pulse">
          <div className="h-8 shimmer rounded w-1/3" />
          <div className="h-40 shimmer rounded-2xl" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-64 shimmer rounded-2xl" />
            <div className="h-64 shimmer rounded-2xl" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!order) {
    return (
      <DashboardLayout>
        <div className="empty-state glass-card">
          <p className="text-surface-50">Order not found</p>
          <Link to={isCustomer ? '/dashboard/customer/orders' : '/dashboard/provider/orders'} className="btn-primary">Back to Orders</Link>
        </div>
      </DashboardLayout>
    )
  }

  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG['pending']
  const StatusIcon = cfg.icon
  const currentStep = cfg.step

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to={isCustomer ? '/dashboard/customer/orders' : '/dashboard/provider/orders'} className="p-2 rounded-xl hover:bg-surface-700 transition-colors text-surface-300">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-display font-bold text-surface-50">Order Details</h1>
              <span className={`badge ${cfg.color.replace('text-', 'badge-').replace('-400', '')} flex items-center gap-1`}>
                <StatusIcon size={12} />
                {cfg.label}
              </span>
            </div>
            <p className="text-surface-400 text-sm mt-0.5">{(order.requirements as any)?.title}</p>
          </div>
          {/* Provider deliver button */}
          {isProvider && (order.status === 'in_progress' || order.status === 'revision_requested') && (
            <Link to={`/dashboard/provider/orders/${order.id}/deliver`} className="btn-primary">
              <Package size={16} />
              {order.status === 'revision_requested' ? 'Re-submit Delivery' : 'Submit Delivery'}
            </Link>
          )}
          {/* Customer pay button */}
          {isCustomer && order.status === 'pending' && (
            <Link to={`/dashboard/customer/orders/${order.id}/pay`} className="btn-primary">
              <DollarSign size={16} />
              Pay Now
            </Link>
          )}
          {/* Customer review button */}
          {isCustomer && order.status === 'completed' && !hasReviewed && (
            <button onClick={() => setShowReviewModal(true)} className="btn-primary bg-yellow-500 hover:bg-yellow-600 text-slate-900 border-none shadow-sm">
              <Star size={16} className="fill-slate-900" />
              Leave a Review
            </button>
          )}
        </div>

        {/* Progress Stepper */}
        {currentStep >= 0 && (
          <div className="glass-card p-5">
            <div className="flex items-center">
              {STEPS.map((step, i) => (
                <div key={step} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                      i < currentStep ? 'bg-brand-500 border-brand-500 text-white' :
                      i === currentStep ? 'border-brand-500 text-brand-400 bg-brand-500/15' :
                      'border-surface-600 text-surface-500 bg-transparent'
                    }`}>
                      {i < currentStep ? <CheckCircle size={14} /> : i + 1}
                    </div>
                    <span className={`text-xs text-center leading-tight ${i <= currentStep ? 'text-surface-300' : 'text-surface-600'}`} style={{ maxWidth: '60px' }}>
                      {step}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-2 ${i < currentStep ? 'bg-brand-500' : 'bg-surface-700'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Parties */}
            <div className="glass-card p-5 space-y-4">
              <h2 className="font-semibold text-surface-50">Parties</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { role: 'Customer', data: order.customer as any },
                  { role: 'Provider', data: order.provider as any },
                ].map(({ role, data }) => (
                  <div key={role} className="flex items-center gap-3 p-3 rounded-xl bg-surface-50/5">
                    <div className="w-10 h-10 rounded-full bg-brand-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {data?.avatar_url ? (
                        <img src={data.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : getInitials(data?.full_name || 'U')}
                    </div>
                    <div>
                      <p className="text-xs text-surface-400">{role}</p>
                      <p className="text-sm font-medium text-surface-50">{data?.full_name}</p>
                      {data?.rating > 0 && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star size={10} className="text-yellow-400 fill-yellow-400" />
                          <span className="text-xs text-surface-400">{data.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Contact / Address Card */}
            {(order.delivery_contact_email || order.delivery_contact_phone || order.delivery_address) && (
              <div className="glass-card p-5 space-y-4">
                <h2 className="font-semibold text-surface-50">
                  {order.requirement_type === 'physical' ? 'Delivery Address & Contact' : 'Service Delivery Contact'}
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {order.delivery_contact_name && (
                    <div className="flex items-start gap-2">
                      <div className="w-7 h-7 rounded-lg bg-brand-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User size={13} className="text-brand-400" />
                      </div>
                      <div>
                        <p className="text-xs text-surface-400">Contact Name</p>
                        <p className="text-sm font-medium text-surface-50">{order.delivery_contact_name}</p>
                      </div>
                    </div>
                  )}
                  {order.delivery_contact_email && (
                    <div className="flex items-start gap-2">
                      <div className="w-7 h-7 rounded-lg bg-brand-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Mail size={13} className="text-brand-400" />
                      </div>
                      <div>
                        <p className="text-xs text-surface-400">Email</p>
                        <a href={`mailto:${order.delivery_contact_email}`} className="text-sm font-medium text-brand-400 hover:text-brand-300">{order.delivery_contact_email}</a>
                      </div>
                    </div>
                  )}
                  {order.delivery_contact_phone && (
                    <div className="flex items-start gap-2">
                      <div className="w-7 h-7 rounded-lg bg-brand-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Phone size={13} className="text-brand-400" />
                      </div>
                      <div>
                        <p className="text-xs text-surface-400">Phone / WhatsApp</p>
                        <a href={`tel:${order.delivery_contact_phone}`} className="text-sm font-medium text-brand-400 hover:text-brand-300">{order.delivery_contact_phone}</a>
                      </div>
                    </div>
                  )}
                </div>
                {order.requirement_type === 'physical' && order.delivery_address && (
                  <div className="border-t border-surface-700 pt-4">
                    <div className="flex items-start gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <MapPin size={13} className="text-amber-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-surface-400 mb-1">Delivery Address</p>
                        <p className="text-sm font-medium text-surface-50">{order.delivery_address}</p>
                        {(order.delivery_city || order.delivery_state || order.delivery_pincode) && (
                          <p className="text-sm text-surface-300">
                            {[order.delivery_city, order.delivery_state, order.delivery_pincode].filter(Boolean).join(', ')}
                          </p>
                        )}
                        {order.delivery_instructions && (
                          <p className="text-xs text-surface-400 mt-2 italic">{order.delivery_instructions}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Delivery Section */}
            {latestDelivery && (
              <div className="glass-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-surface-50">Delivery</h2>
                  <span className={`badge text-xs ${
                    latestDelivery.status === 'approved' ? 'badge-green' :
                    latestDelivery.status === 'revision_requested' ? 'badge-yellow' :
                    'badge-brand'
                  }`}>
                    {latestDelivery.status}
                  </span>
                </div>

                {latestDelivery.type === 'digital' ? (
                  <div className="space-y-3">
                    {/* Files */}
                    {latestDelivery.files.length > 0 && (
                      <div>
                        <p className="text-xs text-surface-400 mb-2">Files</p>
                        <div className="space-y-1">
                          {latestDelivery.files.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-700 transition-colors group">
                              <Download size={14} className="text-brand-400 flex-shrink-0" />
                              <span className="text-sm text-surface-300 group-hover:text-surface-50 truncate">
                                File {i + 1}
                              </span>
                              <ExternalLink size={12} className="text-surface-500 ml-auto" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Links */}
                    {[
                      { label: 'Google Drive', value: latestDelivery.drive_link, icon: FolderOpen },
                      { label: 'GitHub',       value: latestDelivery.github_link, icon: GitBranch },
                      ...(latestDelivery.extra_links || []).map((url, i) => ({ label: `Link ${i + 1}`, value: url, icon: ExternalLink })),
                    ].filter(l => l.value).map(({ label, value, icon: Icon }) => (
                      <a key={label} href={value!} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl border border-surface-700 hover:border-brand-500 transition-colors group">
                        <Icon size={16} className="text-brand-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-surface-400">{label}</p>
                          <p className="text-sm text-surface-300 group-hover:text-brand-400 truncate">{value}</p>
                        </div>
                        <ExternalLink size={14} className="text-surface-500" />
                      </a>
                    ))}

                    {/* Notes */}
                    {latestDelivery.notes && (
                      <div className="p-3 rounded-xl bg-surface-50/5">
                        <p className="text-xs text-surface-400 mb-1">Provider Notes</p>
                        <p className="text-sm text-surface-200">{latestDelivery.notes}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Physical Tracking */
                  <div className="space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      {[
                        { label: 'Courier',   value: latestDelivery.courier },
                        { label: 'Tracking',  value: latestDelivery.tracking_number },
                        { label: 'Shipped',   value: latestDelivery.shipment_date ? formatDate(latestDelivery.shipment_date) : null },
                        { label: 'Expected',  value: latestDelivery.estimated_arrival ? formatDate(latestDelivery.estimated_arrival) : null },
                      ].filter(f => f.value).map(({ label, value }) => (
                        <div key={label} className="p-3 rounded-xl bg-surface-50/5">
                          <p className="text-xs text-surface-400">{label}</p>
                          <p className="text-sm font-medium text-surface-50 mt-0.5">{value}</p>
                        </div>
                      ))}
                    </div>
                    {latestDelivery.physical_status && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-brand-500/10 border border-brand-500/20">
                        <Truck size={16} className="text-brand-400" />
                        <span className="text-sm text-brand-400 font-medium capitalize">
                          {latestDelivery.physical_status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Customer Actions on Delivery */}
                {isCustomer && latestDelivery.status === 'pending' && order.status === 'delivered' && (
                  <div className="border-t border-surface-700 pt-4 space-y-3">
                    <p className="text-sm font-medium text-surface-300">Review Delivery</p>

                    {!showRevisionForm && !showDisputeForm && (
                      <div className="flex flex-wrap gap-3">
                        <button onClick={handleApprove} disabled={actionLoading} className="btn-primary flex-1 justify-center">
                          <CheckCircle size={16} />
                          Approve & Release Payment
                        </button>
                        <button onClick={() => setShowRevisionForm(true)} className="btn-secondary flex-1 justify-center">
                          <MessageSquare size={16} />
                          Request Revision
                        </button>
                        <button onClick={() => setShowDisputeForm(true)} className="btn-ghost text-red-400 hover:bg-red-500/10 flex-1 justify-center">
                          <AlertTriangle size={16} />
                          Raise Dispute
                        </button>
                      </div>
                    )}

                    {showRevisionForm && (
                      <div className="space-y-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                        <p className="text-sm font-medium text-yellow-400">Request Revision</p>
                        <textarea
                          value={revisionNotes}
                          onChange={e => setRevisionNotes(e.target.value)}
                          rows={3}
                          placeholder="Describe what changes you need..."
                          className="form-input resize-none"
                        />
                        <div className="flex gap-2">
                          <button onClick={handleRevision} disabled={actionLoading || !revisionNotes.trim()} className="btn-primary flex-1 justify-center">Send Request</button>
                          <button onClick={() => setShowRevisionForm(false)} className="btn-ghost flex-1 justify-center">Cancel</button>
                        </div>
                      </div>
                    )}

                    {showDisputeForm && (
                      <div className="space-y-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                        <p className="text-sm font-medium text-red-400">Raise Dispute</p>
                        <textarea
                          value={disputeReason}
                          onChange={e => setDisputeReason(e.target.value)}
                          rows={3}
                          placeholder="Describe the issue..."
                          className="form-input resize-none"
                        />
                        <div className="flex gap-2">
                          <button onClick={handleDispute} disabled={actionLoading || !disputeReason.trim()} className="btn-primary bg-red-500 hover:bg-red-600 border-red-500 flex-1 justify-center">Submit Dispute</button>
                          <button onClick={() => setShowDisputeForm(false)} className="btn-ghost flex-1 justify-center">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Activity Log */}
            {(order.order_events?.length ?? 0) > 0 && (
              <div className="glass-card p-5 space-y-4">
                <h2 className="font-semibold text-surface-50">Activity Log</h2>
                <div className="space-y-3">
                  {[...(order.order_events || [])].sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                  ).map((event: OrderEvent) => (
                    <div key={event.id} className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-brand-500 mt-2 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-surface-200">{event.description}</p>
                        <p className="text-xs text-surface-500 mt-0.5">{formatRelativeTime(event.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column — Summary */}
          <div className="space-y-4">
            {/* Payment Summary */}
            <div className="glass-card p-5 space-y-3">
              <h2 className="font-semibold text-surface-50">Payment</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-surface-400">Amount</span>
                  <span className="text-surface-50 font-medium">{formatCurrency(order.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-400">Method</span>
                  <span className="text-surface-50 capitalize">{payment?.method?.replace(/_/g, ' ') ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-400">Status</span>
                  <span className={`font-medium ${payment?.status === 'completed' ? 'text-emerald-400' : 'text-yellow-400'}`}>
                    {payment?.status ?? 'Pending'}
                  </span>
                </div>
                {payment?.transaction_ref && (
                  <div className="pt-2 border-t border-surface-700">
                    <p className="text-xs text-surface-400">Transaction Ref</p>
                    <p className="text-xs font-mono text-surface-300 mt-0.5 break-all">{payment.transaction_ref}</p>
                  </div>
                )}
              </div>
              {isCustomer && order.status === 'pending' && (
                <Link to={`/dashboard/customer/orders/${order.id}/pay`} className="btn-primary w-full justify-center mt-2">
                  <DollarSign size={16} />
                  Pay Now
                </Link>
              )}
            </div>

            {/* Escrow Status */}
            {(order.escrow_records?.length ?? 0) > 0 && (
              <div className="glass-card p-5 space-y-3">
                <h2 className="font-semibold text-surface-50 flex items-center gap-2">
                  <Shield size={16} className="text-brand-400" />
                  Escrow
                </h2>
                {(() => {
                  const escrow = order.escrow_records![0]
                  return (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-surface-400">Amount</span>
                        <span className="text-surface-50 font-medium">{formatCurrency(escrow.amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-surface-400">Status</span>
                        <span className={`font-medium ${
                          escrow.status === 'released' ? 'text-emerald-400' :
                          escrow.status === 'refunded' ? 'text-yellow-400' :
                          'text-brand-400'
                        }`}>{escrow.status}</span>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Order Info */}
            <div className="glass-card p-5 space-y-3">
              <h2 className="font-semibold text-surface-50">Order Info</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-surface-400">Type</span>
                  <span className="text-surface-50 capitalize">{order.requirement_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-400">Created</span>
                  <span className="text-surface-50">{formatDate(order.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-400">Order ID</span>
                  <span className="text-surface-500 font-mono text-xs">{order.id.slice(0, 8)}…</span>
                </div>
              </div>
            </div>

            {/* Dispute Info */}
            {(order.disputes?.length ?? 0) > 0 && (
              <div className="glass-card p-5 space-y-3 border-red-500/30 border">
                <h2 className="font-semibold text-red-400 flex items-center gap-2">
                  <AlertTriangle size={16} />
                  Dispute
                </h2>
                <p className="text-sm text-surface-300">{order.disputes![0].reason}</p>
                <span className="badge badge-red">{order.disputes![0].status}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {showReviewModal && order && (
        <ReviewModal
          order={order}
          onClose={() => setShowReviewModal(false)}
          onSuccess={() => {
            setShowReviewModal(false)
            setHasReviewed(true)
          }}
        />
      )}
    </DashboardLayout>
  )
}
