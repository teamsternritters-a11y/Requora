import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { DashboardLayout } from '../../components/DashboardLayout'
import { RequirementCard, RequirementCardSkeleton } from '../../components/RequirementCard'
import { requirementsService } from '../../services/requirementsService'
import type { RequirementWithDetails } from '../../types/database'
import { DeleteRequirementModal } from '../../components/DeleteRequirementModal'

type StatusFilter = 'all' | 'open' | 'closed' | 'completed'

export default function MyRequirementsPage() {
  const { profile } = useAuth()
  const [requirements, setRequirements] = useState<RequirementWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [deletingReq, setDeletingReq] = useState<RequirementWithDetails | null>(null)

  const loadRequirements = () => {
    if (!profile) return
    setLoading(true)
    requirementsService.getByCustomer(profile.id)
      .then(setRequirements)
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadRequirements() }, [profile])

  const filtered = requirements.filter(r => {
    const matchStatus = status === 'all' || r.status === status
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const statusTabs: { label: string; value: StatusFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Open', value: 'open' },
    { label: 'Closed', value: 'closed' },
    { label: 'Completed', value: 'completed' },
  ]

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-surface-50">My Requirements</h1>
            <p className="text-surface-300 text-sm mt-1">{requirements.length} total requirements posted</p>
          </div>
          <Link to="/requirements/create" className="btn-primary">
            <Plus size={16} />
            New Requirement
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder="Search requirements..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-9"
              id="search-requirements"
            />
          </div>
          <div className="flex items-center gap-1 bg-surface-800 rounded-xl p-1 border border-white/8">
            {statusTabs.map(tab => (
              <button
                key={tab.value}
                id={`filter-${tab.value}`}
                onClick={() => setStatus(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  status === tab.value
                    ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                    : 'text-surface-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Requirements Grid */}
        {loading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {[1, 2, 3, 4].map(i => <RequirementCardSkeleton key={i} />)}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {filtered.map(req => (
              <RequirementCard 
                key={req.id} 
                requirement={req} 
                showCustomer={false} 
                viewAs="customer" 
                onDelete={setDeletingReq}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state glass-card">
            <Search size={40} className="text-surface-600" />
            <div>
              <p className="text-surface-50 font-semibold">No requirements found</p>
              <p className="text-surface-400 text-sm mt-1">
                {search ? `No results for "${search}"` : 'You haven\'t posted any requirements yet.'}
              </p>
            </div>
            {!search && (
              <Link to="/requirements/create" className="btn-primary">
                <Plus size={16} />
                Post your first requirement
              </Link>
            )}
          </div>
        )}
      </div>

      {deletingReq && (
        <DeleteRequirementModal
          isOpen={true}
          onClose={() => setDeletingReq(null)}
          requirement={deletingReq}
          onSuccess={loadRequirements}
        />
      )}
    </DashboardLayout>
  )
}
