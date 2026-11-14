'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { UnauthorizedAccess } from '@/components/auth/unauthorized-access'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { getDashboardRouteAccess } from '@/components/layout/dashboard-navigation'

export function PermissionGuard({ children }: { children: ReactNode }) {
  const { t } = useLanguage()
  const { user, isLoading, error, canAccess } = useAuth()
  const pathname = usePathname()

  if (error) {
    return <p role="alert" className="text-sm text-destructive">{t.common.unexpectedError}</p>
  }

  if (isLoading) {
    return <p role="status" className="rounded-lg border bg-card p-5 text-sm text-muted-foreground">{t.roleDashboard.accessLoading}</p>
  }

  if (!user) {
    return <p role="alert" className="text-sm text-destructive">{t.common.unexpectedError}</p>
  }

  const routeAccess = getDashboardRouteAccess(pathname, user.role)
  if (routeAccess === 'unauthorized') return <UnauthorizedAccess />
  if (routeAccess !== 'public') {
    const officeId = routeAccess.officeScoped && user.role !== 'admin' ? user.officeId : undefined
    if (!canAccess(routeAccess.capability, officeId ?? undefined)) return <UnauthorizedAccess />
  }

  return children
}
