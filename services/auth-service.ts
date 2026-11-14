import { getSupabaseClient } from '@/lib/supabase'
import type { AppUser, ProfileUpdateInput } from '@/types/user'

export type SignInResult = {
  ok: true
} | {
  ok: false
  error: 'not_configured' | 'invalid_credentials' | 'not_admin' | 'request_failed'
}

export type PasswordUpdateResult =
  | { ok: true }
  | { ok: false; error: 'not_configured' | 'not_authenticated' | 'invalid_current_password' | 'request_failed' }

export const authService = {
  async signIn(email: string, password: string): Promise<SignInResult> {
    const supabase = getSupabaseClient()
    if (!supabase) return { ok: false, error: 'not_configured' }

    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) return { ok: false, error: error.status === 400 ? 'invalid_credentials' : 'request_failed' }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle()

    if (profileError) {
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) throw signOutError
      return { ok: false, error: 'request_failed' }
    }
    if (profile?.role !== 'admin') {
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) throw signOutError
      return { ok: false, error: 'not_admin' }
    }

    return { ok: true }
  },

  async signOut(): Promise<void> {
    const supabase = getSupabaseClient()
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getCurrentUser(): Promise<AppUser> {
    const supabase = getSupabaseClient()
    if (!supabase) throw new Error('Supabase is not configured')

    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError) throw authError
    if (!authData.user) throw new Error('No authenticated user')

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, role, created_at')
      .eq('id', authData.user.id)
      .single()

    if (profileError) throw profileError

    return {
      id: authData.user.id,
      fullName: profile.full_name,
      email: authData.user.email ?? '',
      role: profile.role,
      officeId: null,
      accountStatus: 'active',
      createdAt: profile.created_at,
    }
  },

  async updateProfile(input: ProfileUpdateInput): Promise<AppUser> {
    const supabase = getSupabaseClient()
    if (!supabase) throw new Error('Supabase is not configured')

    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError) throw authError
    if (!authData.user) throw new Error('No authenticated user')

    const authUpdate = input.email.trim() === authData.user.email
      ? await supabase.auth.updateUser({ data: { full_name: input.fullName.trim() } })
      : await supabase.auth.updateUser({
          email: input.email.trim(),
          data: { full_name: input.fullName.trim() },
        })
    if (authUpdate.error) throw authUpdate.error

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: input.fullName.trim() })
      .eq('id', authData.user.id)
    if (profileError) throw profileError

    return this.getCurrentUser()
  },

  async updatePassword(currentPassword: string, newPassword: string): Promise<PasswordUpdateResult> {
    const supabase = getSupabaseClient()
    if (!supabase) return { ok: false, error: 'not_configured' }

    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError) return { ok: false, error: 'request_failed' }
    if (!authData.user?.email) return { ok: false, error: 'not_authenticated' }

    const { error: verificationError } = await supabase.auth.signInWithPassword({
      email: authData.user.email,
      password: currentPassword,
    })
    if (verificationError) {
      return {
        ok: false,
        error: verificationError.status === 400 ? 'invalid_current_password' : 'request_failed',
      }
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    if (updateError) return { ok: false, error: 'request_failed' }
    return { ok: true }
  },
}
