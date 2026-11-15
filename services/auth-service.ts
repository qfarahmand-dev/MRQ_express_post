import { getSupabaseClient } from '@/lib/supabase'
import { isUserRole, type AppUser, type ProfileUpdateInput } from '@/types/user'

export type SignInResult = {
  ok: true
} | {
  ok: false
  error: 'not_configured' | 'invalid_credentials' | 'not_authorized' | 'request_failed'
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
      .select('role, office_id, account_status')
      .eq('id', data.user.id)
      .maybeSingle()

    if (profileError) {
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) throw signOutError
      return { ok: false, error: 'request_failed' }
    }
    if (
      !profile
      || !isUserRole(profile.role)
      || profile.account_status !== 'active'
      || (profile.role !== 'admin' && !profile.office_id)
    ) {
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) throw signOutError
      return { ok: false, error: 'not_authorized' }
    }
    if (profile.role !== 'admin') {
      if (!profile.office_id) {
        const { error: signOutError } = await supabase.auth.signOut()
        if (signOutError) throw signOutError
        return { ok: false, error: 'not_authorized' }
      }
      const { data: office, error: officeError } = await supabase
        .from('offices')
        .select('status')
        .eq('id', profile.office_id)
        .maybeSingle()
      if (officeError) {
        const { error: signOutError } = await supabase.auth.signOut()
        if (signOutError) throw signOutError
        return { ok: false, error: 'request_failed' }
      }
      if (office?.status !== 'active') {
        const { error: signOutError } = await supabase.auth.signOut()
        if (signOutError) throw signOutError
        return { ok: false, error: 'not_authorized' }
      }
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
      .select('id, full_name, role, office_id, account_status, created_at')
      .eq('id', authData.user.id)
      .single()

    if (profileError) throw profileError

    if (profile.account_status !== 'active' || !isUserRole(profile.role)) {
      throw new Error('The account is inactive or has an invalid role')
    }
    if (profile.role === 'admin') {
      if (profile.office_id !== null) throw new Error('Admin accounts cannot be assigned to an office')
      return {
        id: authData.user.id,
        fullName: profile.full_name,
        email: authData.user.email ?? '',
        role: 'admin',
        officeId: null,
        accountStatus: profile.account_status,
        createdAt: profile.created_at,
      }
    }
    if (!profile.office_id) throw new Error('An office assignment is required')
    const { data: office, error: officeError } = await supabase
      .from('offices')
      .select('status')
      .eq('id', profile.office_id)
      .maybeSingle()
    if (officeError) throw officeError
    if (office?.status !== 'active') throw new Error('The assigned office is inactive')
    return {
      id: authData.user.id,
      fullName: profile.full_name,
      email: authData.user.email ?? '',
      role: profile.role,
      officeId: profile.office_id,
      accountStatus: profile.account_status,
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
