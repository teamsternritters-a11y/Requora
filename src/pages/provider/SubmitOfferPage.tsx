import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft, Clock, Tag, Users, Plus, X,
  ExternalLink, Send, Calendar
} from 'lucide-react'
import { DashboardLayout } from '../../components/DashboardLayout'
import { requirementsService } from '../../services/requirementsService'
import { offersService } from '../../services/offersService'
import { useAuth } from '../../hooks/useAuth'
import type { RequirementWithDetails } from '../../types/database'
import { formatCurrency, formatDeadline, daysUntilDeadline } from '../../utils/formatters'
import toast from 'react-hot-toast'

const schema = z.object({
  price: z.number().positive('Price must be a positive number'),
  delivery_days: z.number().int().positive('Delivery days must be a positive integer'),
  proposal: z.string().min(1, 'Proposal is required'),
})

type FormData = z.infer<typeof schema>

export default function SubmitOfferPage() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [requirement, setRequirement] = useState<RequirementWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [portfolioUrls, setPortfolioUrls] = useState<string[]>([''])
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)

  useEffect(() => {
    if (!id || !profile) return
    requirementsService.getById(id).then(async req => {
      setRequirement(req)
      // Check if already submitted
      const offers = await offersService.getByRequirement(id)
      if (offers.some(o => o.provider_id === profile.id)) {
        setAlreadySubmitted(true)
      }
    }).finally(() => setLoading(false))
  }, [id, profile])

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { delivery_days: 7 },
  })

  const price = watch('price')
  const deliveryDays = watch('delivery_days')
  const deadlineDays = requirement ? daysUntilDeadline(requirement.deadline) : 0

  const addPortfolioUrl = () => setPortfolioUrls(prev => [...prev, ''])
  const updatePortfolioUrl = (i: number, val: string) => {
    setPortfolioUrls(prev => prev.map((u, j) => j === i ? val : u))
  }
  const removePortfolioUrl = (i: number) => setPortfolioUrls(prev => prev.filter((_, j) => j !== i))

  const onSubmit = async (data: FormData) => {
    if (!profile || !requirement) return
    setSubmitting(true)
    try {
      const validUrls = portfolioUrls.filter(u => u.trim() && u.startsWith('http'))
      await offersService.create({
        requirement_id: requirement.id,
        provider_id: profile.id,
        price: data.price,
        delivery_days: data.delivery_days,
        proposal: data.proposal,
        portfolio_urls: validUrls,
      }, requirement)
      toast.success('Offer submitted successfully!')
      navigate('/dashboard/provider')
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit offer')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="h-8 w-48 shimmer rounded" />
          <div className="h-32 shimmer rounded-2xl" />
          <div className="h-96 shimmer rounded-2xl" />
        </div>
      </DashboardLayout>
    )
  }

  if (!requirement) {
    return (
      <DashboardLayout>
        <div className="empty-state">
          <p className="text-surface-50 font-semibold">Requirement not found</p>
          <Link to="/explore" className="btn-secondary">Back to explore</Link>
        </div>
      </DashboardLayout>
    )
  }

  if (alreadySubmitted) {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto mt-16 glass-card p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/20 flex items-center justify-center mx-auto">
            <Send size={28} className="text-brand-400" />
          </div>
          <h2 className="text-xl font-display font-bold text-surface-50">Already submitted</h2>
          <p className="text-surface-300 text-sm">You've already submitted an offer for this requirement.</p>
          <Link to="/dashboard/provider/offers" className="btn-primary block text-center">
            View my offers
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <Link to={`/requirements/${id}`} className="btn-ghost inline-flex text-sm">
          <ArrowLeft size={16} />
          Back to requirement
        </Link>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Requirement Summary */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-brand-500/15 flex items-center justify-center text-2xl">
                  {requirement.categories?.icon || '📋'}
                </div>
                <div>
                  <h3 className="font-semibold text-surface-50 text-sm leading-tight">{requirement.title}</h3>
                  <p className="text-xs text-surface-400">{requirement.categories?.name}</p>
                </div>
              </div>

              <p className="text-xs text-surface-300 leading-relaxed line-clamp-4">{requirement.description}</p>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-surface-400 flex items-center gap-1"><Tag size={11} /> Budget</span>
                  <span className="text-surface-50 font-medium">{formatCurrency(requirement.budget_min)} – {formatCurrency(requirement.budget_max)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-surface-400 flex items-center gap-1"><Clock size={11} /> Deadline</span>
                  <span className={`font-medium ${deadlineDays <= 3 ? 'text-red-400' : 'text-surface-50'}`}>
                    {formatDeadline(requirement.deadline)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-surface-400 flex items-center gap-1"><Users size={11} /> Offers</span>
                  <span className="text-surface-50 font-medium">{requirement.offer_count || 0} submitted</span>
                </div>
              </div>

              {requirement.profiles && (
                <div className="flex items-center gap-2 pt-3 border-t border-white/8">
                  <div className="w-7 h-7 rounded-full bg-gradient-brand flex items-center justify-center text-white text-xs font-bold">
                    {requirement.profiles.full_name[0]}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-surface-50">{requirement.profiles.full_name}</p>
                    <p className="text-xs text-surface-500">Customer</p>
                  </div>
                </div>
              )}
            </div>

            {/* Live Score Preview */}
            {price > 0 && deliveryDays > 0 && (
              <div className="glass-card p-4 space-y-3">
                <p className="text-xs font-semibold text-surface-300 uppercase tracking-wide">Score Preview</p>
                <div className="space-y-2 text-xs">
                  {[
                    {
                      label: 'Budget Fit',
                      score: price <= requirement.budget_max ? 85 : Math.max(0, 100 - Math.round(((price - requirement.budget_max) / requirement.budget_max) * 100)),
                      color: price <= requirement.budget_max ? '#10b981' : '#ef4444',
                    },
                    {
                      label: 'Delivery Fit',
                      score: deliveryDays <= deadlineDays ? 80 : Math.max(0, 80 - (deliveryDays - deadlineDays) * 10),
                      color: deliveryDays <= deadlineDays ? '#6366f1' : '#f59e0b',
                    },
                  ].map(({ label, score, color }) => (
                    <div key={label}>
                      <div className="flex justify-between mb-1">
                        <span className="text-surface-400">{label}</span>
                        <span style={{ color }} className="font-semibold">{Math.min(100, score)}</span>
                      </div>
                      <div className="progress-bar">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, score)}%`, background: color }} />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-surface-500">Final score calculated after submission</p>
              </div>
            )}
          </div>

          {/* Offer Form */}
          <div className="lg:col-span-3">
            <div className="glass-card p-6">
              <h2 className="text-lg font-display font-bold text-surface-50 mb-6">Submit an Offer</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label" htmlFor="offer-price">Your price (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 text-sm font-medium">₹</span>
                      <input
                        id="offer-price"
                        type="number"
                        placeholder="15000"
                        className={`input-field pl-8 ${errors.price ? 'border-red-500/60' : ''}`}
                        {...register('price', { valueAsNumber: true })}
                      />
                    </div>
                    {errors.price && <p className="text-red-400 text-xs mt-1">{errors.price.message}</p>}
                    {price > 0 && price > requirement.budget_max && (
                      <p className="text-yellow-400 text-xs mt-1">⚠️ Above customer's budget max</p>
                    )}
                  </div>
                  <div>
                    <label className="input-label" htmlFor="delivery-days">Estimated delivery</label>
                    <div className="relative">
                      <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                      <input
                        id="delivery-days"
                        type="number"
                        placeholder="7"
                        className={`input-field pl-8 ${errors.delivery_days ? 'border-red-500/60' : ''}`}
                        {...register('delivery_days', { valueAsNumber: true })}
                      />
                    </div>
                    {errors.delivery_days && <p className="text-red-400 text-xs mt-1">{errors.delivery_days.message}</p>}
                    {deliveryDays > deadlineDays && deadlineDays > 0 && (
                      <p className="text-yellow-400 text-xs mt-1">⚠️ Exceeds deadline by {deliveryDays - deadlineDays} days</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="input-label" htmlFor="proposal">Proposal</label>
                  <textarea
                    id="proposal"
                    rows={6}
                    placeholder="Write a compelling proposal explaining your approach, relevant experience, why you're the best fit for this requirement, and how you'll deliver results..."
                    className={`input-field resize-none ${errors.proposal ? 'border-red-500/60' : ''}`}
                    {...register('proposal')}
                  />
                  {errors.proposal && <p className="text-red-400 text-xs mt-1">{errors.proposal.message}</p>}
                </div>

                {/* Portfolio URLs */}
                <div>
                  <label className="input-label">Portfolio / Work samples</label>
                  <div className="space-y-2">
                    {portfolioUrls.map((url, i) => (
                      <div key={i} className="flex gap-2">
                        <div className="relative flex-1">
                          <ExternalLink size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                          <input
                            type="url"
                            value={url}
                            onChange={e => updatePortfolioUrl(i, e.target.value)}
                            placeholder="https://your-portfolio.com/project"
                            className="input-field pl-8 text-sm"
                          />
                        </div>
                        {i > 0 && (
                          <button type="button" onClick={() => removePortfolioUrl(i)} className="p-2.5 text-surface-400 hover:text-red-400 transition-colors">
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                    {portfolioUrls.length < 5 && (
                      <button
                        type="button"
                        onClick={addPortfolioUrl}
                        className="flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors"
                      >
                        <Plus size={14} />
                        Add more
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Link to={`/requirements/${id}`} className="btn-secondary flex-1 justify-center">
                    Cancel
                  </Link>
                  <button id="submit-offer" type="submit" disabled={submitting} className="btn-primary flex-1">
                    {submitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Submit Offer
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
