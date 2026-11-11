import { MOCK_CURRENT_USER_ID, mockUsers } from '@/data/mock-users'
import { getSupabaseClient } from '@/lib/supabase'
import type { AppUser, ProfileUpdateInput } from '@/types/user'

/**
 * Authentication & profile access layer.
 *
 * Sign-in only works through Supabase Auth; there is intentionally no fake login.
 * The current user is mock data until Supabase sessions and a `profiles` table
 * (with RLS, and roles assigned only by administrators) are added.
 */

export type SignInResult = { ok: true } | { ok: false; error: 'not_configured' | 'invalid_credentials' }

let currentUser: AppUser = structuredClone(
  mockUsers.find((u) => u.id === MOCK_CURRENT_USER_ID) ?? mockUsers[0],
)

export const authService = {
  async signIn(email: string, password: string): Promise<SignInResult> {
    const supabase = getSupabaseClient()
    if (!supabase) {
      await new Promise((resolve) => setTimeout(resolve, 600))
      return { ok: false, error: 'not_configured' }
    }
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    return error ? { ok: false, error: 'invalid_credentials' } : { ok: true }
  },

  async signOut(): Promise<void> {
    const supabase = getSupabaseClient()
    if (supabase) await supabase.auth.signOut()
  },

  async getCurrentUser(): Promise<AppUser> {
    return currentUser
  },

  /** Users can edit their name and email only — never their role. */
  async updateProfile(input: ProfileUpdateInput): Promise<AppUser> {
    await new Promise((resolve) => setTimeout(resolve, 300))
    currentUser = { ...currentUser, fullName: input.fullName.trim(), email: input.email.trim() }
    return currentUser
  },
}
