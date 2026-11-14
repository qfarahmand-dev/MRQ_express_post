'use client'

import { AdminDashboard, OfficeManagerDashboard, StorekeeperDashboard } from '@/components/dashboard/role-dashboard-panels'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'

export function DashboardOverview() {
  const { t } = useLanguage()
  const { user, isLoading, error } = useAuth()

  if (error) {
    return <p role="alert" className="text-sm text-destructive">{t.common.unexpectedError}</p>
  }

  if (isLoading) {
    return <p role="status" className="rounded-lg border bg-card p-5 text-sm text-muted-foreground">{t.roleDashboard.accessLoading}</p>
  }

  if (!user) {
    return <p role="alert" className="text-sm text-destructive">{t.common.unexpectedError}</p>
  }

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />
    case 'office_manager':
      return <OfficeManagerDashboard />
    case 'storekeeper':
      return <StorekeeperDashboard />
  }
}
