import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Star, MapPin, Briefcase, Clock, Globe, ExternalLink } from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { profilesService } from '../services/categoriesService'
import { reviewsService } from '../services/reviewsService'
import type { Profile } from '../types/database'
import type { ReviewWithDetails, RatingSummary } from '../services/reviewsService'
import { getInitials, formatRelativeTime } from '../utils/formatters'
import { StarRating } from '../components/StarRating'
import { useAuth } from '../hooks/useAuth'

type Tab = 'about' | 'portfolio' | 'reviews'

export default function ProviderProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { profile: currentUser } = useAuth()
  const [provider, setProvider] = useState<Profile | null>(null)
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([])
  const [ratingSummary, setRatingSummary] = useState<RatingSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('about')

  useEffect(() => {
    if (!id) return
    Promise.all([
      profilesService.getById(id),
      reviewsService.getForProvider(id),
      reviewsService.getRatingSummary(id),
    ]).then(([p, revs, summary]) => {
      setProvider(p)
      setReviews(revs)
      setRatingSummary(summary)
    }).finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-900">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          <div className="h-64 shimmer rounded-2xl" />
          <div className="h-96 shimmer rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-surface-900">
        <Navbar />
        <div className="empty-state mt-16">
          <p className="text-surface-50 font-semibold">Provider not found</p>
          <Link to="/explore" className="btn-secondary">Back to explore</Link>
        </div>
      </div>
    )
  }

  const tabs: Tab[] = ['about', 'portfolio', 'reviews']

  return (
    <div className="min-h-screen bg-surface-900">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Link to="/explore" className="btn-ghost inline-flex text-sm">
          <ArrowLeft size={16} />
          Back
        </Link>

        {/* Profile Header */}
        <div className="glass-card p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-20 h-20 rounded-2xl bg-gradient-brand flex items-center justify-center text-white text-3xl font-bold flex-shrink-0 overflow-hidden">
              {provider.avatar_url
                ? <img src={provider.avatar_url} className="w-full h-full object-cover" alt="" />
                : <span>{getInitials(provider.full_name)}</span>}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-2xl font-display font-bold text-surface-50">{provider.full_name}</h1>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {provider.rating > 0 && (
                      <span className="flex items-center gap-1 text-sm">
                        <Star size={14} className="fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-surface-50">{provider.rating.toFixed(1)}</span>
                        <span className="text-surface-400">({provider.review_count} reviews)</span>
                      </span>
                    )}
                    {provider.location && (
                      <span className="flex items-center gap-1 text-sm text-surface-400">
                        <MapPin size={14} />
                        {provider.location}
                      </span>
                    )}
                    <span className="badge badge-accent text-xs">Provider</span>
                  </div>
                </div>
                {currentUser?.role === 'customer' && (
                  <Link to="/explore" className="btn-primary">Book a Service</Link>
                )}
              </div>

              <p className="text-sm text-surface-300 mt-4 leading-relaxed max-w-xl">
                {provider.bio || 'No bio provided.'}
              </p>

              <div className="flex flex-wrap gap-4 mt-4 text-xs text-surface-300">
                {provider.projects_completed > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Briefcase size={13} className="text-brand-400" />
                    {provider.projects_completed} projects completed
                  </span>
                )}
                {provider.years_experience && (
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} className="text-accent-400" />
                    {provider.years_experience} years experience
                  </span>
                )}
                {provider.website && (
                  <a href={provider.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-brand-400 hover:text-brand-300">
                    <Globe size={13} />
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>

          {provider.skills?.length > 0 && (
            <div className="mt-5 pt-5 border-t border-white/8">
              <p className="text-xs text-surface-400 mb-3 font-medium">Skills</p>
              <div className="flex flex-wrap gap-2">
                {provider.skills.map(skill => (
                  <span key={skill} className="badge badge-brand text-xs">{skill}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-surface-800 rounded-xl p-1 border border-white/8 w-fit">
          {tabs.map(tab => (
            <button
              key={tab}
              id={`profile-tab-${tab}`}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                activeTab === tab
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                  : 'text-surface-400 hover:text-white'
              }`}
            >
              {tab}
              {tab === 'reviews' && ratingSummary && ratingSummary.total > 0 && (
                <span className="ml-1.5 text-xs bg-brand-500/30 px-1.5 py-0.5 rounded-full">
                  {ratingSummary.total}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* About */}
        {activeTab === 'about' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="glass-card p-5 space-y-4">
              <h3 className="text-base font-semibold text-surface-50">About</h3>
              <p className="text-sm text-surface-300 leading-relaxed">
                {provider.bio || "This provider has not added a bio yet."}
              </p>
            </div>
            <div className="glass-card p-5 space-y-3">
              <h3 className="text-base font-semibold text-surface-50">Stats</h3>
              {[
                { label: 'Projects Completed', value: provider.projects_completed },
                { label: 'Average Rating', value: provider.rating > 0 ? `${provider.rating.toFixed(1)} / 5` : 'No ratings yet' },
                { label: 'Total Reviews', value: provider.review_count ?? 0 },
                { label: 'Years Experience', value: provider.years_experience || 'Not specified' },
                { label: 'Member Since', value: new Date(provider.created_at).getFullYear() },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm border-b border-white/8 pb-2 last:border-0 last:pb-0">
                  <span className="text-surface-400">{label}</span>
                  <span className="text-surface-50 font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Portfolio */}
        {activeTab === 'portfolio' && (
          <div>
            {provider.portfolio_urls?.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {provider.portfolio_urls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                    className="glass-card-hover flex items-center gap-3 p-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center text-brand-400">
                      <ExternalLink size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-50 truncate">Project {i + 1}</p>
                      <p className="text-xs text-surface-400 truncate">{url}</p>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="empty-state glass-card">
                <ExternalLink size={32} className="text-surface-600" />
                <p className="text-surface-400 text-sm">No portfolio items added yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Reviews */}
        {activeTab === 'reviews' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="glass-card p-6 space-y-6 lg:sticky top-24">
                <div>
                  <h3 className="text-lg font-semibold text-surface-50 mb-4">Ratings Summary</h3>
                  <div className="flex items-end gap-3">
                    <span className="text-5xl font-display font-bold text-surface-50">
                      {ratingSummary?.average.toFixed(1) || '0.0'}
                    </span>
                    <div className="pb-1">
                      <StarRating rating={ratingSummary?.average || 0} showValue={false} />
                      <p className="text-xs text-surface-400 mt-1">{ratingSummary?.total || 0} reviews</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 pt-4 border-t border-white/8">
                  {ratingSummary?.distribution.map(d => (
                    <div key={d.star} className="flex items-center gap-3 text-sm">
                      <span className="text-surface-400 w-8 flex-shrink-0">{d.star} ★</span>
                      <div className="flex-1 h-2 rounded-full bg-surface-800 overflow-hidden">
                        <div className="h-full bg-yellow-400 rounded-full transition-all duration-500" style={{ width: `${d.pct}%` }} />
                      </div>
                      <span className="text-surface-400 w-6 text-right flex-shrink-0">{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="glass-card p-6">
                {reviews.length > 0 ? (
                  <div className="space-y-6">
                    {reviews.map(review => (
                      <div key={review.id} className="pb-6 border-b border-white/8 last:border-0 last:pb-0">
                        <div className="flex gap-4">
                          <div className="w-10 h-10 rounded-full bg-brand-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden">
                            {review.reviewer?.avatar_url
                              ? <img src={review.reviewer.avatar_url} className="w-full h-full object-cover" alt="" />
                              : getInitials(review.reviewer?.full_name || 'U')}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
                              <span className="text-sm font-medium text-surface-50">
                                {review.reviewer?.full_name || 'Customer'}
                              </span>
                              <span className="text-xs text-surface-400">{formatRelativeTime(review.created_at)}</span>
                            </div>
                            <div className="mb-2">
                              <StarRating rating={review.rating} showValue={false} size={14} />
                            </div>
                            <h4 className="text-sm font-semibold text-surface-50 mb-1">{review.title}</h4>
                            <p className="text-sm text-surface-300 leading-relaxed">{review.comment}</p>
                            {review.requirement && (
                              <p className="text-xs text-surface-400 mt-3 pt-3 border-t border-white/8">
                                Project: <span className="text-surface-300">{review.requirement.title}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state py-12">
                    <Star size={32} className="text-surface-600 mb-2" />
                    <p className="text-surface-50 font-medium">No reviews yet</p>
                    <p className="text-surface-400 text-sm mt-1">This provider has not received any reviews.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
