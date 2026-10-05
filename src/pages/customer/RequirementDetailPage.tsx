import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Clock, Tag, Eye, Users, Star, Download,
  Trophy, SlidersHorizontal, Trash2
} from 'lucide-react'
import { DashboardLayout } from '../../components/DashboardLayout'
import { OfferCard } from '../../components/OfferCard'
import { requirementsService } from '../../services/requirementsService'
import { offersService } from '../../services/offersService'
import { useAuth } from '../../hooks/useAuth'
import type { RequirementWithDetails, OfferWithDetails } from '../../types/database'
import { formatCurrency, formatDeadline, formatDate } from '../../utils/formatters'
import toast from 'react-hot-toast'
import ConfirmModal from '../../components/ConfirmModal'
import { DeleteRequirementModal } from '../../components/DeleteRequirementModal'

type SortOption = 'total_score' | 'price_asc' | 'price_desc' | 'delivery_asc'

export default function RequirementDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [requirement, setRequirement] = useState<RequirementWithDetails | null>(null)
  const [offers, setOffers] = useState<OfferWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<SortOption>('total_score')
  const [selectedOffer, setSelectedOffer] = useState<OfferWithDetails | null>(null)
  const [confirmSelect, setConfirmSelect] = useState<OfferWithDetails | null>(null)
  const [activeTab, setActiveTab] = useState<'offers' | 'details'>('offers')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const [req, ofs] = await Promise.all([
        requirementsService.getById(id),
        offersService.getByRequirement(id),
      ])
      setRequirement(req)
      setOffers(ofs)
      const sel = ofs.find(o => o.status === 'selected')
      if (sel) setSelectedOffer(sel)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const shortlistedIds = new Set(
    offers.filter(o => o.status === 'shortlisted' || o.shortlists?.some(s => s.customer_id === profile?.id)).map(o => o.id)
  )

  const handleShortlist = async (offer: OfferWithDetails) => {
    if (!profile || !requirement) return
    try {
      await offersService.shortlist(offer.id, requirement.id, profile.id, offer.provider_id)
      toast.success('Offer shortlisted!')
      await load()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleRemoveShortlist = async (offer: OfferWithDetails) => {
    if (!profile) return
    try {
      await offersService.removeShortlist(offer.id, profile.id)
      toast.success('Removed from shortlist')
      await load()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleConfirmSelect = async () => {
    if (!confirmSelect || !profile || !requirement) return
    try {
      const { orderId } = await offersService.select(
        confirmSelect.id,
        requirement.id,
        profile.id,
        confirmSelect.provider_id,
        confirmSelect.price,
        (requirement.requirement_type as any) === 'physical' ? 'physical' : 'digital'
      )
      toast.success('Offer selected! Proceeding to payment...')
      setConfirmSelect(null)
      navigate(`/dashboard/customer/orders/${orderId}/pay`)
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const sortedOffers = [...offers].sort((a, b) => {
    switch (sort) {
      case 'total_score': return (b.offer_scores?.total_score ?? 0) - (a.offer_scores?.total_score ?? 0)
      case 'price_asc': return a.price - b.price
      case 'price_desc': return b.price - a.price
      case 'delivery_asc': return a.delivery_days - b.delivery_days
      default: return 0
    }
  })

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="h-8 w-48 shimmer rounded" />
          <div className="h-40 shimmer rounded-2xl" />
          <div className="grid lg:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-64 shimmer rounded-2xl" />)}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!requirement) {
    return (
      <DashboardLayout>
        <div className="empty-state">
          <p className="text-surface-50 font-semibold">Requirement not found</p>
          <Link to="/dashboard/customer/requirements" className="btn-secondary">Go back</Link>
        </div>
      </DashboardLayout>
    )
  }

  const shortlistedOffers = sortedOffers.filter(o => shortlistedIds.has(o.id))
  const otherOffers = sortedOffers.filter(o => !shortlistedIds.has(o.id) && o.status !== 'selected')

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Back */}
        <Link to="/dashboard/customer/requirements" className="btn-ghost inline-flex text-sm">
          <ArrowLeft size={16} />
          Back to requirements
        </Link>

        {/* Header Card */}
        <div className="glass-card p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-brand-500/15 flex items-center justify-center text-2xl">
                {requirement.categories?.icon || '📋'}
              </div>
              <div>
                <h1 className="text-xl font-display font-bold text-surface-50">{requirement.title}</h1>
                <p className="text-sm text-surface-300">{requirement.categories?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`badge ${requirement.status === 'open' ? 'badge-green' : 'badge-gray'}`}>
                {requirement.status}
              </span>
              <button 
                onClick={() => setShowDeleteModal(true)}
                className="p-2 rounded-lg text-surface-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Delete Requirement"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-surface-300">
              <Tag size={14} className="text-brand-400" />
              <span className="text-surface-50 font-medium">{formatCurrency(requirement.budget_min)} – {formatCurrency(requirement.budget_max)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-surface-300">
              <Clock size={14} className="text-yellow-400" />
              <span>{formatDeadline(requirement.deadline)}</span>
              <span className="text-surface-500">({formatDate(requirement.deadline)})</span>
            </div>
            <div className="flex items-center gap-1.5 text-surface-300">
              <Eye size={14} />
              <span>{requirement.views} views</span>
            </div>
            <div className="flex items-center gap-1.5 text-surface-300">
              <Users size={14} className="text-accent-400" />
              <span>{offers.length} offers received</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-surface-800 rounded-xl p-1 border border-white/8 w-fit">
          {(['offers', 'details'] as const).map(tab => (
            <button
              key={tab}
              id={`tab-${tab}`}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                activeTab === tab ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30' : 'text-surface-400 hover:text-white'
              }`}
            >
              {tab} {tab === 'offers' && offers.length > 0 && `(${offers.length})`}
            </button>
          ))}
        </div>

        {activeTab === 'offers' ? (
          <div className="space-y-6">
            {/* Sort */}
            {offers.length > 0 && (
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={16} className="text-surface-400" />
                  <span className="text-sm text-surface-300">Sort by:</span>
                </div>
                {[
                  { val: 'total_score', label: 'Best Match' },
                  { val: 'price_asc', label: 'Price ↑' },
                  { val: 'price_desc', label: 'Price ↓' },
                  { val: 'delivery_asc', label: 'Fastest' },
                ].map(({ val, label }) => (
                  <button
                    key={val}
                    onClick={() => setSort(val as SortOption)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      sort === val ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30' : 'text-surface-400 hover:text-white bg-surface-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Selected Offer */}
            {selectedOffer && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Trophy size={18} className="text-yellow-400" />
                  <h2 className="text-base font-semibold text-surface-50">Selected Offer</h2>
                </div>
                <OfferCard
                  offer={selectedOffer}
                  allOffers={offers}
                  isSelected
                  showActions={false}
                />
              </div>
            )}

            {/* Shortlisted */}
            {shortlistedOffers.length > 0 && (
              <div>
                <h2 className="text-base font-semibold text-surface-50 mb-3 flex items-center gap-2">
                  <Star size={16} className="text-brand-400" />
                  Shortlisted ({shortlistedOffers.length})
                </h2>
                <div className="grid gap-4 lg:grid-cols-2">
                  {shortlistedOffers.map(offer => (
                    <OfferCard
                      key={offer.id}
                      offer={offer}
                      allOffers={offers}
                      isShortlisted
                      showActions={requirement.status === 'open' && !selectedOffer}
                      onRemoveShortlist={handleRemoveShortlist}
                      onSelect={setConfirmSelect}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Offers */}
            {otherOffers.length > 0 && (
              <div>
                <h2 className="text-base font-semibold text-surface-50 mb-3">
                  All Offers ({otherOffers.length})
                </h2>
                <div className="grid gap-4 lg:grid-cols-2">
                  {otherOffers.map(offer => (
                    <OfferCard
                      key={offer.id}
                      offer={offer}
                      allOffers={offers}
                      showActions={requirement.status === 'open' && !selectedOffer}
                      onShortlist={handleShortlist}
                      onSelect={setConfirmSelect}
                    />
                  ))}
                </div>
              </div>
            )}

            {offers.length === 0 && (
              <div className="empty-state glass-card">
                <Users size={40} className="text-surface-600" />
                <div>
                  <p className="text-surface-50 font-semibold">No offers yet</p>
                  <p className="text-surface-400 text-sm mt-1">Providers will submit their offers soon. Check back later.</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="glass-card p-6 space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-surface-300 mb-2">Description</h3>
              <p className="text-surface-100 leading-relaxed">{requirement.description}</p>
            </div>
            {requirement.reference_files?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-surface-300 mb-2">Reference Files</h3>
                <div className="flex flex-wrap gap-2">
                  {requirement.reference_files.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500/10 text-brand-300 border border-brand-500/20 text-sm hover:bg-brand-500/20 transition-colors"
                    >
                      <Download size={14} />
                      File {i + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}
            {requirement.preferences && Object.keys(requirement.preferences as object).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-surface-300 mb-2">Preferences</h3>
                <pre className="text-xs text-surface-200 bg-white/3 rounded-xl p-4 overflow-auto">
                  {JSON.stringify(requirement.preferences, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirm Selection Modal */}
      {confirmSelect && (
        <ConfirmModal
          title="Confirm Selection"
          message={`Are you sure you want to select ${confirmSelect.profiles?.full_name} for this requirement? This action cannot be undone and other providers will be notified.`}
          onConfirm={handleConfirmSelect}
          onCancel={() => setConfirmSelect(null)}
          confirmLabel="Yes, Select"
          confirmDanger={false}
        />
      )}

      {/* Delete Modal */}
      {requirement && (
        <DeleteRequirementModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          requirement={requirement}
          onSuccess={() => navigate('/dashboard/customer/requirements')}
        />
      )}
    </DashboardLayout>
  )
}
