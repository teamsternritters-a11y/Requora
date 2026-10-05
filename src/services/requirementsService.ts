import { supabase } from '../lib/supabase'
import type { RequirementWithDetails } from '../types/database'

interface RequirementInsert {
  id?: string
  customer_id: string
  category_id: string
  title: string
  description: string
  requirement_type: string
  budget_min: number
  budget_max: number
  deadline: string
  preferences?: Record<string, any>
  reference_files?: string[]
  status?: string
}

export const requirementsService = {
  async getAll(filters?: { category_id?: string; status?: string; search?: string }) {
    let query = supabase
      .from('requirements')
      .select(`
        *,
        profiles!requirements_customer_id_fkey (id, full_name, avatar_url, rating, review_count, location),
        categories (id, name, slug, icon)
      `)
      .order('created_at', { ascending: false })

    if (filters?.category_id) query = query.eq('category_id', filters.category_id)
    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as RequirementWithDetails[]
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('requirements')
      .select(`
        *,
        profiles!requirements_customer_id_fkey (id, full_name, avatar_url, rating, review_count, location),
        categories (id, name, slug, icon)
      `)
      .eq('id', id)
      .single()
    if (error) throw error
    // Increment views
    await supabase.from('requirements').update({ views: ((data as any).views || 0) + 1 } as any).eq('id', id)
    return data as RequirementWithDetails
  },

  async getByCustomer(customerId: string) {
    const { data, error } = await supabase
      .from('requirements')
      .select(`
        *,
        profiles!requirements_customer_id_fkey (id, full_name, avatar_url, rating, review_count),
        categories (id, name, slug, icon)
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as RequirementWithDetails[]
  },

  async create(requirement: RequirementInsert) {
    const { data, error } = await supabase
      .from('requirements')
      .insert(requirement as any)
      .select()
      .single()
    if (error) throw error
    return data as RequirementWithDetails
  },

  async update(id: string, updates: Record<string, any>) {
    const { data, error } = await supabase
      .from('requirements')
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as RequirementWithDetails
  },

  async delete(id: string) {
    const { error } = await supabase.from('requirements').delete().eq('id', id)
    if (error) throw error
  },

  async uploadReferenceFile(file: File, requirementId: string) {
    const ext = file.name.split('.').pop()
    const path = `requirements/${requirementId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('reference-files').upload(path, file)
    if (error) throw error
    const { data } = supabase.storage.from('reference-files').getPublicUrl(path)
    return data.publicUrl
  },
}
