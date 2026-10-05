import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Upload, Link as LinkIcon, GitBranch, FolderOpen, FileText, Package, Truck, X } from 'lucide-react'
import { DashboardLayout } from '../../components/DashboardLayout'
import { ordersService } from '../../services/ordersService'
import { useAuth } from '../../hooks/useAuth'
import type { OrderWithDetails, DeliveryType } from '../../types/database'
import { formatCurrency } from '../../utils/formatters'
import toast from 'react-hot-toast'

export default function ProviderDeliverPage() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [order, setOrder] = useState<OrderWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [deliveryType, setDeliveryType] = useState<DeliveryType>('digital')
  const [files, setFiles] = useState<File[]>([])
  const [driveLink, setDriveLink] = useState('')
  const [githubLink, setGithubLink] = useState('')
  const [extraUrl, setExtraUrl] = useState('')
  const [notes, setNotes] = useState('')
  // Physical
  const [courier, setCourier] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [shipmentDate, setShipmentDate] = useState('')
  const [estimatedArrival, setEstimatedArrival] = useState('')

  useEffect(() => {
    if (!id) return
    ordersService.getById(id).then(o => {
      setOrder(o)
      setDeliveryType(o.requirement_type)
    }).catch(() => toast.error('Order not found')).finally(() => setLoading(false))
  }, [id])

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)])
  }

  const handleSubmit = async () => {
    if (!order || !profile) return
    setSubmitting(true)
    try {
      // Upload files
      const uploadedUrls: string[] = []
      for (const f of files) {
        const url = await ordersService.uploadDeliveryFile(order.id, f)
        uploadedUrls.push(url)
      }

      await ordersService.submitDelivery({
        orderId: order.id,
        providerId: profile.id,
        customerId: order.customer_id,
        type: deliveryType,
        files: uploadedUrls,
        driveLink: driveLink || undefined,
        githubLink: githubLink || undefined,
        extraLinks: extraUrl ? [extraUrl] : [],
        notes: notes || undefined,
        courier: courier || undefined,
        trackingNumber: trackingNumber || undefined,
        shipmentDate: shipmentDate || undefined,
        estimatedArrival: estimatedArrival || undefined,
      })
      toast.success('Delivery submitted! Customer has been notified.')
      navigate(`/dashboard/provider/orders/${order.id}`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit delivery')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
          <div className="h-8 shimmer rounded w-1/2" />
          <div className="h-64 shimmer rounded-2xl" />
        </div>
      </DashboardLayout>
    )
  }

  if (!order) {
    return (
      <DashboardLayout>
        <div className="empty-state glass-card">
          <p className="text-surface-50">Order not found</p>
          <Link to="/dashboard/provider/orders" className="btn-primary">Back to Orders</Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to={`/dashboard/provider/orders/${order.id}`} className="p-2 rounded-xl hover:bg-surface-700 transition-colors text-surface-300">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold text-surface-50">Submit Delivery</h1>
            <p className="text-surface-400 text-sm mt-0.5">{(order.requirements as any)?.title}</p>
          </div>
        </div>

        {/* Order Pill */}
        <div className="glass-card p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-500/15 flex items-center justify-center text-lg">
              {(order.requirements as any)?.categories?.icon || '📋'}
            </div>
            <div>
              <p className="text-sm font-medium text-surface-50">{(order.requirements as any)?.title}</p>
              <p className="text-xs text-surface-400">Customer: {(order.customer as any)?.full_name}</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-bold text-surface-50">{formatCurrency(order.amount)}</p>
            <p className="text-xs text-emerald-400">In Escrow</p>
          </div>
        </div>

        {/* Delivery Type Toggle */}
        <div className="glass-card p-5 space-y-4">
          <h2 className="font-semibold text-surface-50">Delivery Type</h2>
          <div className="flex gap-3">
            {(['digital', 'physical'] as DeliveryType[]).map(t => (
              <button
                key={t}
                onClick={() => setDeliveryType(t)}
                className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  deliveryType === t ? 'border-brand-500 bg-brand-500/10' : 'border-surface-700 hover:border-surface-500'
                }`}
              >
                {t === 'digital' ? <FileText size={18} className="text-brand-400" /> : <Truck size={18} className="text-brand-400" />}
                <span className={`font-medium capitalize text-sm ${deliveryType === t ? 'text-brand-400' : 'text-surface-300'}`}>
                  {t} Delivery
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Digital Delivery Fields */}
        {deliveryType === 'digital' && (
          <div className="glass-card p-5 space-y-4">
            <h2 className="font-semibold text-surface-50">Upload Files / Links</h2>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Upload Files</label>
              <label className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-surface-600 rounded-xl cursor-pointer hover:border-brand-500 transition-colors">
                <Upload size={24} className="text-surface-400" />
                <span className="text-sm text-surface-400">Click to upload files (images, zips, docs, etc.)</span>
                <input type="file" multiple className="hidden" onChange={handleFileAdd} />
              </label>
              {files.length > 0 && (
                <div className="mt-2 space-y-1">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-surface-800/50">
                      <FileText size={14} className="text-brand-400 flex-shrink-0" />
                      <span className="text-xs text-surface-300 flex-1 truncate">{f.name}</span>
                      <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="text-surface-500 hover:text-red-400">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Links */}
            <div className="grid gap-3">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1">Google Drive Link</label>
                <div className="relative">
                  <FolderOpen size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                  <input
                    value={driveLink}
                    onChange={e => setDriveLink(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="form-input pl-9"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1">GitHub Repository</label>
                <div className="relative">
                  <GitBranch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                  <input
                    value={githubLink}
                    onChange={e => setGithubLink(e.target.value)}
                    placeholder="https://github.com/..."
                    className="form-input pl-9"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1">Other URL</label>
                <div className="relative">
                  <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                  <input
                    value={extraUrl}
                    onChange={e => setExtraUrl(e.target.value)}
                    placeholder="https://..."
                    className="form-input pl-9"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">Notes to Customer</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={4}
                placeholder="Describe what you've delivered, how to use it, any passwords, etc."
                className="form-input resize-none"
              />
            </div>
          </div>
        )}

        {/* Physical Delivery Fields */}
        {deliveryType === 'physical' && (
          <div className="glass-card p-5 space-y-4">
            <h2 className="font-semibold text-surface-50">Shipment Details</h2>
            <div className="grid gap-3">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1">Courier / Carrier*</label>
                <input value={courier} onChange={e => setCourier(e.target.value)} placeholder="e.g. BlueDart, FedEx, Delhivery" className="form-input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1">Tracking Number*</label>
                <div className="relative">
                  <Package size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                  <input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="e.g. 123456789" className="form-input pl-9" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1">Shipment Date</label>
                  <input type="date" value={shipmentDate} onChange={e => setShipmentDate(e.target.value)} className="form-input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1">Expected Delivery</label>
                  <input type="date" value={estimatedArrival} onChange={e => setEstimatedArrival(e.target.value)} className="form-input" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1">Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Packaging details, fragile items, etc." className="form-input resize-none" />
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting || (deliveryType === 'digital' && !driveLink && !githubLink && !extraUrl && files.length === 0)}
          className="btn-primary w-full py-4 text-base justify-center"
          id="submit-delivery-btn"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting...
            </span>
          ) : (
            <>
              <Upload size={18} />
              Submit Delivery
            </>
          )}
        </button>
      </div>
    </DashboardLayout>
  )
}
