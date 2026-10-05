import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  Plus, FileText, Star, Briefcase, Bell,
  ArrowRight, Eye, Check, ChevronRight
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { DashboardLayout } from '../../components/DashboardLayout'
import { RequirementCard, RequirementCardSkeleton } from '../../components/RequirementCard'
import { requirementsService } from '../../services/requirementsService'
import { reviewsService } from '../../services/reviewsService'
import type { RequirementWithDetails } from '../../types/database'
import type { ReviewWithDetails } from '../../services/reviewsService'
import { formatRelativeTime } from '../../utils/formatters'
import { StarRating } from '../../components/StarRating'

export default function CustomerDashboard() {
  const { profile } = useAuth()
  const [requirements, setRequirements] = useState<RequirementWithDetails[]>([])
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    Promise.all([
      requirementsService.getByCustomer(profile.id),
      reviewsService.getByCustomer(profile.id),
    ])
      .then(([reqs, revs]) => {
        setRequirements(reqs)
        setReviews(revs)
      })
      .finally(() => setLoading(false))
  }, [profile])

  const active = requirements.filter(r => r.status === 'open')
  const shortlisted = requirements.filter(r => r.status === 'open' && (r.offer_count ?? 0) > 0)
  const completed = requirements.filter(r => r.status === 'completed' || r.status === 'closed')
  const totalOffers = requirements.reduce((s, r) => s + (r.offer_count ?? 0), 0)

  const stats = [
    { label: 'Active Requirements', value: active.length, icon: FileText, color: 'text-brand-400', bg: 'bg-brand-500/15' },
    { label: 'Offers Received', value: totalOffers, icon: Briefcase, color: 'text-accent-400', bg: 'bg-accent-500/15' },
    { label: 'Shortlisted', value: shortlisted.length, icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
    { label: 'Completed', value: completed.length, icon: Check, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  ]

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-surface-50">
              Good {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'there'}
            </h1>
            <p className="text-surface-300 text-sm mt-1">Here's what's happening with your requirements.</p>
          </div>
          <Link to="/requirements/create" id="create-requirement-btn" className="btn-primary">
            <Plus size={16} />
            Post a Requirement
          </Link>
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

        {/* Requirements */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-surface-50">Active Requirements</h2>
            <Link to="/dashboard/customer/requirements" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              [1, 2, 3].map(i => <RequirementCardSkeleton key={i} />)
            ) : requirements.filter(r => r.status === 'open').slice(0, 3).length > 0 ? (
              requirements.filter(r => r.status === 'open').slice(0, 3).map(req => (
                <RequirementCard key={req.id} requirement={req} showCustomer={false} />
              ))
            ) : (
              <div className="col-span-full empty-state glass-card">
                <FileText size={32} className="text-surface-600 mb-2" />
                <p className="text-surface-50 font-medium">No active requirements</p>
                <p className="text-surface-400 text-sm mt-1">Post your first requirement to start receiving offers.</p>
                <Link to="/requirements/create" className="btn-primary mt-4">
                  <Plus size={16} />
                  Post a Requirement
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity & Reviews */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold text-surface-50 mb-4">Recent Activity</h2>
            <div className="glass-card divide-y divide-white/8">
              {requirements.slice(0, 5).map(req => (
                <Link
                  key={req.id}
                  to={`/dashboard/customer/requirements/${req.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-white/3 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-brand-500/15 flex items-center justify-center text-sm flex-shrink-0 text-brand-400">
                    <FileText size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-50 truncate">{req.title}</p>
                    <p className="text-xs text-surface-400">{req.offer_count || 0} offers received</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`badge text-xs ${req.status === 'open' ? 'badge-green' : 'badge-gray'}`}>
                      {req.status}
                    </span>
                    <p className="text-xs text-surface-500 mt-1">{formatRelativeTime(req.created_at)}</p>
                  </div>
                </Link>
              ))}
              {requirements.length === 0 && (
                <div className="p-8 text-center text-surface-400 text-sm">No activity yet</div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-surface-50 mb-4">My Submitted Reviews</h2>
            <div className="glass-card divide-y divide-white/8">
              {reviews.slice(0, 5).map(rev => (
                <div key={rev.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-medium text-surface-50">To: {rev.reviewee?.full_name}</p>
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
              {reviews.length === 0 && (
                <div className="p-8 text-center text-surface-400 text-sm">No reviews submitted yet</div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-surface-50 mb-4">Quick Actions</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { to: '/requirements/create', icon: Plus, label: 'Post a new requirement', desc: 'Get competitive offers from top providers', color: 'bg-brand-500/15 text-brand-400' },
              { to: '/explore', icon: Eye, label: 'Explore open requirements', desc: 'See what others are looking for', color: 'bg-accent-500/15 text-accent-400' },
              { to: '/dashboard/customer/notifications', icon: Bell, label: 'Check notifications', desc: 'Stay updated on your requirements', color: 'bg-yellow-500/15 text-yellow-400' },
            ].map(({ to, icon: Icon, label, desc, color }) => (
              <Link key={to} to={to} className="glass-card-hover flex items-center gap-4 p-4">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-surface-50">{label}</p>
                  <p className="text-xs text-surface-400 mt-0.5">{desc}</p>
                </div>
                <ChevronRight size={16} className="text-surface-400 flex-shrink-0" />
              </Link>
            ))}
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
