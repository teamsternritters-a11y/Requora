import { supabase } from '../lib/supabase'
import type { OfferWithDetails, RequirementWithDetails } from '../types/database'
import { calculateMatchScore } from '../utils/matchingEngine'
import { ordersService } from './ordersService'

interface OfferInsert {
  id?: string
  requirement_id: string
  provider_id: string
  price: number
  delivery_days: number
  proposal: string
  portfolio_urls?: string[]
  status?: string
}

export const offersService = {
  async getByRequirement(requirementId: string) {
    const { data, error } = await supabase
      .from('offers')
      .select(`
        *,
        profiles!offers_provider_id_fkey (id, full_name, avatar_url, rating, review_count, skills, location, projects_completed, years_experience),
        offer_scores (*),
        shortlists (*),
        selections (*)
      `)
      .eq('requirement_id', requirementId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as OfferWithDetails[]
  },

  async getByProvider(providerId: string) {
    const { data, error } = await supabase
      .from('offers')
      .select(`
        *,
        requirements (
          id, title, deadline, budget_min, budget_max, status,
          categories (name, slug, icon)
        ),
        offer_scores (*),
        shortlists (*),
        selections (*)
      `)
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as any[]
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('offers')
      .select(`
        *,
        profiles!offers_provider_id_fkey (id, full_name, avatar_url, rating, review_count, skills, bio, location, portfolio_urls, projects_completed, years_experience),
        offer_scores (*),
        shortlists (*),
        selections (*)
      `)
      .eq('id', id)
      .single()
    if (error) throw error
    return data as OfferWithDetails
  },

  async create(offer: OfferInsert, requirement: RequirementWithDetails) {
    const { data, error } = await supabase
      .from('offers')
      .insert(offer as any)
      .select()
      .single()
    if (error) throw error

    // Get provider profile for scoring
    const { data: provider } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', offer.provider_id)
      .single()

    const offerWithDetails = { ...data, profiles: provider, offer_scores: null } as any
    const scores = calculateMatchScore(requirement, offerWithDetails)

    await supabase.from('offer_scores').insert({
      offer_id: (data as any).id,
      ...scores,
    } as any)

    // Update requirement offer count
    await supabase.rpc('increment_offer_count', { req_id: requirement.id } as any)

    // Notify customer
    await supabase.from('notifications').insert({
      user_id: requirement.customer_id,
      type: 'new_offer',
      title: 'New Offer Received',
      message: `You received a new offer for "${requirement.title}"`,
      data: { requirement_id: requirement.id, offer_id: (data as any).id },
    } as any)

    return data as OfferWithDetails
  },

  async shortlist(offerId: string, requirementId: string, customerId: string, providerId: string) {
    const { error } = await supabase.from('shortlists').insert({
      offer_id: offerId,
      requirement_id: requirementId,
      customer_id: customerId,
    } as any)
    if (error) throw error

    await supabase.from('offers').update({ status: 'shortlisted' } as any).eq('id', offerId)

    await supabase.from('notifications').insert({
      user_id: providerId,
      type: 'shortlisted',
      title: 'Offer Shortlisted!',
      message: 'Your offer has been shortlisted by the customer.',
      data: { offer_id: offerId, requirement_id: requirementId },
    } as any)
  },

  async removeShortlist(offerId: string, customerId: string) {
    const { error } = await supabase
      .from('shortlists')
      .delete()
      .eq('offer_id', offerId)
      .eq('customer_id', customerId)
    if (error) throw error
    await supabase.from('offers').update({ status: 'pending' } as any).eq('id', offerId)
  },

  async select(
    offerId: string,
    requirementId: string,
    customerId: string,
    providerId: string,
    offerPrice: number,
    requirementType: 'digital' | 'physical' = 'digital'
  ): Promise<{ orderId: string }> {

    // ── Idempotency: check if a selection already exists ─────────
    const { data: existing } = await supabase
      .from('selections')
      .select('id')
      .eq('requirement_id', requirementId)
      .maybeSingle()

    if (existing) {
      // Selection already exists — find the corresponding order
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('requirement_id', requirementId)
        .maybeSingle()

      if (existingOrder) {
        return { orderId: (existingOrder as any).id }
      }
      throw new Error('Selection exists but no order found. Please contact support.')
    }

    // ── Fresh selection ───────────────────────────────────────────
    const { data: selData, error } = await supabase.from('selections').insert({
      offer_id: offerId,
      requirement_id: requirementId,
      customer_id: customerId,
      provider_id: providerId,
    } as any).select().single()
    if (error) throw error

    await supabase.from('offers').update({ status: 'selected' } as any).eq('id', offerId)
    await supabase.from('requirements').update({ status: 'closed', updated_at: new Date().toISOString() } as any).eq('id', requirementId)

    // Reject other pending/shortlisted offers
    const { data: others } = await supabase
      .from('offers')
      .select('id, provider_id')
      .eq('requirement_id', requirementId)
      .neq('id', offerId)

    if (others) {
      for (const o of others as any[]) {
        await supabase.from('offers').update({ status: 'rejected' } as any).eq('id', o.id)
        await supabase.from('notifications').insert({
          user_id: o.provider_id,
          type: 'offer_rejected',
          title: 'Offer Not Selected',
          message: 'The customer selected another provider for this requirement.',
          data: { offer_id: o.id, requirement_id: requirementId },
        } as any)
      }
    }

    await supabase.from('notifications').insert({
      user_id: providerId,
      type: 'selected',
      title: 'Offer Selected!',
      message: 'Congratulations! Your offer has been selected. A new order is being created.',
      data: { offer_id: offerId, requirement_id: requirementId },
    } as any)

    // ── v2: Auto-create order ─────────────────────────────────────
    const order = await ordersService.createOrder({
      selectionId: (selData as any).id,
      requirementId,
      offerId,
      customerId,
      providerId,
      amount: offerPrice,
      requirementType,
    })

    return { orderId: order.id }
  },
}

