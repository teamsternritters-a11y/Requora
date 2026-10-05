import { Link } from 'react-router-dom'
import { Clock, Eye, Tag, Trash2 } from 'lucide-react'
import type { RequirementWithDetails } from '../types/database'
import { formatCurrency, formatDeadline, formatRelativeTime } from '../utils/formatters'

interface RequirementCardProps {
  requirement: RequirementWithDetails
  showCustomer?: boolean
  viewAs?: 'customer' | 'provider'
  onDelete?: (req: RequirementWithDetails) => void
}

export function RequirementCard({ requirement, showCustomer = true, viewAs = 'customer', onDelete }: RequirementCardProps) {
  const statusColors: Record<string, string> = {
    open: 'badge-green',
    closed: 'badge-gray',
    completed: 'badge-brand',
    cancelled: 'badge-red',
  }

  const href = viewAs === 'provider'
    ? `/requirements/${requirement.id}`
    : `/dashboard/customer/requirements/${requirement.id}`

  return (
    <Link to={href} className="glass-card-hover block p-5 group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {requirement.categories?.icon && (
            <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center text-xl flex-shrink-0">
              {requirement.categories.icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-surface-50 group-hover:text-brand-300 transition-colors truncate text-sm lg:text-base">
              {requirement.title}
            </h3>
            <p className="text-xs text-surface-400 mt-0.5">{requirement.categories?.name}</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <span className={statusColors[requirement.status] || 'badge-gray'}>
            {requirement.status}
          </span>
          {onDelete && viewAs === 'customer' && (
            <button 
              onClick={(e) => { e.preventDefault(); onDelete(requirement); }}
              className="p-1.5 rounded-lg text-surface-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Delete requirement"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-surface-300 line-clamp-2 mb-4 leading-relaxed">
        {requirement.description}
      </p>

      <div className="flex items-center flex-wrap gap-3 text-xs text-surface-400">
        <div className="flex items-center gap-1.5">
          <Tag size={12} className="text-brand-400" />
          <span className="text-surface-200 font-medium">
            {formatCurrency(requirement.budget_min)} – {formatCurrency(requirement.budget_max)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={12} className="text-yellow-400" />
          <span>{formatDeadline(requirement.deadline)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Eye size={12} />
          <span>{requirement.views || 0} views</span>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="badge-brand">{requirement.offer_count || 0} offers</span>
        </div>
      </div>

      {showCustomer && requirement.profiles && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/8">
          <div className="w-6 h-6 rounded-full bg-gradient-brand flex items-center justify-center text-white text-xs font-bold">
            {requirement.profiles.full_name[0]}
          </div>
          <span className="text-xs text-surface-400">{requirement.profiles.full_name}</span>
          <span className="text-xs text-surface-500 ml-auto">{formatRelativeTime(requirement.created_at)}</span>
        </div>
      )}
    </Link>
  )
}

export function RequirementCardSkeleton() {
  return (
    <div className="glass-card p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl shimmer" />
        <div className="flex-1 space-y-2">
          <div className="h-4 shimmer rounded w-3/4" />
          <div className="h-3 shimmer rounded w-1/4" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 shimmer rounded" />
        <div className="h-3 shimmer rounded w-4/5" />
      </div>
      <div className="flex gap-4">
        <div className="h-3 shimmer rounded w-24" />
        <div className="h-3 shimmer rounded w-20" />
      </div>
    </div>
  )
}
