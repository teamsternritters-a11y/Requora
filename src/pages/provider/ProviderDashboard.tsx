import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase, Star, Search, Check,
  TrendingUp, ChevronRight, Plus
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { DashboardLayout } from '../../components/DashboardLayout'
import { offersService } from '../../services/offersService'
import { requirementsService } from '../../services/requirementsService'
import { reviewsService } from '../../services/reviewsService'
import { formatCurrency, formatDeadline, formatRelativeTime } from '../../utils/formatters'
import { ScoreRing } from '../../components/ScoreRing'
import { StarRating } from '../../components/StarRating'
import type { ReviewWithDetails } from '../../services/reviewsService'

export default function ProviderDashboard() {
  const { profile } = useAuth()
  const [offers, setOffers] = useState<any[]>([])
  const [openReqs, setOpenReqs] = useState<any[]>([])
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    Promise.all([
      offersService.getByProvider(profile.id),
      requirementsService.getAll({ status: 'open' }),
      reviewsService.getForProvider(profile.id),
    ]).then(([ofs, reqs, revs]) => {
      setOffers(ofs)
      setOpenReqs(reqs.slice(0, 5))
      setReviews(revs)
    }).finally(() => setLoading(false))
  }, [profile])

  const shortlisted = offers.filter((o: any) => o.status === 'shortlisted')
  const selected = offers.filter((o: any) => o.status === 'selected')
  const pending = offers.filter((o: any) => o.status === 'pending')

  const stats = [
    { label: 'Active Offers', value: pending.length, icon: Briefcase, color: 'text-brand-400', bg: 'bg-brand-500/15' },
    { label: 'Shortlisted', value: shortlisted.length, icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
    { label: 'Won', value: selected.length, icon: Check, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
    { label: 'Rating', value: profile?.rating?.toFixed(1) || '—', icon: TrendingUp, color: 'text-accent-400', bg: 'bg-accent-500/15' },
  ]

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-surface-50">
              Good {getGreeting()}, {profile?.full_name?.split(' ')[0]}
            </h1>
            <p className="text-surface-300 text-sm mt-1">Find requirements and submit your best offers.</p>
          </div>
          <div className="flex gap-3">
            <Link to="/requirements/create" className="btn-secondary">
              <Plus size={16} />
              Post Requirement
            </Link>
            <Link to="/explore" className="btn-primary">
              <Search size={16} />
              Browse Requirements
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color, bg }) => (
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

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Open Requirements */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-surface-50">Latest Requirements</h2>
              <Link to="/explore" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">
                View all <ChevronRight size={14} />
              </Link>
            </div>
            <div className="glass-card divide-y divide-white/8">
              {loading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="p-4 flex gap-3">
                    <div className="w-9 h-9 rounded-xl shimmer flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 shimmer rounded w-3/4" />
                      <div className="h-3 shimmer rounded w-1/2" />
                    </div>
                  </div>
                ))
              ) : openReqs.length > 0 ? (
                openReqs.map((req: any) => (
                  <Link key={req.id} to={`/requirements/${req.id}`} className="flex items-center gap-3 p-4 hover:bg-white/3 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-brand-500/15 flex items-center justify-center text-lg flex-shrink-0">
                      {req.categories?.icon || '📋'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-50 truncate">{req.title}</p>
                      <p className="text-xs text-surface-400 truncate">
                        {formatCurrency(req.budget_min)} - {formatCurrency(req.budget_max)} · Due {formatDeadline(req.deadline)}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-surface-400 flex-shrink-0" />
                  </Link>
                ))
              ) : (
                <div className="p-8 text-center text-surface-400 text-sm">No open requirements</div>
              )}
            </div>
          </div>

          {/* My Recent Offers */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-surface-50">My Recent Offers</h2>
              <Link to="/dashboard/provider/offers" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">
                View all <ChevronRight size={14} />
              </Link>
            </div>
            <div className="glass-card divide-y divide-white/8">
              {loading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="p-4 flex gap-3">
                    <div className="w-9 h-9 rounded-xl shimmer flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 shimmer rounded w-3/4" />
                      <div className="h-3 shimmer rounded w-1/2" />
                    </div>
                  </div>
                ))
              ) : offers.length > 0 ? (
                offers.slice(0, 5).map((offer: any) => (
                  <div key={offer.id} className="flex items-center gap-3 p-4">
                    <div className="w-9 h-9 rounded-xl bg-accent-500/15 flex items-center justify-center text-lg flex-shrink-0">
                      {offer.requirements?.categories?.icon || '💼'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-50 truncate">
                        {offer.requirements?.title || 'Requirement'}
                      </p>
                      <p className="text-xs text-surface-400">
                        {formatCurrency(offer.price)} · {offer.delivery_days} days
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {offer.offer_scores && (
                        <ScoreRing score={offer.offer_scores.total_score} size={36} />
                      )}
                      <span className={`badge text-xs ${
                        offer.status === 'selected' ? 'badge-green' :
                        offer.status === 'shortlisted' ? 'badge-brand' :
                        offer.status === 'rejected' ? 'badge-red' : 'badge-gray'
                      }`}>
                        {offer.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <p className="text-surface-400 text-sm mb-3">No offers submitted yet</p>
                  <Link to="/explore" className="btn-primary text-xs">
                    <Search size={14} />
                    Browse Requirements
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* My Received Reviews */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-surface-50">My Received Reviews</h2>
            <Link to="/dashboard/provider/profile" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">
              View My Profile <ChevronRight size={14} />
            </Link>
          </div>
          <div className="glass-card divide-y divide-white/8">
            {reviews.slice(0, 5).map(rev => (
              <div key={rev.id} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-medium text-surface-50">From: {rev.reviewer?.full_name}</p>
                    <p className="text-xs text-surface-400 truncate w-48">{rev.requirement?.title}</p>
                  </div>
                  <div className="text-right">
                    <StarRating rating={rev.rating} size={12} showValue={false} />
                    <p className="text-xs text-surface-500 mt-1">{formatRelativeTime(rev.created_at)}</p>
                  </div>
                </div>
                <h4 className="text-xs font-semibold text-surface-50">{rev.title}</h4>
                <p className="text-xs text-surface-300 mt-1 truncate">{rev.comment}</p>
              </div>
            ))}
            {reviews.length === 0 && !loading && (
              <div className="p-8 text-center text-surface-400 text-sm">No reviews received yet</div>
            )}
            {loading && (
              <div className="p-8 text-center text-surface-400 text-sm">Loading reviews...</div>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Morning'
  if (hour < 18) return 'Afternoon'
  return 'Evening'
}
