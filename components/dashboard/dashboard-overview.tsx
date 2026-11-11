'use client'

import Link from 'next/link'
import { Info, PackagePlus } from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { LatestUpdates } from '@/components/dashboard/latest-updates'
import { RecentShipments } from '@/components/dashboard/recent-shipments'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { buttonVariants } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { interpolate } from '@/lib/format'
import { cn } from '@/lib/utils'

export function DashboardOverview() {
  const { t } = useLanguage()
  const { user } = useAuth()

  return (
    <>
      <PageHeader
        title={user ? interpolate(t.dashboard.welcome, { name: user.fullName.split(' ')[0] }) : t.dashboard.title}
        description={t.dashboard.subtitle}
        actions={
          <Link
            href="/dashboard/shipments/new"
            className={cn(buttonVariants({ size: 'lg' }), 'bg-highlight px-4 font-semibold text-highlight-foreground hover:bg-highlight/85')}
          >
            <PackagePlus aria-hidden="true" />
            {t.dashboard.registerNew}
          </Link>
        }
      />
      <p className="flex items-center gap-2 rounded-lg border border-dashed bg-card px-4 py-2.5 text-xs text-muted-foreground">
        <Info className="size-4 shrink-0 text-primary" aria-hidden="true" />
        {t.dashboard.demoNotice}
      </p>
      <StatsCards />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <RecentShipments />
        </div>
        <LatestUpdates />
      </div>
    </>
  )
}
