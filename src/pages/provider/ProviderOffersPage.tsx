import { useState, useEffect } from 'react'
import { DashboardLayout } from '../../components/DashboardLayout'
import { offersService } from '../../services/offersService'
import { useAuth } from '../../hooks/useAuth'
import { ScoreRing } from '../../components/ScoreRing'
import { formatCurrency, formatRelativeTime } from '../../utils/formatters'
import { Link } from 'react-router-dom'
import { Search, ChevronRight, Clock } from 'lucide-react'

export default function ProviderOffersPage() {
  const { profile } = useAuth()
  const [offers, setOffers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'shortlisted' | 'selected' | 'rejected'>('all')

  useEffect(() => {
    if (!profile) return
    offersService.getByProvider(profile.id)
      .then(setOffers)
      .finally(() => setLoading(false))
  }, [profile])

  const filtered = offers.filter((o: any) => filter === 'all' || o.status === filter)

  const tabs = ['all', 'pending', 'shortlisted', 'selected', 'rejected'] as const
  const statusBadge: Record<string, string> = {
    pending: 'badge-gray',
    shortlisted: 'badge-brand',
    selected: 'badge-green',
    rejected: 'badge-red',
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-surface-50">My Offers</h1>
          <p className="text-surface-300 text-sm mt-1">{offers.length} total offers submitted</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-surface-800 rounded-xl p-1 border border-white/8 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab}
              id={`offer-tab-${tab}`}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-all ${
                filter === tab ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30' : 'text-surface-400 hover:text-white'
              }`}
            >
              {tab} ({offers.filter((o: any) => tab === 'all' || o.status === tab).length})
            </button>
          ))}
        </div>

        {/* Offers List */}
        <div className="space-y-3">
          {loading ? (
            [1, 2, 3].map(i => <div key={i} className="h-28 shimmer rounded-2xl" />)
          ) : filtered.length > 0 ? (
            filtered.map((offer: any) => (
              <div key={offer.id} className="glass-card p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center text-lg flex-shrink-0">
                    {offer.requirements?.categories?.icon || '📋'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-sm font-semibold text-surface-50 truncate">
                        {offer.requirements?.title || 'Requirement'}
                      </h3>
                      <span className={`badge text-xs ${statusBadge[offer.status] || 'badge-gray'}`}>
                        {offer.status}
                      </span>
                    </div>
                    <p className="text-xs text-surface-400 line-clamp-1 mb-2">{offer.proposal}</p>
                    <div className="flex items-center gap-4 text-xs text-surface-400">
                      <span className="font-semibold text-surface-50">{formatCurrency(offer.price)}</span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {offer.delivery_days} days
                      </span>
                      <span>{formatRelativeTime(offer.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {offer.offer_scores && (
                      <ScoreRing score={offer.offer_scores.total_score} size={44} showLabel />
                    )}
                    {offer.requirements?.id && (
                      <Link
                        to={`/requirements/${offer.requirements.id}`}
                        className="p-2 rounded-lg bg-surface-800 text-surface-400 hover:text-surface-50 hover:bg-surface-700 transition-all"
                      >
                        <ChevronRight size={16} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state glass-card">
              <Search size={40} className="text-surface-600" />
              <div>
                <p className="text-surface-50 font-semibold">No offers found</p>
                <p className="text-surface-400 text-sm mt-1">You haven't submitted any offers yet.</p>
              </div>
              <Link to="/explore" className="btn-primary">Browse Requirements</Link>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
