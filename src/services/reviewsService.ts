import { supabase } from '../lib/supabase'

export interface ReviewInsert {
  order_id: string
  requirement_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  title: string
  comment: string
}

export interface ReviewWithDetails {
  id: string
  order_id: string
  requirement_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  title: string
  comment: string
  created_at: string
  reviewer?: { id: string; full_name: string; avatar_url: string | null }
  reviewee?: { id: string; full_name: string; avatar_url: string | null }
  requirement?: { id: string; title: string }
}

export interface RatingSummary {
  average: number
  total: number
  distribution: { star: number; count: number; pct: number }[]
}

export const reviewsService = {
  /** Check if reviewer already left a review for this order */
  async hasReviewed(orderId: string, reviewerId: string): Promise<boolean> {
    const { count, error } = await supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('order_id', orderId)
      .eq('reviewer_id', reviewerId)
    if (error) throw error
    return (count ?? 0) > 0
  },

  /** Submit a new review */
  async create(params: ReviewInsert): Promise<ReviewWithDetails> {
    if (params.reviewer_id === params.reviewee_id) {
      throw new Error('You cannot review yourself.')
    }

    const already = await reviewsService.hasReviewed(params.order_id, params.reviewer_id)
    if (already) {
      throw new Error('You have already submitted a review for this order.')
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert(params as any)
      .select(`
        *,
        reviewer:profiles!reviews_reviewer_id_fkey(id, full_name, avatar_url),
        reviewee:profiles!reviews_reviewee_id_fkey(id, full_name, avatar_url),
        requirement:requirements(id, title)
      `)
      .single()
    if (error) throw error

    // Notify provider
    await supabase.from('notifications').insert({
      user_id: params.reviewee_id,
      type: 'new_review' as any,
      title: 'New Review Received!',
      message: `A customer left you a ${params.rating}-star review.`,
      data: { review_id: (data as any).id, order_id: params.order_id },
    } as any)

    return data as ReviewWithDetails
  },

  /** Get all reviews received by a provider */
  async getForProvider(providerId: string): Promise<ReviewWithDetails[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        reviewer:profiles!reviews_reviewer_id_fkey(id, full_name, avatar_url),
        requirement:requirements(id, title)
      `)
      .eq('reviewee_id', providerId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as ReviewWithDetails[]
  },

  /** Get all reviews submitted by a customer */
  async getByCustomer(customerId: string): Promise<ReviewWithDetails[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        reviewee:profiles!reviews_reviewee_id_fkey(id, full_name, avatar_url),
        requirement:requirements(id, title)
      `)
      .eq('reviewer_id', customerId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as ReviewWithDetails[]
  },

  /** Compute rating summary and distribution for a provider */
  async getRatingSummary(providerId: string): Promise<RatingSummary> {
    const { data, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('reviewee_id', providerId)

    if (error) throw error

    const ratings = (data ?? []).map((r: any) => r.rating as number)
    const total = ratings.length
    if (total === 0) {
      return {
        average: 0,
        total: 0,
        distribution: [5, 4, 3, 2, 1].map(s => ({ star: s, count: 0, pct: 0 })),
      }
    }

    const average = ratings.reduce((a, b) => a + b, 0) / total
    const distribution = [5, 4, 3, 2, 1].map(star => {
      const count = ratings.filter(r => r === star).length
      return { star, count, pct: Math.round((count / total) * 100) }
    })

    return { average: Math.round(average * 10) / 10, total, distribution }
  },
}
