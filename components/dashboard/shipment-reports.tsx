'use client'

import { ArrowUpRight, Globe2, PackageCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/contexts/language-context'
import { useShipmentReports } from '@/hooks/use-shipments'
import { getCountryName } from '@/lib/countries'
import { formatNumber } from '@/lib/format'

export function ShipmentReports({ compact = false }: { compact?: boolean }) {
  const { t, lang } = useLanguage()
  const { data, error, isLoading } = useShipmentReports()
  const maxCountryCount = Math.max(...(data?.topDestinations.map((destination) => destination.total) ?? [1]), 1)

  if (error) {
    return <p role="alert" className="text-sm text-destructive">{t.common.unexpectedError}</p>
  }

  const periods = [
    { label: t.dashboard.stats.weekly, value: data?.thisWeek },
    { label: t.dashboard.stats.monthly, value: data?.thisMonth },
    { label: t.dashboard.stats.yearly, value: data?.thisYear },
  ]

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
      <Card>
        <CardHeader>
          <CardTitle>{t.dashboard.shipmentsByPeriod}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {periods.map((period) => (
              <li key={period.label} className="flex items-center justify-between gap-4 rounded-lg bg-muted/60 px-4 py-3">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <PackageCheck className="size-4 text-primary" aria-hidden="true" />
                  {period.label}
                </span>
                <span className="text-lg font-bold text-primary">
                  {isLoading || period.value === undefined ? '—' : formatNumber(period.value, lang)}
                </span>
              </li>
            ))}
          </ul>
          {!compact && <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{t.dashboard.registrationDateBasis}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe2 className="size-5 text-primary" aria-hidden="true" />
            {t.dashboard.topDestinations}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">{t.common.loading}</p>
          ) : data?.topDestinations.length ? (
            <ol className="space-y-4">
              {data.topDestinations.slice(0, 5).map((destination, index) => (
                <li key={destination.country} className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-primary">
                    {formatNumber(index + 1, lang)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                      <span className="truncate font-medium text-foreground">{getCountryName(destination.country, lang)}</span>
                      <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-primary">
                        {formatNumber(destination.total, lang)}
                        {!compact && <ArrowUpRight className="size-3.5" aria-hidden="true" />}
                      </span>
                    </div>
                    <div
                      className="h-2 overflow-hidden rounded-full bg-secondary"
                      role="img"
                      aria-label={`${getCountryName(destination.country, lang)}: ${formatNumber(destination.total, lang)}`}
                    >
                      <div
                        className="h-full rounded-full bg-highlight"
                        style={{ width: `${Math.max((destination.total / maxCountryCount) * 100, 4)}%` }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted-foreground">{t.dashboard.noDestinationData}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
