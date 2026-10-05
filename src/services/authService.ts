import { supabase } from '../lib/supabase'
import type { Profile } from '../types/database'

export const authService = {
  async signUp(email: string, password: string, fullName: string, role: 'customer' | 'provider') {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
      },
    })

    // "Database error saving new user" means the trigger failed but the auth user
    // may or may not have been created. We can't recover from this on the client —
    // the fix is in the Supabase trigger (see supabase/fix-trigger.sql).
    // We still throw so the UI shows a helpful message.
    if (error) {
      // Give a more actionable message for the trigger error
      if (error.message?.includes('Database error')) {
        const betterError = new Error(
          'Account setup failed. Please ask the admin to run the trigger fix in Supabase SQL Editor.'
        )
        throw betterError
      }
      throw error
    }

    // Fallback: manually upsert profile in case trigger didn't run or email confirmation
    // is enabled (in which case data.user exists but trigger may fire later).
    if (data.user) {
      await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          email: data.user.email ?? email,
          full_name: fullName,
          role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any, { onConflict: 'id', ignoreDuplicates: true })
      // Ignore errors here — profile may already exist from trigger
    }

    return data
  },


  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  },

  async updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  },

  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    // Self-heal: If profile doesn't exist, create it (handles broken trigger state)
    if (!data && (!error || error.code === 'PGRST116')) {
      const { data: userData } = await supabase.auth.getUser()
      if (userData?.user) {
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            email: userData.user.email ?? '',
            full_name: userData.user.user_metadata?.full_name ?? 'User',
            role: userData.user.user_metadata?.role ?? 'customer',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as any, { onConflict: 'id' })
          .select()
          .single()
        
        if (!insertError && newProfile) return newProfile as Profile
      }
      return null
    }

    if (error) return null
    return data as Profile
  },

  async updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq('id', userId)
      .select()
      .single()
    if (error) throw error
    return data as Profile
  },

  onAuthStateChange(callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) {
    return supabase.auth.onAuthStateChange(callback)
  },
}
