import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Clock, Tag, Eye, Users, Star, ExternalLink } from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { requirementsService } from '../services/requirementsService'
import { offersService } from '../services/offersService'
import { useAuth } from '../hooks/useAuth'
import type { RequirementWithDetails, OfferWithDetails } from '../types/database'
import { formatCurrency, formatDeadline, formatDate, formatRelativeTime } from '../utils/formatters'
import { OfferCard } from '../components/OfferCard'

export default function PublicRequirementDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuth()
  const [requirement, setRequirement] = useState<RequirementWithDetails | null>(null)
  const [offers, setOffers] = useState<OfferWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([
      requirementsService.getById(id),
      offersService.getByRequirement(id),
    ]).then(([req, ofs]) => {
      setRequirement(req)
      setOffers(ofs)
    }).finally(() => setLoading(false))
  }, [id])

  const canSubmitOffer = profile?.role === 'provider' && requirement?.status === 'open'
  const alreadySubmitted = profile && offers.some(o => o.provider_id === profile.id)

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-900">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          <div className="h-64 shimmer rounded-2xl" />
          <div className="grid lg:grid-cols-2 gap-4">
            {[1, 2].map(i => <div key={i} className="h-48 shimmer rounded-2xl" />)}
          </div>
        </div>
      </div>
    )
  }

  if (!requirement) {
    return (
      <div className="min-h-screen bg-surface-900">
        <Navbar />
        <div className="empty-state mt-20">
          <p className="text-surface-50 font-semibold">Requirement not found</p>
          <Link to="/explore" className="btn-secondary">Back to explore</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-900">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Link to="/explore" className="btn-ghost inline-flex text-sm">
          <ArrowLeft size={16} />
          Back to explore
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-start gap-4 flex-wrap">
                <div className="w-14 h-14 rounded-2xl bg-brand-500/15 flex items-center justify-center text-3xl flex-shrink-0">
                  {requirement.categories?.icon || '📋'}
                </div>
                <div className="flex-1">
                  <div className="flex items-start gap-3 flex-wrap mb-2">
                    <h1 className="text-2xl font-display font-bold text-surface-50">{requirement.title}</h1>
                    <span className={`badge ${requirement.status === 'open' ? 'badge-green' : 'badge-gray'}`}>
                      {requirement.status}
                    </span>
                  </div>
                  <p className="text-sm text-surface-400">{requirement.categories?.name} · {requirement.requirement_type}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-surface-300 pt-2 border-t border-white/8">
                <span className="flex items-center gap-1.5">
                  <Tag size={14} className="text-brand-400" />
                  <span className="text-surface-50 font-medium">{formatCurrency(requirement.budget_min)} – {formatCurrency(requirement.budget_max)}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={14} className="text-yellow-400" />
                  {formatDeadline(requirement.deadline)} ({formatDate(requirement.deadline)})
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye size={14} />
                  {requirement.views} views
                </span>
                <span className="flex items-center gap-1.5">
                  <Users size={14} className="text-accent-400" />
                  {offers.length} offers
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="glass-card p-6 space-y-4">
              <h2 className="text-base font-semibold text-surface-50">Description</h2>
              <p className="text-surface-200 leading-relaxed text-sm whitespace-pre-wrap">{requirement.description}</p>
            </div>

            {/* Offers (visible to provider) */}
            {profile?.role === 'provider' && offers.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-base font-semibold text-surface-50">
                  {offers.length} Offers Submitted
                </h2>
                {offers.filter(o => o.provider_id === profile.id).map(offer => (
                  <OfferCard key={offer.id} offer={offer} allOffers={offers} showActions={false} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Action Card */}
            <div className="glass-card p-5 space-y-4">
              {canSubmitOffer && !alreadySubmitted && (
                <>
                  <p className="text-sm text-surface-300 text-center">Feel like a great fit? Submit your offer!</p>
                  <Link
                    id="submit-offer-btn"
                    to={`/requirements/${id}/submit-offer`}
                    className="btn-primary w-full justify-center"
                  >
                    Submit an Offer
                  </Link>
                </>
              )}
              {alreadySubmitted && (
                <div className="text-center space-y-2">
                  <div className="badge badge-green mx-auto">✓ Offer Submitted</div>
                  <p className="text-xs text-surface-400">You've already submitted an offer for this requirement.</p>
                </div>
              )}
              {!profile && (
                <div className="text-center space-y-3">
                  <p className="text-sm text-surface-300">Sign in as a provider to submit an offer</p>
                  <Link to="/login" className="btn-primary w-full justify-center">Login to Submit</Link>
                  <Link to="/signup" className="btn-secondary w-full justify-center">Create Account</Link>
                </div>
              )}
              {profile?.role === 'customer' && (
                <p className="text-sm text-surface-400 text-center">You're viewing as a customer. Switch to a provider account to submit offers.</p>
              )}
              {requirement.status !== 'open' && (
                <p className="text-sm text-surface-400 text-center">This requirement is {requirement.status} and no longer accepting offers.</p>
              )}
            </div>

            {/* Customer Info */}
            {requirement.profiles && (
              <div className="glass-card p-5 space-y-3">
                <h3 className="text-sm font-semibold text-surface-50">Posted by</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center text-white font-bold">
                    {requirement.profiles.full_name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-surface-50">{requirement.profiles.full_name}</p>
                    <p className="text-xs text-surface-400">
                      Posted {formatRelativeTime(requirement.created_at)}
                    </p>
                  </div>
                </div>
                {requirement.profiles.rating > 0 && (
                  <div className="flex items-center gap-1 text-xs text-surface-400">
                    <Star size={12} className="fill-yellow-400 text-yellow-400" />
                    {requirement.profiles.rating.toFixed(1)} customer rating
                  </div>
                )}
              </div>
            )}

            {/* Reference Files */}
            {requirement.reference_files?.length > 0 && (
              <div className="glass-card p-5 space-y-3">
                <h3 className="text-sm font-semibold text-surface-50">Reference Files</h3>
                {requirement.reference_files.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    <ExternalLink size={14} />
                    Reference {i + 1}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
