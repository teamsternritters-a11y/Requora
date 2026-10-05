import { Link } from 'react-router-dom'
import { Star, MapPin, Briefcase, Clock, ExternalLink, Award, ThumbsUp, Zap } from 'lucide-react'
import type { OfferWithDetails } from '../types/database'
import { formatCurrency } from '../utils/formatters'
import { ScoreRing } from './ScoreRing'
import { getOfferBadge } from '../utils/matchingEngine'

interface OfferCardProps {
  offer: OfferWithDetails
  allOffers?: OfferWithDetails[]
  isShortlisted?: boolean
  isSelected?: boolean
  onShortlist?: (offer: OfferWithDetails) => void
  onRemoveShortlist?: (offer: OfferWithDetails) => void
  onSelect?: (offer: OfferWithDetails) => void
  showActions?: boolean
  compact?: boolean
}

const badgeConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  'Best Match': { label: 'Best Match', icon: Award, className: 'badge-brand' },
  'Lowest Price': { label: 'Lowest Price', icon: ThumbsUp, className: 'badge-green' },
  'Fastest Delivery': { label: 'Fastest', icon: Zap, className: 'badge-accent' },
}

export function OfferCard({
  offer,
  allOffers = [],
  isShortlisted = false,
  isSelected = false,
  onShortlist,
  onRemoveShortlist,
  onSelect,
  showActions = true,
  compact = false,
}: OfferCardProps) {
  const score = offer.offer_scores
  const provider = offer.profiles
  const badge = allOffers.length > 0 ? getOfferBadge(offer, allOffers) : null
  const BadgeIcon = badge ? badgeConfig[badge]?.icon : null

  return (
    <div className={`glass-card p-5 space-y-4 ${isSelected ? 'ring-2 ring-emerald-500/50' : isShortlisted ? 'ring-1 ring-brand-500/40' : ''}`}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-full bg-gradient-brand flex items-center justify-center text-white font-bold flex-shrink-0">
          {provider?.avatar_url ? (
            <img src={provider.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
          ) : (
            provider?.full_name?.[0] || '?'
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/providers/${provider?.id}`}
              className="font-semibold text-surface-50 hover:text-brand-300 transition-colors text-sm"
            >
              {provider?.full_name}
            </Link>
            {badge && BadgeIcon && (
              <span className={`badge ${badgeConfig[badge].className} text-xs`}>
                <BadgeIcon size={10} />
                {badgeConfig[badge].label}
              </span>
            )}
            {isSelected && <span className="badge badge-green">✓ Selected</span>}
            {isShortlisted && !isSelected && <span className="badge badge-brand">Shortlisted</span>}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-surface-400">
            {provider?.rating ? (
              <span className="flex items-center gap-1">
                <Star size={11} className="fill-yellow-400 text-yellow-400" />
                {provider.rating.toFixed(1)} ({provider.review_count})
              </span>
            ) : null}
            {provider?.location && (
              <span className="flex items-center gap-1">
                <MapPin size={11} />
                {provider.location}
              </span>
            )}
            {provider?.projects_completed ? (
              <span className="flex items-center gap-1">
                <Briefcase size={11} />
                {provider.projects_completed} projects
              </span>
            ) : null}
          </div>
        </div>
        {score && (
          <ScoreRing score={score.total_score} size={52} showLabel />
        )}
      </div>

      {/* Price & Delivery */}
      <div className="flex items-center gap-4 py-3 border-y border-white/8">
        <div>
          <p className="text-xs text-surface-400 mb-0.5">Price</p>
          <p className="text-lg font-bold text-surface-50">{formatCurrency(offer.price)}</p>
        </div>
        <div className="w-px h-8 bg-surface-700" />
        <div>
          <p className="text-xs text-surface-400 mb-0.5">Delivery</p>
          <p className="text-base font-semibold text-surface-50 flex items-center gap-1">
            <Clock size={14} className="text-brand-400" />
            {offer.delivery_days} days
          </p>
        </div>
        {score && !compact && (
          <>
            <div className="w-px h-8 bg-surface-700" />
            <div className="flex-1 grid grid-cols-3 gap-2">
              {[
                { label: 'Budget', val: score.budget_score },
                { label: 'Delivery', val: score.delivery_score },
                { label: 'Relevance', val: score.relevance_score },
              ].map(({ label, val }) => (
                <div key={label} className="text-center">
                  <p className="text-xs text-surface-400">{label}</p>
                  <p className="text-sm font-bold text-brand-300">{val}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Proposal */}
      {!compact && (
        <div>
          <p className="text-xs text-surface-400 mb-1.5">Proposal</p>
          <p className="text-sm text-surface-200 leading-relaxed line-clamp-3">{offer.proposal}</p>
        </div>
      )}

      {/* Portfolio */}
      {!compact && offer.portfolio_urls?.length > 0 && (
        <div>
          <p className="text-xs text-surface-400 mb-2">Portfolio samples</p>
          <div className="flex flex-wrap gap-2">
            {offer.portfolio_urls.slice(0, 3).map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-300 hover:bg-brand-500/20 transition-colors border border-brand-500/20"
              >
                <ExternalLink size={11} />
                Sample {i + 1}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex gap-2">
          {!isSelected && (
            <>
              {isShortlisted ? (
                <button
                  onClick={() => onRemoveShortlist?.(offer)}
                  className="btn-secondary flex-1 text-xs py-2"
                >
                  Remove Shortlist
                </button>
              ) : (
                <button
                  onClick={() => onShortlist?.(offer)}
                  className="btn-secondary flex-1 text-xs py-2"
                >
                  Shortlist
                </button>
              )}
              <button
                onClick={() => onSelect?.(offer)}
                className="btn-primary flex-1 text-xs py-2"
              >
                Select Offer
              </button>
            </>
          )}
          {isSelected && (
            <div className="flex-1 text-center py-2 text-sm font-semibold text-emerald-400">
              ✓ This offer was selected
            </div>
          )}
        </div>
      )}
    </div>
  )
}
