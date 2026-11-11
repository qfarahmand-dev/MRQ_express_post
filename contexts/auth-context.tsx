'use client'

import { createContext, useCallback, useContext, useMemo } from 'react'
import useSWR from 'swr'
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
