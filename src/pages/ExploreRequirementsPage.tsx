import { useState, useEffect } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { RequirementCard, RequirementCardSkeleton } from '../components/RequirementCard'
import { requirementsService } from '../services/requirementsService'
import { categoriesService } from '../services/categoriesService'
import type { RequirementWithDetails, Category } from '../types/database'
import { useAuth } from '../hooks/useAuth'

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Most Recent' },
  { value: 'budget_max', label: 'Highest Budget' },
  { value: 'offer_count', label: 'Most Offers' },
]

export default function ExploreRequirementsPage() {
  const { profile } = useAuth()
  const [requirements, setRequirements] = useState<RequirementWithDetails[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sort, setSort] = useState('created_at')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      requirementsService.getAll({ status: 'open', search: search || undefined, category_id: categoryFilter || undefined }),
      categoriesService.getAll(),
    ]).then(([reqs, cats]) => {
      setRequirements(reqs)
      setCategories(cats)
    }).finally(() => setLoading(false))
  }, [search, categoryFilter])

  const sorted = [...requirements].sort((a, b) => {
    if (sort === 'budget_max') return b.budget_max - a.budget_max
    if (sort === 'offer_count') return (b.offer_count ?? 0) - (a.offer_count ?? 0)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const isProvider = profile?.role === 'provider'

  return (
    <div className="min-h-screen bg-surface-900">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-surface-50 mb-2">
            Find opportunities
          </h1>
          <p className="text-surface-300">
            Browse {requirements.length} open requirements from customers looking for providers like you.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filters */}
          <div className={`lg:w-64 flex-shrink-0 space-y-4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="glass-card p-4 space-y-4">
              <h3 className="text-sm font-semibold text-surface-50">Filters</h3>

              <div>
                <p className="text-xs text-surface-400 mb-2 font-medium">Category</p>
                <div className="space-y-1">
                  <button
                    id="filter-all-categories"
                    onClick={() => setCategoryFilter('')}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
                      !categoryFilter ? 'bg-brand-500/20 text-brand-300' : 'text-surface-300 hover:bg-surface-800 hover:text-white'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      id={`filter-cat-${cat.slug}`}
                      onClick={() => setCategoryFilter(cat.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
                        categoryFilter === cat.id ? 'bg-brand-500/20 text-brand-300' : 'text-surface-300 hover:bg-surface-800 hover:text-white'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-4">
            {/* Search & Sort Bar */}
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                <input
                  id="explore-search"
                  type="text"
                  placeholder="Search requirements..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="input-field pl-9"
                />
              </div>

              <select
                id="explore-sort"
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="input-field w-auto"
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden btn-secondary"
              >
                <SlidersHorizontal size={16} />
                Filters
              </button>
            </div>

            {/* Results Count */}
            <p className="text-sm text-surface-400">
              {loading ? 'Searching...' : `${sorted.length} requirements found`}
            </p>

            {/* Requirements Grid */}
            {loading ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {[1, 2, 3, 4, 5, 6].map(i => <RequirementCardSkeleton key={i} />)}
              </div>
            ) : sorted.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {sorted.map(req => (
                  <RequirementCard
                    key={req.id}
                    requirement={req}
                    showCustomer
                    viewAs={isProvider ? 'provider' : 'customer'}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state glass-card">
                <Search size={40} className="text-surface-600" />
                <div>
                  <p className="text-surface-50 font-semibold">No requirements found</p>
                  <p className="text-surface-400 text-sm mt-1">
                    {search ? `No results for "${search}"` : 'No open requirements at this time. Check back later.'}
                  </p>
                </div>
                {search && (
                  <button onClick={() => setSearch('')} className="btn-secondary">
                    Clear search
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
