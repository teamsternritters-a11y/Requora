import { useState } from 'react'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { requirementsService } from '../services/requirementsService'
import type { RequirementWithDetails } from '../types/database'

interface DeleteRequirementModalProps {
  isOpen: boolean
  onClose: () => void
  requirement: RequirementWithDetails
  onSuccess: () => void
}

export function DeleteRequirementModal({ isOpen, onClose, requirement, onSuccess }: DeleteRequirementModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  if (!isOpen) return null

  // Safety Checks
  const hasOffers = (requirement as any).offer_count > 0 || (requirement as any).offers?.length > 0
  const isSelectedOrCompleted = ['closed', 'completed'].includes(requirement.status)
  
  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await requirementsService.delete(requirement.id)
      toast.success('Requirement deleted successfully')
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete requirement')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-white border border-surface-700 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-surface-400 hover:text-surface-100 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
            <Trash2 size={24} />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-surface-50">Delete Requirement</h2>
            <p className="text-sm text-surface-400 mt-1">This action cannot be undone.</p>
          </div>
        </div>

        {isSelectedOrCompleted ? (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 mb-6">
            <div className="flex gap-2">
              <AlertTriangle size={20} className="text-red-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-700">Warning: Active Data</p>
                <p className="text-xs text-red-600 mt-1">
                  This requirement has already been selected or completed. Force deleting it will permanently erase the order, payment records, and provider deliveries.
                </p>
              </div>
            </div>
          </div>
        ) : hasOffers ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 mb-6">
            <div className="flex gap-2">
              <AlertTriangle size={20} className="text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-700">Offers Exist</p>
                <p className="text-xs text-amber-600 mt-1">
                  This requirement already has offers. Deleting it will remove all associated offers and related data.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-surface-300 mb-6">
            Are you sure you want to delete <span className="text-surface-50 font-semibold">{requirement.title}</span>?
          </p>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-surface-700 text-surface-400 hover:bg-surface-100 transition-colors"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : isSelectedOrCompleted ? 'Force Delete' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
