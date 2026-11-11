'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ShipmentsTable } from '@/components/shipments/shipments-table'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/contexts/language-context'
import { useShipments } from '@/hooks/use-shipments'

export function RecentShipments() {
  const { t } = useLanguage()
  const { data, isLoading } = useShipments()

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{t.dashboard.recentShipments}</CardTitle>
        <CardAction>
          <Link
            href="/dashboard/shipments"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            {t.dashboard.viewAll}
            <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ShipmentsTable shipments={(data ?? []).slice(0, 6)} loading={isLoading} compact />
      </CardContent>
    </Card>
  )
}
