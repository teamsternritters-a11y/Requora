import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, CreditCard, Smartphone, Building2, Wallet, Zap,
  Lock, Shield, CheckCircle, MapPin, Mail, Phone, Package, Globe
} from 'lucide-react'
import { DashboardLayout } from '../../components/DashboardLayout'
import { ordersService } from '../../services/ordersService'
import { useAuth } from '../../hooks/useAuth'
import type { OrderWithDetails, PaymentMethod } from '../../types/database'
import { formatCurrency } from '../../utils/formatters'
import toast from 'react-hot-toast'

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'demo',        label: 'Demo Payment',  icon: Zap,          desc: 'Instant simulated payment — no real money' },
  { id: 'upi',         label: 'UPI',           icon: Smartphone,   desc: 'Pay via any UPI app (simulated)' },
  { id: 'card',        label: 'Card',          icon: CreditCard,   desc: 'Credit / Debit card (simulated)' },
  { id: 'net_banking', label: 'Net Banking',   icon: Building2,    desc: 'Bank transfer (simulated)' },
  { id: 'wallet',      label: 'Wallet',        icon: Wallet,       desc: 'Digital wallet (simulated)' },
]

interface DeliveryDetails {
  contactName: string
  contactEmail: string
  contactPhone: string
  address: string
  city: string
  state: string
  pincode: string
  instructions: string
}

export default function PaymentPage() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [order, setOrder] = useState<OrderWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('demo')
  const [paying, setPaying] = useState(false)
  const [paid, setPaid] = useState(false)

  const [delivery, setDelivery] = useState<DeliveryDetails>({
    contactName: profile?.full_name || '',
    contactEmail: profile?.email || '',
    contactPhone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    instructions: '',
  })

  useEffect(() => {
    if (!id) return
    ordersService.getById(id)
      .then(o => {
        setOrder(o)
        // Pre-fill name and email from profile
        setDelivery(d => ({
          ...d,
          contactName: profile?.full_name || '',
          contactEmail: profile?.email || '',
        }))
      })
      .catch(() => toast.error('Order not found'))
      .finally(() => setLoading(false))
  }, [id, profile])

  const isPhysical = order?.requirement_type === 'physical'

  const handlePay = async () => {
    if (!order || !profile) return

    // Validate required contact fields
    if (!delivery.contactEmail && !delivery.contactPhone) {
      toast.error('Please provide at least an email address or phone number')
      return
    }

    // Validate address for physical orders
    if (isPhysical) {
      if (!delivery.address || !delivery.city || !delivery.pincode) {
        toast.error('Please fill in the full delivery address (required for physical orders)')
        return
      }
    }

    setPaying(true)
    try {
      await ordersService.submitPayment({
        orderId: order.id,
        customerId: profile.id,
        providerId: order.provider_id,
        amount: order.amount,
        method: selectedMethod,
        deliveryContactName: delivery.contactName,
        deliveryContactEmail: delivery.contactEmail,
        deliveryContactPhone: delivery.contactPhone,
        deliveryAddress: delivery.address,
        deliveryCity: delivery.city,
        deliveryState: delivery.state,
        deliveryPincode: delivery.pincode,
        deliveryInstructions: delivery.instructions,
        
        // Pass info for the email edge function
        customerEmail: profile.email || delivery.contactEmail,
        customerName: profile.full_name,
        requirementTitle: (order.requirements as any)?.title,
        providerName: (order.provider as any)?.full_name,
      })
      setPaid(true)
      setTimeout(() => navigate(`/dashboard/customer/orders/${order.id}`), 2500)
    } catch (err: any) {
      toast.error(err.message || 'Payment failed')
      setPaying(false)
    }
  }

  const set = (key: keyof DeliveryDetails) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDelivery(d => ({ ...d, [key]: e.target.value }))

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
          <div className="h-8 shimmer rounded w-1/2" />
          <div className="h-48 shimmer rounded-2xl" />
          <div className="h-64 shimmer rounded-2xl" />
        </div>
      </DashboardLayout>
    )
  }

  if (!order) {
    return (
      <DashboardLayout>
        <div className="empty-state glass-card">
          <p className="text-surface-50 font-semibold">Order not found</p>
          <Link to="/dashboard/customer/orders" className="btn-primary">Go to Orders</Link>
        </div>
      </DashboardLayout>
    )
  }

  if (paid) {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto">
          <div className="glass-card p-10 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
              <CheckCircle size={40} className="text-emerald-500" />
            </div>
            <h1 className="text-2xl font-display font-bold text-surface-50">Payment Successful!</h1>
            <p className="text-surface-400">Funds are now in escrow. The provider has been notified to begin work.</p>
            <p className="text-surface-500 text-sm">Redirecting to order details...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to="/dashboard/customer/orders" className="p-2 rounded-xl hover:bg-surface-700 transition-colors text-surface-300">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold text-surface-50">Complete Payment</h1>
            <p className="text-surface-400 text-sm mt-0.5">Secure escrow payment</p>
          </div>
        </div>

        {/* Order Summary */}
        <div className="glass-card p-5 space-y-4">
          <h2 className="font-semibold text-surface-50">Order Summary</h2>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center flex-shrink-0">
              {isPhysical ? <Package size={18} className="text-brand-400" /> : <Globe size={18} className="text-brand-400" />}
            </div>
            <div className="flex-1">
              <p className="font-medium text-surface-50 text-sm">{(order.requirements as any)?.title}</p>
              <p className="text-surface-400 text-xs mt-0.5">
                Provider: {(order.provider as any)?.full_name}
              </p>
              <span className={`inline-flex items-center gap-1 mt-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                isPhysical
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'bg-brand-500/15 text-brand-400'
              }`}>
                {isPhysical ? <Package size={10} /> : <Globe size={10} />}
                {isPhysical ? 'Physical Delivery' : 'Digital / Service Delivery'}
              </span>
            </div>
          </div>
          <div className="border-t border-surface-700 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-surface-400">Order Amount</span>
              <span className="text-surface-50 font-medium">{formatCurrency(order.amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-400">Platform Fee</span>
              <span className="text-emerald-400 font-medium">Free</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t border-surface-700 pt-2 mt-2">
              <span className="text-surface-50">Total</span>
              <span className="text-surface-50">{formatCurrency(order.amount)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Lock size={14} className="text-emerald-400 flex-shrink-0" />
            <p className="text-xs text-emerald-400">Funds are held securely in escrow until you approve the delivery</p>
          </div>
        </div>

        {/* Delivery Contact Details */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            {isPhysical ? <MapPin size={18} className="text-brand-400" /> : <Mail size={18} className="text-brand-400" />}
            <h2 className="font-semibold text-surface-50">
              Delivery Address & Contact
            </h2>
          </div>
          <p className="text-xs text-surface-400 -mt-2">
            The provider will use this contact and address to deliver the order.
          </p>

          {/* Contact fields */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-surface-300 mb-1.5">Full Name</label>
              <input
                type="text"
                className="w-full px-3 py-2.5 rounded-xl border border-surface-600 bg-surface-800 text-surface-50 text-sm placeholder-surface-500 focus:outline-none focus:border-brand-500 transition"
                placeholder="Your full name"
                value={delivery.contactName}
                onChange={set('contactName')}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-300 mb-1.5 flex items-center gap-1">
                <Mail size={12} /> Email Address
              </label>
              <input
                type="email"
                className="w-full px-3 py-2.5 rounded-xl border border-surface-600 bg-surface-800 text-surface-50 text-sm placeholder-surface-500 focus:outline-none focus:border-brand-500 transition"
                placeholder="you@example.com"
                value={delivery.contactEmail}
                onChange={set('contactEmail')}
              />
            </div>
          </div>
          <div className="sm:w-1/2">
            <label className="block text-xs font-medium text-surface-300 mb-1.5 flex items-center gap-1">
              <Phone size={12} /> Phone / WhatsApp
            </label>
            <input
              type="tel"
              className="w-full px-3 py-2.5 rounded-xl border border-surface-600 bg-surface-800 text-surface-50 text-sm placeholder-surface-500 focus:outline-none focus:border-brand-500 transition"
              placeholder="+91 98765 43210"
              value={delivery.contactPhone}
              onChange={set('contactPhone')}
            />
          </div>

          {/* Address fields */}
          <div className="space-y-4 pt-4 border-t border-surface-700">
            <p className="text-xs font-semibold text-surface-300 uppercase tracking-wide">Delivery Address</p>
            <div>
              <label className="block text-xs font-medium text-surface-300 mb-1.5">Street Address {isPhysical && '*'}</label>
              <input
                type="text"
                required={isPhysical}
                className="w-full px-3 py-2.5 rounded-xl border border-surface-600 bg-surface-800 text-surface-50 text-sm placeholder-surface-500 focus:outline-none focus:border-brand-500 transition"
                placeholder="House / Flat No., Street, Area"
                value={delivery.address}
                onChange={set('address')}
              />
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-surface-300 mb-1.5">City {isPhysical && '*'}</label>
                <input
                  type="text"
                  required={isPhysical}
                  className="w-full px-3 py-2.5 rounded-xl border border-surface-600 bg-surface-800 text-surface-50 text-sm placeholder-surface-500 focus:outline-none focus:border-brand-500 transition"
                  placeholder="City"
                  value={delivery.city}
                  onChange={set('city')}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-300 mb-1.5">State</label>
                <input
                  type="text"
                  className="w-full px-3 py-2.5 rounded-xl border border-surface-600 bg-surface-800 text-surface-50 text-sm placeholder-surface-500 focus:outline-none focus:border-brand-500 transition"
                  placeholder="State"
                  value={delivery.state}
                  onChange={set('state')}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-300 mb-1.5">Pincode {isPhysical && '*'}</label>
                <input
                  type="text"
                  required={isPhysical}
                  maxLength={10}
                  className="w-full px-3 py-2.5 rounded-xl border border-surface-600 bg-surface-800 text-surface-50 text-sm placeholder-surface-500 focus:outline-none focus:border-brand-500 transition"
                  placeholder="110001"
                  value={delivery.pincode}
                  onChange={set('pincode')}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-300 mb-1.5">Delivery Instructions (optional)</label>
              <textarea
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl border border-surface-600 bg-surface-800 text-surface-50 text-sm placeholder-surface-500 focus:outline-none focus:border-brand-500 transition resize-none"
                placeholder="e.g. Call before delivery, leave at the gate, etc."
                value={delivery.instructions}
                onChange={set('instructions')}
              />
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="glass-card p-5 space-y-3">
          <h2 className="font-semibold text-surface-50">Select Payment Method</h2>
          <div className="space-y-2">
            {PAYMENT_METHODS.map(({ id: methodId, label, icon: Icon, desc }) => (
              <button
                key={methodId}
                onClick={() => setSelectedMethod(methodId)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                  selectedMethod === methodId
                    ? 'border-brand-500 bg-brand-500/10'
                    : 'border-surface-700 hover:border-surface-500 bg-transparent'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  selectedMethod === methodId ? 'bg-brand-500/20' : 'bg-surface-700'
                }`}>
                  <Icon size={18} className={selectedMethod === methodId ? 'text-brand-400' : 'text-surface-300'} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${selectedMethod === methodId ? 'text-brand-400' : 'text-surface-50'}`}>{label}</p>
                  <p className="text-xs text-surface-400 mt-0.5">{desc}</p>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                  selectedMethod === methodId ? 'border-brand-500 bg-brand-500' : 'border-surface-500'
                }`} />
              </button>
            ))}
          </div>
        </div>

        {/* Security Note */}
        <div className="flex items-center gap-3 text-surface-400 text-xs">
          <Shield size={14} className="flex-shrink-0" />
          <span>This is a demo marketplace. No real payment is processed. Your data is safe.</span>
        </div>

        {/* Pay Button */}
        <button
          onClick={handlePay}
          disabled={paying}
          className="btn-primary w-full py-4 text-base justify-center"
          id="pay-now-btn"
        >
          {paying ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </span>
          ) : (
            <>
              <Lock size={18} />
              Pay {formatCurrency(order.amount)} Securely
            </>
          )}
        </button>
      </div>
    </DashboardLayout>
  )
}
