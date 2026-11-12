'use client'

import { createContext, useCallback, useContext, useEffect, useMemo } from 'react'
import useSWR from 'swr'
import { getSupabaseClient } from '@/lib/supabase'
import { authService } from '@/services/auth-service'
import { ROLE_PERMISSIONS, type AppUser, type Permission, type ProfileUpdateInput } from '@/types/user'

interface AuthContextValue {
  user: AppUser | undefined
  can: (permission: Permission) => boolean
  updateProfile: (input: ProfileUpdateInput) => Promise<AppUser>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: user, mutate } = useSWR('current-user', () => authService.getCurrentUser())

  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        void mutate(undefined, { revalidate: false })
        window.location.replace('/login')
      }
    })

    async function verifyRestoredPage() {
      try {
        await authService.getCurrentUser()
      } catch {
        window.location.replace('/login')
      }
    }

    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) void verifyRestoredPage()
    }

    window.addEventListener('pageshow', handlePageShow)
    return () => {
      subscription.unsubscribe()
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [mutate])

  const can = useCallback(
    (permission: Permission) => (user ? ROLE_PERMISSIONS[user.role].includes(permission) : false),
    [user],
  )

  const updateProfile = useCallback(
    async (input: ProfileUpdateInput) => {
      const updated = await authService.updateProfile(input)
      await mutate({ ...updated }, { revalidate: false })
      return updated
    },
    [mutate],
  )

  const value = useMemo(() => ({ user, can, updateProfile }), [user, can, updateProfile])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
