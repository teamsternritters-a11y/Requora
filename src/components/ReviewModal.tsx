import { useState } from 'react'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import { StarRatingInput } from './StarRating'
import { reviewsService } from '../services/reviewsService'
import type { OrderWithDetails } from '../types/database'

interface ReviewModalProps {
  order: OrderWithDetails
  onClose: () => void
  onSuccess: () => void
}

const RATING_LABELS: Record<number, string> = {
  1: 'Terrible',
  2: 'Poor',
  3: 'Average',
  4: 'Good',
  5: 'Excellent!',
}

export function ReviewModal({ order, onClose, onSuccess }: ReviewModalProps) {
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      toast.error('Please select a star rating')
      return
    }

    setSubmitting(true)
    try {
      await reviewsService.create({
        order_id: order.id,
        requirement_id: order.requirement_id,
        reviewer_id: order.customer_id,
        reviewee_id: order.provider_id,
        rating,
        title,
        comment,
      })
      toast.success('Review submitted successfully!')
      onSuccess()
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const providerName = (order as any).provider?.full_name || 'the provider'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Leave a Review</h2>
            <p className="text-sm text-slate-500 mt-0.5">For {providerName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Star selector */}
          <div className="flex flex-col items-center gap-3 py-4 rounded-xl bg-slate-50">
            <StarRatingInput value={rating} onChange={setRating} />
            <p className="text-sm font-medium text-slate-500 h-5">
              {rating > 0 ? RATING_LABELS[rating] : 'Click a star to rate'}
            </p>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Review Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={100}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition"
              placeholder="Summarize your experience"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Detailed Review <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition resize-none"
              placeholder="What did you like or dislike? How was the work quality and communication?"
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || rating === 0}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
