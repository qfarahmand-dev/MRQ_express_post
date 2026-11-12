'use client'

import Link from 'next/link'
import { StatusBadge } from '@/components/common/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/contexts/language-context'
import { useShipments } from '@/hooks/use-shipments'
import { formatDateTime } from '@/lib/format'

export function LatestUpdates() {
  const { t, lang } = useLanguage()
  const { data: shipments, error } = useShipments()

  const updates = (shipments ?? [])
    .flatMap((shipment) => shipment.events.map((event) => ({ ...event, shipment })))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6)

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{t.dashboard.latestUpdates}</CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <p role="alert" className="text-sm text-destructive">{t.common.unexpectedError}</p>
        ) : shipments && updates.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.dashboard.noUpdates}</p>
        ) : (
          <ul className="flex flex-col divide-y">
            {updates.map((update) => (
              <li key={update.id} className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/dashboard/shipments/${update.shipment.id}`}
                    dir="ltr"
                    className="font-mono text-sm font-semibold text-primary hover:underline"
                  >
                    {update.shipment.trackingNumber}
                  </Link>
                  <StatusBadge status={update.status} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {[update.location, formatDateTime(update.createdAt, lang)].filter(Boolean).join(' · ')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
